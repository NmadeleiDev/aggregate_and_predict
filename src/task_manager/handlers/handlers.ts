import express from 'express';
import { Task } from '../model/model'
import {getDbManager} from '../db/dbManager'
import bodyParser from 'body-parser'
import {taskScheduler} from '../scheduler/scheduler'
import * as utils from './utils'
import Logger from 'js-logger';


export function addHandlers(app: express.Application) {

    app.use(bodyParser.json())
    app.use(bodyParser.raw({type: "text/*", limit: '15mb'}))

    app.get('/', (req, res) => {
        res.send('The sedulous hyena ate the antelope!');
    });

    app.get('/tasks', (req, res) => {
        getDbManager(false).findAllTasks().then(tasks => {
            res.json(utils.createSuccessResponse(tasks))
        }).catch(() => res.status(500).json(utils.createFailResponse('error')))
    });

    app.post('/task', (req, res) => {
        const task = req.body as Task

        Logger.info("Got task: ", task)
        
        getDbManager().insertTaskRecord(task)
            .then(() => console.log("Task inserted"))
            .catch(e => console.log("Error inserting task: ", e))

        if (taskScheduler.addJob(task)) 
            res.status(200).json(utils.createSuccessResponse("Saved!"))
        else
            res.status(200).json(utils.createSuccessResponse("Task saved, but cron is not set due to invalid schedule"))
    })

    app.put('/task', (req, res) => {
        const task = req.body as Task

        Logger.info("Got task: ", task)
        
        getDbManager().updateTaskRecord(task)
            .then(() => console.log("Task updated"))
            .catch(e => console.log("Error updating task: ", e))

        if (taskScheduler.updateJob(task)) 
            res.status(200).json(utils.createSuccessResponse("Updated!"))
        else
            res.status(200).json(utils.createSuccessResponse("Task updated, but cron is not set due to invalid schedule"))

    })

    app.delete('/task/:name', (req, res) => {
        const name = req.params.name

        getDbManager().deleteTaskRecord(name)
            .then(() => res.sendStatus(200))
            .catch(() => res.sendStatus(500))

        if (taskScheduler.deleteJob({name: name} as Task)) 
            res.status(200).json(utils.createSuccessResponse("Deleted!"))
        else
            res.status(500).json(utils.createFailResponse("Error!"))
    })

}