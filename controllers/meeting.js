const { v4: uuidv4 } = require("uuid");
const Meeting = require("../models/meetingsModel");
const ActivityLog = require("../models/activityLog");
const path = require('path');
const fs = require('fs');

const ACTIVE_MEETING_STATUSES = ["scheduled", "in-progress"];
const WORKING_HOURS = {
    startHour: 8,  // 8:00 AM
    endHour: 24,   // 12:00 AM (midnight)
};
const BUFFER_MINUTES = 15;

// Create a new meeting
const createMeeting = async (req, res) => {
    try {
        const {
            title,
            description,
            hostName,
            hostEmail,
            participants = [],
            startTime,
            endTime,
            timeZone = "Africa/Addis_Ababa"
        } = req.body;

        if (!title || !hostName || !hostEmail || !startTime || !endTime) {
            return res.status(400).json({
                error: "Missing required fields: title, hostName, hostEmail, startTime, endTime are required.",
            });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return res.status(400).json({ error: "Invalid startTime or endTime." });
        }

        const now = new Date();
        if (start <= now) {
            return res.status(400).json({ error: "Meeting start time must be in the future." });
        }

        if (end <= start) {
            return res.status(400).json({ error: "Meeting end time must be after the start time." });
        }

        const dayStart = new Date(start);
        dayStart.setHours(WORKING_HOURS.startHour, 0, 0, 0);
        const dayEnd = new Date(start);
        dayEnd.setHours(WORKING_HOURS.endHour, 0, 0, 0);

        if (start < dayStart || end > dayEnd) {
            return res.status(400).json({
                error: "Consultations can only be scheduled between 8:00 AM and 12:00 AM.",
            });
        }

        const startOfDay = new Date(start);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(start);
        endOfDay.setHours(23, 59, 59, 999);

        const existingSameDay = await Meeting.findOne({
            hostEmail,
            startTime: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: "cancelled" },
        });

        if (existingSameDay) {
            return res.status(409).json({
                error: "A meeting is already scheduled for this host on the selected day.",
            });
        }

        const bufferStart = new Date(start.getTime() - BUFFER_MINUTES * 60 * 1000);
        const bufferEnd = new Date(end.getTime() + BUFFER_MINUTES * 60 * 1000);

        const overlappingMeeting = await Meeting.findOne({
            status: { $in: ACTIVE_MEETING_STATUSES },
            $and: [
                { startTime: { $lt: bufferEnd } },
                { endTime: { $gt: bufferStart } },
            ],
        });

        if (overlappingMeeting) {
            return res.status(409).json({
                error: `Another consultation is already booked around this time. Please choose a slot at least ${BUFFER_MINUTES} minutes apart.`,
            });
        }

        // Generate a unique Jitsi meeting ID and link
        const jitsiMeetingId = uuidv4();
        const jitsiMeetingLink = `https://meet.jit.si/${jitsiMeetingId}`;

        // Create the meeting
        const meeting = new Meeting({
            id: uuidv4(),
            title,
            description,
            hostName,
            hostEmail,
            participants,
            startTime: start,
            endTime: end,
            timeZone,
            jitsiMeetingId,
            jitsiMeetingLink,
            status: "scheduled",
        });

        await meeting.save();
        await ActivityLog.create({
            actor: req.user?._id,
            action: "MEETING_CREATE",
            entityType: "Meeting",
            entityId: String(meeting._id),
            metadata: { title, hostEmail }
        });
        res.status(201).json({ meeting, meetingLink: jitsiMeetingLink });
    } catch (error) {
        console.error("Error creating meeting:", error);
        res.status(500).json({ error: "Failed to create meeting" });
    }
};

// Update a meeting
const updateMeeting = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, hostName, hostEmail, participants, startTime, endTime, timeZone, status } = req.body;
        
        // Access: admin can update; creator/hostEmail can update non-destructive fields
        const existing = await Meeting.findById(id);
        if (!existing) return res.status(404).json({ error: "Meeting not found" });
        const isAdmin = req.user && req.user.role === "admin";
        const isHost = req.user && existing.hostEmail && req.user.email === existing.hostEmail;
        if (!isAdmin && !isHost) {
            return res.status(403).json({ error: "Not authorized to update this meeting" });
        }

        existing.title = title ?? existing.title;
        existing.description = description ?? existing.description;
        existing.hostName = hostName ?? existing.hostName;
        existing.hostEmail = hostEmail ?? existing.hostEmail;
        if (participants) existing.participants = participants;
        existing.startTime = startTime ?? existing.startTime;
        existing.endTime = endTime ?? existing.endTime;
        existing.timeZone = timeZone ?? existing.timeZone;
        existing.status = status ?? existing.status;
        existing.updatedAt = new Date();

        const meeting = await existing.save();

        await ActivityLog.create({
            actor: req.user?._id,
            action: "MEETING_UPDATE",
            entityType: "Meeting",
            entityId: String(meeting._id),
            metadata: { title: meeting.title, status: meeting.status }
        });

        res.json(meeting);
    } catch (error) {
        console.error("Error updating meeting:", error);
        res.status(500).json({ error: "Failed to update meeting" });
    }
};

// Get all meetings
const getAllMeetings = async (req, res) => {
    try {
        const { status, from, to, hostEmail, page = 1, limit = 20 } = req.query;
        const query = {};
        if (status) query.status = status;
        if (hostEmail) query.hostEmail = hostEmail;
        if (from || to) {
            query.startTime = {};
            if (from) query.startTime.$gte = new Date(from);
            if (to) query.startTime.$lte = new Date(to);
        }

        const isAdmin = req.user && req.user.role === "admin";
        if (!isAdmin && req.user?.email) {
            // non-admin sees only meetings they host or participate in
            query.$or = [{ hostEmail: req.user.email }, { participants: req.user.email }];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [items, total] = await Promise.all([
            Meeting.find(query).sort({ startTime: -1 }).skip(skip).limit(Number(limit)),
            Meeting.countDocuments(query),
        ]);
        res.json({ items, total, page: Number(page), limit: Number(limit) });
    } catch (error) {
        console.error("Error fetching meetings:", error);
        res.status(500).json({ error: "Failed to fetch meetings" });
    }
};

// Get a meeting by ID
const getMeetingById = async (req, res) => {
    try {
        const { id } = req.params;
        const meeting = await Meeting.findById(id);

        if (!meeting) {
            return res.status(404).json({ error: "Meeting not found" });
        }

        const isAdmin = req.user && req.user.role === "admin";
        const isParticipantOrHost =
            req.user &&
            (meeting.hostEmail === req.user.email || (meeting.participants || []).includes(req.user.email));
        if (!isAdmin && !isParticipantOrHost) {
            return res.status(403).json({ error: "Not authorized to access this meeting" });
        }

        res.json(meeting);
    } catch (error) {
        console.error("Error fetching meeting:", error);
        res.status(500).json({ error: "Failed to fetch meeting" });
    }
};

// Delete a meeting
const deleteMeeting = async (req, res) => {
    try {
        const { id } = req.params;
        const meeting = await Meeting.findById(id);

        if (!meeting) {
            return res.status(404).json({ error: "Meeting not found" });
        }

        // Only admin can delete; route already enforces admin, but keep guard
        const isAdmin = req.user && req.user.role === "admin";
        if (!isAdmin) return res.status(403).json({ error: "Admin access required" });

        await meeting.deleteOne();
        await ActivityLog.create({
            actor: req.user?._id,
            action: "MEETING_DELETE",
            entityType: "Meeting",
            entityId: String(id),
            metadata: { title: meeting.title }
        });

        res.json({ message: "Meeting deleted successfully" });
    } catch (error) {
        console.error("Error deleting meeting:", error);
        res.status(500).json({ error: "Failed to delete meeting" });
    }
};

// Check meeting time and handle embedded meeting
const checkMeetingTime = async (req, res) => {
    try {
        const { id } = req.params;
        const { embedded, displayName: displayNameParam } = req.query;

        // Find the meeting by ID
        const meeting = await Meeting.findById(id);

        if (!meeting) {
            console.error(`Meeting not found with ID: ${id}`);
            return res.status(404).send('Meeting not found or has been cancelled');
        }

        const now = new Date();
        const meetingStartTime = new Date(meeting.startTime);
        const displayName = displayNameParam || 'Guest';
        
        // Calculate 15 minutes before meeting start
        const fifteenMinutesBefore = new Date(meetingStartTime);
        fifteenMinutesBefore.setMinutes(fifteenMinutesBefore.getMinutes() - 15);
        
        // Check if it's time to join the meeting
        const canJoin = now >= fifteenMinutesBefore;
        
        // If it's an embedded meeting request or direct join
        if (embedded === 'true' || req.path.includes('/join')) {
            if (canJoin) {
                try {
                    // Read the meeting.html file and replace placeholders
                    let html = fs.readFileSync(path.join(__dirname, '../public/meeting.html'), 'utf8');
                    
                    // Replace placeholders with actual values
                    html = html
                        .replace(/MEETING_ID_PLACEHOLDER/g, meeting.jitsiMeetingId)
                        .replace(/MEETING_TIME_PLACEHOLDER/g, meetingStartTime.toISOString())
                        .replace(/DISPLAY_NAME_PLACEHOLDER/g, encodeURIComponent(displayName));
                    
                    return res.send(html);
                } catch (fileError) {
                    console.error('Error reading meeting template:', fileError);
                    return res.status(500).send('Error loading meeting interface');
                }
            } else {
                // Too early to join
                return res.send(`
                  <html>
                    <head>
                      <title>Meeting Not Available</title>
                      <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
                        .container { max-width: 600px; margin: 0 auto; }
                        h1 { color: #2c3e50; }
                        .info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <h1>Meeting Not Available Yet</h1>
                        <div class="info">
                          <p>This meeting is scheduled for ${meetingStartTime.toLocaleString()}.</p>
                          <p>Please check back 15 minutes before the scheduled start time.</p>
                        </div>
                        <p><a href="/">Return to home page</a></p>
                      </div>
                    </body>
                  </html>
                `);
            }
        }
        
        // If it's a direct link to Jitsi (non-embedded)
        if (now >= fifteenMinutesBefore) {
            return res.redirect(meeting.jitsiMeetingLink);
        }
        
        // Default response for API calls
        return res.json({
            canJoin,
            meetingStartTime: meetingStartTime.toISOString(),
            message: canJoin 
                ? 'Meeting is available to join' 
                : `Meeting will be available at ${fifteenMinutesBefore.toLocaleString()}`
        });
        
    } catch (error) {
        console.error('Error in checkMeetingTime:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createMeeting,
    updateMeeting,
    getAllMeetings,
    getMeetingById,
    deleteMeeting,
    checkMeetingTime
};
