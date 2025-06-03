require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/users.models');
const Project = require('../models/projects.models');
const Assignment = require('../models/assignments.models');
const { initializeDatabase } = require("../config/database");

const seedData = async () => {
  try {
    // Connect to database
    await initializeDatabase();

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Assignment.deleteMany({});

    // Create manager
    const manager = await User.create({
      email: "manager@example.com",
      password: await bcrypt.hash("password123", 10),
      name: "John Manager",
      role: "manager",
      department: "Engineering",
    });

    // Create engineers
    const engineers = await User.create([
      {
        email: 'alice@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Alice Engineer',
        role: 'engineer',
        skills: ['React', 'Node.js', 'TypeScript'],
        seniority: 'senior',
        maxCapacity: 100,
        department: 'Engineering'
      },
      {
        email: 'bob@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Bob Developer',
        role: 'engineer',
        skills: ['Python', 'Django', 'AWS'],
        seniority: 'mid',
        maxCapacity: 100,
        department: 'Engineering'
      },
      {
        email: 'carol@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Carol Coder',
        role: 'engineer',
        skills: ['React', 'Vue.js', 'JavaScript'],
        seniority: 'junior',
        maxCapacity: 50,
        department: 'Engineering'
      }
    ]);

    // Create projects
    const projects = await Project.create([
      {
        name: 'Client Portal Redesign',
        description: 'Modernize the client portal with new UI/UX',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-06-30'),
        requiredSkills: ['React', 'TypeScript'],
        teamSize: 2,
        status: 'active',
        managerId: manager._id
      },
      {
        name: 'Backend Migration',
        description: 'Migrate legacy backend to microservices',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-08-31'),
        requiredSkills: ['Node.js', 'Python', 'AWS'],
        teamSize: 3,
        status: 'planning',
        managerId: manager._id
      },
      {
        name: 'Mobile App Development',
        description: 'Develop new mobile app for customers',
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-07-31'),
        requiredSkills: ['React', 'JavaScript'],
        teamSize: 2,
        status: 'planning',
        managerId: manager._id
      }
    ]);

    // Create assignments
    await Assignment.create([
      {
        engineerId: engineers[0]._id,
        projectId: projects[0]._id,
        allocationPercentage: 60,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-06-30'),
        role: 'Tech Lead'
      },
      {
        engineerId: engineers[1]._id,
        projectId: projects[1]._id,
        allocationPercentage: 80,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-08-31'),
        role: 'Backend Developer'
      },
      {
        engineerId: engineers[2]._id,
        projectId: projects[0]._id,
        allocationPercentage: 40,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-06-30'),
        role: 'Frontend Developer'
      }
    ]);

    console.log('Sample data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData(); 