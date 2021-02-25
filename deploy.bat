call cd server

call gcloud builds submit --tag gcr.io/ga-knowledge-hub/knowledge-hub

call gcloud beta run deploy knowledge-hub --image gcr.io/ga-knowledge-hub/knowledge-hub --platform managed

call cd ..

call node_modules\.bin\firebase deploy