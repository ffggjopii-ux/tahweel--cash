const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'تحويل-كاش-سري');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'الرجاء تسجيل الدخول' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'تحويل-كاش-سري');
    
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: 'غير مصرح بالوصول' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'الرجاء تسجيل الدخول كمسؤول' });
  }
};

module.exports = { auth, adminAuth };