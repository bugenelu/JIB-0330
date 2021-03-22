### Install following to run properly


import story_editing.Parsing as Parsing

def firestoreTwineConvert(db, input_file_name, import_id):
    with open(input_file_name, 'r') as file:
        html_content = file.read()

    data = Parsing.twine_parse(html_content, import_id)
    collection_name = u'stories'
    db.collection(collection_name).document(str(import_id)).set(data)

