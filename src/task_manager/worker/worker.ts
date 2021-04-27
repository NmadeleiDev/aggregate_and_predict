import { Task } from "../model/model"
import axios from 'axios'
import { DbManager, getDbManager } from "../db/dbManager"

export class TaskWorker {
    constructor() {
        this.dbConn = getDbManager(true)
    }

    dbConn: DbManager

    startWorking(period: number) {
        setInterval(this.fulfillTasks, period)
    }

    fulfillTasks() {
        this.dbConn.initConnection().then(() => {
            this.dbConn.findAllTasks().then(tasks => {
                console.log("Found tasks: ", tasks);
                
                tasks.forEach(task => {
                    this.startTaskExecution(task)
                })
            })
        })
        .catch((e: any) => console.log("Error getting mongo conn: ", e))
        .finally(() => this.dbConn.closeConnection())
    }

    async startTaskExecution(task: Task) {
        console.log("Started executing task: ", task, this.dbConn.isConnected);
        
        await this.makeDataPrepRequest(task.name)
    }
    
    async makeDataPrepRequest(taskName: string): Promise<boolean> {
        const host = 'loader:2222'
        const path = '/execute-task'

        try {
            const res = await axios.get(`http://${host}${path}?task=${taskName}`)
            console.log("Dataprep req sent: ", res.status, res.statusText, res.data);
            return true
        } catch (e) {
            console.log("Error sending dataprep req: ", e);   
            return false
        }
    }
}

export const Worker = new TaskWorker()