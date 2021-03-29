FROM python:3.7

RUN pip install Flask gunicorn Flask-Login firebase-admin fireo Flask-Session bs4 flask-session-plus mock

COPY src/ /app
WORKDIR /app

ENV PORT 8080

ENV PLATFORM prod

CMD exec gunicorn --bind :$PORT app:app