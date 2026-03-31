import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';

export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if(!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            password: hashedPassword
        });
        await user.save();
        const token = generateToken(user._id);
        res.status(201).json({ message: 'User created successfully', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating user' });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const token = generateToken(user._id);
        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
};

export const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ user: req.user });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user profile' });
    }
};

export const logoutUser = async (req, res) => {
    // JWT stateless: frontend should remove token from storage.
    res.status(200).json({ message: 'Logged out successfully' });
};

export const searchUsers = async (req, res) => {
    try {
        const { search } = req.query;

        if (!search || search.trim() === '') {
            return res.status(400).json({ message: 'Search query is required' });
        }

        // Search users by name or email (case-insensitive)
        const users = await User.find({
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ],
            _id: { $ne: req.user._id } // Exclude current user
        })
            .select('_id name email')
            .limit(10);

        res.status(200).json({ users });
    } catch (error) {
        console.error('Search Users Error:', error);
        res.status(500).json({ message: 'Error searching users' });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({
            _id: { $ne: req.user._id } // Exclude current user
        })
            .select('_id name email')
            .limit(50);

        res.status(200).json({ users });
    } catch (error) {
        console.error('Get All Users Error:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
};

