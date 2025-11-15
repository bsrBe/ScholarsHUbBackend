const User = require("../models/userModel");
const Meeting = require("../models/meetingsModel");
const UserForm = require("../models/userForm");
const ActivityLog = require("../models/activityLog");

const getStats = async (req, res) => {
  try {
    const [totalUsers, totalMeetings, totalForms, meetingByStatusAgg] = await Promise.all([
      User.countDocuments(),
      Meeting.countDocuments(),
      UserForm.countDocuments(),
      Meeting.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ])
    ]);

    const meetingsByStatus = meetingByStatusAgg.reduce((acc, cur) => {
      acc[cur._id] = cur.count;
      return acc;
    }, { scheduled: 0, completed: 0, cancelled: 0 });

    // 7/30 day counts
    const since = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [users7, users30, meetings7, meetings30, forms7, forms30] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: since(7) } }),
      User.countDocuments({ createdAt: { $gte: since(30) } }),
      Meeting.countDocuments({ createdAt: { $gte: since(7) } }),
      Meeting.countDocuments({ createdAt: { $gte: since(30) } }),
      UserForm.countDocuments({ createdAt: { $gte: since(7) } }),
      UserForm.countDocuments({ createdAt: { $gte: since(30) } }),
    ]);

    res.json({
      totals: { users: totalUsers, meetings: totalMeetings, forms: totalForms },
      meetingsByStatus,
      last7Days: { users: users7, meetings: meetings7, forms: forms7 },
      last30Days: { users: users30, meetings: meetings30, forms: forms30 },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const getRecentActivities = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 20);
    const items = await ActivityLog.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("actor", "name email role");
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const getOverview = async (req, res) => {
  try {
    const [stats, activities] = await Promise.all([
      (async () => {
        const reqMock = { ...req };
        const resMock = {
          jsonPayload: null,
          json(payload) { this.jsonPayload = payload; },
          status() { return this; }
        };
        await getStats(reqMock, resMock);
        return resMock.jsonPayload;
      })(),
      ActivityLog.find({}).sort({ createdAt: -1 }).limit(20).populate("actor", "name email role"),
    ]);
    res.json({ stats, activities });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = { getStats, getRecentActivities, getOverview };


