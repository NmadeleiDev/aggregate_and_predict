import Logger from 'js-logger'
import {Kafka, Producer} from 'kafkajs'
import * as config from './config'

export class KafkaManager {
    constructor() {
        Logger.info("Creating kafka on ", config.KAFKA_ADDR)
        this.client = new Kafka({clientId: 'load_and_group_producer', brokers: [config.KAFKA_ADDR]})

        this.producer = this.client.producer()
    }

    private client: Kafka | null = null
    private producer: Producer | null = null

    async connectProducer(): Promise<boolean> {
        try {
            await this.producer.connect()
            return true
        } catch (e) {
            Logger.error("Error connecting producer: ", e)
            return false
        }
    }

    async createTopicToProduce() {
        const admin = this.client.admin()
        if ((await admin.listTopics()).includes(config.KAFKA_TOPIC)) {
            Logger.info(`Topic ${config.KAFKA_TOPIC} already exisits, skipping creation`)
            admin.disconnect()
            return
        }

        try {
            if (await admin.createTopics({
                topics: [{
                    topic: config.KAFKA_TOPIC,
                    numPartitions: 1,
                    replicationFactor: 1,
                    configEntries: [{
                        name: 'retention.ms',
                        value: (1000 * 60 * 5).toString()
                    }]
                }]
            })) {
                Logger.info(`Topic ${config.KAFKA_TOPIC} created!`)
            } else {
                Logger.error(`Failed ot create topic ${config.KAFKA_TOPIC}`)
            }
            admin.disconnect()
        } catch (e) {
            Logger.error(`Error creating topic ${config.KAFKA_TOPIC}`)
            admin.disconnect()
        }
    }

    async sendData(data: Buffer, taskName: string) {
        if (!this.producer) {
            Logger.error("Producer is not set!")
            return
        }

        try {
            await this.producer.send({
                topic: config.KAFKA_TOPIC,
                messages: [{value: data, headers: {'task_name': taskName}}]
            })
        } catch (e) {
            Logger.error("Error sending msg: ", e)
        }
    }

    closeProducer() {
        if (!this.producer) {
            Logger.error("Producer is not set!")
            return
        }
        this.producer.disconnect()
    }
}