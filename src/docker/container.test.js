/*eslint-env jest*/
import {Container} from './container'
import {RemoteLocker} from './remote-locker'
const assert = require('assert')

const fetch = () => {}
const called = {}
const docker = {
  container: {
    create: async () => {
      called.create = true
      return {
        id: 'myid',
        start: async () => {
          called.start = true
        },
        wait: async () => {
          called.wait = true
          return { StatusCode: 0}
        },
        logs: async () => {
          called.logs = true
          return {
            on: () => {}
          }
        }
      }
    },
  }
}

it('', async (done) => {
  const c = new Container(docker, new RemoteLocker(fetch, 'URL'))
  await c.lock('EVIDENCE')
  await c.lock('EVIDENCE')
    .then(() => {
      throw new Error('cant lock twice')
    }, () => {
      return
    })
  await c.unlock()
  await c.lockCreateStart('evidence', 'caseDir', 'cmd')
  assert(called.create == true)
  assert(called.start == true)
  assert(called.wait == true)
  await c.instance.wait()
  setTimeout(function () {
    assert(c.locked == false)
    assert(called.logs)
    done()
  }, 10);
})
