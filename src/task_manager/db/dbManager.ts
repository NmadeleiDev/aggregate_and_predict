import { Task } from "../model/model";

import {MongoUser, MongoManager} from "../db/mongo/mongo"


export interface DbManager {
    insertTaskRecord(task: Task)
    updateTaskRecord(task: Task)
    deleteTaskRecord(task: string)
    updateTaskStatusByName(task: string, status: string): Promise<boolean>
    findTaskByName(name: string): Promise<Task>
    findAllTasks(): Promise<Array<Task>>
    deleteAllTasks()
    savePredictions(predicts: Array<object>, keyField: string, predictName: string)
    getPredictsCollectionName(predictName: string): string

    isConnected: boolean

    initConnection()
    closeConnection()
}

export function getDbManager(isNew = false): DbManager {
    return isNew ? new MongoUser(false) : MongoManager
}