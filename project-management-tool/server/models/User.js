import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long."],
      maxlength: [80, "Name cannot be longer than 80 characters."]
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, "Email cannot be longer than 254 characters."]
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required."],
      select: false
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
