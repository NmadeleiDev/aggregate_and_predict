const MONGO_USER = process.env.MONGO_USER || "admin";
const MONGO_PASSWD = process.env.MONGO_PASSWD || "passwd";
const MONGO_ADDR = process.env.MONGO_ADDR || "localhost:27017";

export const DSN = `mongodb://${MONGO_USER}:${MONGO_PASSWD}@${MONGO_ADDR}/`
export const dbName = process.env.MONGO_DB_NAME || `predicts_generator_v2`
export const tasksCollection = `tasks`
export const predictsCollectionPrefix = `predicts`

console.log("DSN: ", DSN, "dbName: ", dbName);