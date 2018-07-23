/*eslint-env jest*/
import {RemoteLocker} from './remote-locker'
import Notifier from './notifier'

it('lock granted', done => {
  Notifier.fetch = jest.fn().mockImplementation(() => {
    return new Promise((resolve) => {
      resolve({ok: true})
    })
  });
  (async () => {
    let locker = new RemoteLocker('http://example1.com/asdf')
    await locker.lock('asdf')
    done()
  })()
})

it('lock not granted', done => {
  Notifier.fetch = jest.fn().mockImplementation(() => {
    return new Promise((resolve) => {
      resolve({ok: false})
    })
  });
  (async () => {
    let locker = new RemoteLocker('http://example.com')
    try {
      await locker.lock('asdf')
      done('lock should have failed')
    } catch (err) {
      done()
    }
  })()
})
