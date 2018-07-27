FROM 192.168.2.191:5001/ipeddocker/iped:3.14.3

ENV NODE_VERSION 10.7.0
RUN python -c "import urllib; urllib.urlretrieve('https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz', '/tmp/node-v${NODE_VERSION}-linux-x64.tar.xz')"

RUN tar xf /tmp/node-v${NODE_VERSION}-linux-x64.tar.xz -C /
RUN tar xf /tmp/node-v${NODE_VERSION}-linux-x64.tar.xz --strip-components=1 -C /usr/ node-v${NODE_VERSION}-linux-x64/bin
RUN tar xf /tmp/node-v${NODE_VERSION}-linux-x64.tar.xz --strip-components=1 -C /usr/ node-v${NODE_VERSION}-linux-x64/include
RUN tar xf /tmp/node-v${NODE_VERSION}-linux-x64.tar.xz --strip-components=1 -C /usr/ node-v${NODE_VERSION}-linux-x64/lib
RUN tar xf /tmp/node-v${NODE_VERSION}-linux-x64.tar.xz --strip-components=1 -C /usr/ node-v${NODE_VERSION}-linux-x64/share
RUN ldconfig

WORKDIR /usr/local/src/ipedworker
COPY ./package.json ./

RUN npm install --only=production

COPY ./ ./

CMD ["npm", "start"]
