const express = require("express");
const { protect, admin } = require("../middlewares/authMiddleware");
const { getStats, getRecentActivities, getOverview } = require("../controllers/adminController");

const router = express.Router();

router.use(protect, admin);

router.get("/stats", getStats);
router.get("/activities", getRecentActivities);
router.get("/overview", getOverview);

module.exports = router;


