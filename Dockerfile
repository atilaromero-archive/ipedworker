FROM 192.168.2.191:5001/ipeddocker/iped:3.14.2

ADD https://deb.nodesource.com/setup_8.x /root/

RUN bash /root/setup_8.x

RUN apt-get install -y nodejs 

RUN apt-get clean  \
    && rm -rf /var/lib/apt/lists/*

ADD ./package.json /usr/local/src/ipedworker/
WORKDIR /usr/local/src/ipedworker

RUN npm install --only=production

ADD ./ /usr/local/src/ipedworker

CMD ["npm", "start"]
