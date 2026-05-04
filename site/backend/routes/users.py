from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db, User
import bcrypt

utilisateurs_bp = Blueprint('users', __name__)


def _get_current_user():
    id_utilisateur_courant = get_jwt_identity()
    if isinstance(id_utilisateur_courant, str):
        id_utilisateur_courant = int(id_utilisateur_courant)
    user = User.query.get(id_utilisateur_courant)
    return user, id_utilisateur_courant


def _admin_guard():
    user, id_utilisateur_courant = _get_current_user()
    if not user or user.role != 'admin':
        return None, None, (jsonify({'error': 'Non autorisé - Accès administrateur requis'}), 403)
    return user, id_utilisateur_courant, None

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


@utilisateurs_bp.route('', methods=['POST'])
@jwt_required()
def creer_utilisateur_admin():
    """Créer un utilisateur (admin seulement)"""
    try:
        _, _, erreur = _admin_guard()
        if erreur:
            return erreur

        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        password = data.get('password') or ''
        full_name = (data.get('full_name') or '').strip()
        role = (data.get('role') or 'user').strip().lower()

        if not email or not password:
            return jsonify({'error': 'Email et mot de passe requis'}), 400

        if role not in ['admin', 'user']:
            return jsonify({'error': "Le rôle doit être 'admin' ou 'user'"}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email déjà enregistré'}), 400

        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        new_user = User(
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            role=role,
        )
        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            'message': 'Utilisateur créé avec succès',
            'user': new_user.vers_dict(),
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@utilisateurs_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def mettre_a_jour_utilisateur_admin(user_id):
    """Mettre à jour un utilisateur (admin seulement)"""
    try:
        admin_user, _, erreur = _admin_guard()
        if erreur:
            return erreur

        target_user = User.query.get(user_id)
        if not target_user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404

        data = request.get_json() or {}

        new_email = data.get('email')
        if isinstance(new_email, str):
            new_email = new_email.strip().lower()
            if not new_email:
                return jsonify({'error': 'Email invalide'}), 400
            exists = User.query.filter(User.email == new_email, User.id != target_user.id).first()
            if exists:
                return jsonify({'error': 'Cet email est déjà utilisé'}), 400
            target_user.email = new_email

        if 'full_name' in data:
            target_user.full_name = (data.get('full_name') or '').strip()

        if 'role' in data:
            new_role = (data.get('role') or '').strip().lower()
            if new_role not in ['admin', 'user']:
                return jsonify({'error': "Le rôle doit être 'admin' ou 'user'"}), 400
            if admin_user.id == target_user.id and new_role != 'admin':
                return jsonify({'error': 'Vous ne pouvez pas retirer votre propre rôle admin'}), 400
            target_user.role = new_role

        if 'password' in data and data.get('password'):
            new_password = str(data.get('password'))
            target_user.password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        db.session.commit()

        return jsonify({
            'message': 'Utilisateur mis à jour avec succès',
            'user': target_user.vers_dict(),
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@utilisateurs_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
def supprimer_utilisateur_admin(user_id):
    """Supprimer un utilisateur (admin seulement)"""
    try:
        admin_user, _, erreur = _admin_guard()
        if erreur:
            return erreur

        target_user = User.query.get(user_id)
        if not target_user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404

        if target_user.id == admin_user.id:
            return jsonify({'error': 'Vous ne pouvez pas supprimer votre propre compte'}), 400

        if target_user.role == 'admin':
            admin_count = User.query.filter_by(role='admin').count()
            if admin_count <= 1:
                return jsonify({'error': 'Impossible de supprimer le dernier administrateur'}), 400

        db.session.delete(target_user)
        db.session.commit()

        return jsonify({'message': 'Utilisateur supprimé avec succès'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
