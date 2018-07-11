export class NoLock {
  async lock () {}
  async unlock () {}
}

export class RemoteLocker {

  constructor (fetch, url) {
    this.fetch = fetch
    this.url = url
  }

  async lock (evidence) {
    this.evidence = evidence
    return await this.fetch(this.url, {
      method: 'POST',
      body: JSON.stringify({
        type: 'LOCK',
        evidence,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  async unlock () {
    return await this.fetch(this.url, {
      method: 'POST',
      body: JSON.stringify({
        type: 'UNLOCK',
        evidence: this.evidence,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
  }

}
