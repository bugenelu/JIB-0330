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
from flask import Blueprint, request

# Built-in modules imports
import random
import json

# Local imports
from story_editing.Editor import Editor
from utils import db
from users import current_user



editor_blueprint = Blueprint('editor_blueprint', __name__)
editor = Editor(db)


@editor_blueprint.route('/editor/init_editor', methods=['GET', 'POST'])
def init_editor():
    return f'initialized editor with {db}'

@editor_blueprint.route('/editor/get_all_stories', methods=['GET'])
def get_all_stories():
    if current_user is not None and current_user.admin == True:
        stories = db.collection('stories')
        # all_stories = [story for story in stories]
        child_doc = list(stories.list_documents())
        child_doc = [child.id for child in child_doc]
        
        return {'list': child_doc}, 200
    
    return None, 500

@editor_blueprint.route('/editor/open_story/<story_id>', methods=['GET'])
def open_story(story_id):
    if current_user is not None and current_user.admin == True:
        story_data = db.collection('stories').document(story_id)
        if story_data.get().exists:
            # return story_data # should return some success code
            # return json.dumps({'success': True}), 200, story_data.get().to_dict()
            return story_data.get().to_dict(), 200
    return None, 500 # should be an error code of some sort

@editor_blueprint.route('/editor/save_story/<story_id>', methods=['POST'])
def save_story(story_id):    
    if current_user is not None and current_user.admin == True:
        stories = db.collection('stories')
        story_data = stories.document(story_id)
        print(request.json)
        print('-----------------------')

        if request.json is None:
            print("It is none so work")
            return json.dumps({'success': False}), 500, {'ContentType': 'application/json'} 

        if story_data.get().exists:
            story_data.update(request.json)
        else:
            stories.add(request.json)

    return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}
