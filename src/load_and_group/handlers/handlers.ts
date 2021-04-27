import {LoadAndPrepareWorker} from '../worker/worker'
import express from 'express';
import Logger from 'js-logger';


export function addHandlers(app: express.Application) {

    app.get('/', (req, res) => {
        res.send('The sedulous hyena ate the antelope!');
    });

    app.get('/execute-task', (req, res) => {
        const taskName = req.query['task'] as string
        Logger.info("executing task ", taskName)
        
        const worker = new LoadAndPrepareWorker()
        worker.executeTask(taskName)
    })
}