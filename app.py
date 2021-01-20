from flask import Flask


# Initialize the Flask application
app = Flask(__name__, template_folder='pages')


# Maps url extension '/' to this function
@app.route('/')
def hello():

	# Returns just the text 'Hello, World!', to be replaced with an HTML template
    return 'Hello, World!'


# Run the application
app.run(host="127.0.0.1", port=8080, debug=True)