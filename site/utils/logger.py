import logging
import os

LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO').upper()

def configure_logging():
    logging.basicConfig(
        level=getattr(logging, LOG_LEVEL, logging.INFO),
        format='%(asctime)s %(levelname)s [%(name)s] %(message)s',
    )
    logging.getLogger('werkzeug').setLevel(logging.WARNING)
    return logging.getLogger('morpheus')
