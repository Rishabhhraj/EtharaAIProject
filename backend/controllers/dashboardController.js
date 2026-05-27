import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { sortTasksByPriorityAndDue, getDueSoonTasks } from '../utils/taskSort.js';

export const getDashboard = async (req, res) => {
  try {
    let projectIds;
    if (req.user.role === 'admin') {
      const projects = await Project.find({ createdBy: req.user._id }).select('_id');
      projectIds = projects.map((p) => p._id);
    } else {
      const projects = await Project.find({ members: req.user._id }).select('_id');
      projectIds = projects.map((p) => p._id);
    }

    let taskFilter = { project: { $in: projectIds } };
    if (req.user.role === 'member') {
      taskFilter = {
        project: { $in: projectIds },
        assignedTo: req.user._id,
      };
    }

    let tasks = await Task.find(taskFilter)
      .populate('project', 'name status')
      .populate('assignedTo', 'name email');

    tasks = sortTasksByPriorityAndDue(tasks);

    const now = new Date();
    const statusCounts = { todo: 0, in_progress: 0, done: 0 };
    const overdue = [];
    const dueSoon = getDueSoonTasks(tasks, 3);

    for (const task of tasks) {
      statusCounts[task.status]++;
      if (task.dueDate && task.status !== 'done' && new Date(task.dueDate) < now) {
        overdue.push(task);
      }
    }

    const projectCount = projectIds.length;

    res.json({
      success: true,
      dashboard: {
        projectCount,
        totalTasks: tasks.length,
        statusCounts,
        overdueCount: overdue.length,
        overdue,
        dueSoonCount: dueSoon.length,
        dueSoon,
        recentTasks: tasks.slice(0, 10),
        allTasks: tasks,
        memberViewNote:
          req.user.role === 'member'
            ? 'Showing tasks assigned to you only.'
            : null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
