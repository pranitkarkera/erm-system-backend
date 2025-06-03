const mongoose = require("mongoose");

// Task Schema
const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true }, // Refers to Team model
  owners: [
    { type: mongoose.Schema.Types.ObjectId, ref: "WorkUser", required: true }, // Refers to User model (owners)
  ],
  tags: [{ type: String }], // Array of tags
  timeToComplete: { type: Number, required: true }, // Number of days to complete the task
  status: {
    type: String,
    enum: ["To Do", "In Progress", "Completed", "Blocked"],
    // Enum for task status
    default: "To Do",
  }, // Task status
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
// Automatically update the `updatedAt` field whenever the document is updated
taskSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Tasks = mongoose.model("Task", taskSchema);
module.exports = Tasks;
