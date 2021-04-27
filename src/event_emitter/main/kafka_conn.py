from kafka import KafkaConsumer, KafkaProducer
import os
import logging
import json
from io import StringIO
import manager
import pandas as pd
from db.mongo import MongoDbManager

db_manager = MongoDbManager()

kafka_host = os.getenv('KAFKA_HOST', '10.0.0.2')
kafka_port = os.getenv('KAFKA_PORT', '9092')

def start_waiting_for_predictions():
    topic = os.getenv('KAFKA_TOPIC_TO_LISTEN')
    group = os.getenv('KAFKA_GROUP')

    consumer = KafkaConsumer(topic, 
        group_id=group,
        bootstrap_servers='{}:{}'.format(kafka_host, kafka_port),
        value_deserializer=lambda v: StringIO(v.decode('utf-8')))

    logging.info("Waiting in topic {} in group {} on {}:{}".format(topic, group, kafka_host, kafka_port))

    for msg in consumer:
        headers = dict([(x[0], x[1].decode("utf-8")) for x in msg.headers])
        if ('task_name' not in headers.keys()):
            print("Got msg without task_name specified: {}".format(msg.headers))
            continue

        task = db_manager.get_task_by_name(headers['task_name'])

        print("Got task: ", task)

        manager.emit_events_for_df(pd.read_csv(msg.value).convert_dtypes(), task['eventTriggers'], 
            user_id_field=task['afIdField'], app_id_field=task['appIdField'],
            af_event_name=task['afEventName'], predictor_event_name=task['predictorEventName'],
            af_dev_key_android=task['afDevKeyAndroid'], af_dev_key_ios=task['adDevKeyIos'],
            field_to_set_as_event_revenue=task['setAsEventRevenue'],
            version=task['version'],
            value_correction_directives=task['valueCorrectionDirectives'],
            db_client=db_manager)
