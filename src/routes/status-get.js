module.exports = (container) => ({
  method: 'GET',
  path: '/status',
  config: {
    description: 'Returns docker container status',
    tags: ['api'],
    handler: async (req, h) => {
      if (container.instance) {
        try {
          const status = await container.instance.status()
          const State = status.data.State
          container.running = State.Running
          return h.response(State)
        } catch (err) {
          //If can't get status, assume not running
        }
      }
      container.running = false
      return h.response({Running: container.running})
    }
  }
});
