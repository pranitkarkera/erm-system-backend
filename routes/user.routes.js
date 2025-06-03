const express = require('express');
const router = express.Router();
const User = require('../models/users.models');
const { auth, isManager, isManagerOrSelf } = require('../middleware/auth');

// Get all engineers (managers only)
router.get('/', auth, isManager, async (req, res) => {
  try {
    const engineers = await User.find({ role: 'engineer' }).select('-password');
    res.json(engineers);
  } catch (error) {
    console.error('Error fetching engineers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get engineer by ID (managers or self)
router.get('/:id', auth, isManagerOrSelf, async (req, res) => {
  try {
    const engineer = await User.findById(req.params.id).select('-password');
    if (!engineer) {
      return res.status(404).json({ message: 'Engineer not found' });
    }
    res.json(engineer);
  } catch (error) {
    console.error('Error fetching engineer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update engineer profile (managers or self)
router.put('/:id', auth, isManagerOrSelf, async (req, res) => {
  try {
    const { name, skills, seniority, maxCapacity, department } = req.body;
    
    const engineer = await User.findById(req.params.id);
    if (!engineer) {
      return res.status(404).json({ message: 'Engineer not found' });
    }

    // Update fields
    if (name) engineer.name = name;
    if (skills) engineer.skills = skills;
    if (seniority) engineer.seniority = seniority;
    if (maxCapacity) engineer.maxCapacity = maxCapacity;
    if (department) engineer.department = department;

    await engineer.save();

    // Remove password from response
    const engineerResponse = engineer.toObject();
    delete engineerResponse.password;

    res.json(engineerResponse);
  } catch (error) {
    console.error('Error updating engineer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get engineer's current capacity
router.get('/:id/capacity', auth, isManagerOrSelf, async (req, res) => {
  try {
    const engineer = await User.findById(req.params.id);
    if (!engineer) {
      return res.status(404).json({ message: 'Engineer not found' });
    }

    const availableCapacity = await engineer.getAvailableCapacity();
    res.json({
      engineerId: engineer._id,
      name: engineer.name,
      maxCapacity: engineer.maxCapacity,
      availableCapacity,
      allocatedCapacity: engineer.maxCapacity - availableCapacity
    });
  } catch (error) {
    console.error('Error fetching capacity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search engineers by skills
router.get('/search/skills', auth, async (req, res) => {
  try {
    const { skills } = req.query;
    if (!skills) {
      return res.status(400).json({ message: 'Skills parameter is required' });
    }

    const skillsArray = skills.split(',').map(skill => skill.trim());
    
    const engineers = await User.find({
      role: 'engineer',
      skills: { $in: skillsArray }
    }).select('-password');

    res.json(engineers);
  } catch (error) {
    console.error('Error searching engineers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 