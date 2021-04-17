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

# Other installed modules imports
from werkzeug.utils import secure_filename
import os

# Built-in modules imports
import random
import json

# Local imports
# from story_editing.Editor import Editor
from utils import db
from users import current_user, admin_login_required



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
            story_name = db.collection('stories').document(live_story).get().get('story_name')
        except KeyError:
            print('No Live Story Field')
        return {'story_id': live_story, 'story_name': story_name}, 200
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
        
        print(story_id)

        stories = db.collection('stories')
        for doc in list(stories.list_documents()):
            doc = doc.id
            loop_name = stories.document(doc).get().get('story_name')
            loop_id = stories.document(doc).get().get('story_id')
            if loop_name == story_data['story_name'] and loop_id != story_id:
                # Attempting to save something with a duplicate name
                msg = 'Attempted to save engine with name already used by engine with ID ' + loop_id + '. To save, change current story name or overwrite existing engine with ID'
                return {'success': False, 'retry': False, 'msg': msg}, 200, {'ContentType': 'application/json'}

        if not confirm_save:
            if story_id == live_story_id:
                return {'success': False, 'retry': False, 
                    'msg': 'Attempted to overwrite live enine. Duplicate engine and try saving again.'}, 200, {'ContentType': 'application/json'}
                # return {'success': False, 'rename': False}, 200, {'ContentType': 'application/json'}
            elif stories.document(story_id).get().exists:
                return {'success': False, 'retry': True,
                    'msg': 'You are about to overwrite an existing engine. Are you sure you want to overwrite? If not, try saving with a different engine ID'}, 200, {'ContentType': 'application/json'}
                # return {'success': False, 'rename': True}, 200, {'ContentType': 'application/json'}

        if stories.document(story_id).get().exists:
            stories.document(story_id).update(story_data)
        else:
            stories.document(story_id).set(story_data)

    return {'success': True, 'retry': False, 'msg': 'Story successfully saved'}, 200, {'ContentType': 'application/json'}


@editor_blueprint.route('/editor/delete_engine', methods=['POST'])
def delete_engine():
    if current_user is not None and current_user.admin == True:
        live_story = db.collection('application_states').document('application_state').get().get('active_story_id')
        engine_id = request.form['engine_id']
        if engine_id == live_story:
            return {'success': False}, 200
        
        print(engine_id)
        print(db.collection('stories').document(engine_id).get().get('story_name'))
        db.collection('stories').document(engine_id).delete()

        return {'success': True}, 200


@editor_blueprint.route('/editor/import', methods=['POST'])
@admin_login_required
def import_engine():
    # Checks to make sure a file was uploaded
    if 'file' not in request.files:
        return {'success': False}, 500
    file = request.files['file']
    # Checks to make sure the file has an actual name and not just empty
    if file.filename == '':
        return {'success': False}, 500
    # Checks to make sure the file extension/type is allowed
    if '.' in file.filename and file.filename.rsplit('.', 1)[1].lower() == 'json':
        # Secures the file name for security purposes
        filename = secure_filename('upload.json')
        # Saves the file in the specified upload folder
        file.save(os.path.join('import_uploads', filename))
        #flash('File uploaded successfully')
        return {'success': False}, 200
    return {'success': False}, 500


@editor_blueprint.route('/import_uploads')
@admin_login_required
def import_files():
    file_data = json.load(open(os.path.join('import_uploads', secure_filename('upload.json'))))
    os.remove(os.path.join('import_uploads', secure_filename('upload.json')))
    return json.dumps(file_data)