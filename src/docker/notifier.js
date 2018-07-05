import fetch from 'node-fetch'

export class Notifier {
  constructor (url) {
    this.url = url
  }
  async notify (id, event, payload) {
    return await fetch(this.url, {
      method: 'POST',
      body: JSON.stringify({
        id,
        event,
        payload,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
