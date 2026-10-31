const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const flatRoles = roles.flat();
    if (!flatRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user.role}' lacks permissions for this resource`
      });
    }

    next();
  };
};

// Ensures that if the logged in user is a Customer, they can only access records matching their customerId
const enforceCustomerIsolation = (customerIdField = 'customerId') => {
  return (req, res, next) => {
    if (req.user && req.user.role === 'Customer') {
      // Force query filter or param to customer's own ID
      req.query[customerIdField] = req.user._id.toString();
      if (req.body && req.body[customerIdField]) {
        req.body[customerIdField] = req.user._id.toString();
      }
    }
    next();
  };
};

module.exports = {
  authorize,
  enforceCustomerIsolation
};
