import mongoose from 'mongoose';

const statusChangeRequestSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    currentStatus: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      required: true,
    },
    requestedStatus: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      required: true,
    },
    requestStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
  },
  { timestamps: true }
);

statusChangeRequestSchema.index({ project: 1, requestStatus: 1 });
statusChangeRequestSchema.index({ task: 1, requestStatus: 1 });
statusChangeRequestSchema.index(
  { task: 1, requestedBy: 1 },
  { unique: true, partialFilterExpression: { requestStatus: 'pending' } }
);

export default mongoose.model('StatusChangeRequest', statusChangeRequestSchema);
