from google.cloud import vision
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set Google Cloud credentials
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "add your credentials"


# Initialize Google Vision client
client = vision.ImageAnnotatorClient()

def detect(image_path):
    with open(image_path, "rb") as image_file:
        content = image_file.read()

    image = vision.Image(content=content)
    response = client.document_text_detection(image=image)

    if response.error.message:
        raise Exception(f"Google OCR API Error: {response.error.message}")

    if response.full_text_annotation and response.full_text_annotation.text:
        text = response.full_text_annotation.text.strip()
        formatted_text = " ".join(text.split("\n"))
        return formatted_text
    return "No text found"
