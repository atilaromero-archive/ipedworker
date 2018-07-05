const config = require('config')
const path = require('path')

function createConfig(evidence, caseDir, dockerCmd) {
  const parameters = {
    Image: config.docker.image,
    Env: [
      'LANG=C.UTF-8',
      'EVIDENCE=' + path.basename(evidence),
      'CASEDIR=' + (caseDir || 'IPED'),
      'Xmx=' + config.java.Xmx
    ],
    WorkingDir: path.dirname(evidence),
    HostConfig: {
      Binds: [
        '/tmp/:/tmp/',
        '/tmp/.X11-unix/:/tmp/.X11-unix/',
        '/etc/localtime:/etc/localtime:ro',
      ],
    }
  };
  ['HTTP_PROXY', 'DISPLAY', 'GDK_BACKEND'].forEach(x => {
    if (process.env[x]) {
      parameters.Env.push(x + '=' + process.env[x])
    }
  })
  if (config.docker.volume) {
    let volume = config.docker.volume
    if (config.docker.volume.indexOf(':') < 0) {
      volume = volume + ':' + volume
    }
    parameters.HostConfig.Binds.push(volume)
  }
  if (dockerCmd || config.docker.cmd) {
    parameters.Cmd = dockerCmd || config.docker.cmd
  }
  return parameters
}

module.exports = createConfig
