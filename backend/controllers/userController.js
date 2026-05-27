import User from '../models/User.js';

export const getMembers = async (req, res) => {
  try {
    const members = await User.find({ role: 'member' }).select('name email role');
    res.json({ success: true, users: members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
