FROM node:latest

MAINTAINER Jan Wolf <info@jan-wolf.de>

RUN mkdir -p /home/app
WORKDIR /home/app
ADD package.json .
RUN npm install
CMD npm start
