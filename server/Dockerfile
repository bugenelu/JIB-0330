FROM python:3.7

RUN pip install Flask gunicorn Flask-Login firebase-admin fireo Flask-Session redis bs4

COPY src/ /app
WORKDIR /app

ENV PORT 8080

ENV PLATFORM gcloud

CMD exec gunicorn --bind :$PORT app:app