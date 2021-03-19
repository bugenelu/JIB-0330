"""
example blueprint from https://realpython.com/flask-blueprint/
---

from flask import Blueprint

example_blueprint = Blueprint('example_blueprint', __name__)

@example_blueprint.route('/')
def index():
    return "This is an example app"
"""

# Flask imports
from flask import Blueprint

# Built-in modules imports
import random

# Local imports
from story_editing.Editor import Editor
from utils import db
from users import current_user



editor_blueprint = Blueprint('editor_blueprint', __name__)
editor = Editor(db)


@editor_blueprint.route('/editor/dice', methods=['GET', 'POST'])
def dice(a=1, b=6):
    num = random.randint(min(a, b), max(a, b))
    return f'You rolled {num} between {min(a, b)} and {max(a, b)}.'


@editor_blueprint.route('/editor/init_editor', methods=['GET', 'POST'])
def init_editor():
    return f'initialized editor with {db}'


@editor_blueprint.route('/editor/open_story/<story_id>', methods=['GET'])
def open_story(story_id):
	if (current_user is not None and current_user.admin == True):
        story_data = db.collection('stories').document(story_id)
        return story_data
    return None


@editor_blueprint.route('/editor/save_story', methods=['POST'])
def save_story(story_id):
    return f'saved {story_id}'


@editor_blueprint.route('/editor/edit_story', methods=['POST'])
def edit_story(story_id, params):
    return f'edited {story_id} with {params}'


