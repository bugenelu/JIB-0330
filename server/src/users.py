# Flask imports
from flask import Blueprint, request, redirect, url_for, render_template, flash

# Other installed modules imports
from werkzeug.local import LocalProxy
from functools import wraps

# Built-in modules imports
import os, json, sys, requests, uuid, hashlib, string, random
from datetime import datetime, timedelta

# Local imports
from utils import url, db, render_response, Mail




# Used to access the current user
current_user = LocalProxy(lambda: _get_current_user())

# Stores User objects so that they can persist each time current_user is accessed.
# Otherwise, current_user would be immutable
_users = {}

def _get_current_user():
    """_get_current_user()
    Retrieves the current user as a User object based on the session cookie
    Returns None if the current user is anonymous
    """

    global _users

    current_user = None

    # Gets the session cookie
    session_key = request.cookies.get('__session')
    if session_key is not None:
        # Finds the session based on the session cookie
        session = Session.get_session(session_key=session_key)
        if session:
            # Returns the existing User object if the current user has already been
            # loaded from the database
            if session.user_id in _users:
                return _users[session.user_id]

            # Loads the current user from the database
            current_user = User.get_user(email=session.user_id)

            # Verifies that the current user is authenticated
            if not current_user.authenticated:
                return None

            # Stores the current user so it can be re-referenced
            _users[session.user_id] = current_user

            # Updates the current user's last activity timestamp
            current_user.last_activity = datetime.now()
            current_user.save()

    return current_user


def login_user(user):
    """login_user(user)
    Used to log a user in
    Requires a valid User object
    """

    # Looks for an existing session key in the database
    session = Session.get_session(user_id=user.email)

    # If a session does not already exists, makes a new session
    if not session:
        session = Session(user.email)

    return session

 
def login_required(f):
    """@login_required
    Wrapper used to require that a user is logged in to access a page
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Checks if the user is anonymous
        if not current_user:
            return redirect(url + url_for('user_blueprint.login'))

        return f(*args, **kwargs)

    return decorated_function


def admin_login_required(f):
    """@admin_login_required
    Wrapper used to require that a user is logged as an admin in to access a page
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Checks if the user is anonymous
        if not current_user:
            return render_response(redirect(url + url_for('user_blueprint.login')))

        # Checks if the user is an admin
        if not current_user.admin:
            return render_response(render_template('error_pages/admin_access_denied.html'))

        return f(*args, **kwargs)

    return decorated_function


class User():
    """User
    Object used to represent users
    Contains the following fields:
        email
        password
        salt
        first_name
        last_name
        authenticated
        admin
        last_activity
        favorites
        history
        temp_password
        temp_password_expire
    """

    # The name of the collection in Firestore that stores objects of the same type
    _collection_name = 'user'

    def __init__(self, email, password, salt, first_name, last_name, authenticated=False, admin=False, last_activity=None, favorites=[], history=[], temp_password=None, temp_password_expire=None):
        """User(email, password, salt, first_name, last_name, authenticated=False, admin=False, last_activity=None, favorites=[], history=[], temp_password=None, temp_password_expire=None)
        Creates a new User object
        """

        self.email = email
        self.password = password
        self.salt = salt
        self.first_name = first_name
        self.last_name = last_name
        self.authenticated = authenticated
        self.admin = admin
        if last_activity:
            self.last_activity = last_activity
        else:
            self.last_activity = datetime.now()
        self.favorites = favorites
        self.history = history
        self.temp_password = temp_password
        self.temp_password_expire = temp_password_expire
        if temp_password_expire:
            self.temp_password_expire = temp_password_expire.replace(tzinfo=None)

    def save(self):
        """save()
        Saves the User object to the Firestore database
        """

        # Gets the document containing the user
        user_doc = db.collection(User._collection_name).where('email', '==', self.email).get()

        # If the user already has a document, updates the values
        if user_doc:
            user_ref = db.collection(User._collection_name).document(user_doc[0].id)
            user_ref.update({
                'email': self.email,
                'password': self.password,
                'salt': self.salt,
                'first_name': self.first_name,
                'last_name': self.last_name,
                'authenticated': self.authenticated,
                'admin': self.admin,
                'last_activity': self.last_activity,
                'favorites': self.favorites,
                'history': self.history,
                'temp_password': self.temp_password,
                'temp_password_expire': self.temp_password_expire
                })

        # If the user does not already have a document, creates a new document
        else:
            db.collection(User._collection_name).add({
                'email': self.email,
                'password': self.password,
                'salt': self.salt,
                'first_name': self.first_name,
                'last_name': self.last_name,
                'authenticated': self.authenticated,
                'admin': self.admin,
                'last_activity': self.last_activity,
                'favorites': self.favorites,
                'history': self.history,
                'temp_password': self.temp_password,
                'temp_password_expire': self.temp_password_expire
                })

    @staticmethod
    def get_user(email=None):
        """get_user(email=None)
        Retrieves a user based on the query parameters and returns a User object with the values populated from Firestore
        """

        # Creates a query on the user collection
        query = db.collection(User._collection_name)

        # Filters the query by email, if one is provided
        if email:
            query = query.where('email', '==', email)

        # Checks that exactly one user is found. If no users are found, we want to return None. If multiple users are found,
        # we want to return None to ensure that no one can access a user account they are not meant to.
        query = query.get()
        if len(query) != 1:
            return None

        # Creates and returns a User object with the values from Firestore
        return User(email=query[0].get('email'),
            password=query[0].get('password'),
            salt=query[0].get('salt'),
            first_name=query[0].get('first_name'),
            last_name=query[0].get('last_name'),
            authenticated=query[0].get('authenticated'),
            admin=query[0].get('admin'),
            last_activity=query[0].get('last_activity'),
            favorites=query[0].get('favorites'),
            history=query[0].get('history'),
            temp_password=query[0].get('temp_password'),
            temp_password_expire=query[0].get('temp_password_expire'))

    @staticmethod
    def get_all_users():
        """get_all_users()
        Retrieves basic information for all users in Firestore
        Only returns their email, first name, last name, last activity, and admin status
        Does not return sensitive data like password and salt
        """

        users = []

        # Gets an iterator over all users in the user collection in Firestore
        query = db.collection(User._collection_name).stream()
        for user in query:
            # Adds just the email, first name, last name, last activity, and admin status to the output
            users.append({
                'email': user.get('email'),
                'first_name': user.get('first_name'),
                'last_name': user.get('last_name'),
                'admin': user.get('admin'),
                'last_activity': user.get('last_activity')  
                })

        return users


class Session():
    """Session
    Object used to represent sessions
    Contains the following fields:
        user_id
        session_key
    """

    # The name of the collection in Firestore that stores objects of the same type
    _collection_name = 'sessions'

    def __init__(self, user_id, session_key=None):
        """Session(user_id, session_key=None)
        Creates a new Session object
        """

        self.user_id = user_id

        # Checks if a session key was provided, if not it generates a new one and stores the session in Firestore
        if session_key:
            self.session_key = session_key
        else:
            # Generates a session key
            self.session_key = str(uuid.uuid4())

            # Saves the session to Firestore
            db.collection(Session._collection_name).add({
                'session_key': self.session_key,
                'user_id': self.user_id
                })

    @staticmethod
    def get_session(session_key=None, user_id=None):
        """get_session(session_key=None, user_id=None)
        Retrieves a session based on the query parameters and returns a Session object with the values populated from Firestore
        """

        # Creates a query on the user collection
        query = db.collection(Session._collection_name)

        # Filters the query by session key, if one is provided
        if session_key:
            query = query.where('session_key', '==', session_key)

        # Filters the query by user ID, if one is provided
        if user_id:
            query = query.where('user_id', '==', user_id)
        
        # Checks that exactly one session is found. If no sessions are found, we want to return None. If multiple sessions are found,
        # we want to return None to ensure that no one can access a session they are not meant to.
        query = query.get()
        if len(query) != 1:
            return None

        # Creates and returns a Session object with the values from Firestore
        return Session(user_id=query[0].get('user_id'), session_key=query[0].get('session_key'))

    @staticmethod
    def delete_session(session_key=None, user_id=None):
        """delete_session(session_key=None, user_id=None)
        Deletes a session based on the query parameters and returns a Session object with the values populated from Firestore
        """

        # Creates a query on the user collection
        query = db.collection(Session._collection_name)

        # Filters the query by session key, if one is provided
        if session_key:
            query = query.where('session_key', '==', session_key)

        # Filters the query by user ID, if one is provided
        if user_id:
            query = query.where('user_id', '==', user_id)

        # Checks that exactly one session is found. If no sessions are found, we want to return None. If multiple sessions are found,
        # we want to do nothing so that we don't end a session we don't intend to
        query = query.get()
        if len(query) == 1:
            # Deletes the session from Firestore
            db.collection(Session._collection_name).document(query[0].id).delete()



class UserActivity():
    """UserActivity
    Object used to represent a user's activity
    Contains the following fields:
        user_id
        story_activity
    """

    # The name of the collection in Firestore that stores objects of the same type
    _collection_name = 'activity'

    def __init__(self, user_id, story_activity=[]):
        """UserActivity(user_id, story_activity=[])
        Creates a new UserActivity object
        """

        self.user_id = user_id
        self.story_activity = story_activity

    def save(self):
        """save()
        Saves the UserActivity object to the Firestore database
        """

        # Gets the document containing the user activity
        activity_doc = db.collection(UserActivity._collection_name).where('user_id', '==', self.user_id).get()

        # If the user activity already has a document, updates the values
        if activity_doc:
            activity_ref = db.collection(UserActivity._collection_name).document(activity_doc[0].id)
            activity_ref.update({
                'user_id': self.user_id,
                'story_activity': self.story_activity
                })

        # If the user activity does not already have a document, creates a new document
        else:
            db.collection(UserActivity._collection_name).add({
                'user_id': self.user_id,
                'story_activity': self.story_activity
                })

    @staticmethod
    def get_user_activity(user_id):
        """get_user_activity(user_id=None)
        Retrieves a session based on the query parameters and returns a Session object with the values populated from Firestore
        """

        # Creates a query on the user collection
        query = db.collection(UserActivity._collection_name)

        # Filters the query by user ID, if one is provided
        if user_id:
            query = query.where('user_id', '==', user_id)

        # Checks that exactly one user activity is found. If no user activities are found, we want to create a new user activity.
        # If multiple user activities are found, we want to return None to ensure that no one can access a user activity they are
        # not meant to.
        query = query.get()
        if len(query) != 1:
            # If no user activities are found, creates a new one
            if len(query) == 0:
                user = UserActivity(user_id=user_id)
                user.save()
                return user
            return None

        # Creates and returns a UserActivity object with the values from Firestore
        return UserActivity(user_id=query[0].get('user_id'), story_activity=query[0].get('story_activity'))




# The Flask blueprint for user routes
user_blueprint = Blueprint('user_blueprint', __name__)


@user_blueprint.route('/login', methods=['GET', 'POST'])
def login():
    """login()
    Serves the login page
    Accessed at '/login' via a GET or POST request
    """

    # If the request is a POST request, attempts to log the user in using the form input
    if request.method == 'POST':
        # Looks for a user with the provided email
        user = User.get_user(email=request.form['email'])

        # If the user exists, attempts to log the user in
        if user:
            # Creates the hashed password
            hashed_password = hashlib.sha512((request.form['password'] + str(user.salt)).encode('utf-8')).hexdigest()

            # Checks if the provided password matches the user's password
            if user.password is not None and hashed_password == user.password:
                # Marks the user as authenticated
                user.authenticated = True
                user.save()

                # Creates a session for the user
                session = login_user(user)

                # Sets the session cookie and redirects to the homepage
                return render_response(redirect(url + url_for('index')), cookies={'__session': session.session_key})

        # Returns the login page with an error that the login failed
        return render_response(render_template('user_pages/login.html', failed_login=True))

    # Returns the login.html template with the given values
    return render_response(render_template('user_pages/login.html'))


# Serves the sign up page
@user_blueprint.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        if User.get_user(email=request.form['email']):
            return render_response(render_template('user_pages/signup.html', user_exists=True))
        salt = str(uuid.uuid4())
        hashed_password = hashlib.sha512((request.form['password'] + salt).encode('utf-8')).hexdigest()
        user = User(email=request.form['email'], password=hashed_password, salt=salt, first_name=request.form['first-name'], last_name=request.form['last-name'], authenticated=True)
        user.save()
        session = login_user(user)
        return render_response(redirect(url + url_for('index')), cookies={'__session': session.session_key})

    # Returns the signup.html template with the given values
    return render_response(render_template('user_pages/signup.html'))


@user_blueprint.route('/logout')
def logout():
    if current_user:
        current_user.authenticated = False
        current_user.save()
        Session.delete_session(user_id=current_user.email)
    return render_response(redirect(url + url_for('index')), delete_cookies=['__session'])


@user_blueprint.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        user = User.get_user(email=request.form['email'])
        if user:
            user.temp_password = ''.join(random.choices(string.ascii_uppercase + string.digits, k=12))
            user.temp_password_expire = datetime.now() + timedelta(minutes=15)
            user.save()
            mail = Mail(user.email, 'Temporary Password', '<p>Here is your temporary password:</p><h3>' + user.temp_password + '</h3>')
            return render_response(render_template('user_pages/reset_password_1.html', email=user.email))
        return render_response(render_template('user_pages/forgot_password.html', no_account=True))

    # Returns the forgot_password.html template with the given values
    return render_response(render_template('user_pages/forgot_password.html'))


@user_blueprint.route('/reset_password', methods=['POST'])
def reset_password():
    user = User.get_user(email=request.form['email'])
    if user:
        if user.temp_password and user.temp_password_expire > datetime.now(user.temp_password_expire.tzinfo) and user.temp_password == request.form['password']:
            user.password = None
            user.temp_password = None
            user.temp_password_expire = None
            user.save()
            return render_response(render_template('user_pages/reset_password_2.html', email=user.email))
        if user.password is None:
            salt = str(uuid.uuid4())
            hashed_password = hashlib.sha512((request.form['password'] + salt).encode('utf-8')).hexdigest()
            user.password = hashed_password
            user.salt = salt
            user.save()
            return render_response(redirect(url + url_for('user_blueprint.login')))
    return render_response(redirect(url + url_for('user_blueprint.login')))


# Serves the profile page
@user_blueprint.route('/profile')
@login_required
def profile():
    # Returns the profile page for admins
    if current_user.admin:
        return render_response(render_template('admin_pages/profile.html'))

    # Returns the profile page for users
    return render_response(render_template('user_pages/profile.html'))


# Serves the profile edit page
@user_blueprint.route('/profile/edit', methods=['GET', 'POST'])
@login_required
def edit_profile():
    if request.method == 'POST':
        # Updates values of the current user's profile from the form
        current_user.email = request.form['email']
        current_user.first_name = request.form['first-name']
        current_user.last_name = request.form['last-name']

        # Updates the password only if a new one is provided
        if request.form['password'] != '':
            salt = str(uuid.uuid4())
            current_user.password = hashlib.sha512((request.form['password'] + salt).encode('utf-8')).hexdigest()
            current_user.salt = salt
        return render_response(redirect(url + url_for('user_blueprint.profile')))

    # Returns the edit profile page for admins
    if current_user.admin:
        return render_response(render_template('admin_pages/edit_profile.html', email=current_user.email, first_name=current_user.first_name, last_name=current_user.last_name))
    # Returns the edit profile page for users
    return render_response(render_template('user_pages/edit_profile.html', email=current_user.email, first_name=current_user.first_name, last_name=current_user.last_name))


# Serves the favorites page
@user_blueprint.route('/favorites')
@login_required
def favorites():
    favorites = []
    for favorite in current_user.favorites:
        story_ref = db.collection('stories').document(favorite['story'])
        story_doc = story_ref.get()
        page = story_doc.get('page_nodes.`' + favorite['page_id'] + '`')
        favorites.insert(0, (page['page_name'], favorite['story'] + "/" + favorite['page_id'], favorite['history_id']))

    # Returns the favorites.html template with the given values
    return render_response(render_template('user_pages/favorites.html', first_name=current_user.first_name, favorites=favorites))


@user_blueprint.route('/add_favorite', methods=['POST'])
@login_required
def add_favorites():
    current_user.favorites.append({
        'page_id': request.form['page_id'],
        'story': request.form['story'],
        'history_id': request.form['history_id']
    })
    current_user.save()

    return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}


@user_blueprint.route('/remove_favorite', methods=['POST'])
@login_required
def remove_favorite():
    page_id, story, history_id = request.form['page_id'], request.form['story'], request.form['history_id']

    for favorite in current_user.favorites:
        if favorite['page_id'] == page_id and favorite['story'] == story and favorite['history_id'] == history_id:
            current_user.favorites.remove(favorite)
            break
    current_user.save()

    return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}


# Serves the history page
@user_blueprint.route('/history')
@login_required
def history():
    history = current_user.history
    history_arr = []
    # [[(page_id, history)]]

    # Tracking which story a page belongs to

    # Sort the history
    for i in range(len(history)):
        for j in range(i + 1, len(history)):
            if history[i]['last_updated'].replace(tzinfo=None) < history[j]['last_updated'].replace(tzinfo=None):
                history[i], history[j] = history[j], history[i]

    for hist in history:
        new_arr = []
        story_ref = db.collection('stories').document(hist['story'])
        story_doc = story_ref.get()
        for page_id in hist['pages']:
            page = story_doc.get('page_nodes.`' + page_id + '`')
            new_arr.insert(0, (page['page_name'], hist['story'] + "/" + page_id))
        history_arr.append(new_arr)

    # Returns the history.html template with the given values
    return render_response(render_template('user_pages/history.html', history=history_arr))


@user_blueprint.route('/users')
@admin_login_required
def users():
    users = User.get_all_users()
    return render_response(render_template('admin_pages/edit_users.html', users=users))


@user_blueprint.route('/add_admin', methods=['POST'])
@admin_login_required
def add_admin():
    user = User.get_user(request.form['user_id'])
    user.admin = True
    user.save()

    return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}


@user_blueprint.route('/remove_admin', methods=['POST'])
@admin_login_required
def remove_admin():
    user = User.get_user(request.form['user_id'])
    user.admin = False
    user.save()

    return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}