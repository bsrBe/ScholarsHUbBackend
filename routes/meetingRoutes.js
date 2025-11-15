const express = require("express");
const router = express.Router();
const {
    createMeeting,
    updateMeeting,
    getAllMeetings,
    getMeetingById,
    deleteMeeting,
    checkMeetingTime,
} = require("../controllers/meeting");
const { protect, admin } = require("../middlewares/authMiddleware");

// Authenticated routes
router.use(protect);

// Route to create a new meeting (admin or authenticated users based on policy)
router.post("/", createMeeting);

// Route to update a meeting
router.put("/:id", updateMeeting);

// Route to get all meetings
router.get("/", getAllMeetings);

// Route to get a specific meeting by ID
router.get("/:id", getMeetingById);

// Route to delete a meeting (admin only)
router.delete("/:id", admin, deleteMeeting);

// Route to join a meeting (supports both embedded and redirect modes)
router.get("/:id/join", checkMeetingTime);

module.exports = router;
