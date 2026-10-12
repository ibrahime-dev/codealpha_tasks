import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });

  return res.status(201).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    },
    token: generateToken(user._id)
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: "Email or password is incorrect." });
  }

  return res.status(200).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    },
    token: generateToken(user._id)
  });
};
