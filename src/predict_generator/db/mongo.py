from pymongo import MongoClient
import os
import json
from threading import Timer
import logging


class TasksDbManager:
    def __init__(self):
        self.tasks = {}

        self.db_name = os.getenv('MONGO_DB_NAME')
        self.tasks_collection = os.getenv('MONGO_TASKS_COLLECTION')
        self.db_addr = os.getenv('MONGO_ADDR')
        self.db_user = os.getenv('MONGO_USER')
        self.db_passwd = os.getenv('MONGO_PASSWD')

        url = "mongodb://{}:{}@{}".format(self.db_user, self.db_passwd, self.db_addr)

        print("Connecting to mongo with {}; db={} coll={}".format(url, self.db_name, self.tasks_collection))
        self.client = MongoClient(url)
        print("Conn success!")

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
