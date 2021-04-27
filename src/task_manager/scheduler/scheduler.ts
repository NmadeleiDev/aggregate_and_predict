import CronJob from 'cron'
import { Task } from '../model/model'
import { TaskWorker } from '../worker/worker'
import { getDbManager } from "../db/dbManager"


class TaskScheduler {
    constructor() {
        this.jobs = new Map()
    }

    jobs: Map <string, CronJob.CronJob>

    pullTasksFromDb() {
        const db = getDbManager(true)

        db.initConnection().then(() => {
            db.findAllTasks().then((tasks) => {
                tasks.forEach(task => {
                    this.addJob(task)
                })
            }).catch(e => console.warn("Error getting tasks: ", e))
            .finally(() => db.closeConnection())
        })
        .catch((e) => console.warn("Error connecting to mongo: ", e))
    }

    addJob(task: Task): boolean {
        if (task.launchOnStart === true) {
            this.costructCronTaskExecutable(task)()
        }

        if (!task.cronSchedule || task.cronSchedule.length < 3) {
            console.log("Task cron schedule is invalid: ", task.cronSchedule, task.name)
            return false
        }

        const job = new CronJob.CronJob(task.cronSchedule, this.costructCronTaskExecutable(task), null, true, 'Europe/Moscow')

        this.jobs.set(task.name, job)

        job.start()
        return true
    }

    updateJob(task: Task): boolean {
        if (task.launchOnStart === true) {
            this.costructCronTaskExecutable(task)()
        }
        
        if (!task.cronSchedule || task.cronSchedule.length < 3) {
            console.log("Task cron schedule is invalid: ", task.cronSchedule, task.name)
            return false
        }

        const job = new CronJob.CronJob(task.cronSchedule, this.costructCronTaskExecutable(task), null, true, 'Europe/Moscow')

        if (this.jobs.has(task.name))
            (this.jobs.get(task.name) as CronJob.CronJob).stop()

        this.jobs.set(task.name, job)

        job.start()
        return true
        
    }

    deleteJob(task: Task): boolean {
        if (this.jobs.has(task.name)) {
            (this.jobs.get(task.name) as CronJob.CronJob).stop()
            this.jobs.delete(task.name)
            return true
        }
        return false
    }

    deleteAllJobs() {
        this.jobs.forEach(job => {
            job.stop()
        })

        this.jobs = new Map()
    }

    costructCronTaskExecutable(task: Task) {
        return function() {
            const worker = new TaskWorker()

            worker.dbConn.initConnection()
                .then(() => {
                    worker.startTaskExecution(task).then(() => {
                        console.log("Scheduler started task ", task.name);
                    })
                    .finally(() => {
                        worker.dbConn.closeConnection().catch((e) => console.warn(e))
                    })
                })
                .catch((e: any) => {
                    console.log("Connecting to mongo to start task: ", e)
                })
          }
    }
}

export const taskScheduler = new TaskScheduler()
