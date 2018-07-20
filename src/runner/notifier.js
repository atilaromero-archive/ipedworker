import fetch from 'node-fetch'

export default class Notifier {
  constructor (url) {
    this.url = url
  }
  async notify (type, payload) {
    return await fetch(this.url, {
      method: 'POST',
      body: JSON.stringify({
        type,
        payload,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
