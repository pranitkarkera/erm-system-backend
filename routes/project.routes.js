const express = require('express');
const router = express.Router();
const Project = require('../models/projects.models');
const { auth, isManager } = require('../middleware/auth');

// Get all projects
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('managerId', 'name email')
      .sort({ startDate: 1 });
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get project by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('managerId', 'name email');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get current team allocation
    const teamAllocation = await project.getCurrentTeamAllocation();
    
    res.json({
      ...project.toObject(),
      teamAllocation
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new project (managers only)
router.post('/', auth, isManager, async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      requiredSkills,
      teamSize,
      status
    } = req.body;

    const project = new Project({
      name,
      description,
      startDate,
      endDate,
      requiredSkills,
      teamSize,
      status: status || 'planning',
      managerId: req.user.userId
    });

    await project.save();

    // Find suitable engineers for the project
    const suitableEngineers = await project.findSuitableEngineers();

    res.status(201).json({
      project,
      suitableEngineers: suitableEngineers.map(eng => ({
        id: eng._id,
        name: eng.name,
        skills: eng.skills
      }))
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update project (managers only)
router.put('/:id', auth, isManager, async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      requiredSkills,
      teamSize,
      status
    } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Update fields
    if (name) project.name = name;
    if (description) project.description = description;
    if (startDate) project.startDate = startDate;
    if (endDate) project.endDate = endDate;
    if (requiredSkills) project.requiredSkills = requiredSkills;
    if (teamSize) project.teamSize = teamSize;
    if (status) project.status = status;

    await project.save();
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete project (managers only)
router.delete('/:id', auth, isManager, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search projects by status
router.get('/search/status/:status', auth, async (req, res) => {
  try {
    const { status } = req.params;
    const projects = await Project.find({ status })
      .populate('managerId', 'name email')
      .sort({ startDate: 1 });
    
    res.json(projects);
  } catch (error) {
    console.error('Error searching projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 