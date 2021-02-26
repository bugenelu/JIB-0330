from flask import Flask, flash, get_flashed_messages, render_template, request, redirect, url_for, session
from flask_login import LoginManager, login_user, current_user, logout_user, login_required
# from flask_session import Session

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

# import redis

from fireo.models import Model
from fireo.fields import TextField, BooleanField, ListField, MapField, IDField

import os, json, sys

from werkzeug.utils import secure_filename


# Checks which platform we are running on to use the correct static folder
platform = os.environ.get('PLATFORM', 'local')
static_folder = ''
if platform == 'local':
	static_folder = '../../static'

# Initialize the Flask application
app = Flask(__name__, template_folder='pages', static_folder=static_folder)
app.config['UPLOAD_FOLDER'] = 'file_uploads'
login_manager = LoginManager()
login_manager.init_app(app)
app.config['SECRET_KEY'] = 'something unique and secret'
# app.config['SESSION_TYPE'] = 'redis'
# app.config['SESSION_REDIS'] = redis.from_url(environ.get('SESSION_REDIS'))
# session = Session(app)

# Use the application default credentials
cred = credentials.ApplicationDefault()
firebase_app = firebase_admin.initialize_app(cred, {
  'projectId': 'ga-knowledge-hub',
})

db = firestore.client()


class User(Model):

	email = TextField()
	password = TextField()
	first_name = TextField()
	last_name = TextField()
	authenticated = BooleanField()
	admin = BooleanField()
	favorites = ListField()
	history = ListField()

	def is_active(self):
		return True
	
	def is_authenticated(self):
		return self.authenticated
		
	def is_anonymous(self):
		return False
	
	def get_id(self):
		return self.email
		
	@staticmethod
	def get(user_id):
		return 1

@login_manager.user_loader
def load_user(user_id):
	return User.collection.filter(email=user_id).get()


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
	return render_template('home.html')

# Serves the login page
@app.route('/login', methods=['GET', 'POST'])
def login():
	if request.method == 'POST':
		user = User.collection.filter(email=request.form['email']).get()
		if user:
			if request.form["password"] == user.password:
				user.authenticated = True
				user.save()
				login_user(user, remember=True)
				return redirect('https://gaknowledgehub.web.app/loggedin')
		return render_template('unsuccessful-login.html')

	# Returns the login.html template with the given values
	return render_template('login.html')

# Serves the sign up page
@app.route('/signup', methods=['GET', 'POST'])
def signup():
	if request.method == 'POST':
		if User.collection.filter(email=request.form['email']).get():
			# TODO: Add error page for account already exists
			pass
		user = User()
		user.email = request.form['email']
		user.password = request.form['password']
		user.first_name = request.form['first-name']
		user.last_name = request.form['last-name']
		user.authenticated = True
		user.admin = False
		user.favorites = []
		user.history = []
		user.save()
		login_user(user, remember=True)
		return redirect('https://gaknowledgehub.web.app/loggedin')

	# Returns the signup.html template with the given values
	return render_template('signup.html')

# Serves the logged in home page
@app.route('/loggedin')
def logged_in():

	# Returns the home_loggedin.html template with the given values
	return render_template('home_loggedin.html', first_name='Joseph', sample_story='data')

# Serves the upload page
@app.route('/upload', methods=['GET', 'POST'])
def upload():
	if request.method == 'POST':
		if 'files' not in request.files:
			flash('No file part')
			return redirect(request.url)
		files = request.files.getlist['files']
		for file in files:
			if file.filename == '':
				flash('No selected file')
				return redirect(request.url)
			if '.' in filename and file.filename.rsplit('.', 1)[1].lower() in {'html', 'pdf', 'jpeg', 'png', 'tgif', 'svg', 'mp4', 'mp3'}:
				filename = secure_filename(file.filename)
				file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
		if len(files) == 1:
			flash('File uploaded successfully')
		else:
			flash('Files uploaded successfully')
		redirect(request.url)
	# Returns the file_upload.html template with the given values
	return render_template('file_upload.html')

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

		# Gets the page data for the specified page ID
		page = story_data['page-nodes'][page_id]

		# Returns the story_page.html template with the specified page
		return render_template("story_page.html", story=story, page=page)


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

		# Gets the page data for the specified page ID
		page = story_data['page-nodes'][page_id]

		# Returns the story_page.html template with the specified page
		return render_template('story_page.html', story=story, page=page)


# # Default to running on port 80
# port = 80

# # Check for port argument from command line
# if len(sys.argv) >= 2:
# 	port = int(sys.argv[1])

if __name__ == '__main__':
	# Run the application on the specified IP address and port
	app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)), debug=True)
