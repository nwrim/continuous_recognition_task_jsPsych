import os
import argparse
import json

def get_image_files(directory):
    """Retrieve a sorted list of image file names (png, jpg, jpeg) from the given directory."""
    valid_extensions = {'.png', '.jpg', '.jpeg'}
    return sorted(f for f in os.listdir(directory) if os.path.splitext(f)[1].lower() in valid_extensions)

def main(target_dir, filler_dir, output_dir):
    # Get file lists
    target_file_lst = get_image_files(target_dir)
    filler_file_lst = get_image_files(filler_dir) if filler_dir else []

    # Ensure output directory exists
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created output directory: {output_dir}")

    # Prepare JavaScript content
    js_content = f"""var TARGETIMGLST = {json.dumps(target_file_lst, indent=2)};
    var FILLERIMGLST = {json.dumps(filler_file_lst, indent=2)};
    """

    # Write to stimuli.js
    output_path = os.path.join(output_dir, 'stimuli.js')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"stimuli.js file created at {output_path}")

if __name__ == "__main__":
    # Argument parser setup
    parser = argparse.ArgumentParser(description='Create stimuli.js file')
    parser.add_argument('--target_dir', type=str, required=True, help='Directory containing target images')
    parser.add_argument('--filler_dir', type=str, default=None, help='Directory containing filler images (optional)')
    parser.add_argument('--output_dir', type=str, required=True, help='Output directory')

    args = parser.parse_args()
    main(args.target_dir, args.filler_dir, args.output_dir)