const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const User = require('../models/User');

// تسجيل مستخدم جديد
router.post('/register', async (req, res) => {
  try {
    const { firstName, fatherName, lastName, age, phone, password } = req.body;
    
    // التحقق من العمر
    if (age < 18) {
      return res.status(400).json({ error: 'يجب أن يكون العمر 18 سنة أو أكثر' });
    }
    
    // إنشاء المستخدم
    const user = new User({
      firstName,
      fatherName,
      lastName,
      age,
      phone,
      password
    });
    
    // توليد QR Code
    const qrCodeData = {
      receiveCode: user.receiveCode,
      name: `${firstName} ${lastName}`,
      phone: user.phone
    };
    
    user.qrCode = await QRCode.toDataURL(JSON.stringify(qrCodeData));
    
    await user.save();
    
    // توليد JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        phone: user.phone,
        isAdmin: user.isAdmin 
      },
      process.env.JWT_SECRET || 'تحويل-كاش-سري',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'تم إنشاء الحساب بنجاح',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        receiveCode: user.receiveCode,
        qrCode: user.qrCode,
        balance: user.balance
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// تسجيل الدخول
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    const user = await User.findOne({ phone });
    
    if (!user) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }
    
    // توليد JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        phone: user.phone,
        isAdmin: user.isAdmin 
      },
      process.env.JWT_SECRET || 'تحويل-كاش-سري',
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        receiveCode: user.receiveCode,
        qrCode: user.qrCode,
        balance: user.balance,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;