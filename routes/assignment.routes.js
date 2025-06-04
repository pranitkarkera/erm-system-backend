const express = require("express");
const router = express.Router();
const Assignment = require("../models/assignments.models");
const User = require("../models/users.models");
const Project = require("../models/projects.models");
const { auth, isManager } = require("../middleware/auth");

// GET all assignments with populated data
router.get("/", auth, async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate("engineerId", "name email skills seniority")
      .populate("projectId", "name description status")
      .sort({ startDate: 1 });

    res.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET assignments by engineer
router.get("/engineer/:engineerId", auth, async (req, res) => {
  try {
    const assignments = await Assignment.find({
      engineerId: req.params.engineerId,
    })
      .populate("projectId", "name description status startDate endDate")
      .sort({ startDate: 1 });

    res.json(assignments);
  } catch (error) {
    console.error("Error fetching engineer assignments:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET assignments by project
router.get("/project/:projectId", auth, async (req, res) => {
  try {
    const assignments = await Assignment.find({
      projectId: req.params.projectId,
    })
      .populate("engineerId", "name email skills seniority")
      .sort({ startDate: 1 });

    res.json(assignments);
  } catch (error) {
    console.error("Error fetching project assignments:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE new assignment
router.post("/", auth, isManager, async (req, res) => {
  try {
    const {
      engineerId,
      projectId,
      allocationPercentage,
      startDate,
      endDate,
      role,
    } = req.body;

    const [engineer, project] = await Promise.all([
      User.findById(engineerId),
      Project.findById(projectId),
    ]);

    if (!engineer || engineer.role !== "engineer") {
      return res.status(404).json({ message: "Engineer not found" });
    }
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const newAssignment = new Assignment({
      engineerId,
      projectId,
      allocationPercentage,
      startDate,
      endDate,
      role,
    });

    const overlaps = await newAssignment.checkDateOverlap();
    if (overlaps.length > 0) {
      return res.status(400).json({
        message: "Engineer has overlapping assignments",
        overlaps,
      });
    }

    await newAssignment.save();

    const populatedAssignment = await Assignment.findById(newAssignment._id)
      .populate("engineerId", "name email skills")
      .populate("projectId", "name description status");

    res.status(201).json(populatedAssignment);
  } catch (error) {
    console.error("Error creating assignment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE assignment
router.put("/:id", auth, isManager, async (req, res) => {
  try {
    const { allocationPercentage, startDate, endDate, role } = req.body;

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (allocationPercentage !== undefined)
      assignment.allocationPercentage = allocationPercentage;
    if (startDate) assignment.startDate = startDate;
    if (endDate) assignment.endDate = endDate;
    if (role) assignment.role = role;

    const overlaps = await assignment.checkDateOverlap();
    if (overlaps.length > 0) {
      return res.status(400).json({
        message: "Engineer has overlapping assignments",
        overlaps,
      });
    }

    await assignment.save();

    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate("engineerId", "name email skills")
      .populate("projectId", "name description status");

    res.json(populatedAssignment);
  } catch (error) {
    console.error("Error updating assignment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE assignment
router.delete("/:id", auth, isManager, async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ENGINEER AVAILABILITY
router.get("/availability/:engineerId", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start and end date required" });
    }

    const engineer = await User.findById(req.params.engineerId);
    if (!engineer) {
      return res.status(404).json({ message: "Engineer not found" });
    }

    const assignments = await Assignment.find({
      engineerId: req.params.engineerId,
      $or: [
        {
          startDate: { $lte: new Date(startDate) },
          endDate: { $gte: new Date(startDate) },
        },
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(endDate) },
        },
      ],
    }).populate("projectId", "name");

    const totalAllocation = assignments.reduce(
      (sum, a) => sum + a.allocationPercentage,
      0
    );

    res.json({
      engineerId: engineer._id,
      name: engineer.name,
      maxCapacity: engineer.maxCapacity,
      availableCapacity: engineer.maxCapacity - totalAllocation,
      assignments: assignments.map((a) => ({
        projectName: a.projectId.name,
        allocation: a.allocationPercentage,
        startDate: a.startDate,
        endDate: a.endDate,
      })),
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
