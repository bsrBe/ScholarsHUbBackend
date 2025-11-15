const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true }, // e.g., 'USER_UPDATE', 'MEETING_CREATE'
    entityType: { type: String, required: true }, // 'User' | 'Meeting' | 'UserForm'
    entityId: { type: String, required: true },
    metadata: { type: Object, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);


