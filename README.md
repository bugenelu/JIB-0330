Greenhouse Accelerator Interactive Knowledge Hub<br>
<br>
Python Version: 3.9.1<br>
Twine Version: 2.3.9 (Desktop)


# Steps to Run Locally:
## First time setup
1. Run 'pip install -r requirements.txt'
2. Run 'pip install firebase_admin'

### Install Firebase Emulator Suite (First Time):
1. Install Node.js and Java 1.8+
2. Once Node.js is installed, run 'npm install' in the project root directory.

## Run each time
1. Run the Firebase Emulator with 'firebase emulators:start --import=local_test_data'
2. Run 'python app.py'
3. Navigate to 'localhost:8080' to use the application
4. Navigate to 'localhost:4000' to see the Firestore Emulator UI, including the emulated
database.
5. When you edit your code (Python, JS, etc.) you should see the changes reflected in
the local application. You might need to refresh your browser.


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