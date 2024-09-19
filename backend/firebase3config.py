import os
from firebase_admin import credentials, initialize_app, storage
from dotenv import load_dotenv
import logging

# Load environment variables from .env file
load_dotenv()

try:
    # Initialize Firebase
    firebase_config = {
        "type": os.getenv("FIREBASE_TYPE3"),
        "project_id": os.getenv("FIREBASE_PROJECT_ID3"),
        "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID3"),
        "private_key": os.getenv("FIREBASE_PRIVATE_KEY3").replace('\\n', '\n'),  # Handle newlines in private key
        "client_email": os.getenv("FIREBASE_CLIENT_EMAIL3"),
        "client_id": os.getenv("FIREBASE_CLIENT_ID3"),
        "auth_uri": os.getenv("FIREBASE_AUTH_URI3"),
        "token_uri": os.getenv("FIREBASE_TOKEN_URI3"),
        "auth_provider_x509_cert_url": os.getenv("FIREBASE_AUTH_PROVIDER_X509_CERT_URL3"),
        "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_X509_CERT_URL3"),
    }
    cred = credentials.Certificate(firebase_config)
    initialize_app(cred, {'storageBucket': os.getenv("FIREBASE_STORAGE_BUCKET3")})
    bucket = storage.bucket()
    logging.info("Firebase initialized successfully")
except Exception as e:
    logging.error(f"Error initializing Firebase: {e}")
    raise
