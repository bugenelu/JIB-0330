"""
blueprint app.py example implementation from https://realpython.com/flask-blueprint/
---
from flask import Flask
from example_blueprint import example_blueprint

app = Flask(__name__)
app.register_blueprint(example_blueprint)

"""

# Flask imports
from flask import Flask, flash, get_flashed_messages, render_template, request, redirect, url_for, session, make_response

# Firebase imports
import firebase_admin
from firebase_admin import credentials, firestore, auth
from firebase_admin.auth import UserRecord
import google.auth.credentials

# Other installed modules imports
import mock
from werkzeug.utils import secure_filename

# Built-in modules imports
import os, json, sys, requests, uuid
from datetime import datetime

# Local imports
from story_editing.TwineIngestFirestore import firestoreTwineConvert
from utils import db, render_response, init_mail
from users import User, FirebaseSession, current_user, login_user, login_required, user_blueprint
from editor_blueprint import editor_blueprint




# Checks which platform we are running on
platform = os.environ.get('PLATFORM', 'local')

if platform == 'prod':
    static_folder = ''
    url = 'https://gaknowledgehub.web.app'

if platform == 'local':
    static_folder = '../../static'
    url = 'http://localhost:8080'

# Initialize the Flask application
app = Flask(__name__, template_folder='pages', static_folder=static_folder)
app.config['SECRET_KEY'] = 'something unique and secret'
app.config['SESSION_COOKIE_NAME'] = '__session'
app.config['SESSION_TYPE'] = 'filesystem'
app.config['UPLOAD_FOLDER'] = 'file_uploads'
app.config.update(dict(
    DEBUG = True,
    MAIL_SERVER = 'smtp.gmail.com',
    MAIL_PORT = 587,
    MAIL_USE_TLS = True,
    MAIL_USE_SSL = False,
    MAIL_USERNAME = 'gaknowledgehubtest@gmail.com',
    MAIL_PASSWORD = '_8\'D7(}|B&kzB9@T_1p&',
))
init_mail(app)

if platform == 'prod':
    app.config['SERVER_NAME'] = 'https://gaknowledgehub.web.app'

# blueprints
app.register_blueprint(editor_blueprint)
app.register_blueprint(user_blueprint)


# Maps url extension '/' to this function
@app.route('/')
def index():
    if current_user:
        if current_user.admin:
            # Returns the admin homepage
            return render_response(render_template('admin_homepage.html', first_name=current_user.first_name))
        # Returns the user homepage
        most_recent_history = None
        continue_story = None
        for history in current_user.history:
            if most_recent_history is None:
                most_recent_history = history
                continue_story = most_recent_history['story'] + '/' + most_recent_history['pages'][-1]
            elif history['last_updated'].replace(tzinfo=None) > most_recent_history['last_updated'].replace(tzinfo=None):
                most_recent_history = history
                continue_story = most_recent_history['story'] + '/' + most_recent_history['pages'][-1]
        return render_response(render_template('user_homepage.html', first_name=current_user.first_name, begin_story='GA_draft_01', continue_story=continue_story))

    # Returns the index.html template with the given values
    return render_response(render_template('home.html'))


# Serves the root page of the specified story
@app.route('/story/<story>')
def story_root(story):
    # Gets the DocumentReference to the story document in Firestore
    story_ref = db.collection('stories').document(story)

    # Gets the DocumentSnapshot of the story document in Firestore
    story_doc = story_ref.get()

    # Checks whether or not the story exists
    if not story_doc.exists:
        # TODO: return an error page
        pass

    # Gets the root page's page ID
    page_id = story_doc.get('root_id')

    preview = request.args.get('preview')
    if preview == None:
        preview = False

    if not preview:
        # Adds the root page to a new history
        history_found = False
        for history in current_user.history:
            if history['story'] == story and history['pages'][0] == page_id and len(history['pages']) == 1:
                history['last_updated'] = datetime.now()
                history_found = True
        if not history_found:
            new_history = {}
            new_history['last_updated'] = datetime.now()
            new_history['story'] = story
            new_history['pages'] = [page_id]
            current_user.history.append(new_history)
        current_user.save()

    # Gets the page data for the specified page ID
    page = story_doc.get('page_nodes.`' + page_id + '`')

    favorited = False
    for favorite in current_user.favorites:
        if favorite['story'] == story and favorite['page_id'] == page_id:
            favorited = True

    # Returns the story_page.html template with the specified page
    return render_response(render_template('story_page.html', favorited=favorited, story=story, page=page, preview=preview))


# Serves the specified page of the specified story
@app.route('/story/<story>/<page_id>')
def story_page(story, page_id):
    # Gets the DocumentReference to the story document in Firestore
    story_ref = db.collection('stories').document(story)

    # Gets the DocumentSnapshot of the story document in Firestore
    story_doc = story_ref.get()

    # Checks whether or not the story exists
    if not story_doc.exists:
        # TODO: return an error page
        pass


    preview = request.args.get('preview')
    if preview == None:
        preview = False

    if not preview:
        if page_id == story_doc.get('root_id'):
            history_found = False
            for history in current_user.history:
                if history['story'] == story and history['pages'][0] == page_id and len(history['pages']) == 1:
                    history['last_updated'] = datetime.now()
                    history_found = True
            if not history_found:
                new_history = {}
                new_history['last_updated'] = datetime.now()
                new_history['story'] = story
                new_history['pages'] = [page_id]
                current_user.history.append(new_history)
        else:
            url = request.referrer
            prev_page_id = url[url.rfind('/') + 1:]
            if prev_page_id == story:
                prev_page_id = story_doc.get('root_id')

            # Adds the page to the history
            for history in current_user.history:
                if history['story'] == story and history['pages'][-1] == prev_page_id:
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
    page = story_doc.get('page_nodes.`' + page_id + '`')

    favorited = False
    for favorite in current_user.favorites:
        if favorite['story'] == story and favorite['page_id'] == page_id:
            favorited = True

    # Returns the story_page.html template with the specified page
    return render_response(render_template("story_page.html", favorited=favorited, story=story, page=page, preview=preview))



# Serves the editor page
@app.route('/editor')
def myedit():
    # Returns the editor.html template with the given values
    return render_template('editor.html')


# Serves the editor page
@app.route('/openeditor')
def openedit():
    # Returns the editor.html template with the given values
    return render_template('openeditor.html')


@app.route('/forward/', methods=["POST"])
def move_forward():
    render_template('openeditor.html', button_color="blue")


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
        if '.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in {'html', 'pdf', 'jpeg', 'png', 'tgif',
                                                                                'svg', 'mp4', 'mp3'}:
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            flash('File uploaded successfully')
        else:
            flash('Files uploaded successfully')
        return render_response(redirect(request.url))
    # Returns the file_upload.html template with the given values
    return render_response(render_template('file_upload.html'))


@app.route('/admin/editor')
def editor():
    input_file_name = 'story_editing/demo_html/GA_draft.html'
    import_id = '2000'
    firestoreTwineConvert(db, input_file_name, import_id)
    return 'Success!'

@app.route('/admin/twine')
def twine():
    twine_files = [
        {
            'path': 'story_editing/demo_html/demo-story.html',
            'id': 'demo_01'
        },
        {
            'path': 'story_editing/demo_html/GA_draft.html',
            'id': 'GA_draft_01'
        },
        {
            'path': 'story_editing/demo_html/subtree.html',
            'id': 'demo_02'
        }
    ]
    file_index = 0
    for file in twine_files:
        file_index += 1
        firestoreTwineConvert(db, file['path'], file['id'])
    return f'imported {file_index} stories'


if __name__ == '__main__':
    # Run the application on the specified IP address and port
    if platform == 'local':
        app.run(host='localhost', port=8080, debug=True)
    else:
        app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)), debug=True)
