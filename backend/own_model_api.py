
from tensorflow.keras.layers.experimental.preprocessing import StringLookup
from tensorflow import keras

import matplotlib.pyplot as plt
import tensorflow as tf
import numpy as np
import os

np.random.seed(42)
tf.random.set_seed(42)



# In[18]:


#import pickle
 
#with open('characters.pkl', 'wb') as f:

#   pickle.dump(characters, f)


# In[19]:


import pickle
with open('characters.pkl', 'rb') as f:
   characters = pickle.load(f)




import pickle
 
#with open('vocab1.pkl', 'wb') as f:

#   pickle.dump(vocab1, f)

import pickle
with open('vocab1.pkl', 'rb') as f:
   vocab1= pickle.load(f)




def clean_labels(labels):
    cleaned_labels = []
    for label in labels:
        label = label.split(" ")[-1].strip()
        cleaned_labels.append(label)
    return cleaned_labels

batch_size = 32
padding_token = 99
image_width = 128
image_height = 32


def preprocess_image(image_path, img_size=(image_width, image_height)):     #called 4th 
    image = tf.io.read_file(image_path)
    image = tf.image.decode_png(image, 1)
    image = distortion_free_resize(image, img_size)    #calling above function  here
    image = tf.cast(image, tf.float32) / 255.0
    return image


def vectorize_label(label):
    label = char_to_num(tf.strings.unicode_split(label, input_encoding="UTF-8"))              #called 3rd
    length = tf.shape(label)[0]
    pad_amount = max_len - length
    label = tf.pad(label, paddings=[[0, pad_amount]], constant_values=padding_token)
    return label


def process_images_labels(image_path, label):                     #called 2nd
    image = preprocess_image(image_path)
    label = vectorize_label(label)
    return {"image": image, "label": label}






def prepare_dataset(image_paths, labels):           #called 1
    dataset = tf.data.Dataset.from_tensor_slices((image_paths, labels)).map(         
        process_images_labels, num_parallel_calls=AUTOTUNE
    )
    return dataset.batch(batch_size).cache().prefetch(AUTOTUNE)


AUTOTUNE = tf.data.AUTOTUNE

# Mapping characters to integers.
char_to_num = StringLookup(vocabulary=vocab1, mask_token=None)

# Mapping integers back to original characters.
num_to_char = StringLookup(
    vocabulary=char_to_num.get_vocabulary(), mask_token=None, invert=True
)




model1 = keras.models.load_model('handwritten_text_50.h5')

#model1 =tf.saved_model.load(('handwritten_text.h5'))


# In[60]:

max_len=21
# A utility function to decode the output of the network.
def decode_batch_predictions(pred):
    input_len = np.ones(pred.shape[0]) * pred.shape[1]
    # Use greedy search. For complex tasks, you can use beam search.
    results = keras.backend.ctc_decode(pred, input_length=input_len, greedy=True)[0][0][
        :, :max_len
    ]
    # Iterate over the results and get back the text.
    output_text = []
    for res in results:
        res = tf.gather(res, tf.where(tf.math.not_equal(res, -1)))
        res = tf.strings.reduce_join(num_to_char(res)).numpy().decode("utf-8")
        output_text.append(res)
    return output_text


import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt
from tensorflow import keras

# Assuming num_to_char and prepare_dataset functions are defined elsewhere
def distortion_free_resize(image, img_size):
    w, h = img_size
    image = tf.image.resize(image, size=(h, w), preserve_aspect_ratio=True)

    # Check tha amount of padding needed to be done.
    pad_height = h - tf.shape(image)[0]
    pad_width = w - tf.shape(image)[1]

    # Only necessary if you want to do same amount of padding on both sides.
    if pad_height % 2 != 0:
        height = pad_height // 2
        pad_height_top = height + 1
        pad_height_bottom = height
    else:
        pad_height_top = pad_height_bottom = pad_height // 2

    if pad_width % 2 != 0:
        width = pad_width // 2
        pad_width_left = width + 1
        pad_width_right = width
    else:
        pad_width_left = pad_width_right = pad_width // 2

    image = tf.pad(
        image,
        paddings=[
            [pad_height_top, pad_height_bottom],
            [pad_width_left, pad_width_right],
            [0, 0],
        ],
    )

    image = tf.transpose(image, perm=[1, 0, 2])
    image = tf.image.flip_left_right(image)
    return image


def prediction_on_user_input2(img_path):
    # Load the image
    img = tf.io.read_file(img_path)
    img = tf.image.decode_png(img, channels=1)  # Adjust channels based on image format

    # Preprocess the image
    img = tf.image.convert_image_dtype(img, tf.float32)
    img = tf.image.resize(img, [128,32])  # Resize to match model input size

    # Expand dimensions to match the model's expected input shape
    img = tf.expand_dims(img, axis=0)

    # Predict
    preds = model1.predict(img)

    # Decode predictions
    pred_texts = decode_batch_predictions(preds)

    return pred_texts[0]
def prediction_on_user_input3(img_path):
    # Assuming you have a single test label available as test_label
    test_labels_cleaned = ["yes"]

    
    # Assuming you want to use the provided image path
    test_img_paths = [0]
    test_img_paths[0]=img_path

    test_ds1 = prepare_dataset(test_img_paths, test_labels_cleaned)

    # Let's check results on the provided test sample.
    for batch in test_ds1.take(1):
        batch_images = batch["image"]
        _, ax = plt.subplots(1, 1, figsize=(6, 4))  # Adjust size based on your preference

        preds = model1.predict(batch_images)
        pred_texts = decode_batch_predictions(preds)
        print(pred_texts)

        title = f"Prediction: {pred_texts[0]}"
        ax.imshow(batch_images[0], cmap="gray")  # Assuming batch size is 1
        ax.set_title(title)
        ax.axis("off")

    return pred_texts[0]

# Example usage
#image_path = "path_to_your_image.png"
#prediction = prediction_on_user_input(image_path)
#print("Prediction:", prediction)

# Example usage
image_path = "a02-004-00-01.png"
prediction = prediction_on_user_input3(image_path)
print("Prediction:", prediction)
