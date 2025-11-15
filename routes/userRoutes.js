const express = require("express");
const { protect, admin } = require("../middlewares/authMiddleware");
const { listUsers, getUser, updateUser, deleteUser } = require("../controllers/userController");

const router = express.Router();

router.use(protect, admin);

router.get("/", listUsers);
router.get("/:id", getUser);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;


