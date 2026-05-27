import Task from '../models/Task.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { userCanAccessProject, userIsProjectAdmin, toIdString } from '../utils/projectAccess.js';

const populateTask = (query) =>
  query
    .populate('project', 'name')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');

export const getTasksByProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!userCanAccessProject(project, req.user._id, req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const tasks = await populateTask(
      Task.find({ project: project._id }).sort('-createdAt')
    );

    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!userIsProjectAdmin(project, req.user._id, req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only admin can create tasks' });
    }

    const { title, description, assignedTo, status, dueDate } = req.body;

    if (assignedTo) {
      const assignee = await User.findById(assignedTo);
      if (!assignee) {
        return res.status(400).json({ success: false, message: 'Assignee not found' });
      }
      const isMember =
        project.members.some((m) => toIdString(m) === assignedTo) ||
        toIdString(project.createdBy) === assignedTo;
      if (!isMember && assignee.role === 'member') {
        return res.status(400).json({
          success: false,
          message: 'Assignee must be a member of this project',
        });
      }
    }

    const task = await Task.create({
      title,
      description: description || '',
      project: project._id,
      assignedTo: assignedTo || null,
      status: status || 'todo',
      dueDate: dueDate || null,
      createdBy: req.user._id,
    });

    const populated = await populateTask(Task.findById(task._id));
    res.status(201).json({ success: true, task: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = task.project;
    if (!userCanAccessProject(project, req.user._id, req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const isAdmin = userIsProjectAdmin(project, req.user._id, req.user.role);
    const isAssignee =
      task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    const { title, description, assignedTo, status, dueDate } = req.body;

    if (isAdmin) {
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (assignedTo !== undefined) {
        if (assignedTo) {
          const assignee = await User.findById(assignedTo);
          if (!assignee) {
            return res.status(400).json({ success: false, message: 'Assignee not found' });
          }
        }
        task.assignedTo = assignedTo || null;
      }
      if (status) task.status = status;
    } else if (isAssignee && status) {
      return res.status(403).json({
        success: false,
        message:
          'Members cannot change task status directly. Submit a status change request for admin approval.',
      });
    } else if (isAssignee) {
      return res.status(403).json({
        success: false,
        message: 'Members cannot update task details. Use status change requests for progress updates.',
      });
    } else {
      return res.status(403).json({ success: false, message: 'Not allowed to update this task' });
    }

    await task.save();
    const populated = await populateTask(Task.findById(task._id));
    res.json({ success: true, task: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (!userIsProjectAdmin(task.project, req.user._id, req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only admin can delete tasks' });
    }

    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
