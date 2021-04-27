import {Task} from '../../model/model';
import mongo from 'mongodb';
import {DSN, tasksCollection, predictsCollectionPrefix, dbName} from './config'
import Logger from 'js-logger';

export class MongoUser {
    constructor(doInit = false) {
        if (doInit) this.initConnection().catch(console.warn)
    }

    private _client: mongo.MongoClient = new mongo.MongoClient(DSN, {useUnifiedTopology: true})

    get connection(): mongo.MongoClient {
        return this._client
    }

    set connection(val: mongo.MongoClient) {
        this._client = val
    }

    get isConnected(): boolean {
        return (this._client && this._client.isConnected())
    }

    getPredictsCollectionName(predictName: string): string {
        return predictsCollectionPrefix + "_" + predictName
    }

    async updateTaskStatusByName(task: string, status: string): Promise<boolean> {
        try {
            await this.connection
                .db(dbName).collection(tasksCollection)
                .updateOne({name: task}, {$set: {status: status}})
            return true
        } catch (e) {
            console.warn("Error updating task status: ", e);
            throw(e)
        }
    }
    
    async findTaskByName(name: string): Promise<Task | null> {
        try {
            const res = await this.connection
                .db(dbName).collection(tasksCollection)
                .findOne({name: name})
            return res as Task
        } catch (e) {
            console.warn("Error find task by name: ", e);
            return null
        }
    }

    async initConnection() {
        try {
            this._client = await this.connection.connect();
            console.log("Mongo connection succeded!");
            return true
        } catch (e) {
            console.log("Failed to connect to mongo: ", e);
            throw "Connection error!"
        }
    }

    async closeConnection() {
        if (!this.isConnected)
            return

        try {
            await this._client.close()
        } catch (e) {
            console.log("Error closing mongo con: ", e);
        }
    }
}
