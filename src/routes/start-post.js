import Joi from 'joi';

module.exports = (container) => ({
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
          .default('IPED'),
      },
    },
    handler: async (req, h) => {
      try {
        const {evidencePath, outputPath, cmd} = req.payload
        return container.lockCreateStart(evidencePath, outputPath, cmd)
      } catch (err) {
        return h.response(err.toString()).code(500)
      }
    }
  }
})
