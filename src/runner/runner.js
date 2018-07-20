const assert = require('assert')
const config = require('config')
const fetch = require('node-fetch')
const EventEmitter = require('events')
const path = require('path')
const spawn = require('child_process').spawn

export class Runner extends EventEmitter {

  constructor (remoteLocker, notifier) {
    super()
    this.proc = null
    this.locked = false
    this.remoteLocker = remoteLocker
    this.notifier = notifier

    this.start = this.start.bind(this)
    this.wait = this.wait.bind(this)
    this.watch = this.watch.bind(this)
  }

  async start (evidence, caseDir, profile) {
    let workingDir = path.dirname(evidence);
    let args = [
      '-Djava.awt.headless=true',
      '-jar', config.runner.jar,
      '-d', path.basename(evidence),
      '-o', caseDir,
      '--portable',
      '--nologfile',
      '--nogui'
    ]
    if (profile) {
      args.push('-profile', profile)
    }
    assert (this.locked === false)
    this.locked = true
    try {
      await this.remoteLocker.lock(evidence)
      await this.notifier.notify('running', {evidencePath: evidence})
      this.proc = spawn(config.runner.java,  args, {
        cwd: workingDir,
      });
      this.followLogs(this.proc)
      this.proc.on('exit', () => {
        async function f (self) {
          try {
            if (self.locked) {
              if (self.proc.exitCode === 0) {
                await self.notifier.notify('done', {evidencePath: evidence})
              } else {
                await self.notifier.notify('failed', {evidencePath: evidence})
              }
              await self.remoteLocker.unlock()
            }
          } finally {
            self.locked = false
          }
        }
        return f(this)
      })
    } catch (err) {
      this.locked = false
      throw err
    }
  }

  wait () {
    const self = this
    return new Promise((resolve, reject) => {
      if (!self.proc || self.proc.exitCode != null || self.proc.pid == null) {
        return reject('not running')
      }
      self.proc.on('exit', resolve)
    })
  }

  followLogs (proc) {
    proc.stdout.on('data', (data) => {
      console.log(data.toString())
    });
    proc.stderr.on('data', (data) => {
      console.error(data.toString())
    })
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
        if (!data || data.length === 0) {
          return
        }
        const {evidencePath,outputPath,profile} = data[0]
        await this.start(evidencePath,outputPath,profile)
        await this.wait()
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
