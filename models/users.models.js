const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
      },
      message: 'Please enter a valid email address'
    }
  },
  password: {
    type: String,
    required: true,
    validate: {
      validator: function(password) {
        // Only validate password on new user creation or password change
        if (this.isModified('password')) {
          // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
          const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
          return passwordRegex.test(password);
        }
        return true;
      },
      message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'
    }
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
  
  // Get all current and future assignments
  const assignments = await Assignment.find({
    engineerId: this._id,
    endDate: { $gte: now }
  });

  // Calculate total allocation from current assignments
  const totalAllocated = assignments.reduce((sum, assignment) => {
    // Only count assignments that are currently active
    if (assignment.startDate <= now && assignment.endDate >= now) {
      return sum + assignment.allocationPercentage;
    }
    return sum;
  }, 0);

  return this.maxCapacity - totalAllocated;
};

// Method to get capacity data including future allocations
userSchema.methods.getCapacityData = async function() {
  const Assignment = mongoose.model('Assignment');
  const now = new Date();
  
  // Get all current and future assignments
  const assignments = await Assignment.find({
    engineerId: this._id,
    endDate: { $gte: now }
  }).sort({ startDate: 1 });

  // Calculate current allocation
  const currentAllocation = assignments.reduce((sum, assignment) => {
    if (assignment.startDate <= now && assignment.endDate >= now) {
      return sum + assignment.allocationPercentage;
    }
    return sum;
  }, 0);

  return {
    engineerId: this._id,
    name: this.name,
    maxCapacity: this.maxCapacity,
    allocatedCapacity: currentAllocation,
    totalCapacity: this.maxCapacity,
    futureAssignments: assignments.map(a => ({
      startDate: a.startDate,
      endDate: a.endDate,
      allocation: a.allocationPercentage
    }))
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User;