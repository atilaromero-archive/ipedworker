const Container = require('../container')

module.exports = {
  method: 'GET',
  path: '/state',
  config: {
    description: 'Returns docker container state',
    tags: ['api'],
    handler: Container.state
  }
};
