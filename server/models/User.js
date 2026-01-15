const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  fatherName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 18
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        // التحقق من رقم سوري: +9639XXXXXXXX أو 09XXXXXXXX
        return /^(?:\+9639\d{8}|09\d{8})$/.test(v);
      },
      message: props => `${props.value} ليس رقم هاتف سوري صالح!`
    }
  },
  password: {
    type: String,
    required: true
  },
  receiveCode: {
    type: String,
    unique: true,
    default: function() {
      // توليد رمز استقبال فريد
      return 'RC' + Date.now() + Math.random().toString(36).substr(2, 9);
    }
  },
  qrCode: {
    type: String // سيتم توليده كـ base64
  },
  balance: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// تشفير كلمة المرور قبل الحفظ
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// مقارنة كلمات المرور
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);