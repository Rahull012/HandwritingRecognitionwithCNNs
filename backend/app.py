from flask import Flask, request, jsonify
from google.cloud import vision
import os
from dotenv import load_dotenv
from flask_cors import CORS
import cv2
from PIL import Image
import tempfile
import threading
import requests
import pytesseract
from paddleocr import PaddleOCR
import shutil
from detectwords import detect
# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow all origins

TESSDATA_DIR = r"C:\Program Files\Tesseract-OCR\tessdata"
os.environ["TESSDATA_PREFIX"] = TESSDATA_DIR
# Initialize PaddleOCR models
ocr_models = {
    'te': PaddleOCR(use_angle_cls=True, lang='te'),  # Telugu
    'hi': PaddleOCR(use_angle_cls=True, lang='hi'),  # Hindi
    'ta': PaddleOCR(use_angle_cls=True, lang='ta'),  # Tamil
    'mr': PaddleOCR(use_angle_cls=True, lang='mr'),  # Marathi
}

# Languages handled by Tesseract OCR
tesseract_languages = {'mal': 'mal', 'kan': 'kan'}  # Malayalam, Kannada

# Get LLM API details from environment variables
LLM_API_URL = os.getenv('LLM_API_URL')
LLM_API_KEY = os.getenv('LLM_API_KEY')

if not LLM_API_URL or not LLM_API_KEY:
    raise ValueError("LLM_API_URL and LLM_API_KEY must be set in the environment variables.")

def perform_tesseract_ocr(image_path, lang_code):
    try:
        image = Image.open(image_path)
        extracted_text = pytesseract.image_to_string(image, lang=tesseract_languages[lang_code])
        return extracted_text.strip()
    except Exception as e:
        print(f"Tesseract OCR error: {e}")
        return ''

def perform_paddleocr(image_path, lang_code):
    try:
        ocr_model = ocr_models.get(lang_code, ocr_models['te'])
        results = ocr_model.ocr(image_path, cls=True)
        return ' '.join(line[1][0] for result in results for line in result)
    except Exception as e:
        print(f"PaddleOCR error: {e}")
        return ''

def resize(image):
    imgH, imgW = image.shape[:2]
    resized_image = cv2.resize(image, (imgW // 2, imgH // 2))
    return resized_image

def tiff2img(imagePath):
    image = Image.open(imagePath)
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
    tempImagePath = temp_file.name
    image.save(tempImagePath, 'JPEG', quality=96)
    return tempImagePath

def helpercode(image_path):
    filename, file_extension = os.path.splitext(image_path)
    if file_extension.lower() in (".tif", ".tiff"):
        image_path = tiff2img(image_path)

    image = cv2.imread(image_path)
    try:
        imgH, imgW = image.shape[:2]
        while imgW > 4000 or imgH > 4000:
            image = resize(image)
            imgH, imgW = image.shape[:2]
            cv2.imwrite(image_path, image)
    except Exception as e:
        print(f"Error during image resizing: {e}")

    extracted_text = detect(image_path)
    return extracted_text

def background_ocr_tasks(temp_image_path, selected_language):
    try:
        # PaddleOCR
        paddle_text = perform_paddleocr(temp_image_path, selected_language)

        # Tesseract OCR (if language is supported)
        if selected_language in tesseract_languages:
            tesseract_text = perform_tesseract_ocr(temp_image_path, selected_language)
            # LLM Correction for Tesseract
            payload = {
                'model': 'llama3-70b-8192',
                'messages': [
                    {'role': 'system', 'content': f'You are a helpful assistant that corrects text in {selected_language}.'},
                    {'role': 'user', 'content': f"Please correct the errors in the following text extracted from a handwritten image and return only the corrected version in the respective language, without explanations or additional comments and also dont mention Here is the corrected text:\n\n{tesseract_text}"}
                ],
                'max_tokens': 1000
            }
            headers = {
                'Authorization': f'Bearer {LLM_API_KEY}',
                'Content-Type': 'application/json'
            }
            llm_response = requests.post(LLM_API_URL, json=payload, headers=headers)
            response_data = llm_response.json()
            corrected_text = response_data.get('choices', [{}])[0].get('message', {}).get('content', '').strip()

    except Exception as e:
        print(f"Error in background OCR tasks: {e}")
    finally:
        # Clean up the temporary file used by the background thread
        if os.path.exists(temp_image_path):
            try:
                os.remove(temp_image_path)
            except Exception as e:
                print(f"Error deleting temp file {temp_image_path}: {e}")

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    selected_language = request.form.get('language', 'en').lower()
    image_file = request.files['image']
    filename = image_file.filename
    image_path = os.path.join('uploads', filename)
    os.makedirs('uploads', exist_ok=True)
    image_file.save(image_path)

    # Create a temporary copy for background tasks
    temp_image_path = os.path.join('uploads', f"temp_{filename}")
    shutil.copy(image_path, temp_image_path)

    try:
        # Extract text using Google Cloud Vision (foreground)
        extracted_text = helpercode(image_path)
        print(f"Extracted Text: {extracted_text}")

        # Start background OCR tasks with the temporary copy
        threading.Thread(target=background_ocr_tasks, args=(temp_image_path, selected_language)).start()

        # Return only Google Cloud Vision extracted text
        return jsonify({
            'extractedText': extracted_text,
            'language': selected_language
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Error processing image'}), 500

    finally:
        # Delete the original file immediately after the main thread is done
        if os.path.exists(image_path):
            try:
                os.remove(image_path)
            except Exception as e:
                print(f"Error deleting original file {image_path}: {e}")

if __name__ == '__main__':
    app.run(debug=True, port=5000)