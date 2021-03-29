# Flask imports
from flask import Blueprint, render_template




errors_blueprint = Blueprint('errors_blueprint', __name__)

@errors_blueprint.app_errorhandler(404)
def page_not_found(error):
	return render_template('error_pages/404.html'), 404


@errors_blueprint.app_errorhandler(500)
def internal_server_error(error):
	return render_template('error_pages/500.html'), 500