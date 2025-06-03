const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  engineerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  allocationPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    validate: {
      validator: async function(value) {
        if (this.isNew || this.isModified('allocationPercentage')) {
          const Assignment = this.constructor;
          const now = new Date();
          
          // Get all other active assignments for this engineer
          const activeAssignments = await Assignment.find({
            engineerId: this.engineerId,
            _id: { $ne: this._id },
            startDate: { $lte: now },
            endDate: { $gte: now }
          });

          // Calculate total allocation including this new assignment
          const totalAllocation = activeAssignments.reduce(
            (sum, assignment) => sum + assignment.allocationPercentage, 
            value
          );

          // Get engineer's max capacity
          const User = mongoose.model('User');
          const engineer = await User.findById(this.engineerId);
          
          return totalAllocation <= engineer.maxCapacity;
        }
        return true;
      },
      message: 'Total allocation exceeds engineer\'s capacity'
    }
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying of active assignments
assignmentSchema.index({ engineerId: 1, startDate: 1, endDate: 1 });
assignmentSchema.index({ projectId: 1, startDate: 1, endDate: 1 });

// Method to check if dates overlap with existing assignments
assignmentSchema.methods.checkDateOverlap = async function() {
  const Assignment = this.constructor;
  
  const overlappingAssignments = await Assignment.find({
    engineerId: this.engineerId,
    _id: { $ne: this._id },
    $or: [
      {
        startDate: { $lte: this.startDate },
        endDate: { $gte: this.startDate }
      },
      {
        startDate: { $lte: this.endDate },
        endDate: { $gte: this.endDate }
      }
    ]
  });

  return overlappingAssignments;
};

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment; 