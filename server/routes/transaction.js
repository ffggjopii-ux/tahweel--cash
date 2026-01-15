const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// تحويل أموال
router.post('/transfer', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { receiverCode, amount } = req.body;
    const senderId = req.user.userId;
    
    // التحقق من المدخلات
    if (!receiverCode || !amount || amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'بيانات غير صالحة' });
    }
    
    // البحث عن المرسل
    const sender = await User.findById(senderId).session(session);
    if (!sender || !sender.isActive) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'الحساب غير نشط' });
    }
    
    // التحقق من الرصيد
    if (sender.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'رصيد غير كاف' });
    }
    
    // البحث عن المستقبل
    const receiver = await User.findOne({ 
      receiveCode: receiverCode,
      isActive: true 
    }).session(session);
    
    if (!receiver) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'المستقبل غير موجود أو الحساب غير نشط' });
    }
    
    // تجنب التحويل للنفس
    if (sender._id.equals(receiver._id)) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'لا يمكن التحويل لنفس الحساب' });
    }
    
    // إجراء التحويل
    sender.balance -= amount;
    receiver.balance += amount;
    
    await sender.save({ session });
    await receiver.save({ session });
    
    // تسجيل العملية
    const transaction = new Transaction({
      sender: sender._id,
      receiver: receiver._id,
      amount,
      status: 'تم'
    });
    
    await transaction.save({ session });
    
    await session.commitTransaction();
    
    res.json({
      message: 'تم التحويل بنجاح',
      transactionId: transaction.transactionId,
      newBalance: sender.balance
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ error: 'فشل في التحويل' });
  } finally {
    session.endSession();
  }
});

// سجل التحويلات
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const transactions = await Transaction.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
    .populate('sender', 'firstName lastName phone')
    .populate('receiver', 'firstName lastName phone')
    .sort({ timestamp: -1 })
    .limit(50);
    
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'فشل في جلب السجل' });
  }
});

module.exports = router;