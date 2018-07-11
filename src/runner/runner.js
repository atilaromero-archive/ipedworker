const assert = require('assert')
const config = require('config')
const fetch = require('node-fetch')
const EventEmitter = require('events')
const path = require('path')

export class Runner extends EventEmitter {

  constructor (remoteLocker) {
    super()
    this.proc = null
    this.cmd = ""
    this.workingDir = ""
    this.java = ""
    this.locked = false
    this.remoteLocker = remoteLocker

    this.lock = this.lock.bind(this)
    this.unlock = this.unlock.bind(this)
    this.status = this.status.bind(this)
    this.createConfig = this.createConfig.bind(this)
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
    console.log(this, this.proc.pid, this.proc.on('exit', () => console.log("Program exit code: ",this.proc.exitCode,)))
    return this.proc.exitCode
  }



  async createConfig(evidence) {

        this.cmd = config.runner.cmd;
        this.java = config.runner.java;
        this.workingDir = path.dirname(evidence);
  }




  async create (evidence, caseDir, profile) {

    this.createConfig(evidence)
    var spawn = require('child_process').spawn;
    var proc = spawn(this.java,  ['-jar', this.cmd, '-d ',evidence, '-o ',this.workingDir+"/"+caseDir, '-profile ',profile,'--portable','--nologfile','--nogui']);

    //this.emit('create')
    return proc
  }

  async start(rm=false, unlock=false) {
    //this.emit('start')
    this.followLogs()
    const exitStatus = this.proc.exitCode
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
    this.proc.stdout.on('data', (data) => {
      console.log(data.toString())
    });
    this.proc.stderr.on('data', (data) => {
      console.error(data.toString())
    })
  }

  async lockCreateStart (evidence, caseDir, profile, rm=false) {
    await this.lock(evidence)
    this.proc = await this.create(evidence, caseDir, profile)
    const unlock = true
    this.start(rm, unlock)
    return this.proc
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
        await Runner.start(data)
        await Runner.instance.wait()
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
