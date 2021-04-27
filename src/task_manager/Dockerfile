FROM node:15.13.0-alpine3.10

WORKDIR /usr/src/app

COPY package.json /usr/src/app
RUN npm install
COPY . /usr/src/app

CMD npm start
