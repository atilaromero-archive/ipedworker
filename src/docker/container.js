const assert = require('assert')
const createConfig = require('./create-config')
const config = require('config')
const fetch = require('node-fetch')
const EventEmitter = require('events')

export class Container extends EventEmitter {

  constructor (docker, remoteLocker) {
    super()
    this.docker = docker
    this.instance = null
    this.locked = false
    this.remoteLocker = remoteLocker

    this.lock = this.lock.bind(this)
    this.unlock = this.unlock.bind(this)
    this.status = this.status.bind(this)
    this.create = this.create.bind(this)
    this.start = this.start.bind(this)
    this.delete = this.delete.bind(this)
    this.followLogs = this.followLogs.bind(this)
    this.lockCreateStart = this.lockCreateStart.bind(this)
    this.watch = this.watch.bind(this)
  }

  async lock (evidence) {
    assert(!this.locked)
    this.locked = true
    try {
      await this.remoteLocker.lock(evidence)
    } catch (e) {
      this.locked = false
      throw e
    }
  }

  async unlock () {
    assert(this.locked)
    await this.remoteLocker.unlock()
    this.locked = false
  }

  async status () {
    console.log(this, this.instance, this.instance.status())
    return this.instance.status()
  }

  async create (evidence, caseDir, cmd) {
    const parameters = createConfig(evidence, caseDir, cmd)
    this.instance = await this.docker.container.create(parameters)
    this.emit('create')
    return this.instance.id
  }

  async start(rm=false, unlock=false) {
    await this.instance.start()
    this.emit('start')
    this.followLogs()
    const exitStatus = await this.instance.wait()
    if (exitStatus.StatusCode == 0) {
      this.emit('end')
    } else {
      this.emit('error')
    }
    if (unlock) {
      await this.unlock()
    }
    if (rm) {
      await this.delete()
    }
    return exitStatus
  }

  async delete () {
    this.instance.delete()
  }

  async followLogs () {
    const stream = await this.instance.logs({
      follow: true,
      stdout: true,
      stderr: true,
      timestamps: true,
    })
    //docker API stream chunk has a header of 8 bytes
    stream.on('data', chunk => { process.stdout.write(chunk.slice(8))})
    stream.on('error', chunk => { process.stdout.write(chunk.slice(8))})
  }

  async lockCreateStart (evidence, caseDir, cmd, rm=false) {
    await this.lock(evidence)
    let id
    id = await this.create(evidence, caseDir, cmd)
    const unlock = true
    this.start(rm, unlock)
    return id
  }

  async watch (url) {
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
}
