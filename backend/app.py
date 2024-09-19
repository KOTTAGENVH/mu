import yt_dlp
from flask import Flask, request, jsonify, send_file, after_this_request
import os
from dotenv import load_dotenv
import importlib

app = Flask(__name__)

# Load environment variables
load_dotenv()

# Function to dynamically load the Firebase configuration module
def load_firebase_module(storage_number):
    if storage_number == 1:
        return importlib.import_module('firebase1config')
    elif storage_number == 2:
        return importlib.import_module('firebase2config')
    elif storage_number == 3:
        return importlib.import_module('firebase3config')
    elif storage_number == 4:
        return importlib.import_module('firebase4config')
    elif storage_number == 5:
        return importlib.import_module('firebase5config')
    else:
        raise ValueError('Invalid storage number')

@app.route('/download_audio', methods=['POST'])
def download_audio():
    try:
        # Get the video URL, storage selection number, and token from the request
        link = request.json.get('link')
        storage_number = request.json.get('storage_number')
        token = request.json.get('token')

        # Check if the token is valid
        if token != os.getenv('API_TOKEN'):
            return jsonify({'error': 'Invalid token'}), 403

        if not link or not storage_number or not (1 <= storage_number <= 5):
            return jsonify({'error': 'Invalid link or storage number provided'}), 400

        # Load the appropriate Firebase configuration
        firebase_module = load_firebase_module(storage_number)

        # Define the download options for audio
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': '%(title)s.%(ext)s',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '320',
            }],
             'geo_bypass': True, # Bypass geographic restriction
        }

        # Download the audio
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(link, download=True)
            filename = ydl.prepare_filename(info_dict)
            filename = filename.rsplit('.', 1)[0] + '.mp3'
            song_title = info_dict.get('title', 'Unknown Title')

        # Get the Firebase bucket
        bucket = firebase_module.bucket

        # Check if the file already exists in Firebase storage
        blob = bucket.blob(f'music/{os.path.basename(filename)}')
        if blob.exists():
            @after_this_request
            def remove_file(response):
                try:
                    os.remove(filename)
                    app.logger.info(f"Successfully deleted file {filename}")
                except Exception as error:
                    app.logger.error(f"Error deleting file {filename}: {error}")
                return response

            # If the file exists, return a message without uploading
            return jsonify({
                'message': 'Audio already available',
                'song_title': song_title,
                'firebase_url': blob.public_url
            }), 200

        # If the file doesn't exist, upload it to Firebase storage
        blob.upload_from_filename(filename)
        blob.make_public()  # Make the file publicly accessible

        # Get the public URL for the uploaded file
        firebase_url = blob.public_url

        # Register the file for removal after the request is completed
        @after_this_request
        def remove_file(response):
            try:
                os.remove(filename)
                app.logger.info(f"Successfully deleted file {filename}")
            except Exception as error:
                app.logger.error(f"Error deleting file {filename}: {error}")
            return response

        # Return the Firebase URL and the name of the song
        return jsonify({
            'firebase_url': firebase_url,
            'song_title': song_title
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050)
