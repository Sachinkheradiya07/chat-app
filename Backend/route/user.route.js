import express from "express";
import { registerUser, loginUser, getMe, logoutUser, searchUsers, getAllUsers } from "../controllers/user.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/logout', protect, logoutUser);
router.get('/search', protect, searchUsers);
router.get('/all', protect, getAllUsers);

export default router;

