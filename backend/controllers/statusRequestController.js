import StatusChangeRequest from '../models/StatusChangeRequest.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { userCanAccessProject, userIsProjectAdmin, toIdString } from '../utils/projectAccess.js';

const populateRequest = (query) =>
  query
    .populate('task', 'title status')
    .populate('requestedBy', 'name email')
    .populate('reviewedBy', 'name email');

export const createStatusRequest = async (req, res) => {
  try {
    const { requestedStatus } = req.body;
    const task = await Task.findById(req.params.taskId).populate('project');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = task.project;
    if (!userCanAccessProject(project, req.user._id, req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (req.user.role !== 'member') {
      return res.status(403).json({
        success: false,
        message: 'Only members submit status change requests. Admins can update status directly.',
      });
    }

    const assigneeId = toIdString(task.assignedTo);
    if (assigneeId !== toIdString(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You can only request status changes for tasks assigned to you',
      });
    }

    if (task.status === requestedStatus) {
      return res.status(400).json({
        success: false,
        message: 'Requested status is the same as current status',
      });
    }

    const existing = await StatusChangeRequest.findOne({
      task: task._id,
      requestedBy: req.user._id,
      requestStatus: 'pending',
    });

    if (existing) {
      existing.requestedStatus = requestedStatus;
      existing.currentStatus = task.status;
      await existing.save();
      const populated = await populateRequest(StatusChangeRequest.findById(existing._id));
      return res.json({
        success: true,
        message: 'Status change request updated',
        request: populated,
      });
    }

    const statusRequest = await StatusChangeRequest.create({
      task: task._id,
      project: project._id,
      requestedBy: req.user._id,
      currentStatus: task.status,
      requestedStatus,
    });

    const populated = await populateRequest(StatusChangeRequest.findById(statusRequest._id));
    res.status(201).json({
      success: true,
      message: 'Status change request sent to admin for approval',
      request: populated,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request for this task',
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPendingByProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!userIsProjectAdmin(project, req.user._id, req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only project admin can view requests' });
    }

    const requests = await populateRequest(
      StatusChangeRequest.find({ project: project._id, requestStatus: 'pending' }).sort(
        '-createdAt'
      )
    );

    res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMyRequestsForProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!userCanAccessProject(project, req.user._id, req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const filter = { project: project._id };
    if (req.user.role === 'member') {
      filter.requestedBy = req.user._id;
      filter.requestStatus = 'pending';
    }

    const requests = await populateRequest(
      StatusChangeRequest.find(filter).sort('-createdAt')
    );

    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const approveStatusRequest = async (req, res) => {
  try {
    const statusRequest = await StatusChangeRequest.findById(req.params.id).populate('task');
    if (!statusRequest) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (statusRequest.requestStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already reviewed' });
    }

    const project = await Project.findById(statusRequest.project);
    if (!userIsProjectAdmin(project, req.user._id, req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only project admin can approve' });
    }

    const task = await Task.findById(statusRequest.task._id || statusRequest.task);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    task.status = statusRequest.requestedStatus;
    await task.save();

    statusRequest.requestStatus = 'approved';
    statusRequest.reviewedBy = req.user._id;
    statusRequest.reviewedAt = new Date();
    await statusRequest.save();

    const populated = await populateRequest(StatusChangeRequest.findById(statusRequest._id));
    res.json({
      success: true,
      message: 'Status change approved',
      request: populated,
      task: { _id: task._id, status: task.status },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const rejectStatusRequest = async (req, res) => {
  try {
    const statusRequest = await StatusChangeRequest.findById(req.params.id);
    if (!statusRequest) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (statusRequest.requestStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already reviewed' });
    }

    const project = await Project.findById(statusRequest.project);
    if (!userIsProjectAdmin(project, req.user._id, req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only project admin can reject' });
    }

    statusRequest.requestStatus = 'rejected';
    statusRequest.reviewedBy = req.user._id;
    statusRequest.reviewedAt = new Date();
    statusRequest.reviewNote = req.body.reviewNote || '';
    await statusRequest.save();

    const populated = await populateRequest(StatusChangeRequest.findById(statusRequest._id));
    res.json({
      success: true,
      message: 'Status change request rejected',
      request: populated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
