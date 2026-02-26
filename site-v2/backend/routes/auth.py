from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from database import db, User
import bcrypt

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def inscrire():
    """Inscrire un nouvel utilisateur"""
    try:
        data = request.get_json()
        
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('fullName', data.get('full_name', ''))
        
        if not email or not password:
            return jsonify({'error': 'L\'email et le mot de passe sont requis'}), 400
        
        # Vérifier si l'utilisateur existe déjà
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email déjà enregistré'}), 400
        
        # Hacher le mot de passe
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Créer un nouvel utilisateur
        new_user = User(
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            role='user'
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'Utilisateur enregistré avec succès',
            'user': new_user.vers_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def connexion():
    """Authentifier l'utilisateur et retourner les jetons JWT"""
    try:
        data = request.get_json()
        
        if not data:
            print("Erreur de connexion: Aucune donnée JSON reçue")
            return jsonify({'error': 'Aucune donnée fournie'}), 400
        
        email = data.get('email')
        password = data.get('password')
        
        print(f"Tentative de connexion pour: {email}")
        
        if not email or not password:
            print("Erreur de connexion: Email ou mot de passe manquant")
            return jsonify({'error': 'Email et mot de passe requis'}), 400
        
        # Trouver l'utilisateur
        user = User.query.filter_by(email=email).first()
        
        if not user:
            print(f"Erreur de connexion: Utilisateur non trouvé - {email}")
            return jsonify({'error': 'Identifiants de connexion invalides'}), 401
        
        # Vérifier le mot de passe
        if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
            print(f"Erreur de connexion: Mot de passe invalide pour {email}")
            return jsonify({'error': 'Identifiants de connexion invalides'}), 401
        
        # Créer les jetons avec une identité explicite
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        print(f"✓ Connexion réussie pour l'utilisateur {user.id}: {user.email}")
        
        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.vers_dict()
        }), 200
        
    except Exception as e:
        print(f"✗ Exception de connexion: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Erreur du serveur: {str(e)}'}), 500


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def rafraîchir():
    """Rafraîchir le jeton d'accès"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        print(f"Rafraîchissement du jeton pour l'ID utilisateur: {id_utilisateur_courant}")
        
        # Convertir en chaîne pour la cohérence
        access_token = create_access_token(identity=str(id_utilisateur_courant))
        
        print(f"Nouveau jeton d'accès créé: {access_token[:50]}...")
        return jsonify({'access_token': access_token}), 200
        
    except Exception as e:
        print(f"Erreur de rafraîchissement: {e}")
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def obtenir_utilisateur_courant():
    """Obtenir les informations de l'utilisateur courant"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        print(f"Obtention de l'utilisateur pour l'ID: {id_utilisateur_courant} (type: {type(id_utilisateur_courant)})")
        
        # Convertir en int si c'est une chaîne
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
        
        user = User.query.get(id_utilisateur_courant)
        
        if not user:
            print(f"Utilisateur non trouvé pour l'ID: {id_utilisateur_courant}")
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        print(f"Utilisateur trouvé: {user.email}")
        return jsonify({'user': user.vers_dict()}), 200
        
    except Exception as e:
        print(f"Erreur dans obtenir_utilisateur_courant: {e}")
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def déconnexion():
    """Déconnecter l'utilisateur (suppression du jeton côté client)"""
    return jsonify({'message': 'Déconnexion réussie'}), 200
