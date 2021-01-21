from flask import Flask, render_template


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
	return render_template("index.html", sample_var=sample_var, sample_obj=sample_obj)


# Run the application on the specified IP address and port
app.run(host="127.0.0.1", port=80, debug=True)