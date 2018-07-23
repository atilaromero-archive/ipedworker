/* eslint-env jest */
import {NoLock} from './remote-locker'
import Runner from './runner'

Runner.fs = {
  open: (path, flags, fn) => {
    console.log({path})
    return fn(null, {
      write: console.log,
      close: () => null
    })
  }
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
    const runner = new Runner(new NoLock(), {notify: console.log})
    await runner.start('myevidence', 'mycase', 'myprofile')
    done()
  })()
})
