import User from '../models/User.js';
import { verifyGoogleToken } from '../config/google.js';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import express from "express";
import session from "express-session";
const Regisrouter = express.Router();


const JWT_SECRET ='emeka';

Regisrouter.use(session({
secret:'autopost',
resave:false,
saveUninitialized:false,
cookie: {
    secure:false, //set to true if using HTTPS
    maxAge: 24*60*60*1000 //24 hours
}
}));
// Middleware to check if user is authenticated
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Middleware to verify JWT token
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};
// Google Authentication
export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Google token is required' });
    }

    const googleData = await verifyGoogleToken(token);
    
    if (googleData.error) {
      return res.status(401).json({ error: googleData.error });
    }

    const { email, name, picture } = googleData.payload;

    // Check if user exists
    let user = await User.findByEmail(email);

    if (!user) {
      // Create new user
      user = await User.create({
        name,
        email,
        avatar: picture,
        provider: 'google',
        verified: true
      });
    }

    // Store user in session
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      provider: user.provider
    };

    res.status(200).json({
      status: 'success',
      user: req.session.user
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Email Signup
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Create new user 
    
    const user = await User.create({
      name,
      email,
      password,
      provider: 'email'
    });

    // Store user in session
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      provider: user.provider
    };

    
                    // Generate JWT token
                    const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      status: 'success',
      token,
      user :  {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      provider: user.provider
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Email Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await User.comparePassword(email, password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Store user in session
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      provider: user.provider
    };
  console.log(req.user);
            // Generate JWT token
            const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: '14d' });

    res.status(200).json({
      status: 'success',
      token,
        user :  {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      provider: user.provider
      }
    });


  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Get current user
export const getMe = async (req, res) => {
  try {
    console.log(req.user);
    if (!req.session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Verify user still exists in database
    const user = await User.findById(req.user.id);
    
    if (!user) {
      req.session.destroy();
      console.log('user not found');
      return res.status(404).json({ error: 'User not found' });

    }
    res.status(200).json({
      status: 'success',
      user: req.user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};



// Start free trial
export const startTrial = async (req, res) => {
    try {
        
        const userId = req.user.id;
        const { plan } = req.body;
        
        // Check if user already has an active trial
        pool.query('SELECT * FROM trials WHERE user_id = ? AND status = "active"', [userId], (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ message: 'You already have an active trial' });
            }
            
            // Calculate trial end date (14 days from now)
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 14);
            
            // Create new trial
            pool.query('INSERT INTO trials (user_id, plan, start_date, end_date) VALUES (?, ?, ?, ?)', 
                [userId, plan, startDate, endDate], (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: 'Database error' });
                    }
                    
                    res.status(201).json({
                        message: 'Trial started successfully',
                        id: result.insertId,
                        user_id: userId,
                        plan,
                        start_date: startDate,
                        end_date: endDate,
                        status: 'active'
                    });
                });
        });
    } catch (error) {
        console.error('Trial start error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


// Get trial status
export const getTrialStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get active trial for user
        pool.query('SELECT * FROM trials WHERE user_id = ? AND status = "active"', [userId], (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ message: 'No active trial found' });
            }
            
            const trial = results[0];
            
            // Check if trial has expired
            const now = new Date();
            const endDate = new Date(trial.end_date);
            
            if (now > endDate) {
                // Update trial status to expired
                pool.query('UPDATE trials SET status = "expired" WHERE id = ?', [trial.id], (err) => {
                    if (err) {
                        console.error('Error updating trial status:', err);
                    }
                });
                
                return res.status(404).json({ message: 'Trial has expired' });
            }
            
            res.json({
                active: true,
                id: trial.id,
                plan: trial.plan,
                start_date: trial.start_date,
                end_date: trial.end_date
            });
        });
    } catch (error) {
        console.error('Trial status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


// Logout
export const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      
      res.clearCookie('autopost.sid');
      res.status(200).json({ status: 'success', message: 'Logged out successfully' });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};


export const saveContent = async (req, res) => {
  const { id, postDetailsDate, postDetailsPost, postDetailsPlatform } = req.body;
  try {
      console.log(id);
      console.log(postDetailsDate);
      console.log(postDetailsPost);
      console.log(postDetailsPlatform); 
      if(!id){
        res.status(401).json({error: 'User is not logged in'})
      }

          const post = await User.uploadPost({
            id,
            postDetailsDate,
            postDetailsPost, 
            postDetailsPlatform
          });
    
      res.status(200).json({
        status: 'success',
        data: 'Content updated successfully'
      });
  
    
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Upload failed' });
    }
};

export const getContent = async (req, res) =>{
  try {
const { id } = req.body;
    
          
      console.log(id);
      if (!req.session) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
  
      // Verify user has posts in database
      const posts = await User.getPosts(id);
      
      if (!posts) {
        console.log('User does not have any posts');
        return res.status(404).json({ error: 'User does not have any generated posts' });
      }
      const postDetails = {
        date: posts.date,
        post: posts.post,
        platform: posts.platform
      };

      res.status(200).json({
        status: 'success',
        data: postDetails
      });
    
    } catch (error) {
      console.error('Get post error:', error);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
};
