const ApiError = require("../utils/apiError");

function validateInputs(validations) {
  return (req, res, next) => {
    const errors = [];

    validations.forEach((validation) => {
      const { field, message } = validation;
      const value = req.body[field];

      if (!value || value.trim() === "") {
        errors.push({ field, message });
      }
    });

    if (errors.length > 0) {
      const errorMessage = errors
        .map((error) => `${error.field}: ${error.message}`)
        .join(", ");
      return next(new ApiError(errorMessage, 400));
    }

    next();
  };
}

module.exports = validateInputs;
