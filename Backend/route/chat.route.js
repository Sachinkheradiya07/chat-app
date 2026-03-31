import express from "express";
import { accessChat, fetchChats, createGroupChat, renameGroup, removeFromGroup, addToGroup, searchChats } from "../controllers/chat.controller.js";
import {protect}  from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/access").post(protect, accessChat);
router.route("/").get(protect, fetchChats);
router.route("/search").get(protect, searchChats);
router.route("/group").post(protect, createGroupChat);
router.route("/rename").put(protect, renameGroup);
router.route("/groupremove").put(protect, removeFromGroup);
router.route("/groupadd").put(protect, addToGroup);

export default router;