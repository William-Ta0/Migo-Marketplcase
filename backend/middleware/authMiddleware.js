const admin = require('../config/firebaseAdmin');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
      }

      // Verify token
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Add the user's UID to the request object
      req.user = { uid: decodedToken.uid };

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
};

module.exports = { protect }; 