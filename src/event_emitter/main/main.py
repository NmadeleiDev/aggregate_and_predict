import logging
from kafka_conn import start_waiting_for_predictions

logging.basicConfig(level=logging.INFO)

start_waiting_for_predictions()
