from kafka import KafkaConsumer, KafkaProducer
import os
import logging
import json
import manager
import pandas as pd
import numpy as np
from io import StringIO

from db.mongo import TasksDbManager


tasks_manager = TasksDbManager()

kafka_host = os.getenv('KAFKA_HOST', '10.0.0.2')
kafka_port = os.getenv('KAFKA_PORT', '9092')

def start_waiting_for_records():
    topic = os.getenv('KAFKA_TOPIC_TO_LISTEN')
    group = os.getenv('KAFKA_GROUPED_DATA_GROUP', 'grouped_data_consumers')

    print("Waiting in topic {} in group {} on {}:{}".format(topic, group, kafka_host, kafka_port))

    consumer = KafkaConsumer(topic, 
        group_id=group, 
        bootstrap_servers='{}:{}'.format(kafka_host, kafka_port),
        value_deserializer=lambda v: StringIO(v.decode('utf-8')))

    for msg in consumer:
        headers = dict([(x[0], x[1].decode("utf-8")) for x in msg.headers])
        if ('task_name' not in headers.keys()):
            print("Got msg without task_name specified: {}".format(msg.headers))
            continue

        task = tasks_manager.get_task_by_name(headers['task_name'])
        print("Got task model config: {}".format(str(task['feedTo'])))

        dataset = pd.read_csv(msg.value).convert_dtypes()
        result, ok = manager.get_prediction(dataset, task['feedTo']['modelName'])
        if (ok is False):
            print("Failed to get prediction: ", result, ok)
            continue
        dataset[task['feedTo']['saveAs']] = np.nan_to_num(pd.to_numeric(result, errors='coerce'))
        print("Got prediction! ", dataset.info())
        print(dataset.iloc[:4])
        ds_file = dataset.to_csv()
        send_predict_to_topic(ds_file, task['name'])

def send_predict_to_topic(value, task_name):
    topic = os.getenv('KAFKA_TOPIC_TO_WRITE')

    producer = KafkaProducer(retries=3,
        bootstrap_servers='{}:{}'.format(kafka_host, kafka_port),
        value_serializer=lambda v: v.encode('utf-8'))

    producer.send(topic, value=value, headers=[('task_name', task_name.encode('utf-8'))])
    print("Sent predicts")