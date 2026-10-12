import mongoose from "mongoose";

const delay = (milliseconds) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const safeErrorMessage = (error) => {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(
    /(mongodb(?:\+srv)?:\/\/)[^/@\s]+@/gi,
    "$1<credentials>@"
  );
};

const connectDB = async ({
  mongoUri,
  mongoRetryAttempts,
  mongoRetryBaseDelayMs,
  mongoRetryMaxDelayMs,
  mongoServerSelectionTimeoutMs
}) => {
  for (let attempt = 1; attempt <= mongoRetryAttempts; attempt += 1) {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: mongoServerSelectionTimeoutMs,
        connectTimeoutMS: mongoServerSelectionTimeoutMs
      });
      console.log("MongoDB connected");
      return;
    } catch (error) {
      const message = safeErrorMessage(error);
      if (attempt === mongoRetryAttempts) {
        throw new Error(
          `MongoDB connection failed after ${mongoRetryAttempts} attempt(s): ${message}`,
          { cause: error }
        );
      }

      const backoffMs = Math.min(
        mongoRetryBaseDelayMs * 2 ** (attempt - 1),
        mongoRetryMaxDelayMs
      );
      console.error(
        `MongoDB connection attempt ${attempt}/${mongoRetryAttempts} failed. Retrying in ${backoffMs}ms: ${message}`
      );
      await delay(backoffMs);
    }
  }
};

export default connectDB;
