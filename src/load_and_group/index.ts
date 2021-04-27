import express from 'express';
import {addHandlers} from './handlers/handlers'
import Logger from 'js-logger'

const app = express();
const host = '0.0.0.0';
const port = 2222

Logger.useDefaults();
Logger.setHandler(Logger.createDefaultHandler({
    formatter: function(messages, context) {
        messages.unshift(new Date().toUTCString())
    }
}))

addHandlers(app)

app.listen(port, host, () => {
  return console.log(`load and prepare server is listening on ${port}`);
});