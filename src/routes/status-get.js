module.exports = (container) => ({
  method: 'GET',
  path: '/status',
  config: {
    description: 'Returns docker container status',
    tags: ['api'],
    handler: container.status
  }
});
