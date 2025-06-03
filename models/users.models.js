const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['engineer', 'manager'],
    required: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  seniority: {
    type: String,
    enum: ['junior', 'mid', 'senior'],
    required: function() {
      return this.role === 'engineer';
    }
  },
  maxCapacity: {
    type: Number,
    default: 100,
    min: 0,
    max: 100,
    required: function() {
      return this.role === 'engineer';
    }
  },
  department: {
    type: String,
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get available capacity
userSchema.methods.getAvailableCapacity = async function() {
  const Assignment = mongoose.model('Assignment');
  const now = new Date();
  
  const activeAssignments = await Assignment.find({
    engineerId: this._id,
    startDate: { $lte: now },
    endDate: { $gte: now }
  });

  const totalAllocated = activeAssignments.reduce((sum, assignment) => 
    sum + assignment.allocationPercentage, 0);

  return this.maxCapacity - totalAllocated;
};

const User = mongoose.model('User', userSchema);

module.exports = User;