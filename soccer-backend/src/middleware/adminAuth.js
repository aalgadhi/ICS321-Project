const adminAuth = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.sendStatus(403); // Forbidden
  }
};

module.exports = adminAuth;
