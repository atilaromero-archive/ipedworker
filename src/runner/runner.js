const assert = require('assert')
const config = require('config')
const fetch = require('node-fetch')
const EventEmitter = require('events')
const path = require('path')

export class Runner extends EventEmitter {

  constructor (remoteLocker) {
    super()
    this.proc = null
    this.locked = false
    this.remoteLocker = remoteLocker

    this.lock = this.lock.bind(this)
    this.unlock = this.unlock.bind(this)
    this.status = this.status.bind(this)
    this.create = this.create.bind(this)
    this.start = this.start.bind(this)
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

  async create (evidence, caseDir, profile) {
    let workingDir = path.dirname(evidence);
    let spawn = require('child_process').spawn;
    let args = [
      '-Djava.awt.headless=true',
      '-jar', config.runner.jar,
      '-d', path.basename(evidence),
      '-o', caseDir,
      '-profile', profile,
      '--portable',
      '--nologfile',
      '--nogui'
    ]
    let proc = spawn(config.runner.java,  args, {
      cwd: workingDir,
    });
    return proc
  }

  async start(unlock=false) {
    this.followLogs()
    const exitStatus = this.proc.exitCode
    if (unlock) {
      await this.unlock()
    }
    return exitStatus
  }

  async followLogs () {
    this.proc.stdout.on('data', (data) => {
      console.log(data.toString())
    });
    this.proc.stderr.on('data', (data) => {
      console.error(data.toString())
    })
  }

  async lockCreateStart (evidence, caseDir, profile) {
    await this.lock(evidence)
    this.proc = await this.create(evidence, caseDir, profile)
    const unlock = true
    this.start(unlock)
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
        const {evidencePath,outputPath,profile} = data
        await Runner.lockCreateStart(evidencePath,outputPath,profile)
        await Runner.wait()
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
