import os
from firebase_admin import credentials, initialize_app, storage
from dotenv import load_dotenv
import logging

# Load environment variables from .env file
load_dotenv()

try:
    # Initialize Firebase
    firebase_config = {
        "type": os.getenv("FIREBASE_TYPE2"),
        "project_id": os.getenv("FIREBASE_PROJECT_ID2"),
        "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID2"),
        "private_key": os.getenv("FIREBASE_PRIVATE_KEY2").replace('\\n', '\n'),  # Handle newlines in private key
        "client_email": os.getenv("FIREBASE_CLIENT_EMAIL2"),
        "client_id": os.getenv("FIREBASE_CLIENT_ID2"),
        "auth_uri": os.getenv("FIREBASE_AUTH_URI2"),
        "token_uri": os.getenv("FIREBASE_TOKEN_URI2"),
        "auth_provider_x509_cert_url": os.getenv("FIREBASE_AUTH_PROVIDER_X509_CERT_URL2"),
        "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_X509_CERT_URL2"),
    }
    cred = credentials.Certificate(firebase_config)
    initialize_app(cred, {'storageBucket': os.getenv("FIREBASE_STORAGE_BUCKET2")})
    bucket = storage.bucket()
    logging.info("Firebase initialized successfully")
except Exception as e:
    logging.error(f"Error initializing Firebase: {e}")
    raise
