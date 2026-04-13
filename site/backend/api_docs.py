"""
Documentation de l'API utilisant Flasgger (Swagger)
"""

docs_api = {
    "swagger": "2.0",
    "info": {
        "title": "API du Tableau de Bord de Qualité de l'Air Aerium",
        "description": "API REST pour la surveillance en temps réel de la qualité de l'air et la gestion des capteurs",
        "version": "1.0.0",
        "contact": {
            "email": "support@airsense.app"
        }
    },
    "host": "localhost:5000",
    "basePath": "/api",
    "schemes": ["http", "https"],
    "paths": {
        "/health": {
            "get": {
                "summary": "Point de terminaison de vérification de santé",
                "description": "Vérifier si l'API fonctionne",
                "responses": {
                    "200": {
                        "description": "L'API est en bonne santé"
                    }
                }
            }
        },
        "/auth/register": {
            "post": {
                "summary": "Inscrire un nouvel utilisateur",
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "email": {"type": "string", "format": "email"},
                                "password": {"type": "string", "minLength": 6},
                                "full_name": {"type": "string"}
                            },
                            "required": ["email", "password"]
                        }
                    }
                ],
                "responses": {
                    "201": {"description": "Utilisateur inscrit avec succès"},
                    "400": {"description": "Entrée invalide"}
                }
            }
        },
        "/auth/login": {
            "post": {
                "summary": "Connecter un utilisateur",
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "email": {"type": "string", "format": "email"},
                                "password": {"type": "string"}
                            },
                            "required": ["email", "password"]
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "Connexion réussie"},
                    "401": {"description": "Identifiants invalides"}
                }
            }
        },
        "/sensors": {
            "get": {
                "summary": "Obtenir tous les capteurs",
                "security": [{"Bearer": []}],
                "parameters": [
                    {"name": "search", "in": "query", "type": "string", "description": "Rechercher par nom ou emplacement"},
                    {"name": "status", "in": "query", "type": "string", "enum": ["en ligne", "avertissement", "offline"]},
                    {"name": "type", "in": "query", "type": "string", "description": "Filtrer par type de capteur"},
                    {"name": "active", "in": "query", "type": "boolean"},
                    {"name": "sort", "in": "query", "type": "string", "enum": ["name", "updated_at", "status"]},
                    {"name": "limit", "in": "query", "type": "integer", "default": 100}
                ],
                "responses": {
                    "200": {"description": "Liste des capteurs"},
                    "401": {"description": "Non autorisé"}
                }
            },
            "post": {
                "summary": "Créer un nouveau capteur",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "location": {"type": "string"},
                                "sensor_type": {"type": "string", "enum": ["CO2", "TEMPERATURE", "HUMIDITY", "MULTI"]}
                            },
                            "required": ["name", "location"]
                        }
                    }
                ],
                "responses": {
                    "201": {"description": "Capteur créé"},
                    "400": {"description": "Entrée invalide"}
                }
            }
        },
        "/readings": {
            "post": {
                "summary": "Ajouter une nouvelle lecture de capteur",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "sensor_id": {"type": "integer"},
                                "co2": {"type": "number"},
                                "temperature": {"type": "number"},
                                "humidity": {"type": "number"}
                            },
                            "required": ["sensor_id", "co2", "temperature", "humidity"]
                        }
                    }
                ],
                "responses": {
                    "201": {"description": "Lecture ajoutée"},
                    "400": {"description": "Entrée invalide"}
                }
            }
        },
        "/alerts": {
            "get": {
                "summary": "Obtenir les alertes",
                "security": [{"Bearer": []}],
                "parameters": [
                    {"name": "status", "in": "query", "type": "string"},
                    {"name": "limit", "in": "query", "type": "integer", "default": 50}
                ],
                "responses": {
                    "200": {"description": "Liste des alertes"}
                }
            }
        }
    },
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "En-tête d'autorisation JWT utilisant le schéma Bearer"
        }
    }
}
