# Firebase imports
import firebase_admin
from firebase_admin import credentials, firestore, auth
import google.auth.credentials

# Other installed modules imports
import mock

# Built-in modules imports
import os



db = None

platform = os.environ.get('PLATFORM', 'local')

if platform == 'prod':
    cred = credentials.ApplicationDefault()
    firebase_app = firebase_admin.initialize_app(cred, {
        'projectId': 'ga-knowledge-hub'
    })
    db = firestore.client()

if platform == 'local':
    os.environ["FIRESTORE_EMULATOR_HOST"] = "localhost:8081"
    credentials = mock.Mock(spec=google.auth.credentials.Credentials)
    db = firestore.Client(project='ga-knowledge-hub', credentials=credentials)
