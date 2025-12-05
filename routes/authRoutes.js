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
    changePassword
} = require("../controllers/authController")

// Remove protect middleware to allow token verification
router.get("/me", getMe)
router.post("/register" , register)
router.post("/login" , Login)
router.post("/forgotPassword" ,  forgotPassword)
router.put("/resetPassword/:token", protect ,resetPassword)
router.get("/confirmEmail/:token", confirmEmail);
router.post("/logout", logout)
router.put("/changePassword", protect, changePassword)
module.exports = router

