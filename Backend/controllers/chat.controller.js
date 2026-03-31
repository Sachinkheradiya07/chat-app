import Chat from '../models/chat.model.js';
import User from '../models/user.model.js';

export const accessChat = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ success: false, message: "UserId is required" });
    }

    try {
        let isChat = await Chat.find({
            isGroupChat: false,
            $and: [
                { users: { $elemMatch: { $eq: req.user._id } } },
                { users: { $elemMatch: { $eq: userId } } },
            ],
        })
            .populate("users", "-password")
            .populate("latestMessage");

        isChat = await User.populate(isChat, {
            path: "latestMessage.sender",
            select: "name email",
        });

        if (isChat.length > 0) {
            return res.status(200).json({ success: true, chat: isChat[0] });
        } 

        const chatData = {
            chatName: "sender",
            isGroupChat: false,
            users: [req.user._id, userId],
        };

        const createdChat = await Chat.create(chatData);

        const fullChat = await Chat.findOne({ _id: createdChat._id })
            .populate("users", "-password");

        res.status(201).json({ success: true, chat: fullChat });
    } catch (error) {
        console.error("Access Chat Error:", error);
        res.status(500).json({ success: false, message: 'Failed to access chat. Please try again.' });
    }
};

export const fetchChats = async (req, res) => {
    try {
        const results = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate("latestMessage")
            .sort({ updatedAt: -1 });

        const populatedResults = await User.populate(results, {
            path: "latestMessage.sender",
            select: "name  email",
        });

        res.status(200).json({ success: true, chats: populatedResults });
    } catch (error) {
        console.error("Fetch Chats Error:", error);
        res.status(500).json({ success: false, message: 'Failed to fetch chats. Please try again.' });
    }
};

// export const createGroupChat = async (req, res) => {
//     const { users, name } = req.body;

//     if (!users || !name) {
//         return res.status(400).json({ message: "Please fill all the fields" });
//     }

//     try {
//         let parsedUsers = JSON.parse(users);
//         if (parsedUsers.length < 2) {
//             return res.status(400).json({ message: "More than 2 users are required to form a group chat" });
//         }

//         parsedUsers.push(req.user._id);

//         const groupChat = await Chat.create({
//             chatName: name,
//             users: parsedUsers,
//             isGroupChat: true,
//             groupAdmin: req.user._id,
//         });

//         const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
//             .populate("users", "-password")
//             .populate("groupAdmin", "-password");

//         res.status(201).json(fullGroupChat);
//     } catch (error) {
//         console.error("Create Group Chat Error:", error);
//         res.status(400).json({ message: error.message });
//     }
// };

export const createGroupChat = async (req, res) => {
    const { name, users } = req.body;

    if (!name || !users) {
        return res.status(400).json({ 
            success: false,
            message: "Please provide both 'name' and 'users'" 
        });
    }

    try {
        let userIds = users;

        // Agar users string mein aaya to parse karo
        if (typeof users === "string") {
            userIds = JSON.parse(users);
        }

        if (!Array.isArray(userIds) || userIds.length < 2) {
            return res.status(400).json({ 
                success: false,
                message: "At least 2 users are required to form a group chat" 
            });
        }

        // Add current logged in user as admin
        userIds.push(req.user._id);

        const groupChat = await Chat.create({
            chatName: name.trim(),
            users: userIds,
            isGroupChat: true,
            groupAdmin: req.user._id,
        });

        const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        res.status(201).json({
            success: true,
            message: "Group chat created successfully",
            chat: fullGroupChat
        });

    } catch (error) {
        console.error("Create Group Chat Error:", error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to create group chat. Please try again.' 
        });
    }
};

export const renameGroup = async (req, res) => {
    const { chatId, chatName } = req.body;

    try {
        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({ success: false, message: "Chat not found" });
        }

        if (chat.groupAdmin.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Only group admin can rename the group" });
        }

        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            { chatName },
            { new: true }
        )
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        res.status(200).json({ success: true, chat: updatedChat });
    } catch (error) {
        console.error("Rename Group Error:", error);
        res.status(500).json({ success: false, message: 'Failed to rename group. Please try again.' });
    }
};

export const removeFromGroup = async (req, res) => {
    const { chatId, userId } = req.body;

    try {
        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({ success: false, message: "Chat not found" });
        }

        if (chat.groupAdmin.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Only group admin can remove users" });
        }

        if (userId === chat.groupAdmin.toString()) {
            return res.status(400).json({ success: false, message: "Cannot remove group admin" });
        }

        const removed = await Chat.findByIdAndUpdate(
            chatId,
            { $pull: { users: userId } },
            { new: true }
        )
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        res.status(200).json({ success: true, chat: removed });
    } catch (error) {
        console.error("Remove From Group Error:", error);
        res.status(500).json({ success: false, message: 'Failed to remove user. Please try again.' });
    }
};

export const addToGroup = async (req, res) => {
    const { chatId, userId } = req.body;

    try {
        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({ success: false, message: "Chat not found" });
        }

        if (chat.groupAdmin.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Only group admin can add users" });
        }

        const added = await Chat.findByIdAndUpdate(
            chatId,
            { $push: { users: userId } },
            { new: true }
        )
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        res.status(200).json({ success: true, chat: added });
    } catch (error) {
        console.error("Add To Group Error:", error);
        res.status(500).json({ success: false, message: 'Failed to add user. Please try again.' });
    }
};

export const searchChats = async (req, res) => {
    try {
        const { search } = req.query;

        if (!search || search.trim() === '') {
            return res.status(400).json({ success: false, message: 'Search query is required' });
        }

        const chats = await Chat.find({
            $and: [
                { users: { $elemMatch: { $eq: req.user._id } } },
                { chatName: { $regex: search, $options: 'i' } }
            ]
        })
            .populate("users", "-password")
            .populate("latestMessage")
            .sort({ updatedAt: -1 });

        const populatedChats = await User.populate(chats, {
            path: "latestMessage.sender",
            select: "name email",
        });

        res.status(200).json({ success: true, chats: populatedChats });
    } catch (error) {
        console.error("Search Chats Error:", error);
        res.status(500).json({ success: false, message: 'Failed to search chats. Please try again.' });
    }
};