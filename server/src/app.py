from flask import Flask, render_template
import os, json, sys


# Checks which platform we are running on to use the correct static folder
platform = os.environ.get('PLATFORM', 'local')
static_folder = ''
if platform == 'local':
	static_folder = '../../static'

# Initialize the Flask application
app = Flask(__name__, template_folder='pages', static_folder=static_folder)


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
	return render_template("home.html")

# Serves the login page
@app.route('/login')
def login():

	# Returns the login.html template with the given values
	return render_template("login.html")

# Serves the logged in home page
@app.route('/loggedin')
def logged_in():

	# Returns the home_loggedin.html template with the given values
	return render_template("home_loggedin.html", sample_story="data")

# Serves the upload page
@app.route('/upload')
def upload():

	# Returns the file_upload.html template with the given values
	return render_template("file_upload.html")

# Serves the root page of the specified story
@app.route('/story/<story>')
def story_root(story):

	# Creates file path to the story's JSON file
	filepath = os.path.join('twine_ingest', story + '.json')

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
	filepath = os.path.join('twine_ingest', story + '.json')

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
		return render_template("story_page.html", story=story, page=page)


# # Default to running on port 80
# port = 80

# # Check for port argument from command line
# if len(sys.argv) >= 2:
# 	port = int(sys.argv[1])

if __name__ == "__main__":
	# Run the application on the specified IP address and port
	app.run(host="0.0.0.0", port=int(os.environ.get('PORT', 8080)), debug=True)
