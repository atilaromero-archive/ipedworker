import Joi from 'joi';
const Container = require('../container')

module.exports = {
  method: 'POST',
  path: '/start',
  config: {
    description: 'Run IPED using given image path',
    tags: ['api'],
    validate: {
      payload: {
        imagePath: Joi.string()
          .required()
          .description('input file path'),
        outputPath: Joi.string()
          .description("optional - case folder relative to imagePath's parent folder - defaults to IPED")
          .default(''),
      },
    },
    handler: async (req, h) => {
      try {
        return h.response(await Container.start(req.payload))
      } catch (err) {
        return h.response(err.toString()).code(500)
      }
    }
  }
};
