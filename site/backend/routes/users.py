from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db, User
import bcrypt

utilisateurs_bp = Blueprint('users', __name__)

@utilisateurs_bp.route('/profile', methods=['GET'])
@jwt_required()
def obtenir_profil():
    """Obtenir le profil de l'utilisateur courant"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        
        # Convertir en int si chaîne
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
            
        user = User.query.get(id_utilisateur_courant)
        
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        return jsonify({'user': user.vers_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@utilisateurs_bp.route('/profile', methods=['PUT'])
@jwt_required()
def mettre_a_jour_profil():
    """Mettre à jour le profil de l'utilisateur courant"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        
        # Convertir en int si chaîne
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
            
        user = User.query.get(id_utilisateur_courant)
        
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        data = request.get_json()
        
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'avatar_url' in data:
            user.avatar_url = data['avatar_url']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profil mis à jour avec succès',
            'user': user.vers_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@utilisateurs_bp.route('/change-password', methods=['POST'])
@jwt_required()
def changer_mot_de_passe():
    """Changer le mot de passe de l'utilisateur"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        
        # Convertir en int si chaîne
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
            
        user = User.query.get(id_utilisateur_courant)
        
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        data = request.get_json()
        ancien_mot_de_passe = data.get('old_password')
        nouveau_mot_de_passe = data.get('new_password')
        
        if not ancien_mot_de_passe or not nouveau_mot_de_passe:
            return jsonify({'error': 'Les anciens et nouveaux mots de passe sont requis'}), 400
        
        # Vérifier l'ancien mot de passe
        if not bcrypt.checkpw(ancien_mot_de_passe.encode('utf-8'), user.password_hash.encode('utf-8')):
            return jsonify({'error': 'Ancien mot de passe incorrect'}), 401
        
        # Hacher le nouveau mot de passe
        nouveau_hash = bcrypt.hashpw(nouveau_mot_de_passe.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user.password_hash = nouveau_hash
        
        db.session.commit()
        
        return jsonify({'message': 'Mot de passe changé avec succès'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@utilisateurs_bp.route('', methods=['GET'])
@jwt_required()
def obtenir_tous_utilisateurs():
    """Obtenir tous les utilisateurs (admin seulement)"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        
        # Convertir en int si chaîne
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
            
        user = User.query.get(id_utilisateur_courant)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Non autorisé - Accès administrateur requis'}), 403
        
        utilisateurs = User.query.all()
        
        return jsonify({
            'users': [u.vers_dict() for u in utilisateurs]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
