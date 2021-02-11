from flask import Flask, render_template
import os, json, sys


# Initialize the Flask application
app = Flask(__name__, template_folder='pages')


# Sample class
class Sample():

	name = 'Sample'
	shouldShowSecret = True
	secret = 'shhh... don\'t tell'
	values = [0, 1, 1, 2, 3, 5, 8, 13]


# Maps url extension '/' to this function
@app.route('/')
def hello():

	# Creates a sample variable to pass to the HTML template
	sample_var = 'This variable holds a single string'

	# Creates a sample object to pass to the HTML template
	sample_obj = Sample()

	# Returns the index.html template with the given values
	return render_template("index.html", sample_var=sample_var, sample_obj=sample_obj, sample_story="data")


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


# Default to running on port 80
port = 80

# Check for port argument from command line
if len(sys.argv) >= 2:
	port = int(sys.argv[1])

# Run the application on the specified IP address and port
app.run(host="127.0.0.1", port=port, debug=True)