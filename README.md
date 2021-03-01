Greenhouse Accelerator Interactive Knowledge Hub<br>
<br>
Python Version: 3.9.1<br>
Twine Version: 2.3.9 (Desktop)


# Steps to Run Locally:
## First time setup
1. Run 'pip install -r requirements.txt'

## Run each time
1. Run 'python app.py [port]' with the [port] optionally to specify a port other than port 80
2. Navigate to 'localhost:[port]'


# Steps to Update Hosting:
## First time setup
1. Run 'gcloud init'

## Run to deploy to production
1. Run 'deploy prod'

## Run to deploy to development
1. Run 'deploy dev'

# User data structure
- email - string
- password - string
- history: array [map{
	page: reference
	last visited: timestamp
}]
- favorites: array[string]
- first name: string
- last name: string
- last login: timestamp
- admin: boolean