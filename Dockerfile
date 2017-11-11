FROM node:latest
MAINTAINER Jan Wolf <we@rudl.me>

WORKDIR /root/app

RUN apt-get update && apt-get install nano && \
npm install -g typescript ts-node forever nodemon mocha

ADD package.json package-lock.json ./
RUN npm install

CMD npm start