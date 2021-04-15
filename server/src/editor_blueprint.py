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
# from story_editing.Editor import Editor
from utils import db
from users import current_user



editor_blueprint = Blueprint('editor_blueprint', __name__)
# editor = Editor(db)


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
        story_names = []
        for doc in child_doc:
            story_names.append(db.collection('stories').document(doc).get().get('story_name'))
        
        return {'story_id': child_doc, 'story_name': story_names}, 200
    
    return None, 500

@editor_blueprint.route('/editor/load_all_stories', methods=['GET'])
def load_all_stories():
    if current_user is not None and current_user.admin == True:
        stories = db.collection('stories')
        # all_stories = [story for story in stories]
        child_doc = list(stories.list_documents())
        child_doc = [child.id for child in child_doc]
        return {'list': child_doc}, 200
    
    return None, 500

@editor_blueprint.route('/editor/view_live_story', methods=['GET'])
def view_live_story():
    if current_user is not None and current_user.admin == True:
        app_states = db.collection('application_states')
        # all_stories = [story for story in stories]
        app_state = list(app_states.list_documents())[0]
        live_story = 'NONE'
        try:
            live_story = app_state.get().get('active_story_id')
        except KeyError:
            print('No Live Story Field')
        return {'list': live_story}, 200
    return None, 200

@editor_blueprint.route('/editor/update_live_story', methods=['POST'])
def update_live_story():  
    if current_user is not None and current_user.admin == True:
        new_live_story = request.form['new_live_story']        
        live_story_data = {'active_story_id': new_live_story, 
            'active_story_ref': db.collection('stories').document(new_live_story)}

        app_states = db.collection('application_states')
        app_states.document('application_state').update(live_story_data)
    return {'list': new_live_story}, 200

@editor_blueprint.route('/editor/open_story/<story_id>', methods=['GET'])
def open_story(story_id):
    if current_user is not None and current_user.admin == True:
        story_data = db.collection('stories').document(story_id)
        if story_data.get().exists:
            # return story_data # should return some success code
            # return json.dumps({'success': True}), 200, story_data.get().to_dict()
            return story_data.get().to_dict(), 200
    return None, 500 # should be an error code of some sort

@editor_blueprint.route('/editor/save_story', methods=['POST'])
def save_story():    
    if current_user is not None and current_user.admin == True:
        story_id = request.form['story_id']
        story_data = json.loads(request.form['story_data'])
        confirm_save = request.form['confirm_save'] != 'false'
        live_story_id = db.collection('application_states').document('application_state').get().get('active_story_id')
        
        stories = db.collection('stories')

        if not confirm_save:
            if story_id == live_story_id:
                return {'success': False, 'rename': False}, 200, {'ContentType': 'application/json'}
            elif stories.document(story_id).get().exists:
                return {'success': False, 'rename': True}, 200, {'ContentType': 'application/json'}

        if stories.document(story_id).get().exists:
            stories.document(story_id).update(story_data)
        else:
            stories.document(story_id).set(story_data)

    return {'success': True, 'rename': False}, 200, {'ContentType': 'application/json'}
