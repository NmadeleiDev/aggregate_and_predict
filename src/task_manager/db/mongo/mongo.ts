import {Task} from '../../model/model';
import mongo from 'mongodb';
import {DSN, tasksCollection, predictsCollectionPrefix, dbName} from './config'

export class MongoUser {
    constructor(doInit = true) {
        if (doInit) this.initConnection().catch(console.warn)
    }

    private _connection: mongo.MongoClient | undefined = undefined

    get connection(): mongo.MongoClient | undefined {
        return this._connection
    }

    set connection(val: mongo.MongoClient | undefined) {
        this._connection = val
    }

    get isConnected(): boolean {
        return (this._connection && this._connection.isConnected())
    }

    getPredictsCollectionName(predictName: string): string {
        return predictsCollectionPrefix + "_" + predictName
    }

    async insertTaskRecord(task: Task) {
        try {
            await this.connection
                .db(dbName).collection(tasksCollection)
                .insertOne(task)
            return true
        } catch (e) {
            console.warn("Error inserting task: ", e);
            throw(e)
        }
    }

    async updateTaskRecord(task: Task) {
        try {
            await this.connection
                .db(dbName).collection(tasksCollection)
                .updateOne({name: task.name}, {$set: task}, {upsert: false})
            return true
        } catch (e) {
            console.warn("Error updating task: ", e);
            throw(e)
        }
    }

    async deleteTaskRecord(task: string) {
        try {
            await this.connection
                .db(dbName).collection(tasksCollection)
                .deleteOne({name: task})
            return true
        } catch (e) {
            console.warn("Error deleting task: ", e);
            throw(e)
        }
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

    async findTaskByName(name: string): Promise<Task> {
        try {
            const res = await this.connection
                .db(dbName).collection(tasksCollection)
                .findOne({name: name})
                
            console.log("Found task by name: ", res.name);
            
            return res as Task
        } catch (e) {
            console.warn("Error find task by name: ", e);
            throw(e)
        }
    }

    async findAllTasks(): Promise<Array<Task>> {
        let res: Array<any>

        try {
            res = await this.connection
                .db(dbName).collection(tasksCollection).find({}).toArray()
        } catch (e) {
            console.warn("Error finding all tasks: ", e);
            throw(e)
        }
        return res.map(item => {
            item.id = item._id.toString()
            return item as Task
        })
    }

    async deleteAllTasks() {
        try {
            await this.connection
                .db(dbName).collection(tasksCollection)
                .deleteMany({})
            console.log("Cleared tasks");
        } catch (e) {
            console.warn("Error deleting all tasks: ", e);
            throw(e)
        }
    }

    async savePredictions(predicts: Array<object>, keyField: string, predictName: string) {
        try {
            const bulk = this.connection
            .db(dbName).collection(this.getPredictsCollectionName(predictName))
            .initializeUnorderedBulkOp()

            predicts.forEach(predict => {
                const key = predict[`${keyField}`]
                bulk.find({[`${keyField}`]: key})
                    .upsert().updateOne({$set: predict})
            })

            bulk.execute()
        } catch (e) {
            console.warn("Error saving all predictions: ", e);
            throw(e)
        }
    }

    async initConnection() {
        try {
            const mongoTask = new mongo.MongoClient(DSN, {useUnifiedTopology: true});
            this._connection = await mongoTask.connect();
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
            await this._connection.close()
            this.connection = undefined
        } catch (e) {
            console.log("Error closing mongo con: ", e);
        }
    }
}

export const MongoManager = new MongoUser(true)
