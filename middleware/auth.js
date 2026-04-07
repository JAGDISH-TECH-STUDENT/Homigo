module.exports = {
  ensureAuth: (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: "Please login first" });
  },
  
  ensureHost: (req, res, next) => {
    if (req.isAuthenticated() && (req.user.role === 'host' || req.user.role === 'admin')) return next();
    res.status(403).json({ error: "Host access required" });
  },
  
  ensureAdmin: (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'admin') return next();
    res.status(403).json({ error: "Admin access required" });
  }
};