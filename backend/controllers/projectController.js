import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { userCanAccessProject, userIsProjectAdmin } from '../utils/projectAccess.js';
import { rejectIfArchived } from '../utils/projectArchived.js';

export const getProjects = async (req, res) => {
  try {
    let filter;
    if (req.user.role === 'admin') {
      filter = { createdBy: req.user._id };
    } else {
      filter = { members: req.user._id };
    }

    const projects = await Project.find(filter)
      .populate('createdBy', 'name email')
      .populate('members', 'name email role')
      .sort('-createdAt');

    res.json({ success: true, count: projects.length, projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email role');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!userCanAccessProject(project, req.user._id, req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied to this project' });
    }

    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;

    const members = memberIds?.length
      ? await User.find({ _id: { $in: memberIds }, role: 'member' })
      : [];

    const project = await Project.create({
      name,
      description: description || '',
      createdBy: req.user._id,
      members: members.map((m) => m._id),
    });

    await project.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'members', select: 'name email role' },
    ]);

    res.status(201).json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!userIsProjectAdmin(project, req.user._id, req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only project admin can update' });
    }

    const { name, description, status } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status && ['active', 'archived'].includes(status)) {
      project.status = status;
    }
    await project.save();

    await project.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'members', select: 'name email role' },
    ]);

    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!userIsProjectAdmin(project, req.user._id, req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only project admin can delete' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ success: true, message: 'Project and associated tasks deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const addMembers = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!userIsProjectAdmin(project, req.user._id, req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only project admin can manage team' });
    }
    if (rejectIfArchived(project, res)) return;

    const { memberIds } = req.body;
    const users = await User.find({ _id: { $in: memberIds }, role: 'member' });
    const newIds = users.map((u) => u._id.toString());
    const existing = new Set(project.members.map((m) => m.toString()));

    for (const id of newIds) {
      if (!existing.has(id)) project.members.push(id);
    }

    await project.save();
    await project.populate('members', 'name email role');

    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!userIsProjectAdmin(project, req.user._id, req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only project admin can manage team' });
    }
    if (rejectIfArchived(project, res)) return;

    project.members = project.members.filter((m) => m.toString() !== req.params.memberId);
    await project.save();
    await project.populate('members', 'name email role');

    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
