from flask import Flask, flash, get_flashed_messages, render_template, request, redirect, url_for, session, make_response
from flask_login import LoginManager
import firebase_admin
from firebase_admin import credentials, firestore, auth
from firebase_admin.auth import UserRecord

from fireo.models import Model
from fireo.fields import TextField, BooleanField, ListField, MapField, IDField, DateTime

import os, json, sys, requests, uuid
from datetime import datetime

from werkzeug.utils import secure_filename

# from functools import wraps

from story_editing.TwineIngestFirestore import firestoreTwineConvert


# Checks which platform we are running on to use the correct static folder
platform = os.environ.get('PLATFORM', 'local')
static_folder = ''
if platform == 'local':
    static_folder = '../../static'

# Use the application default credentials
if platform == 'gcloud':
    cred = credentials.ApplicationDefault()
    firebase_app = firebase_admin.initialize_app(cred, {
        'projectId': 'ga-knowledge-hub'
    })

    db = firestore.client()

# Initialize the Flask application
app = Flask(__name__, template_folder='pages', static_folder=static_folder)
app.config['SECRET_KEY'] = 'something unique and secret'
app.config['SESSION_COOKIE_NAME'] = '__session'
app.config['SESSION_TYPE'] = 'filesystem'
app.config['UPLOAD_FOLDER'] = 'file_uploads'
login_manager = LoginManager()
login_manager.init_app(app)
# Session(app)
secret_key = 'something unique and secret'


# class CustomUserMixin(UserMixin):
#     class Meta():
#         abstract = True
#         field_list = {}

#     _meta = Meta()


class User(Model):

    email = TextField()
    password = TextField()
    first_name = TextField()
    last_name = TextField()
    authenticated = BooleanField()
    admin = BooleanField()
    favorites = ListField()
    history = ListField()

    # @staticmethod
    # def get(user_id):
    #     return 1

class FirebaseSession(Model):

    class Meta:
        collection_name = 'sessions'

    session_key = TextField()
    user_id = TextField()

    def __init__(self):
        self.session_key = str(uuid.uuid4())

    @staticmethod
    def has_session(session_key, user_id):
        return False

current_user = None

def login_user(user):
    session = FirebaseSession.collection.filter(user_id=user.email).get()
    if not session:
        session = FirebaseSession()
        session.user_id = user.email
        session.save()
    return session

def render_response(content, allow_cache=False, cookies=None):
    response = make_response(content)
    if not allow_cache:
        response.headers['Cache-Control'] = 'no-cache, max-age=0, s-maxage=0'
    if cookies is not None:
        for cookie in cookies:
            response.set_cookie(cookie, cookies[cookie])
    return response

@app.before_request
def get_current_user():
    global current_user

    current_user = None
    session_key = request.cookies.get('__session')
    session = FirebaseSession.collection.filter(session_key=session_key).get()
    if session:
        current_user = User.collection.filter(email=session.user_id).get()



@login_manager.user_loader
def load_user(user_id):
    return User.collection.filter(email=user_id).get()

# def login_required(f):
#     @wraps(f)
#     def decorated_function(*args, **kwargs):
#         if 


# Sample class
class Sample():

    name = 'Sample'
    shouldShowSecret = True
    secret = 'shhh... don\'t tell'
    values = [0, 1, 1, 2, 3, 5, 8, 13]


# Maps url extension '/' to this function
@app.route('/')
def hello():

    # Returns the index.html template with the given values
    return render_response(render_template('home.html'))

# Serves the login page
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if platform == 'local':
            return redirect('/loggedin')
        user = User.collection.filter(email=request.form['email']).get()
        if user:
            if request.form["password"] == user.password:
                user.authenticated = True
                user.save()
                session = login_user(user)
                return render_response(redirect('https://gaknowledgehub.web.app/loggedin'), cookies={'__session': session.session_key})
        # TODO: Add behavior for unsuccessful login

    # Returns the login.html template with the given values
    return render_response(render_template('login.html'))

# Serves the sign up page
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        if platform == 'local':
            return redirect('/loggedin')
        if User.collection.filter(email=request.form['email']).get():
            # TODO: Add error page for account already exists
            pass
        user = User()
        user.email = request.form['email']
        user.password = request.form['password']
        user.first_name = request.form['first-name']
        user.last_name = request.form['last-name']
        user.is_authenticated = True
        user.admin = False
        user.favorites = []
        user.history = []
        user.save()
        session = login_user(user)
        return render_response(redirect('https://gaknowledgehub.web.app/loggedin'), cookies={'__session': session.session_key})

    # Returns the signup.html template with the given values
    return render_response(render_template('signup.html'))

# Serves the logged in home page
@app.route('/loggedin')
def logged_in():

    # Returns the home_loggedin.html template with the given values
    return render_response(render_template('home_loggedin.html', first_name=current_user.first_name, sample_story='data'))

# Serves the upload page
@app.route('/upload', methods=['GET', 'POST'])
def upload():
    if request.method == 'POST':
        if 'files' not in request.files:
            flash('No file part')
            return render_response(redirect(request.url))
        file = request.files['files']
        if file.filename == '':
            flash('No selected file')
            return render_response(redirect(request.url))
        if '.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in {'html', 'pdf', 'jpeg', 'png', 'tgif', 'svg', 'mp4', 'mp3'}:
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            flash('File uploaded successfully')
        else:
            flash('Files uploaded successfully')
        return render_response(redirect(request.url))
    # Returns the file_upload.html template with the given values
    return render_response(render_template('file_upload.html'))

# Serves the root page of the specified story
@app.route('/story/<story>')
def story_root(story):
    # Creates file path to the story's JSON file
    filepath = os.path.join('story_editing', story + '.json')

    # Checks whether or not the story exists
    if not os.path.exists(filepath):
        # TODO: return an error page
        pass

    # Opens the JSON file corresponding to the story
    with open(filepath) as story_json:

        # Converts text of file into JSON dictionary
        story_data = json.load(story_json)

        # Gets the root page's page ID
        page_id = story_data['root-ID']

        # Adds the root page to a new history
        history_found = False
        for history in current_user.history:
            if history['pages'][0] == page_id and len(history['pages']) == 1:
                history['last_updated'] = datetime.now()
                history_found = True
        if not history_found:
            new_history = {}
            new_history['last_updated'] = datetime.now()
            new_history['pages'] = [page_id]
            current_user.history.append(new_history)
        current_user.save()

        # Gets the page data for the specified page ID
        page = story_data['page-nodes'][page_id]

        # Returns the story_page.html template with the specified page
        return render_response(render_template("story_page.html", favorited=False, story=story, page=page))


# Serves the specified page of the specified story
@app.route('/story/<story>/<page_id>')
def story_page(story, page_id):

    # Creates file path to the story's JSON file
    filepath = os.path.join('story_editing', story + '.json')

    # Checks whether or not the story exists
    if not os.path.exists(filepath):
        # TODO: return an error page
        pass

    # Opens the JSON file corresponding to the story
    with open(filepath) as story_json:

        # Converts text of file into JSON dictionary
        story_data = json.load(story_json)


        url = request.referrer
        prev_page_id = url[url.rfind('/')+1:]
        if prev_page_id == story:
            prev_page_id = story_data['root-ID']

        # Adds the page to the history
        for history in current_user.history:
            if history['pages'][-1] == prev_page_id:
                history['pages'].append(page_id)
                history['last_updated'] = datetime.now()
                for h in current_user.history:
                    history_matches = True
                    if history['last_updated'] != h['last_updated'] and len(history['pages']) == len(h['pages']):
                        for p in range(len(h['pages'])):
                            if history['pages'][p] != h['pages'][p]:
                                history_matches = False
                        if history_matches:
                            current_user.history.remove(h)
        current_user.save()

        # Gets the page data for the specified page ID
        page = story_data['page-nodes'][page_id]

        # Returns the story_page.html template with the specified page
        return render_response(render_template('story_page.html', favorited=True, story=story, page=page))


@app.route('/admin/editor')
def editor():
    input_file_name = 'file_uploads/GA_draft.html'
    import_id = 2000
    firestoreTwineConvert(db, input_file_name, import_id)
    return 'Success!'

# Serves the profile page
@app.route('/profile')
def profile():

    # Returns the profile.html template with the given values
    return render_response(render_template('profile.html', first_name="Joseph"))

# Serves the favorites page
@app.route('/favorites')
def favorites():

    # Returns the favorites.html template with the given values
    return render_response(render_template('favorites.html'))

@app.route('/add_favorite', methods=['POST'])
def add_favorites():
    current_user.favorites.append({
        'page_id': request.form['page_id'],
        'story_id': request.form['story_id']
    })
    current_user.save()

    return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}

@app.route('/remove_favorite', methods=['POST'])
def remove_favorite():
    page_id, story_id = request.form['page_id'], request.form['story_id']

    for favorite in current_user.favorites:
        if favorite['page_id'] == page_id and favorite['story_id'] == story_id:
            current_user.favorites.remove(favorite)
            break
    current_user.save()

    return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}

# Serves the history page
@app.route('/history')
def history():
    history = current_user.history
    history_arr = []
    # [[(page_id, history)], []]

    # Tracking which story a page belongs to

    # Sort the history
    for i in range(len(history)):
        for j in range(i + 1, len(history)):
            if history[i]['last_updated'] < history[j]['last_updated']:
                history[i], history[j] = history[j], history[i]

    for hist in history:
        new_arr = []
        for page_id in hist['pages']:
            new_arr.insert(0, (page_id, page_id))
        history_arr.append(new_arr)

    # Returns the history.html template with the given values
    return render_response(render_template('history.html', history=history_arr))

# # Default to running on port 80
# port = 80

# # Check for port argument from command line
# if len(sys.argv) >= 2:
#     port = int(sys.argv[1])

if __name__ == '__main__':
    # Run the application on the specified IP address and port
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)), debug=True)
