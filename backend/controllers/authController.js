import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const resolveSignupRole = async (adminInviteCode) => {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    return { role: 'admin', isFirstUser: true };
  }

  const secret = process.env.ADMIN_INVITE_CODE?.trim();
  if (secret && adminInviteCode && adminInviteCode === secret) {
    return { role: 'admin', isFirstUser: false };
  }

  return { role: 'member', isFirstUser: false };
};

export const register = async (req, res) => {
  try {
    const { name, email, password, adminInviteCode } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const { role, isFirstUser } = await resolveSignupRole(adminInviteCode);

    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    const token = signToken(user._id);
    const message =
      role === 'admin'
        ? isFirstUser
          ? 'First account created with admin access.'
          : 'Admin account created with invite code.'
        : 'Member account created.';

    res.status(201).json({
      success: true,
      message,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = signToken(user._id);
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMe = async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    const projectFilter = isAdmin
      ? { createdBy: userId }
      : { $or: [{ createdBy: userId }, { members: userId }] };

    const projects = await Project.find(projectFilter).select('_id name status createdAt');
    const projectIds = projects.map((p) => p._id);

    const assignedFilter = { assignedTo: userId };
    const [assignedTasks, unreadNotifications] = await Promise.all([
      Task.find(assignedFilter).select('status priority project'),
      Notification.countDocuments({ userId, read: false }),
    ]);

    const statusCounts = { todo: 0, in_progress: 0, done: 0 };
    const priorityCounts = { low: 0, medium: 0, high: 0 };
    for (const t of assignedTasks) {
      if (statusCounts[t.status] !== undefined) statusCounts[t.status]++;
      if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++;
    }

    let adminTaskCount = 0;
    if (isAdmin && projectIds.length) {
      adminTaskCount = await Task.countDocuments({ project: { $in: projectIds } });
    }

    res.json({
      success: true,
      profile: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          createdAt: req.user.createdAt,
          updatedAt: req.user.updatedAt,
        },
        stats: {
          projectCount: projects.length,
          activeProjects: projects.filter((p) => p.status === 'active').length,
          archivedProjects: projects.filter((p) => p.status === 'archived').length,
          assignedTaskCount: assignedTasks.length,
          totalTasksInProjects: isAdmin ? adminTaskCount : null,
          statusCounts,
          priorityCounts,
          unreadNotifications,
        },
        projects: projects.map((p) => ({
          id: p._id,
          name: p.name,
          status: p.status,
          createdAt: p.createdAt,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
