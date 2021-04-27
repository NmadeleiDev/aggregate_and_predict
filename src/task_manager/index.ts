import express from 'express';
import {addHandlers} from './handlers/handlers'
import Logger from 'js-logger'


const app = express();
const host = '0.0.0.0';
const port = 2222

addHandlers(app)

Logger.useDefaults();
Logger.setHandler(Logger.createDefaultHandler({
    formatter: function(messages, context) {
        messages.unshift(new Date().toUTCString())
    }
}))

app.listen(port, host, () => {
  return Logger.info(`server is listening on ${port}`);
});