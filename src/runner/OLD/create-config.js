const config = require('config')
const path = require('path')

function createConfig(evidence, caseDir) {
	
	runner.cmd = config.runner.cmd;
	runner.java = config.runner.java;
        runner.workingDir = path.dirname(evidence);
}

module.exports = createConfig
