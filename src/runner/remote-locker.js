import Notifier from './notifier'

export class NoLock {
  async lock () {}
  async unlock () {}
}

export class RemoteLocker {

  constructor (fetch, url) {
    this.fetch = fetch
    this.url = url
    this.notifier = new Notifier(url)
  }

  async lock (evidencePath) {
    this.evidencePath = evidencePath
    return await this.notifier.notify('LOCK', {evidencePath})
  }

  async unlock () {
    return await this.notifier.notify('UNLOCK', {evidencePath: this.evidencePath})
  }

}
