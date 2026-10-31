const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    if (!parsed.success) {
      const formattedErrors = parsed.error.issues.map((err) => ({
        path: err.path.join('.'),
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formattedErrors
              });
    }

    // Replace
    req.body = parsed.data.body || req.body;
    req.query = parsed.data.query || req.query;
    req.params = parsed.data.params || req.params;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { validate };
