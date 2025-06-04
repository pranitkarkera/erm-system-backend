const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    engineerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    allocationPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      validate: {
        validator: async function (value) {
          if (
            this.isNew ||
            this.isModified("allocationPercentage") ||
            this.isModified("startDate") ||
            this.isModified("endDate")
          ) {
            const Assignment = this.constructor;

            // Find assignments overlapping with THIS assignment's date range
            const overlappingAssignments = await Assignment.find({
              engineerId: this.engineerId,
              _id: { $ne: this._id },
              startDate: { $lte: this.endDate },
              endDate: { $gte: this.startDate },
            });

            // Sum their allocation plus this assignment's value
            const totalAllocation = overlappingAssignments.reduce(
              (sum, a) => sum + a.allocationPercentage,
              value
            );

            const User = mongoose.model("User");
            const engineer = await User.findById(this.engineerId);

            return engineer && totalAllocation <= engineer.maxCapacity;
          }
          return true;
        },
        message:
          "Total allocation exceeds engineer's capacity during this period",
      },
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > this.startDate;
        },
        message: "End date must be after start date",
      },
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, // This will add and maintain createdAt and updatedAt automatically
  }
);

// Indexes (unchanged)
assignmentSchema.index({ engineerId: 1, startDate: 1, endDate: 1 });
assignmentSchema.index({ projectId: 1, startDate: 1, endDate: 1 });

// Improved checkDateOverlap method
assignmentSchema.methods.checkDateOverlap = async function () {
  const Assignment = this.constructor;

  const overlappingAssignments = await Assignment.find({
    engineerId: this.engineerId,
    _id: { $ne: this._id },
    // Overlap condition
    $and: [
      { startDate: { $lte: this.endDate } },
      { endDate: { $gte: this.startDate } },
    ],
  });

  return overlappingAssignments;
};

const Assignment = mongoose.model("Assignment", assignmentSchema);

module.exports = Assignment;
