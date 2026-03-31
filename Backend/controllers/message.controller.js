// controllers/message.controller.js
import Message from '../models/message.model.js';
import User from '../models/user.model.js';
import Chat from '../models/chat.model.js';

export const sendMessage = async (req, res) => {
    const { content, chatId } = req.body;
    const io = req.app.get('io');

    if (!content || !content.trim() || !chatId) {
        return res.status(400).json({ 
            success: false,
            message: "Content and chatId are required" 
        });
    }

    try {
        // Create new message
        const newMessage = {
            sender: req.user._id,
            content: content.trim(),
            chat: chatId,
            readBy: [req.user._id] 
        };

        let message = await Message.create(newMessage);

        // Populate necessary data
        message = await message.populate("sender", "name email");
        message = await message.populate("chat");
        
        await User.populate(message, {
            path: "chat.users",
            select: "name email",
        });

        // Update latest message in Chat model
        await Chat.findByIdAndUpdate(chatId, { 
            latestMessage: message._id 
        });

        // ====================== REAL-TIME BROADCAST ======================
        // 1. Chat room mein message bhejo (recommended for group + private)
        io.to(chatId).emit("newMessage", message);

        // 2. Har user ke personal room mein bhi bhejo (extra safety)
        if (message.chat && message.chat.users) {
            message.chat.users.forEach((user) => {
                if (user._id.toString() !== req.user._id.toString()) {
                    io.to(user._id.toString()).emit("message received", message);
                }
            });
        }
        // =================================================================

        res.status(201).json({ success: true, message });

    } catch (error) {
        console.error("Send Message Error:", error);
        res.status(500).json({ 
            success: false,
            message: "Failed to send message. Please try again."
        });
    }
};

export const allMessages = async (req, res) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId })
            .populate("sender", "name email")
            .populate("chat")
            .sort({ createdAt: 1 });

        res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error("All Messages Error:", error);
        res.status(500).json({ success: false, message: 'Failed to fetch messages. Please try again.' });
    }
};

// export const markAsRead = async (req, res) => {
//     const { chatId } = req.body;

//     if (!chatId) {
//         return res.status(400).json({ message: "chatId is required" });
//     }

//     try {
//         const result = await Message.updateMany(
//             {
//                 chat: chatId,
//                 sender: { $ne: req.user._id },     // Sender ke alawa sab
//                 readBy: { $ne: req.user._id }      // Jo abhi tak unread hai
//             },
//             {
//                 $addToSet: { readBy: req.user._id }   // Add user to readBy array
//             }
//         );

//         // Real-time update bhejo
//         io.to(chatId).emit("messagesRead", {
//             chatId,
//             userId: req.user._id,
//             readBy: req.user._id
//         });

//         res.status(200).json({
//             success: true,
//             message: "Messages marked as read",
//             updatedCount: result.modifiedCount
//         });

//     } catch (error) {
//         console.error("Mark as Read Error:", error);
//         res.status(500).json({ message: "Failed to mark messages as read" });
//     }
// };

export const markAsRead = async (req, res) => {
    const { messageIds } = req.body;   // 🔥 array of messageIds
    const userId = req.user?._id;
    const io = req.app.get('io');

    // ✅ Validation
    if (!messageIds || messageIds.length === 0) {
        return res.status(400).json({ success: false, message: "messageIds are required" });
    }

    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const result = await Message.updateMany(
            {
                _id: { $in: messageIds },     // 🔥 only these messages
                sender: { $ne: userId },      // apne message skip
                readBy: { $ne: userId }       // jo already read nahi
            },
            {
                $addToSet: { readBy: userId } // duplicate nahi add hoga
            }
        );

        // 🔥 socket emit
        if (io) {
            io.emit("messagesRead", {
                messageIds,
                userId
            });
        }

        res.status(200).json({
            success: true,
            message: "Messages marked as read",
            updatedCount: result.modifiedCount
        });

    } catch (error) {
        console.error("Mark as Read Error:", error);
        res.status(500).json({ success: false, message: "Failed to mark messages as read. Please try again." });
    }
};