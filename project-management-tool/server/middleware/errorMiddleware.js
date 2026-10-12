import mongoose from "mongoose";

const handleError = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body contains invalid JSON." });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: "A record with that value already exists." });
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((item) => item.message);
    return res.status(400).json({ message: "Validation failed.", details });
  }

  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: "An ID or value has an invalid format." });
  }

  console.error(error);
  return res.status(500).json({ message: "An unexpected server error occurred." });
};

export default handleError;
