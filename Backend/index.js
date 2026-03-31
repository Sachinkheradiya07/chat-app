import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import userRoutes from './route/user.route.js';
import messageRoutes from './route/message.route.js';
import chatRoutes from './route/chat.route.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

const io = new Server(server, {
    cors: { 
        origin: "*", 
        methods: ["GET", "POST"],
        credentials: true 
    },
    pingTimeout: 60000,    
    pingInterval: 25000
});

// Middleware
app.use(cors({
  origin: true, 
  credentials: true
}))
app.use(express.json());

// Make io available globally (optional, agar controller mein direct use karna ho)
app.set('io', io);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/chats', chatRoutes);

app.get('/', (req, res) => {
    res.json({ success: true, message: "Server is running with Socket.IO" });
});

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler (MUST be LAST)
app.use(errorHandler);

// ====================== SOCKET.IO LOGIC ======================
io.on('connection', (socket) => {
    console.log(` User Connected: ${socket.id}`);

    // User apne personal room mein join kare (recommended)
    socket.on('setup', (userId) => {
        if (userId) {
            socket.join(userId);
            socket.userId = userId;
            console.log(`User ${userId} joined their personal room`);
            socket.emit('connected');
            io.emit('userOnline', userId);
        }
    });

    // Join specific chat room
    socket.on('joinChat', (chatId) => {
        socket.join(chatId);
        console.log(`User ${socket.id} joined chat room: ${chatId}`);
    });

    // Typing Indicator
    socket.on('typing', (data) => {
        const { chatId, userName } = data;
        if (chatId) {
            socket.to(chatId).emit('typing', { 
                chatId, 
                userName,
                isTyping: true 
            });
        }
    });

    socket.on('stop typing', (chatId) => {
        if (chatId) {
            socket.to(chatId).emit('stop typing', { 
                chatId,
                isTyping: false 
            });
        }
    });

    // Real-time New Message
    socket.on('new message', (newMessage) => {
        const chat = newMessage.chat;

        if (!chat || !chat.users) {
            console.log("Chat users not defined");
            return;
        }

        // Message ko chat room mein bhejo (except sender)
        chat.users.forEach((user) => {
            if (user._id === newMessage.sender._id) return;
            
            socket.to(user._id).emit('message received', newMessage);
        });

        // Alternative: Chat room mein bhi bhej sakte ho (agar group chat ho)
        socket.to(newMessage.chat._id).emit('newMessage', newMessage);
    });

    socket.on('disconnect', () => {
        console.log(`User Disconnected: ${socket.id}`);
        if (socket.userId) {
          io.emit('userOffline', socket.userId);
        }
    });
});
// =============================================================

const dbURL = process.env.MONGO_URL;

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect(dbURL);
    console.log("Connected to MongoDB");
}

server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});

export { io };