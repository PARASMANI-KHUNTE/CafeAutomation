const User = require('../Model/User');

const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { sendOTP, verifyOTP, clearOTP } = require('../Utils/OtpServices');
const JWT_SECRET  = process.env.JWT_SECRET;

const register = async (req, res) => {
    const { username, email, password, role } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
        return res.status(400).json({ 
            message: 'Missing required fields',
            details: {
                username: !username ? 'Username is required' : null,
                email: !email ? 'Email is required' : null,
                password: !password ? 'Password is required' : null
            }
        });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
    
        // Hash the password
        const hashedPassword = await argon2.hash(password);
    
        // Create a new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            role: role || 'staff' // Use provided role or default to 'staff'
        });
    
        // Save the user to the database
        await newUser.save();
    
        return res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ 
            message: 'Server error',
            details: error.message 
        });
    }
};
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }else {
            // Check if the password is correct
            const isPasswordValid = await argon2.verify(user.password, password);
            if (!isPasswordValid) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }
    
            // Generate a JWT token with user ID and role
            const token = jwt.sign(
                { 
                    id: user._id,
                    role: user.role 
                }, 
                JWT_SECRET, 
                { expiresIn: '1h' }
            );
    
            return res.status(200).json({ token, role: user.role });
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, email, password, role } = req.body;
    try {
        // Prepare the update object
        const updateData = {};
        
        // Only add fields that are provided
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        
        // If password is provided, hash it before updating
        if (password) {
            updateData.password = await argon2.hash(password);
        }
        
        // Update the user
        const user = await User.findByIdAndUpdate(id, updateData, { new: true });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        return res.status(200).json({ message: 'User updated successfully' });
    }
    catch (error) {
        console.error('Update user error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}
const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 }); // Exclude password from the response
        return res.status(200).json(users);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Request OTP for password reset
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    
    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Generate and send OTP
        const otp = await sendOTP(email);
        
        return res.status(200).json({ 
            message: 'OTP sent successfully to your email',
            email
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ 
            message: 'Failed to send OTP',
            details: error.message 
        });
    }
};

// Verify OTP and reset password
const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ 
            message: 'Missing required fields',
            details: {
                email: !email ? 'Email is required' : null,
                otp: !otp ? 'OTP is required' : null,
                newPassword: !newPassword ? 'New password is required' : null
            }
        });
    }
    
    try {
        // Verify the OTP
        const isOtpValid = await verifyOTP(email, otp);
        
        if (!isOtpValid) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }
        
        // Find the user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Hash the new password
        const hashedPassword = await argon2.hash(newPassword);
        
        // Update the user's password
        user.password = hashedPassword;
        await user.save();
        
        // Clear the OTP after successful password reset
        clearOTP(email);
        
        return res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ 
            message: 'Failed to reset password',
            details: error.message 
        });
    }
};

// Verify OTP only (for two-step verification)
const verifyOtpOnly = async (req, res) => {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
        return res.status(400).json({ 
            message: 'Email and OTP are required'
        });
    }
    
    try {
        // Verify the OTP
        const isOtpValid = await verifyOTP(email, otp);
        
        if (!isOtpValid) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }
        
        return res.status(200).json({ 
            message: 'OTP verified successfully',
            verified: true
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        return res.status(500).json({ 
            message: 'Failed to verify OTP',
            details: error.message 
        });
    }
};

module.exports = { 
    register, 
    login, 
    updateUser, 
    deleteUser, 
    getAllUsers,
    forgotPassword,
    resetPassword,
    verifyOtpOnly
};
