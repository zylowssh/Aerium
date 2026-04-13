"""
Utilitaires de validation des données pour les requêtes API
"""
from marshmallow import Schema, fields, ValidationError, validate
import logging

logger = logging.getLogger(__name__)


class SchémaCapteur(Schema):
    """Schéma pour la validation de la création/mise à jour des capteurs"""
    name = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    location = fields.Str(validate=validate.Length(min=0, max=500))
    sensor_type = fields.Str(validate=validate.OneOf(['CO2', 'TEMPERATURE', 'HUMIDITY', 'MULTI', 'CUSTOM']))
    is_active = fields.Boolean()
    external_id = fields.Str(validate=validate.Length(min=0, max=100))


class SchémaLecture(Schema):
    """Schéma pour la validation des lectures des capteurs"""
    co2_level = fields.Float(validate=validate.Range(min=0, max=5000, error="Le niveau de CO2 doit être entre 0 et 5000 ppm"))
    temperature = fields.Float(validate=validate.Range(min=-50, max=100, error="La température doit être entre -50 et 100°C"))
    humidity = fields.Float(validate=validate.Range(min=0, max=100, error="L'humidité doit être entre 0 et 100%"))
    timestamp = fields.DateTime()


class SchémaAlerte(Schema):
    """Schéma pour la validation des alertes"""
    sensor_id = fields.Int(required=True)
    alert_type = fields.Str(required=True, validate=validate.OneOf(['CO2', 'TEMPERATURE', 'HUMIDITY']))
    threshold = fields.Float(required=True)
    is_active = fields.Boolean()


class SchémaUtilisateur(Schema):
    """Schéma pour la validation des utilisateurs"""
    email = fields.Email(required=True, error_messages={"required": "L'email est requis", "invalid": "Format d'email invalide"})
    full_name = fields.Str(validate=validate.Length(min=1, max=255, error="Le nom complet doit être entre 1 et 255 caractères"))
    password = fields.Str(validate=validate.Length(min=8, max=255, error="Le mot de passe doit avoir au moins 8 caractères"))
    role = fields.Str(validate=validate.OneOf(['user', 'admin'], error="Le rôle doit être 'user' ou 'admin'"))


def valider_données_requête(data, classe_schéma):
    """
    Valider les données de la requête par rapport à un schéma
    
    Args:
        data: Dictionnaire des données de la requête
        classe_schéma: Classe de schéma Marshmallow pour valider
        
    Returns:
        Tuple de (est_valide, données_ou_erreurs)
        Si valide: (True, données_validées)
        Si invalide: (False, messages_erreur)
    """
    schéma = classe_schéma()
    try:
        données_validées = schéma.load(data)
        return True, données_validées
    except ValidationError as e:
        logger.warning(f"Erreur de validation: {e.messages}")
        return False, e.messages


def valider_paramètres_requête(params, paramètres_autorisés):
    """
    Valider les paramètres de requête
    
    Args:
        params: Dictionnaire des paramètres de requête
        paramètres_autorisés: Liste des noms de paramètres autorisés
        
    Returns:
        Tuple de (est_valide, paramètres_nettoyés)
    """
    nettoyé = {}
    paramètres_invalides = []
    
    for key, value in params.items():
        if key not in paramètres_autorisés:
            paramètres_invalides.append(key)
        else:
            nettoyé[key] = value
    
    if paramètres_invalides:
        logger.warning(f"Paramètres de requête invalides: {paramètres_invalides}")
        return False, {"error": f"Paramètres invalides: {', '.join(paramètres_invalides)}"}
    
    return True, nettoyé


schéma_capteur = SchémaCapteur()
schéma_lecture = SchémaLecture()
schéma_alerte = SchémaAlerte()
schéma_utilisateur = SchémaUtilisateur()
