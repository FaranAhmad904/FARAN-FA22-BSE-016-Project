// server/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";

export const signup = async (req, res) => {
  try {
    let { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Missing fields" });

    email = email.trim().toLowerCase();
    name = name.trim();
    password = password.trim();
    
    // Validate role
    const validRoles = ['customer', 'restaurantManager', 'admin'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    
    // Set default role if not provided
    if (!role) role = 'customer';
    
    // Only allow admin creation if user is already admin (for security)
    if (role === 'admin') {
      return res.status(403).json({ message: "Cannot create admin account through signup" });
    }

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ 
      name, 
      email, 
      password: hashed, 
      role,
      isAdmin: role === 'admin' // Keep isAdmin for backward compatibility
    });
    await user.save();

    res.status(201).json({ success: true, message: "Signup successful", role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed: " + err.message });
  }
};

export const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing fields" });

    email = email.trim().toLowerCase();
    password = password.trim();

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // Determine role (use role field if exists, otherwise fallback to isAdmin)
    const userRole = user.role || (user.isAdmin ? 'admin' : 'customer');
    
    const token = jwt.sign({ 
      id: user._id, 
      isAdmin: user.isAdmin || userRole === 'admin',
      role: userRole
    }, JWT_SECRET, { expiresIn: "1h" });
    
    res.json({ 
      success: true, 
      token, 
      isAdmin: user.isAdmin || userRole === 'admin',
      role: userRole
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed: " + err.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Determine role
    const userRole = user.role || (user.isAdmin ? 'admin' : 'customer');
    
    res.json({
      ...user.toObject(),
      role: userRole,
      isAdmin: user.isAdmin || userRole === 'admin'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching profile" });
  }
};
