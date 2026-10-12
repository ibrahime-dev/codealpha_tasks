import jwt from "jsonwebtoken";

const generateToken = (userId) => {
  const { JWT_SECRET } = process.env;

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is missing. Add it to your .env file.");
  }

  return jwt.sign({ sub: userId.toString() }, JWT_SECRET, { expiresIn: "7d" });
};

export default generateToken;
