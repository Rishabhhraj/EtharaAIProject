export const isProjectArchived = (project) => project?.status === 'archived';

export const rejectIfArchived = (project, res) => {
  if (isProjectArchived(project)) {
    res.status(403).json({
      success: false,
      message: 'This project is archived and read-only.',
    });
    return true;
  }
  return false;
};
