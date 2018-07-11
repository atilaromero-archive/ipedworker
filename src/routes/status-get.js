module.exports = (runner) => ({
  method: 'GET',
  path: '/status',
  config: {
    description: 'Returna o status do POD',
    tags: ['api'],
    handler: async (req, h) => {
      if (runner.proc == null){
        return h.response({Status: "Not running"})
      }
      else if ((runner.proc.exitCode == null)&&(runner.proc.pid != null)) {
        return h.response({Status: "Running"})
      }
      else if ((runner.proc.exitCode == null)&&(runner.proc.pid == null)){
        return h.response({Status: "Not running"})
      }
      else if (!runner.proc.exitCode){
        return h.response({Running: "Not running, with previous success run"})
      }
      else {
        return h.response({Running: "Not running, with previous failure run"})
      }
    }
  }
}
);
