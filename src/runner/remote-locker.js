const assert = require('assert')
import Notifier from './notifier'

export class NoLock {
  async lock () {}
  async unlock () {}
}

export class RemoteLocker {

  constructor (url) {
    this.url = url
    this.notifier = new Notifier(url)
  }

  async lock (evidencePath) {
    assert(evidencePath)
    assert (!this.evidencePath)
    let response = await this.notifier.notify('LOCK', {evidencePath})
    assert(response && response.ok)
    this.evidencePath = evidencePath
  }

  async unlock () {
    if (!this.evidencePath) { return }
    let response = await this.notifier.notify('UNLOCK', {evidencePath: this.evidencePath})
    assert(response && response.ok)
    this.evidencePath = null
  }

}
