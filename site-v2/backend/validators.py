"""
Data validation utilities for API requests
"""
from marshmallow import Schema, fields, ValidationError, validate
import logging

logger = logging.getLogger(__name__)


class SensorSchema(Schema):
    """Schema for sensor creation/update validation"""
    name = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    location = fields.Str(validate=validate.Length(min=0, max=500))
    sensor_type = fields.Str(validate=validate.OneOf(['CO2', 'TEMPERATURE', 'HUMIDITY', 'MULTI', 'CUSTOM']))
    is_active = fields.Boolean()
    external_id = fields.Str(validate=validate.Length(min=0, max=100))


class ReadingSchema(Schema):
    """Schema for sensor reading validation"""
    co2_level = fields.Float(validate=validate.Range(min=0, max=5000, error=\"CO2 level must be between 0 and 5000 ppm\"))
    temperature = fields.Float(validate=validate.Range(min=-50, max=100, error=\"Temperature must be between -50 and 100°C\"))
    humidity = fields.Float(validate=validate.Range(min=0, max=100, error=\"Humidity must be between 0 and 100%\"))
    timestamp = fields.DateTime()


class AlertSchema(Schema):
    """Schema for alert validation"""
    sensor_id = fields.Int(required=True)
    alert_type = fields.Str(required=True, validate=validate.OneOf(['CO2', 'TEMPERATURE', 'HUMIDITY']))
    threshold = fields.Float(required=True)
    is_active = fields.Boolean()


class UserSchema(Schema):
    """Schema for user validation"""
    email = fields.Email(required=True, error_messages={\"required\": \"Email is required\", \"invalid\": \"Invalid email format\"})
    full_name = fields.Str(validate=validate.Length(min=1, max=255, error=\"Full name must be between 1 and 255 characters\"))
    password = fields.Str(validate=validate.Length(min=8, max=255, error=\"Password must be at least 8 characters\"))
    role = fields.Str(validate=validate.OneOf(['user', 'admin'], error=\"Role must be either 'user' or 'admin'\"))


def validate_request_data(data, schema_class):
    """
    Validate request data against schema
    
    Args:
        data: Dictionary of request data
        schema_class: Marshmallow schema class to validate against
        
    Returns:
        Tuple of (is_valid, data_or_errors)
        If valid: (True, validated_data)
        If invalid: (False, error_messages)
    """
    schema = schema_class()
    try:
        validated_data = schema.load(data)
        return True, validated_data
    except ValidationError as e:
        logger.warning(f"Validation error: {e.messages}")
        return False, e.messages


def validate_query_params(params, allowed_params):
    """
    Validate query parameters
    
    Args:
        params: Dictionary of query parameters
        allowed_params: List of allowed parameter names
        
    Returns:
        Tuple of (is_valid, cleaned_params)
    """
    cleaned = {}
    invalid_params = []
    
    for key, value in params.items():
        if key not in allowed_params:
            invalid_params.append(key)
        else:
            cleaned[key] = value
    
    if invalid_params:
        logger.warning(f"Invalid query parameters: {invalid_params}")
        return False, {"error": f"Invalid parameters: {', '.join(invalid_params)}"}
    
    return True, cleaned


sensor_schema = SensorSchema()
reading_schema = ReadingSchema()
alert_schema = AlertSchema()
user_schema = UserSchema()
