const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
import config from 'config'

const Container = require('./container')
const Pack = require('../package');

(async () => {
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

  const routes = [
    require('./routes/state-get'),
  ]
  if (!config.watchURL) {
    routes.push(require('./routes/start-post'))
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

})();
