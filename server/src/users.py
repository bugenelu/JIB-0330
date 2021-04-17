# Flask imports
from flask import Blueprint, request, redirect, url_for, render_template, flash

# Other installed modules imports
from werkzeug.local import LocalProxy
from functools import wraps

# Built-in modules imports
import os, json, sys, requests, uuid, hashlib, string, random, time
from datetime import datetime, timedelta

# Local imports
from utils import url, db, render_response, Mail




# Used to access the current user
current_user = LocalProxy(lambda: __get_current_user())

# Stores User objects so that they can persist each time current_user is accessed.
# Otherwise, current_user would be immutable
__users = {}

def __get_current_user():
    """_get_current_user()
    Retrieves the current user as a User object based on the session cookie
    Returns None if the current user is anonymous
    """

    global __users

    current_user = None

    # Gets the session cookie
    session_key = request.cookies.get('__session')
    if session_key is not None:
        # Finds the session based on the session cookie
        session = Session.get_session(session_key=session_key)
        if session:
            # Gets the user by the user_id matching the session key
            current_user = get_user(session.user_id)

            # Verifies that the current user is authenticated
            if not current_user.authenticated:
                return None

            # Updates the current user's last activity timestamp
            current_user.last_activity = datetime.now()
            current_user.save()

    return current_user


def get_user(user_id):
    """get_user(user_id)
    Returns the user corresponding to the user_id
    requires a valid user_id
    """

    # Returns the existing User object if the current user has already been
    # loaded from the database
    if user_id in __users:
        return __users[user_id]

    # Loads the current user from the database
    user = User.get_user(email=user_id)

    # Checks that the user exists
    if user:
        # Stores the current user so it can be re-referenced
        __users[user_id] = user

    return user


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
    __collection_name = 'user'

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
        user_doc = db.collection(User.__collection_name).where('email', '==', self.email).get()

        # If the user already has a document, updates the values
        if user_doc:
            user_ref = db.collection(User.__collection_name).document(user_doc[0].id)
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
            db.collection(User.__collection_name).add({
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

    def update_email(self, email):
        """update_email(email)
        Used to update the user's email, since the save function looks for the document to update by email
        """

        # Stores the old email
        old_email = self.email

        # Updates the User object's email field
        self.email = email

        # Gets the document containing the user searching by the old email
        user_doc = db.collection(User.__collection_name).where('email', '==', old_email).get()

        # If the user already has a document, updates the values
        if user_doc:
            user_ref = db.collection(User.__collection_name).document(user_doc[0].id)
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
            db.collection(User.__collection_name).add({
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
        query = db.collection(User.__collection_name)

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
        query = db.collection(User.__collection_name).stream()
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
    __collection_name = 'sessions'

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
            db.collection(Session.__collection_name).add({
                'session_key': self.session_key,
                'user_id': self.user_id
                })

    def save(self):
        """save()
        Saves the Session object to the Firestore database
        """

        # Gets the document containing the session
        session_doc = db.collection(Session.__collection_name).where('session_key', '==', self.session_key).get()

        # If the user already has a document, updates the values
        if session_doc:
            session_ref = db.collection(Session.__collection_name).document(session_doc[0].id)
            session_ref.update({
                'session_key': self.session_key,
                'user_id': self.user_id
                })

        # If the user does not already have a document, creates a new document
        else:
            db.collection(Session.__collection_name).add({
                'session_key': self.session_key,
                'user_id': self.user_id
                })

    @staticmethod
    def get_session(session_key=None, user_id=None):
        """get_session(session_key=None, user_id=None)
        Retrieves a session based on the query parameters and returns a Session object with the values populated from Firestore
        """

        # Creates a query on the user collection
        query = db.collection(Session.__collection_name)

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
        query = db.collection(Session.__collection_name)

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
            db.collection(Session.__collection_name).document(query[0].id).delete()



class UserActivity():
    """UserActivity
    Object used to represent a user's activity
    Contains the following fields:
        user_id
        story_activity
    """

    # The name of the collection in Firestore that stores objects of the same type
    __collection_name = 'activity'

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
        activity_doc = db.collection(UserActivity.__collection_name).where('user_id', '==', self.user_id).get()

        # If the user activity already has a document, updates the values
        if activity_doc:
            activity_ref = db.collection(UserActivity.__collection_name).document(activity_doc[0].id)
            activity_ref.update({
                'user_id': self.user_id,
                'story_activity': self.story_activity
                })

        # If the user activity does not already have a document, creates a new document
        else:
            db.collection(UserActivity.__collection_name).add({
                'user_id': self.user_id,
                'story_activity': self.story_activity
                })

    @staticmethod
    def get_user_activity(user_id):
        """get_user_activity(user_id=None)
        Retrieves a session based on the query parameters and returns a Session object with the values populated from Firestore
        """

        # Creates a query on the user collection
        query = db.collection(UserActivity.__collection_name)

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
    Serves the login page or logs the user in, depending on the request method
    Accessed at '/login' via a GET or POST request
    """

    # If the request is a POST request, attempts to log the user in using the form input
    if request.method == 'POST':
        # Looks for a user with the provided email
        user = get_user(request.form['email'])

        # If the user exists, attempts to log the user in
        if user:
            # Creates the hashed password
            # (?) TODO: Switch hashing to key derivation function
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

    # If the request is a GET request, returns the login page
    return render_response(render_template('user_pages/login.html'))


# Serves the sign up page
@user_blueprint.route('/signup', methods=['GET', 'POST'])
def signup():
    """signup()
    Serves the signup page or signs the user up, depending on the request method
    Accessed at '/signup' via a GET or POST request
    """

    # If the request is a POST request, attempts to create the user using the form input
    if request.method == 'POST':
        # Checks for an existing user with the same email
        if get_user(request.form['email']):
            # Returns the signup page with an error that an account already exists with that email
            return render_response(render_template('user_pages/signup.html', user_exists=True))

        # Creates the salt used in hashing the password
        salt = str(uuid.uuid4())

        # Hashes the password
        # (?) TODO: Switch hashing to key derivation function
        hashed_password = hashlib.sha512((request.form['password'] + salt).encode('utf-8')).hexdigest()

        # Creates the user with the values from the form and the hashed password
        user = User(email=request.form['email'], password=hashed_password, salt=salt, first_name=request.form['first-name'], last_name=request.form['last-name'], authenticated=True)
        user.save()

        # Creates a session for the user
        session = login_user(user)

        # Sets the session cookie and redirects to the homepage
        return render_response(redirect(url + url_for('index')), cookies={'__session': session.session_key})

    # If the request is a GET request, returns the signup page
    return render_response(render_template('user_pages/signup.html'))


@user_blueprint.route('/logout')
@login_required
def logout():
    """logout()
    Logs the user out of the application
    Accessed at '/logout' via a GET request
    Requires that the user is logged in
    """

    # Gets the current user, since the current user will be lost once authenticated is set to false
    user = __get_current_user()

    # Sets the user to unauthenticated
    user.authenticated = False
    user.save()

    # Deletes the session associated with the user
    Session.delete_session(user_id=user.email)

    # Deletes the session cookie and redirects to the homepage of the application
    return render_response(redirect(url + url_for('index')), delete_cookies=['__session'])


@user_blueprint.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    """forgot_password()
    Serves the forgot password page or creates a temporary password the user can use to reset their password, depending on the request method
    Accessed at '/forgot_password' via a GET or POST request
    """

    # If the request is a POST request, creates a temporary password for the user to reset their password
    if request.method == 'POST':
        # Gets the user by email
        user = get_user(request.form['email'])

        # Checks that the user exists
        if user:
            # Creates a temporary password and an expiration time of 15 minutes later
            user.temp_password = ''.join(random.choices(string.ascii_uppercase + string.digits, k=12))
            user.temp_password_expire = datetime.now() + timedelta(minutes=15)
            user.save()

            # Emails the temporary password to the user's email address
            mail = Mail(user.email, 'Temporary Password', '<p>Here is your temporary password:</p><h3>' + user.temp_password + '</h3>')

            # Returns the next page where the user provides the temporary password to verify they own the account
            return render_response(render_template('user_pages/reset_password_1.html', email=user.email))

        # Returns the forgot password page with an error that their is not an account with the email provided
        return render_response(render_template('user_pages/forgot_password.html', no_account=True))

    # Returns the forgot password page
    return render_response(render_template('user_pages/forgot_password.html'))


@user_blueprint.route('/reset_password', methods=['POST'])
def reset_password():
    """reset_password()
    Verifies the temporary password used by the user or resets the user's password, depending on the state of the application
    Accessed at '/reset_password' via a POST request
    """

    # Gets the user by email
    user = get_user(request.form['email'])

    # Checks that the user exists
    if user:
        # Checks that the temporary password exists, has not expired, and matches the password provided by the user
        if user.temp_password and user.temp_password_expire > datetime.now(user.temp_password_expire.tzinfo) and user.temp_password == request.form['password']:
            # Sets the user's password to None so it can be reset
            user.password = None

            # Sets the temporary password and expiration to None so it cannot be used again
            user.temp_password = None
            user.temp_password_expire = None
            user.save()

            # Returns the next page where the user can reset their password
            return render_response(render_template('user_pages/reset_password_2.html', email=user.email))

        # Checks that the user's password is None and therefore ready to be reset
        if user.password is None:
            # Creates the salt used in hashing the password
            salt = str(uuid.uuid4())

            # Hashes the password
            # (?) TODO: Switch hashing to key derivation function
            hashed_password = hashlib.sha512((request.form['password'] + salt).encode('utf-8')).hexdigest()

            # Stores the updated hashed password and salt
            user.password = hashed_password
            user.salt = salt
            user.save()

            # Redirects to the login page
            return render_response(redirect(url + url_for('user_blueprint.login')))

    # If the user does not exists, redirects to the login page
    # The email is passed by the system, not user input, so this shouldn't happen unless the user mistakenly navigates here with an out of context POST request
    return render_response(redirect(url + url_for('user_blueprint.login')))


# Serves the profile page
@user_blueprint.route('/profile')
@login_required
def profile():
    """profile()
    Serves the profile page
    Accessed at '/profile' via a GET request
    Requires that the user is logged in
    """

    # Returns the profile page for admins
    if current_user.admin:
        return render_response(render_template('admin_pages/profile.html'))

    # Returns the profile page for users
    return render_response(render_template('user_pages/profile.html'))


# Serves the profile edit page
@user_blueprint.route('/profile/edit', methods=['GET', 'POST'])
@login_required
def edit_profile():
    """edit_profile()
    Serves the edit profile page or updates the profile, depending on the request method
    Accessed at '/logout' via a GET or POST request
    Requires that the user is logged in
    """

    # If the request is a POST request, updates the user based on the form input
    if request.method == 'POST':
        # Updates values of the current user's profile from the form
        current_user.first_name = request.form['first-name']
        current_user.last_name = request.form['last-name']

        # Updates the email only if a new one is provided
        if request.form['email'] != current_user.email:
            # Stores old user_id
            old_user_id = current_user.email

            # Updates the user's email
            current_user.update_email(request.form['email'])

            # Updates the session key with the new user_id
            session = Session.get_session(user_id=old_user_id)
            session.user_id = current_user.email
            session.save()

            # Removes the user at the old user_id from memory
            __users.pop(old_user_id, None)

        # Updates the password only if a new one is provided
        if request.form['password'] != '':
            # Creates the salt used in hashing the password
            salt = str(uuid.uuid4())

            # Hashes the password and stores the new hashed password and salt
            current_user.password = hashlib.sha512((request.form['password'] + salt).encode('utf-8')).hexdigest()
            current_user.salt = salt

        # Saves the changes to the user
        current_user.save()
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
    """favorites()
    Serves the favorites page with the user's favorites
    Accessed at '/favorites' via a GET request
    Requires that the user is logged in
    """

    # Creates an array of the user's favorites with information about each page
    favorites = []
    for favorite in current_user.favorites:
        # Gets the story the favorite belongs to
        story_ref = db.collection('stories').document(favorite['story'])
        story_doc = story_ref.get()

        # Gets the page data for the favorite
        page = story_doc.get('page_nodes.`' + favorite['page_id'] + '`')

        # Adds the favorite's page name, the favorite's page link, and which history the favorite belongs to
        favorites.insert(0, (page['page_name'], favorite['story'] + "/" + favorite['page_id'], favorite['history_id']))

    # Returns the favorites.html template with the given values
    return render_response(render_template('user_pages/favorites.html', first_name=current_user.first_name, favorites=favorites))


@user_blueprint.route('/add_favorite', methods=['POST'])
@login_required
def add_favorite():
    """add_favorite()
    Adds a page to a user's favorites
    Accessed at '/add_favorites' via a POST request
    Requires that the user is logged in
    """

    # Adds the current page ot the user's favorites
    current_user.favorites.append({
        'page_id': request.form['page_id'],
        'story': request.form['story'],
        'history_id': request.form['history_id']
    })
    current_user.save()

    # Returns a successful message
    return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}


@user_blueprint.route('/remove_favorite', methods=['POST'])
@login_required
def remove_favorite():
    """remove_favorite()
    Removes a page from a user's favorites
    Accessed at '/remove_favorite' via a GET request
    Requires that the user is logged in
    """

    # Gets the page ID, story, and history ID of the current page
    page_id, story, history_id = request.form['page_id'], request.form['story'], request.form['history_id']

    # Looks for a matching favorite in the current user's favorites
    for favorite in current_user.favorites:
        # Checks for a favorite with a matching page ID and story
        if favorite['page_id'] == page_id and favorite['story'] == story:
            # Removes the matching favorite
            current_user.favorites.remove(favorite)
            break

    # Saves the changes to the user
    current_user.save()

    # Returns a successful message
    return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}


# Serves the history page
@user_blueprint.route('/history')
@login_required
def history():
    """history()
    Serves the history page with the user's history
    Accessed at '/history' via a GET request
    Requires that the user is logged in
    """

    # The current user's history
    history = current_user.history

    # The array with the history information to pass to the history page
    # [[(page_id, history)]]
    history_arr = []

    # Sorts the history
    for i in range(len(history)):
        for j in range(i + 1, len(history)):
            if history[i]['last_updated'].replace(tzinfo=None) < history[j]['last_updated'].replace(tzinfo=None):
                history[i], history[j] = history[j], history[i]

    # Builds the array to pass to the history page
    for hist in history:
        # The array with the history information for this history
        new_arr = []

        # Gets the story the history belongs to
        story_ref = db.collection('stories').document(hist['story'])
        story_doc = story_ref.get()

        # Adds each page in this history to the array
        for page_id in hist['pages']:
            # Gets the page data by page ID
            page = story_doc.get('page_nodes.`' + page_id + '`')

            # Adds the page's name and link
            new_arr.insert(0, (page['page_name'], hist['story'] + "/" + page_id))

        # Appends the 
        history_arr.append(new_arr)

    # Returns the history page with the history data
    return render_response(render_template('user_pages/history.html', history=history_arr))


@user_blueprint.route('/users')
@admin_login_required
def users():
    """users()
    Serves the users page with all of the users
    Accessed at '/users' via a GET request
    Requires that the user is logged in
    """

    # Gets basic information for all users
    # Does NOT contain passwords, salt, or any other sensitive data
    users = User.get_all_users()

    # Returns the user page with the users data
    return render_response(render_template('admin_pages/edit_users.html', users=users))


@user_blueprint.route('/add_admin', methods=['POST'])
@admin_login_required
def add_admin():
    """add_admin()
    Makes a user an admin
    Accessed at '/add_admin' via a POST request
    Requires that the user is logged in as an admin
    """

    # Gets the user by email
    user = get_user(request.form['user_id'])

    # Sets the user to an admin
    user.admin = True
    user.save()

    # Returns a successful message
    return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}


@user_blueprint.route('/remove_admin', methods=['POST'])
@admin_login_required
def remove_admin():
    """remove_admin()
    Makes an admin a regular user
    Accessed at '/remove_admin' via a POST request
    Requires that the user is logged in as an admin
    """

    # Gets the user by email
    user = get_user(request.form['user_id'])

    # Checks that the user being removed as an admin is not the current
    # A user should not be able to remove themselves as an admin to avoid the situation where no admins exist
    if user.email == current_user.email:
        return json.dumps({'success': False}), 403, {'ContentType': 'application/json'}

    # Sets the admin to a regular user
    user.admin = False
    user.save()

    # Returns a successful message
    return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}


# Serves the media manager page
@user_blueprint.route('/media')
@admin_login_required
def media():
    """media()
    Serves the media manager page
    Accessed at '/media' via a GET request
    Requires that the user is logged in as an admin
    """

    # The file names
    files = []

    # Gets the names of all files in the file_uploads folder
    for file in os.listdir('file_uploads'):
        seconds = os.path.getmtime('file_uploads/' + file)
        timestamp = time.ctime(seconds)
        sizeb = os.stat('file_uploads/' + file).st_size
        sizek = sizeb/1024
        sizeg = round(sizek/1024, 2)
        sizek = round(sizek, 2)
        size = sizek
        sizetype = 'KB'
        if sizeg > 2:
            size = sizeg
            sizetype = 'GB'
        files.append([file, timestamp, size, sizetype])

    # Returns the files page with the files
    return render_response(render_template('admin_pages/media_manager.html', files=files, url_root=request.url_root))