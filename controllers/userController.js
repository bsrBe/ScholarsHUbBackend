const User = require("../models/userModel");
const ActivityLog = require("../models/activityLog");

const listUsers = async (req, res) => {
  try {
    const { search = "", role, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) query.role = role;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      User.find(query).select("-password").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const allowed = ["name", "email", "role", "profileImageUrl", "isEmailConfirmed"];
    const updates = {};
    for (const k of allowed) if (k in req.body) updates[k] = req.body[k];

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    await ActivityLog.create({
      actor: req.user._id,
      action: "USER_UPDATE",
      entityType: "User",
      entityId: String(user._id),
      metadata: updates,
    });

    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await ActivityLog.create({
      actor: req.user._id,
      action: "USER_DELETE",
      entityType: "User",
      entityId: String(req.params.id),
      metadata: { email: user.email },
    });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = {
  listUsers,
  getUser,
  updateUser,
  deleteUser,
};


