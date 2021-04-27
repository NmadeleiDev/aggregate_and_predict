const MONGO_USER = process.env.MONGO_USER
const MONGO_PASSWD = process.env.MONGO_PASSWD
const MONGO_ADDR = process.env.MONGO_ADDR

export const DSN = `mongodb://${MONGO_USER}:${MONGO_PASSWD}@${MONGO_ADDR}/`
export const dbName = process.env.MONGO_DB_NAME
export const tasksCollection = `tasks`
export const predictsCollectionPrefix = `predicts`

console.log(DSN, dbName);
