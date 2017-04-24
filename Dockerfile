FROM node:latest
MAINTAINER Jan Wolf <we@rudl.me>

ENV PATH /root/.yarn/bin:$PATH
WORKDIR /root/app

RUN curl -o- -L https://yarnpkg.com/install.sh | bash && npm install -g typescript ts-node forever

ADD package.json yarn.lock ./
RUN yarn install

CMD yarn start
