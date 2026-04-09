import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    profilePic: { type: String, default: "" },
    role: { type: String, default: "student" },
    department: { type: String, default: "CSE" },
    year: { type: String, default: "1" },
    joinedClubs: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Club" }],
      default: [],
    },
  },
  { timestamps: true }
);

const Student = mongoose.model("Student", studentSchema);

export default Student;
