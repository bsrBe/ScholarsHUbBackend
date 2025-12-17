const express = require("express")
const router = express.Router()
const { protect } = require("../middlewares/authMiddleware")
const cookieParser = require("cookie-parser");

router.use(cookieParser());

const  {
    register,
    Login,
    getMe,
    forgotPassword,
    resetPassword,
    confirmEmail,
    logout,
    changePassword,
    updateDetails
} = require("../controllers/authController")

const { upload } = require("../middlewares/multer");

// Remove protect middleware to allow token verification
router.get("/me", protect, getMe)
router.post("/register" , register)
router.post("/login" , Login)
router.post("/forgotPassword" ,  forgotPassword)
// Reset password route - token is now expected in the request body
router.put("/resetPassword", resetPassword)
router.get("/confirmEmail/:token", confirmEmail);
router.post("/logout", logout)
router.put("/changePassword", protect, changePassword)
router.put("/updatedetails", protect, upload.single('profileImage'), updateDetails)

module.exports = router

