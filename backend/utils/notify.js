import Notification from '../models/Notification.js';

export const createNotification = async ({
  userId,
  message,
  type,
  relatedTask = null,
  relatedProject = null,
}) => {
  if (!userId) return null;
  return Notification.create({
    userId,
    message,
    type,
    relatedTask,
    relatedProject,
  });
};
