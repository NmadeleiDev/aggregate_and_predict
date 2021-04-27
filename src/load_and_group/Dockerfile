FROM node:15.13.0-buster

RUN apt update && apt install python3-pip -y

WORKDIR /usr/src/app

COPY package.json /usr/src/app
RUN npm install && mkdir -p /usr/src/raw_data
COPY . /usr/src/app

CMD npm start
