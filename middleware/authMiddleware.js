import jwt from 'jsonwebtoken';

/**
 * Middleware to verify JWT token and protect private routes
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  // 1. Check if Authorization header exists and starts with 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Missing or invalid Authorization header format. Expected Bearer <token>.'
    });
  }

  // 2. Extract the token string
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  // 3. Verify token with secret key
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach authenticated user information to request object
    req.user = {
      id: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};
