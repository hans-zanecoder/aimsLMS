const Joi = require('joi');

// Validation schemas
const schemas = {
  createStudent: Joi.object({
    userId: Joi.string().hex().length(24).optional(),
    email: Joi.string().email().when('userId', { is: undefined, then: Joi.required() }),
    firstName: Joi.string().when('userId', { is: undefined, then: Joi.required() }),
    lastName: Joi.string().when('userId', { is: undefined, then: Joi.required() }),
    phone: Joi.string().optional(),
    location: Joi.string().optional(),
    department: Joi.string().optional(),
    status: Joi.string().valid('Active', 'Pending', 'Inactive').default('Pending'),
    enrollmentDate: Joi.date().default(Date.now)
  }),

  updateStudent: Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    status: Joi.string().valid('Active', 'Pending', 'Inactive'),
    phone: Joi.string(),
    location: Joi.string(),
    department: Joi.string()
  }).min(1),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
};

// Validation middleware
const validate = (schemaName) => {
  return async (req, res, next) => {
    try {
      const schema = schemas[schemaName];
      if (!schema) {
        throw new Error(`Schema ${schemaName} not found`);
      }

      const validated = await schema.validateAsync(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      req.validatedData = validated;
      next();
    } catch (error) {
      if (error.isJoi) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: error.details.map(detail => ({
            field: detail.context.key,
            message: detail.message
          }))
        });
      }
      next(error);
    }
  };
};

module.exports = { validate };
