import fs from 'fs'
import path from 'path'
import { MongoUser } from '../db/mongo/mongo'
import Client from 'ssh2-sftp-client'
import exec from 'child_process'
import Logger from 'js-logger'
import { PostgresManager } from '../db/postgres/postgres'
import csv from 'csv'
import { KafkaManager } from '../db/kafka/kafka'

export class LoadAndPrepareWorker {
    constructor() {

    }

    dumpDataToFile(data: any[][], headers: string[], separator = ','): Promise<string> {
        return new Promise((resolve, reject) => {
            const stringifier = new csv.stringify.Stringifier({
                delimiter: separator,
                cast: {
                    date: (val: Date): string => val.toISOString(),
                    number: (val: number): any => ({value: val.toString(), quote: false})
                }
            })
        
            const name = `raw_data_${(Math.random() * 1000).toFixed(0)}.${separator === '\t' ? 'tsv': 'csv'}`
            const folder = process.env.RAW_DATA_FOLDER
            if (!folder) {
                reject(`raw data folder not set: '${folder}'`)
                return
            }
    
            const resultPath = path.join(folder, name)
    
            const tmpFile = fs.createWriteStream(resultPath)
    
            stringifier.on('readable', function(){
                let row: any
                while(row = stringifier.read()){
                    tmpFile.write(row)
                }
              })
            stringifier.on('error', function(err){
                Logger.error("Error stringifying data: ", err.message)
                reject(err.message)
            })
            stringifier.on('finish', function(){
                tmpFile.close()
                resolve(resultPath)
            })
            stringifier.write(headers)
            data.forEach(record => stringifier.write(record))
            stringifier.end()
        })
    }

    async downloadGrouperScript(scriptName: string): Promise<string> {
        const sftp = new Client();
        const sshKey = fs.readFileSync('./worker/id_ed25519')
        const config = {
            host: process.env.SFTP_HOST,
            port: parseInt(process.env.SFTP_PORT),
            username: 'username',
            privateKey: sshKey
        }
        try {
            await sftp.connect(config)
        } catch (e) {
            Logger.error(`Error connecting to sftp with config (${JSON.stringify(config)}): `, e)
            return ""
        }
        const remotePathToScript = path.join(process.env.SFTP_SCRIPTS_FOLDER_PATH || './', scriptName)
        const localPathToScript = path.join(process.env.LOCAL_SCRIPTS_FOLDER_PATH || './', scriptName)

        const writeStream = fs.createWriteStream(localPathToScript)
        try {
            await sftp.get(remotePathToScript, writeStream)
        } catch (e) {
            Logger.error("Error getting script: ", e)
        }
        
        writeStream.close()

        return localPathToScript
    }

    async executeTask(taskName: string) {
        const tasksDb = new MongoUser()
        await tasksDb.initConnection()
        const task = await tasksDb.findTaskByName(taskName)
        if (!task) {
            Logger.info("Task not found")
            return
        }

        const dataDb = new PostgresManager()
        await dataDb.initConnection()

        const rawDataRes = await dataDb.executeQuery(task.rawDataSelectQuery)
        if (rawDataRes.err) {
            Logger.error("Error getting raw data from db: ", rawDataRes.err)
            await tasksDb.updateTaskStatusByName(taskName, rawDataRes.err)
            return
        } else {
            Logger.info(`Got ${rawDataRes.data.length} by ${rawDataRes.headers.length} raw data`)
        }

        const rawDataFile = await this.dumpDataToFile(rawDataRes.data, rawDataRes.headers, '\t')
        const dstFilePath = path.join(process.env.GROUPED_FILES_PATH || './', `result_${taskName}_${(Math.random() * 1000).toFixed(0)}.csv`)

        const scriptPath = await this.downloadGrouperScript(task.grouperFileName)

        if (!scriptPath) {
            await tasksDb.updateTaskStatusByName(taskName, "Failed to download script")
            Logger.warn("Failed to download script, exiting")
            return
        }

        exec.exec(`/usr/bin/python3 ${scriptPath} --src=${rawDataFile} --dst=${dstFilePath} --mode=${task.groupMode}`, 
            async (err, stdout, stderr) => {
                if (err) {
                    Logger.error("Error calling script: ", err)
                    tasksDb.updateTaskStatusByName(taskName, `Error calling script: ${err.toString()}`)
                    return
                }

                const rawResult = fs.readFileSync(dstFilePath)
                Logger.info(`Raw grouped file size=${rawResult.length}`)

                const kafkaDb = new KafkaManager()
                if (!(await kafkaDb.connectProducer())) {
                    // TODO: тут нужно сохранять неудачу куда то, и потом пробовать дообработать эти файлы
                    Logger.error("Faied to connect producer")
                    return
                }
                await kafkaDb.createTopicToProduce()

                await kafkaDb.sendData(rawResult, taskName)
                Logger.info("Data sent!")
            })
    }
}