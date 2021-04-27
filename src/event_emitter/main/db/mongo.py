from pymongo import MongoClient
import os
import json
from threading import Timer


class MongoDbManager:
    def __init__(self):
        self.tasks = {}

        self.db_name = os.getenv('MONGO_DB_NAME')
        self.logs_collection = os.getenv('MONGO_EMIT_LOGS_COLLECTION')
        self.tasks_collection = os.getenv('MONGO_TASKS_COLLECTION')
        self.db_addr = os.getenv('MONGO_ADDR')
        self.db_user = os.getenv('MONGO_USER')
        self.db_passwd = os.getenv('MONGO_PASSWD')

        url = "mongodb://{}:{}@{}".format(self.db_user, self.db_passwd, self.db_addr)

        self.client = MongoClient(url)
        print("Connected to mongo with ", url, self.db_name, self.logs_collection)

    def get_records_from_collection(self, coll_name):
        records = self.client[self.db_name][coll_name].find()
        return [r for r in records]

    def save_request_log(self, log):
        self.client[self.db_name][self.logs_collection].insert_one(log)

    def find_users_with_emitted_event(self, user_ids, event_name, event_version):
        filter = {
            'user_id': {'$in': user_ids}, 
            'eventValue.name': event_name, 
            'eventValue.version': event_version
        }
        projection = {'user_id': 1}

        records = self.client[self.db_name][self.logs_collection].find(filter, projection=projection)
        return [r['user_id'] for r in records]

    def load_task_by_name(self, task_name):
        task = self.client[self.db_name][self.tasks_collection].find_one({'name': task_name})
        return task

    def get_task_by_name(self, name):
        if (name in self.tasks.keys()):
            return self.tasks[name]
        else:
            task = self.load_task_by_name(name)
            self.add_task(task)
            return task

    def add_task(self, task):
        self.tasks[task['name']] = task
        cleanTimeout = Timer(60 * 60, self.clear_task, task['name'])
        cleanTimeout.start()

    def clear_task(self, task_name):
        self.tasks.pop(task_name)

