const jwt = require("jsonwebtoken");
const db = require("../db");

function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ success:false, message:"Please log in." });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare("SELECT id,name,email,role,area FROM users WHERE id=?").get(payload.sub);
    if (!user) return res.status(401).json({ success:false, message:"Account not found." });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success:false, message:"Session expired. Please log in again." });
  }
}
const adminOnly = (req,res,next) => req.user?.role === "admin"
  ? next() : res.status(403).json({success:false,message:"Admin access required."});
module.exports = { auth, adminOnly };
