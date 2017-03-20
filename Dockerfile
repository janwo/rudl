FROM node:latest

MAINTAINER Jan Wolf <info@jan-wolf.de>

RUN mkdir -p /root/app
WORKDIR /root/app
ADD package.json .
RUN npm install
CMD npm install && npm start
