import Comment from '../models/Comment.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { userCanAccessProject } from '../utils/projectAccess.js';
import { rejectIfArchived } from '../utils/projectArchived.js';
import { createNotification } from '../utils/notify.js';
import { toIdString } from '../utils/projectAccess.js';

export const getTaskComments = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    if (!userCanAccessProject(project, req.user._id, req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const comments = await Comment.find({ task: task._id })
      .populate('author', 'name email role')
      .sort('createdAt');

    res.json({ success: true, count: comments.length, comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createComment = async (req, res) => {
  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    if (!userCanAccessProject(project, req.user._id, req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (rejectIfArchived(project, res)) return;

    const comment = await Comment.create({
      task: task._id,
      project: project._id,
      author: req.user._id,
      text,
    });

    await comment.populate('author', 'name email role');

    const notifyIds = new Set();
    if (project.createdBy) notifyIds.add(toIdString(project.createdBy));
    if (task.assignedTo) notifyIds.add(toIdString(task.assignedTo));
    notifyIds.delete(toIdString(req.user._id));

    for (const uid of notifyIds) {
      await createNotification({
        userId: uid,
        message: `${req.user.name} commented on "${task.title}"`,
        type: 'comment',
        relatedTask: task._id,
        relatedProject: project._id,
      });
    }

    res.status(201).json({ success: true, comment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
