import { validationResult } from "express-validator";

const validateRequest = (req, res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const errors = result.array({ onlyFirstError: true }).map(({ path, msg }) => ({
      field: path,
      message: msg
    }));

    return res.status(400).json({ message: "Validation failed.", errors });
  }

  return next();
};

export default validateRequest;
