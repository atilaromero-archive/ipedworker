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
    this.evidencePath = evidencePath
    let response = await this.notifier.notify('LOCK', {evidencePath})
    assert(response && response.ok)
  }

  async unlock () {
    let response = await this.notifier.notify('UNLOCK', {evidencePath: this.evidencePath})
    assert(response && response.ok)
  }

}
