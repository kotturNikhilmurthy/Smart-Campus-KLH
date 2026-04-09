import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, default: "" },
    profilePic: { type: String, default: "" },
    role: { type: String, enum: ["student", "teacher", "admin"], required: true },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

const User = mongoose.model("User", userSchema);

export default User;
