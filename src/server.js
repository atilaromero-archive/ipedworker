const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
import config from 'config'

import {NoLock, RemoteLocker} from './runner/remote-locker'
import {Runner} from './runner/runner'
const Pack = require('../package');

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
      title: 'IPED Job Submission API',
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


  const runner = new Runner(locker)


  const routes = [
    require('./routes/status-get')(runner),
  ]
  if (!config.watchURL) {
    routes.push(require('./routes/start-post')(runner));
  }
  try {
    await server.route(routes);
    await server.start();
    console.log('Server running at:', server.info.uri);
    if (config.watchURL) {
      console.log('watching', config.watchURL)
      Runner.watch(config.watchURL)
    }
  } catch(err) {
    console.log(err);
  }
}

runserver();
