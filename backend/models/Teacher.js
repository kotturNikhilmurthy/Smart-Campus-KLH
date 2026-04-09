import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    profilePic: { type: String, default: "" },
    role: { type: String, default: "teacher" },
    department: { type: String, default: "General" },
    designation: { type: String, default: "Faculty" },
    managedEvents: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
      default: [],
    },
  },
  { timestamps: true }
);

const Teacher = mongoose.model("Teacher", teacherSchema);

export default Teacher;
