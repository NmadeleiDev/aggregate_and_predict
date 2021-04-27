import pg from 'pg'
import * as config from './config'
import Logger from 'js-logger'


export class PostgresManager {
    constructor() {
        this.client = new pg.Client({
            user: config.POSTGRES_USER,
            host: config.POSTGRES_HOST,
            database: config.POSTGRES_DB,
            password: config.POSTGRES_PASSWORD,
            port: config.POSTGRES_PORT,
          })

        this.isConnected = false
    }

    private _client: pg.Client = new pg.Client()
    private _isConnected: boolean = false

    get isConnected(): boolean {
        return this._isConnected
    }

    set isConnected(val: boolean) {
        this._isConnected = val
    }

    get client(): pg.Client {
        return this._client
    }

    set client(val: pg.Client) {
        this._client = val
    }

    async initConnection() {
        
        try {
            await this.client.connect()
            this.isConnected = true

            this.client.on('error', (err: any) => {
                Logger.error('Error in pg connection, reconnecting: ', err.stack)
                this.reconnect()
            })

            this.client.on('end', () => {
                this.isConnected = false
            })
        } catch (e) {
            Logger.error("Failed to connect to postgres: ", e)
            this.isConnected = false
        }
    }

    async reconnect() {
        if (this.isConnected) await this.closeConnection()
        this.client

        await this.initConnection()
    }

    async closeConnection() {
        try {
            await this.client.end()
            this.isConnected = false
        } catch (e) {
            Logger.error("Failed to disconnect postgres: ", e)
        }
    }

    async executeQuery(query: string): Promise<{ data: any[], headers: string[], err: any }> {
        if (!this.isConnected) await this.initConnection()

        try {
            const res = await this.client.query({text: query, rowMode: 'array'})
            
            return {data: res.rows, headers: res.fields.map(field => field.name), err: null}
        } catch (e) {
            Logger.error("Error executing query: ", e)
            return {data: [], headers: [], err: `error executing query: '${e}'`}
        }
    }
}

