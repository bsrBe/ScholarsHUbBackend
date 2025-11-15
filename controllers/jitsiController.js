// Jitsi configuration for public instance
const JITSI_CONFIG = {
  host: process.env.JITSI_HOST || 'meet.jit.si',
  useStunTurn: true,
  enableNoAudioDetection: true,
  enableNoisyMicDetection: true,
  startWithAudioMuted: false,
  startWithVideoMuted: false,
};

// Get Jitsi configuration
exports.getConfig = async (req, res) => {
  try {
    res.json({
      success: true,
      config: JITSI_CONFIG,
      interfaceConfig: {
        APP_NAME: 'ScholarsHub',
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
          'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts'
        ]
      }
    });
  } catch (error) {
    console.error('Error getting Jitsi config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get Jitsi configuration',
    });
  }
};
