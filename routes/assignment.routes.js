const express = require('express');
const router = express.Router();
const Assignment = require('../models/assignments.models');
const User = require('../models/users.models');
const Project = require('../models/projects.models');
const { auth, isManager } = require('../middleware/auth');

// Get all assignments
router.get('/', auth, async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('engineerId', 'name email skills')
      .populate('projectId', 'name description status')
      .sort({ startDate: 1 });
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get assignments by engineer ID
router.get('/engineer/:engineerId', auth, async (req, res) => {
  try {
    const assignments = await Assignment.find({ engineerId: req.params.engineerId })
      .populate('projectId', 'name description status startDate endDate')
      .sort({ startDate: 1 });
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching engineer assignments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get assignments by project ID
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const assignments = await Assignment.find({ projectId: req.params.projectId })
      .populate('engineerId', 'name email skills seniority')
      .sort({ startDate: 1 });
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching project assignments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new assignment (managers only)
router.post('/', auth, isManager, async (req, res) => {
  try {
    const {
      engineerId,
      projectId,
      allocationPercentage,
      startDate,
      endDate,
      role
    } = req.body;

    // Validate engineer and project exist
    const [engineer, project] = await Promise.all([
      User.findById(engineerId),
      Project.findById(projectId)
    ]);

    if (!engineer || engineer.role !== 'engineer') {
      return res.status(404).json({ message: 'Engineer not found' });
    }
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Create assignment
    const assignment = new Assignment({
      engineerId,
      projectId,
      allocationPercentage,
      startDate,
      endDate,
      role
    });

    // Check for overlapping assignments
    const overlappingAssignments = await assignment.checkDateOverlap();
    if (overlappingAssignments.length > 0) {
      return res.status(400).json({
        message: 'Engineer has overlapping assignments during this period',
        overlappingAssignments
      });
    }

    await assignment.save();

    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('engineerId', 'name email skills')
      .populate('projectId', 'name description status');

    res.status(201).json(populatedAssignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update assignment (managers only)
router.put('/:id', auth, isManager, async (req, res) => {
  try {
    const {
      allocationPercentage,
      startDate,
      endDate,
      role
    } = req.body;

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Update fields
    if (allocationPercentage) assignment.allocationPercentage = allocationPercentage;
    if (startDate) assignment.startDate = startDate;
    if (endDate) assignment.endDate = endDate;
    if (role) assignment.role = role;

    // Check for overlapping assignments
    const overlappingAssignments = await assignment.checkDateOverlap();
    if (overlappingAssignments.length > 0) {
      return res.status(400).json({
        message: 'Engineer has overlapping assignments during this period',
        overlappingAssignments
      });
    }

    await assignment.save();

    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('engineerId', 'name email skills')
      .populate('projectId', 'name description status');

    res.json(populatedAssignment);
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete assignment (managers only)
router.delete('/:id', auth, isManager, async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get engineer availability for a date range
router.get('/availability/:engineerId', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const engineer = await User.findById(req.params.engineerId);
    if (!engineer) {
      return res.status(404).json({ message: 'Engineer not found' });
    }

    const assignments = await Assignment.find({
      engineerId: req.params.engineerId,
      $or: [
        {
          startDate: { $lte: new Date(startDate) },
          endDate: { $gte: new Date(startDate) }
        },
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(endDate) }
        }
      ]
    }).populate('projectId', 'name');

    const totalAllocation = assignments.reduce((sum, assignment) => 
      sum + assignment.allocationPercentage, 0);

    res.json({
      engineerId: engineer._id,
      name: engineer.name,
      maxCapacity: engineer.maxCapacity,
      availableCapacity: engineer.maxCapacity - totalAllocation,
      assignments: assignments.map(a => ({
        projectName: a.projectId.name,
        allocation: a.allocationPercentage,
        startDate: a.startDate,
        endDate: a.endDate
      }))
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 