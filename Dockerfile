FROM node:17-alpine

RUN apk --no-cache add --virtual native-deps  \
  curl openssl g++ gcc libgcc libstdc++ linux-headers autoconf automake make nasm py-pip git ffmpeg && \
  yarn global add node-gyp typescript rimraf

RUN mkdir /app
WORKDIR /app

ADD ./server .

RUN npm install pm2 -g
# RUN npm rebuild sharp --force
RUN yarn install --network-concurrency 1

EXPOSE 5000

CMD ["yarn", "run", "start:dev:pm2"]
