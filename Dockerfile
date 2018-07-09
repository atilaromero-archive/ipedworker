FROM node:9.11.2-alpine

ADD ./package.json /usr/local/src/
WORKDIR /usr/local/src/

RUN npm install --only=production

ADD ./ /usr/local/src/

CMD ["npm", "start"]
