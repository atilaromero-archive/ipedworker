const fetch = require('node-fetch')


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
