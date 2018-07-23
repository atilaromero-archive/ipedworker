FROM 192.168.2.191:5001/ipeddocker/iped:3.14.2

RUN python -c 'import urllib; urllib.urlretrieve("https://deb.nodesource.com/setup_8.x", "/root/setup_8.x")'

RUN bash /root/setup_8.x

RUN apt-get install -y nodejs \
    && apt-get clean  \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/local/src/ipedworker
COPY ./package.json ./

RUN npm install --only=production

COPY ./ ./

CMD ["npm", "start"]
