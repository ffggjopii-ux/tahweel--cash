const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// دخول الأدمن
router.post('/admin/login', async (req, res) => {
  try {
    const { password } = req.body;
    
    // كلمة سر الأدمن الثابتة
    const ADMIN_PASSWORD = 'Iudj3486';
    
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'كلمة السر غير صحيحة' });
    }
    
    // إنشاء أو العثور على حساب الأدمن
    let adminUser = await User.findOne({ isAdmin: true });
    
    if (!adminUser) {
      adminUser = new User({
        firstName: 'مدير',
        lastName: 'النظام',
        age: 30,
        phone: '0000000000',
        password: ADMIN_PASSWORD,
        isAdmin: true
      });
      await adminUser.save();
    }
    
    // توليد JWT token
    const token = jwt.sign(
      { 
        userId: adminUser._id,
        phone: adminUser.phone,
        isAdmin: true 
      },
      process.env.JWT_SECRET || 'تحويل-كاش-سري',
      { expiresIn: '8h' }
    );
    
    res.json({
      token,
      user: {
        id: adminUser._id,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        isAdmin: true
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// قائمة المستخدمين
router.get('/admin/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find({}, '-password')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'فشل في جلب المستخدمين' });
  }
});

// تعديل رصيد مستخدم
router.put('/admin/users/:id/balance', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, operation } = req.body; // operation: 'add' أو 'subtract'
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    
    if (operation === 'add') {
      user.balance += amount;
    } else if (operation === 'subtract') {
      user.balance = Math.max(0, user.balance - amount);
    } else {
      return res.status(400).json({ error: 'عملية غير صالحة' });
    }
    
    await user.save();
    
    res.json({
      message: 'تم تعديل الرصيد بنجاح',
      newBalance: user.balance
    });
  } catch (error) {
    res.status(500).json({ error: 'فشل في تعديل الرصيد' });
  }
});

// تفعيل/إيقاف حساب
router.put('/admin/users/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-password');
    
    res.json({
      message: `تم ${isActive ? 'تفعيل' : 'إيقاف'} الحساب بنجاح`,
      user
    });
  } catch (error) {
    res.status(500).json({ error: 'فشل في تعديل حالة الحساب' });
  }
});

// جميع التحويلات
router.get('/admin/transactions', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const transactions = await Transaction.find()
      .populate('sender', 'firstName lastName phone')
      .populate('receiver', 'firstName lastName phone')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Transaction.countDocuments();
    
    res.json({
      transactions,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: 'فشل في جلب التحويلات' });
  }
});

module.exports = router;