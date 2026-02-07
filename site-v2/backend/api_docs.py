"""
API documentation using Flasgger (Swagger)
"""

api_docs = {
    "swagger": "2.0",
    "info": {
        "title": "Aerium Air Quality Dashboard API",
        "description": "REST API for real-time air quality monitoring and sensor management",
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
                "summary": "Health check endpoint",
                "description": "Check if the API is running",
                "responses": {
                    "200": {
                        "description": "API is healthy"
                    }
                }
            }
        },
        "/auth/register": {
            "post": {
                "summary": "Register a new user",
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
                    "201": {"description": "User registered successfully"},
                    "400": {"description": "Invalid input"}
                }
            }
        },
        "/auth/login": {
            "post": {
                "summary": "Login user",
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
                    "200": {"description": "Login successful"},
                    "401": {"description": "Invalid credentials"}
                }
            }
        },
        "/sensors": {
            "get": {
                "summary": "Get all sensors",
                "security": [{"Bearer": []}],
                "parameters": [
                    {"name": "search", "in": "query", "type": "string", "description": "Search by name or location"},
                    {"name": "status", "in": "query", "type": "string", "enum": ["en ligne", "avertissement", "offline"]},
                    {"name": "type", "in": "query", "type": "string", "description": "Filter by sensor type"},
                    {"name": "active", "in": "query", "type": "boolean"},
                    {"name": "sort", "in": "query", "type": "string", "enum": ["name", "updated_at", "status"]},
                    {"name": "limit", "in": "query", "type": "integer", "default": 100}
                ],
                "responses": {
                    "200": {"description": "List of sensors"},
                    "401": {"description": "Unauthorized"}
                }
            },
            "post": {
                "summary": "Create a new sensor",
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
                    "201": {"description": "Sensor created"},
                    "400": {"description": "Invalid input"}
                }
            }
        },
        "/readings": {
            "post": {
                "summary": "Add a new sensor reading",
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
                    "201": {"description": "Reading added"},
                    "400": {"description": "Invalid input"}
                }
            }
        },
        "/alerts": {
            "get": {
                "summary": "Get alerts",
                "security": [{"Bearer": []}],
                "parameters": [
                    {"name": "status", "in": "query", "type": "string"},
                    {"name": "limit", "in": "query", "type": "integer", "default": 50}
                ],
                "responses": {
                    "200": {"description": "List of alerts"}
                }
            }
        }
    },
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "JWT Authorization header using the Bearer scheme"
        }
    }
}
