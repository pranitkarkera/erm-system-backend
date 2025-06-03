const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
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
  requiredSkills: [{
    type: String,
    trim: true
  }],
  teamSize: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'completed'],
    default: 'planning'
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Method to find suitable engineers
projectSchema.methods.findSuitableEngineers = async function() {
  const User = mongoose.model('User');
  
  return await User.find({
    role: 'engineer',
    skills: { $in: this.requiredSkills }
  });
};

// Method to get current team allocation
projectSchema.methods.getCurrentTeamAllocation = async function() {
  const Assignment = mongoose.model('Assignment');
  const now = new Date();
  
  return await Assignment.find({
    projectId: this._id,
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).populate('engineerId');
};

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
