const config = require('config')
const fetch = require('node-fetch')
const {Docker} = require('node-docker-api')
const path = require('path')
const assert = require('assert')

assert(!(config.docker.host && config.docker.socketPath), 'Use DOCKER_HOST or DOCKER_SOCKET, but not both')

const docker = new Docker(config.docker.host?
  {host: config.docker.host}
  :{socketPath: config.docker.socketPath}
)

const stateHandler = async (req, h) => {
  if (Container.instance) {
    try {
      const status = await Container.instance.status()
      const State = status.data.State
      Container.running = State.Running
      return h.response(State)
    } catch (err) {
      //If can't get status, assume not running
    }
  }
  Container.running = false
  return h.response({Running: Container.running})
}

const notifyHandler = async (event, payload) => {
  const url = config.notifyURL
  if (url) {
    return await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        id: Container.instance && Container.instance.id,
        event,
        payload,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

const startHandler = async (payload) => {
  if (Container.running) {
    throw new Error('container already running')
  }
  Container.running = true
  Container.instance = await docker.container.create(
    makeParameters(payload)
  )

  if (config.notifyURL) {
    const requestJob = await Container.notify('request', payload)
    if (!requestJob.ok) {
      Container.running = false
      await Container.instance.delete()
      throw new Error('Job request failed')
    }
  }

  //don't await, just launch and move on
  Container.instance.start().then(() => {
    Container.running = true
    Container.instance.logs({
      follow: true,
      stdout: true,
      stderr: true,
      timestamps: true,
    }).then(stream => {
      //chunk has 8 bytes header
      stream.on('data', chunk => { process.stdout.write(chunk.slice(8))})
      stream.on('error', chunk => { process.stdout.write(chunk.slice(8))})
    }).catch(error => console.log(error));
    Container.notify('start')
  }).then(() => Container.instance.wait())
    .then((exitStatus) => {
      Container.running = false
      Container.notify('end', exitStatus)
    })

  return Container.instance.id
}

function makeParameters(payload) {
  const parameters = {
    Image: config.docker.image,
    Env: [
      'LANG=C.UTF-8',
      'IMAGE=' + path.basename(payload.imagePath),
      'OUTPUT=' + (payload.outputPath || 'IPED'),
      'Xmx=' + config.java.Xmx
    ],
    WorkingDir: path.dirname(payload.imagePath),
    HostConfig: {
      Binds: [
        '/tmp/:/tmp/',
        '/tmp/.X11-unix/:/tmp/.X11-unix/',
        '/etc/localtime:/etc/localtime:ro',
      ],
    }
  };
  ['HTTP_PROXY', 'DISPLAY', 'GDK_BACKEND'].forEach(x => {
    if (process.env[x]) {
      parameters.Env.push(x + '=' + process.env[x])
    }
  })
  if (config.docker.volume) {
    parameters.HostConfig.Binds.push(config.docker.volume)
  }
  if (payload.cmd || config.docker.cmd) {
    parameters.Cmd = payload.cmd || config.docker.cmd
  }
  return parameters
}

const watchHandler = async (url) => {
  const single = async () => {
    try {
      const req = await fetch(url)
      if (!req.ok) {
        console.log(await req.text())
        return
      }
      const data = await req.json()
      if (!data) {
        return
      }
      await Container.start(data)
      await Container.instance.wait()
    } catch (err) {
      console.log(err)
    }
  }
  /*eslint no-constant-condition: ["error", { "checkLoops": false }]*/
  while (true) {
    await single()
    await new Promise(resolve => setTimeout(resolve, (config.watchSeconds || 1) * 1000))
  }
}

const Container = {
  running: false,
  instance: null,
  state: stateHandler,
  notify: notifyHandler,
  start: startHandler,
  watch: watchHandler,
}

module.exports = Container
