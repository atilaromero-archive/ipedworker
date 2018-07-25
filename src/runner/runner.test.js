/* eslint-env jest */
import {NoLock} from './remote-locker'
import Runner from './runner'
const fetchMock = require('fetch-mock')

fetchMock.mock('http://asdf.asdf.ok', 200)
fetchMock.mock('http://asdf.asdf.err', 400)

Runner.fs = {
  open: (path, flags, fn) => {
    console.log({path})
    return fn(null, {
      write: console.log,
      close: () => null
    })
  },
  mkdir: (path, fn) => fn()
}
Runner.spawn = (...args) => {
  console.log(args)
  return {
    stdout: {
      on: (e, fn) => fn('stdout')
    },
    stderr: {
      on: (e, fn) => fn('stderr')
    },
    on: (e, fn) => fn('proc.on'),
    exitCode: 0
  }
}

it('', done => {
  (async function () {
    const runner = new Runner(new NoLock(), {notify: () => fetch('http://asdf.asdf.err')})
    await runner.start('myevidence', 'mycase', 'myprofile')
    done()
  })()
})
