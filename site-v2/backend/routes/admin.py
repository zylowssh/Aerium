"""
Points de terminaison réservés aux administrateurs pour la configuration du système
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import User
from scheduler import mettre_a_jour_vitesse_simulation, VITESSE_SIMULATION

admin_bp = Blueprint('admin', __name__)


def admin_requis(f):
    """Décorateur pour exiger le rôle d'administrateur"""
    from functools import wraps
    
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        id_utilisateur_courant = get_jwt_identity()
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
        
        user = User.query.get(id_utilisateur_courant)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Accès administrateur requis'}), 403
        
        return f(*args, **kwargs)
    
    return decorated


@admin_bp.route('/simulation/speed', methods=['GET'])
@admin_requis
def obtenir_vitesse_simulation():
    """Obtenir la vitesse de simulation courante"""
    return jsonify({
        'speed': VITESSE_SIMULATION,
        'message': f'Vitesse de simulation actuelle: {VITESSE_SIMULATION} secondes'
    }), 200


@admin_bp.route('/simulation/speed', methods=['POST'])
@admin_requis
def definir_vitesse_simulation():
    """Mettre à jour la vitesse de simulation (admin seulement)"""
    try:
        data = request.get_json()
        nouvelle_vitesse = data.get('speed')
        
        if not nouvelle_vitesse or nouvelle_vitesse <= 0:
            return jsonify({'error': 'La vitesse doit être un nombre positif'}), 400
        
        succes = mettre_a_jour_vitesse_simulation(float(nouvelle_vitesse))
        
        if succes:
            return jsonify({
                'message': f'Vitesse de simulation mise à jour à {nouvelle_vitesse} secondes',
                'speed': nouvelle_vitesse
            }), 200
        else:
            return jsonify({'error': 'Échec de la mise à jour de la vitesse de simulation'}), 500
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
