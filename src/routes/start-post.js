import Joi from 'joi';

module.exports = (runner) => ({
  method: 'POST',
  path: '/start',
  config: {
    description: 'Run IPED using given image path',
    tags: ['api'],
    validate: {
      payload: {
        evidencePath: Joi.string()
          .required()
          .description('input file path'),
        outputPath: Joi.string()
          .description("optional - case folder relative to evidencePath's parent folder - defaults to IPED")
          .default('SARD'),
	profile: Joi.string()
          .description("optional - profile of the case - defaults to forensic")
          .default('forensic'),

      },
    },
    handler: async (req, h) => {
      try {
        const {evidencePath, outputPath, profile} = req.payload
	let proc
        proc = runner.lockCreateStart(evidencePath, outputPath, profile)
        return h.response({Result: "Submission Success"})
	
      } catch (e) {
        return h.response(err.toString()).code(500)
      }
    }
  }
})
