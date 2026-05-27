import mongoose from 'mongoose';

const isValidObjectId = (value) => {
  if (!value || typeof value !== 'string') return false;
  return mongoose.Types.ObjectId.isValid(value) && /^[0-9a-fA-F]{24}$/.test(value);
};

/**
 * Validates route params are valid MongoDB ObjectIds before controllers run.
 * @param {...string} paramNames - e.g. 'id', 'projectId', 'memberId'
 */
export const validateObjectId =
  (...paramNames) =>
  (req, res, next) => {
    for (const name of paramNames) {
      const value = req.params[name];
      if (value !== undefined && !isValidObjectId(value)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${name}: must be a valid resource identifier`,
        });
      }
    }
    next();
  };
