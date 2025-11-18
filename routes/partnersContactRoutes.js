const express = require('express');
const router = express.Router();
const { submitIndividualInquiry, submitCompanyInquiry, getAllPartnershipRequests, getPartnershipRequest, updateRequestStatus, downloadFile } = require('../controllers/partnersContactController');
const upload = require('../controllers/partnersContactController').upload;

// Submit partners contact form with file uploads
router.post('/submit-individual', 
  upload.fields([
    { name: 'passport', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
  ]), 
  submitIndividualInquiry
);

router.post('/submit-company', 
  upload.fields([
    { name: 'businessLicense', maxCount: 1 },
    { name: 'companyProfile', maxCount: 1 }
  ]), 
  submitCompanyInquiry
);

// Get all partnership requests (for admin dashboard)
router.get('/requests', getAllPartnershipRequests);

// Get single partnership request
router.get('/requests/:id', getPartnershipRequest);

// Update partnership request status
router.patch('/requests/:id/status', updateRequestStatus);

// Download uploaded files
router.get('/download/:filename', downloadFile);

module.exports = router;
