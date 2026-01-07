from flask import jsonify, render_template, request
import traceback


def _wants_json_response():
    # Prefer JSON for API routes or when client asks for JSON
    return request.path.startswith('/api') or 'application/json' in request.headers.get('Accept', '')


def register_error_handlers(app, logger=None):
    @app.errorhandler(404)
    def handle_404(e):
        if _wants_json_response():
            return jsonify({
                'error': 'Not Found',
                'message': 'The requested resource was not found.'
            }), 404
        return render_template('error.html', error='404 Not Found', message='La ressource demandée est introuvable.'), 404

    @app.errorhandler(500)
    def handle_500(e):
        if logger:
            logger.error('Unhandled 500 error: %s', e)
        if _wants_json_response():
            return jsonify({
                'error': 'Internal Server Error',
                'message': 'An unexpected error occurred.'
            }), 500
        return render_template('error.html', error='Erreur interne', message='Une erreur inattendue est survenue.'), 500

    @app.errorhandler(401)
    def handle_401(e):
        if logger:
            logger.warning('401 Unauthorized: %s', request.path)
        if _wants_json_response():
            return jsonify({'error': 'Unauthorized', 'message': 'Authentication required.'}), 401
        return render_template('error.html', error='Non autorisé', message='Authentification requise.'), 401

    @app.errorhandler(403)
    def handle_403(e):
        if logger:
            logger.warning('403 Forbidden: %s', request.path)
        if _wants_json_response():
            return jsonify({'error': 'Forbidden', 'message': 'Access denied.'}), 403
        return render_template('error.html', error='Accès refusé', message='Vous n\'avez pas les droits.'), 403

    @app.errorhandler(Exception)
    def handle_exception(e):
        # Generic fallback for unhandled exceptions
        if logger:
            logger.exception('Unhandled exception: %s', e)
        if _wants_json_response():
            return jsonify({
                'error': 'Exception',
                'message': str(e)
            }), 500
        # Show a friendly error page
        return render_template(
            'error.html',
            error='Erreur',
            message='Une erreur est survenue. Veuillez réessayer plus tard.'
        ), 500
