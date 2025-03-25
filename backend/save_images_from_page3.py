#!/usr/bin/env python
# coding: utf-8

# In[1]:


import easyocr
import cv2
import os
import gc


# In[3]:


import os
import shutil
import pandas as pd




def resize_image(image, max_width=1000, max_height=1000):
    height, width = image.shape[:2]
    scaling_factor = min(max_width / width, max_height / height, 1.0)
    new_width = int(width * scaling_factor)
    new_height = int(height * scaling_factor)
    return cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)

def crop_words_and_save_coordinates(image_path, output_folder, coordinates_file):
    # Load and resize the image
    image = cv2.imread(image_path)
    if image is None:
        print("Image not found!")
        return
    image = resize_image(image)  # Resize to reduce memory usage

    # Initialize EasyOCR reader
    reader = easyocr.Reader(['en'], gpu=False)  # Set gpu=True if available
    
    # Perform OCR with limited batch size
    results = reader.readtext(image, detail=1, batch_size=1)
    
    # Create the output folder if it doesn't exist
    os.makedirs(output_folder, exist_ok=True)
    
    # Write bounding box data to a text file
    with open(coordinates_file, 'w') as coord_file:
        coord_file.write("filename,x_min,y_min,x_max,y_max\n")  # Header
        for i, (bbox, text, _) in enumerate(results):
            (x1, y1), (x2, y2), (x3, y3), (x4, y4) = bbox
            x_min, y_min = int(min(x1, x2, x3, x4)), int(min(y1, y2, y3, y4))
            x_max, y_max = int(max(x1, x2, x3, x4)), int(max(y1, y2, y3, y4))
            
            # Crop the word from the image
            cropped_word = image[y_min:y_max, x_min:x_max]
            word_filename = f"word_{i+1:03d}.png"
            word_path = os.path.join(output_folder, word_filename)
            cv2.imwrite(word_path, cropped_word)
            
            # Save the coordinates to the text file
            coord_file.write(f"{word_filename},{x_min},{y_min},{x_max},{y_max}\n")
            
            print(f"Saved {word_path}")

            cv2.rectangle(image, (x_min, y_min), (x_max, y_max), (0, 255, 0), 2)
            
            # Free up memory
            gc.collect()
    output_image_with_boxes = os.path.join(output_folder, "lines_with_boxes.png")
    cv2.imwrite(output_image_with_boxes, image)
    print(f"Coordinates saved to {coordinates_file}")
import pandas as pd

def sort_coordinates_by_center_with_tolerance(input_file, output_file, vertical_tolerance=10):
    # Load the coordinates from the file
    df = pd.read_csv(input_file)
    
    # Calculate the center of the bounding box
    df['x_center'] = (df['x_min'] + df['x_max']) / 2
    df['y_center'] = (df['y_min'] + df['y_max']) / 2
    
    # Sort first by y_center (top-to-bottom) and x_center (left-to-right within rows)
    df = df.sort_values(by=['y_center', 'x_center']).reset_index(drop=True)

    # Create a new column 'line' to group words based on their vertical proximity (y_center)
    line_number = 0
    lines = []
    previous_y_center = df.iloc[0]['y_center']
    
    for i, row in df.iterrows():
        # If the current word's y_center is within the tolerance of the previous word's y_center, it's on the same line
        if abs(row['y_center'] - previous_y_center) <= vertical_tolerance:
            lines.append(line_number)
        else:
            line_number += 1
            lines.append(line_number)
        previous_y_center = row['y_center']
    
    # Assign the line numbers to the dataframe
    df['line'] = lines
    
    # Sort again by line and then by x_center to arrange words within each line
    df = df.sort_values(by=['line', 'x_center']).reset_index(drop=True)
    
    # Save the sorted coordinates to a new file
    df[['filename', 'x_min', 'y_min', 'x_max', 'y_max']].to_csv(output_file, index=False)
    print(f"Sorted coordinates saved to {output_file}")

def copy_sorted_words_to_folder(sorted_coords_file, source_folder, output_folder):
    # Create the output folder if it doesn't exist
    os.makedirs(output_folder, exist_ok=True)

    # Read the sorted coordinates from the file
    df = pd.read_csv(sorted_coords_file)

    # Loop through the sorted coordinates and copy the images sequentially
    for i, row in df.iterrows():
        filename = row['filename']  # Filename of the segmented word
        source_path = os.path.join(source_folder, filename)  # Path to the segmented image

        if os.path.exists(source_path):
            # Define the new path with sequential numbers as filenames
            new_filename = f"{i+1}.png"
            new_path = os.path.join(output_folder, new_filename)

            # Copy the image to the new folder with sequential name
            shutil.copy(source_path, new_path)
            print(f"Copied {source_path} to {new_path}")
        else:
            print(f"Image {source_path} not found!")


def get_segmented():
                    # Example usage
                    image_path = 'input.png'
                    output_folder = 'segmented_words'
                    coordinates_file = 'word_coordinates.txt'
                    crop_words_and_save_coordinates(image_path, output_folder, coordinates_file)


                    # In[2]:
                    # Example usage
                    sorted_coordinates_file = 'sorted_word_coordinates.txt'
                    coordinates_file = 'word_coordinates.txt'  # Original input file
                    sort_coordinates_by_center_with_tolerance(coordinates_file, sorted_coordinates_file)

                    # Example usage
                    sorted_coordinates_file = 'sorted_word_coordinates.txt'  # File containing the sorted coordinates
                    source_folder = 'segmented_words'  # Folder where the segmented words are stored
                    output_folder = 'sorted_words'  # New folder to save the sorted words

                    # Call the function to copy and arrange images sequentially
                    copy_sorted_words_to_folder(sorted_coordinates_file, source_folder, output_folder)

                    # Define file paths
                    input_file = "sorted_word_coordinates.txt"
                    output_file = "img_names_sequence2.txt"

                    # Initialize a list to store the new filenames
                    image_sequence = []

                    # Read the input file
                    with open(input_file, "r") as file:
                        # Skip the header line
                        lines = file.readlines()[1:]

                        # Process each line to extract the sequence number and format the new filename
                        for line in lines:
                            original_filename = line.split(",")[0]  # Extract the original filename
                            # Extract the numerical part from the filename (word_001.png -> 001)
                            sequence_number = original_filename.split("_")[1].split(".")[0]
                            # Format the new filename
                            new_filename = f"sorted_words/{int(sequence_number)}.png"
                            image_sequence.append(new_filename)

                    # Write the new filenames to the output file
                    with open(output_file, "w") as file:
                        file.write("\n".join(image_sequence))

                    print(f"File '{output_file}' has been created successfully!")





# In[ ]:




