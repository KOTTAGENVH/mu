import os
from firebase_admin import credentials, initialize_app, storage
from dotenv import load_dotenv
import logging

# Load environment variables from .env file
load_dotenv()

try:
    # Initialize Firebase
    firebase_config = {
        "type": os.getenv("FIREBASE_TYPE4"),
        "project_id": os.getenv("FIREBASE_PROJECT_ID4"),
        "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID4"),
        "private_key": os.getenv("FIREBASE_PRIVATE_KEY4").replace('\\n', '\n'),  # Handle newlines in private key
        "client_email": os.getenv("FIREBASE_CLIENT_EMAIL4"),
        "client_id": os.getenv("FIREBASE_CLIENT_ID4"),
        "auth_uri": os.getenv("FIREBASE_AUTH_URI4"),
        "token_uri": os.getenv("FIREBASE_TOKEN_URI4"),
        "auth_provider_x509_cert_url": os.getenv("FIREBASE_AUTH_PROVIDER_X509_CERT_URL4"),
        "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_X509_CERT_URL4"),
    }
    cred = credentials.Certificate(firebase_config)
    initialize_app(cred, {'storageBucket': os.getenv("FIREBASE_STORAGE_BUCKET4")})
    bucket = storage.bucket()
    logging.info("Firebase initialized successfully")
except Exception as e:
    logging.error(f"Error initializing Firebase: {e}")
    raise
