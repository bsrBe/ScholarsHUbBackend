const Testimonial = require('../models/Testimonial');
const { uploadToCloudinary } = require('../utils/cloudinary');

// Get all active testimonials
exports.getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true })
      .sort({ createdAt: -1 })
      .select('-__v -isActive');
    res.json(testimonials);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all testimonials (admin)
exports.getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (error) {
    console.error('Error fetching all testimonials:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new testimonial
exports.createTestimonial = async (req, res) => {
  try {
    const { name, country, university, message, rating } = req.body;
    
    let imageData = {};
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        `testimonial-${Date.now()}`,
        { folder: 'testimonials' }
      );
      imageData = {
        url: result.secure_url,
        public_id: result.public_id
      };
    }

    const testimonial = new Testimonial({
      name,
      country,
      university,
      message,
      rating: parseInt(rating),
      image: Object.keys(imageData).length > 0 ? imageData : undefined
    });

    await testimonial.save();
    res.status(201).json(testimonial);
  } catch (error) {
    console.error('Error creating testimonial:', error);
    res.status(500).json({ message: 'Error creating testimonial' });
  }
};

// Update testimonial
exports.updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, country, university, message, rating, isActive } = req.body;
    
    const updateData = {
      name,
      country,
      university,
      message,
      rating: parseInt(rating),
      isActive: isActive === 'true'
    };

    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        `testimonial-${Date.now()}`,
        { folder: 'testimonials' }
      );
      updateData.image = {
        url: result.secure_url,
        public_id: result.public_id
      };
    }

    const updatedTestimonial = await Testimonial.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedTestimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    res.json(updatedTestimonial);
  } catch (error) {
    console.error('Error updating testimonial:', error);
    res.status(500).json({ message: 'Error updating testimonial' });
  }
};

// Delete testimonial
exports.deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTestimonial = await Testimonial.findByIdAndDelete(id);
    
    if (!deletedTestimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    // TODO: Delete image from Cloudinary if it exists
    // You might want to implement this in a cleanup job

    res.json({ message: 'Testimonial deleted successfully' });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    res.status(500).json({ message: 'Error deleting testimonial' });
  }
};

// Toggle testimonial status
exports.toggleTestimonialStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const testimonial = await Testimonial.findById(id);
    
    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    testimonial.isActive = !testimonial.isActive;
    await testimonial.save();

    res.json({
      message: `Testimonial ${testimonial.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: testimonial.isActive
    });
  } catch (error) {
    console.error('Error toggling testimonial status:', error);
    res.status(500).json({ message: 'Error updating testimonial status' });
  }
};
