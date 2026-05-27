/** Normalize ObjectId, populated doc, or string to a comparable id string */
export function toIdString(ref) {
  if (ref == null) return '';
  if (typeof ref === 'string') return ref;
  if (ref._id != null) return ref._id.toString();
  return ref.toString();
}

export const userCanAccessProject = (project, userId, userRole) => {
  const uid = toIdString(userId);
  const ownerId = toIdString(project.createdBy);

  if (ownerId && ownerId === uid) return true;

  return (project.members || []).some((m) => toIdString(m) === uid);
};

export const userIsProjectAdmin = (project, userId, userRole) => {
  if (userRole !== 'admin') return false;
  return toIdString(project.createdBy) === toIdString(userId);
};
