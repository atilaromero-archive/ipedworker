const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
const assert = require('assert')
import config from 'config'
const {Docker} = require('node-docker-api')

import {NoLock, RemoteLocker} from './docker/remote-locker'
import {Container} from './docker/container'
const Pack = require('../package');

assert(!(config.docker.host && config.docker.socketPath), 'Use DOCKER_HOST or DOCKER_SOCKET, but not both');
let locker
if (config.lockURL) {
  locker = new RemoteLocker()
} else {
  locker = new NoLock()
}

const runserver = async () => {
  const server = await new Hapi.Server({
    host: config.host,
    port: config.port,
  });

  const swaggerOptions = {
    info: {
      title: 'Test API Documentation',
      version: Pack.version,
    },
    documentationPath: '/'
  };

  await server.register([
    Inert,
    Vision,
    {
      plugin: HapiSwagger,
      options: swaggerOptions
    }
  ]);

  const docker = new Docker(config.docker.host?
    {host: config.docker.host}
    :{socketPath: config.docker.socketPath}
  )

  const container = new Container(docker, locker)


  const routes = [
    require('./routes/status-get')(container),
  ]
  if (!config.watchURL) {
    routes.push(require('./routes/start-post')(container))
  }
  try {
    await server.route(routes);
    await server.start();
    console.log('Server running at:', server.info.uri);
    if (config.watchURL) {
      console.log('watching', config.watchURL)
      Container.watch(config.watchURL)
    }
  } catch(err) {
    console.log(err);
  }
}

runserver();
