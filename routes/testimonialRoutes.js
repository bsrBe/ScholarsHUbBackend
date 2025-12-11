const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/multer');

// Public routes
router.get('/', testimonialController.getTestimonials);

// Protected admin routes
router.use(protect, authorize('admin'));

router.get('/all', testimonialController.getAllTestimonials);
router.post(
  '/',
  upload.single('image'),
  testimonialController.createTestimonial
);
router.put(
  '/:id',
  upload.single('image'),
  testimonialController.updateTestimonial
);
router.delete('/:id', testimonialController.deleteTestimonial);
router.patch('/:id/status', testimonialController.toggleTestimonialStatus);

module.exports = router;
