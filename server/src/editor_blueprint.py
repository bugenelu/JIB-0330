"""
example blueprint from https://realpython.com/flask-blueprint/
---

from flask import Blueprint

example_blueprint = Blueprint('example_blueprint', __name__)

@example_blueprint.route('/')
def index():
    return "This is an example app"
"""

from flask import Blueprint
from story_editing import Editor
import random

editor_blueprint = Blueprint('editor_blueprint', __name__)
database = None
editor = Editor(database)


@editor_blueprint.route('/editor/dice', methods=['GET', 'POST'])
def dice(a=1, b=6):
    num = random.randint(min(a, b), max(a, b))
    return f'You rolled {num} between {min(a, b)} and {max(a, b)}.'


@editor_blueprint.route('/editor/init_editor', methods=['GET', 'POST'])
def init_editor():
    return f'initialized editor with {database}'


@editor_blueprint.route('/editor/open_story', methods=['POST'])
def open_story(story_id):
    return f'opened {story_id}'


@editor_blueprint.route('/editor/save_story', methods=['POST'])
def save_story(story_id):
    return f'saved {story_id}'


@editor_blueprint.route('editor/edit_story', methods=['POST'])
def edit_story(story_id, params):
    return f'edited {story_id} with {params}'


