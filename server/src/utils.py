# Flask imports
from flask import make_response

# Firebase imports
import firebase_admin
from firebase_admin import credentials, firestore, auth
import google.auth.credentials

# Other installed modules imports
import mock

# Built-in modules imports
import os




# Checks which platform we are running on
platform = os.environ.get('PLATFORM', 'local')

if platform == 'prod':
    url = 'https://gaknowledgehub.web.app'

if platform == 'local':
    url = 'http://localhost:8080'



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



def render_response(content, allow_cache=False, cookies=None, delete_cookies=None):
    response = make_response(content)
    if not allow_cache:
        response.headers['Cache-Control'] = 'no-cache, max-age=0, s-maxage=0'
    if cookies is not None:
        for cookie in cookies:
            response.set_cookie(cookie, cookies[cookie])
    if delete_cookies is not None:
        for cookie in delete_cookies:
            response.set_cookie(cookie, '', expires=0)
    return response



class Mail():
    _collection_name = 'mail'

    def __init__(self, to, subject, html):
        self.to = to
        self.message = {
            'subject': subject,
            'html': html
        }
        db.collection(Mail._collection_name).add({
            'to': self.to,
            'message': self.message
            })