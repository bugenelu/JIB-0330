from flask import Flask

app = Flask(__name__, template_folder='pages')

@app.route('/')
def hello():
    return 'Hello, World!'
	
	
app.run(host="127.0.0.1", port=8080, debug=True)