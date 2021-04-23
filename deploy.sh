#!/bin/bash

cd server
gcloud builds submit --tag gcr.io/ga-knowledge-hub/knowledge-hub
gcloud beta run deploy knowledge-hub --image gcr.io/ga-knowledge-hub/knowledge-hub --platform managed
cd ..
node_modules/.bin/firebase deploy --only hosting