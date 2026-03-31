import express from "express";
import { allMessages, sendMessage,markAsRead } from "../controllers/message.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();


router.post("/", protect, sendMessage);
router.get("/:chatId", protect, allMessages);
router.post('/read', protect, markAsRead);  

export default router;
