FROM node:latest
MAINTAINER Jan Wolf <info@jan-wolf.de>

ENV PATH /root/.yarn/bin:$PATH
WORKDIR /root/app

RUN curl -o- -L https://yarnpkg.com/install.sh | bash && yarn config set yarn-offline-mirror ./.yarn-offline-cache

ADD package.json yarn.lock ./
RUN yarn install

ADD . .

CMD yarn start
