import nodeFetch from 'node-fetch'

class Notifier {
  constructor (url) {
    this.url = url
  }
  async notify (type, payload) {
    return await Notifier.fetch(this.url, {
      method: 'POST',
      body: JSON.stringify({
        type,
        payload,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
Notifier.fetch = nodeFetch
export default Notifier
