const mongoose = require('mongoose');
const validator = require('validator');

const crypto = require('crypto');

const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    requried: [true, 'please enter your name']
  },
  email: {
    type: String,
    requried: [true, 'please enter your email'],
    validate: [validator.isEmail, 'Please enter a valid Email'],
    unique: true,
    lowercase: true
  },
  photo: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please enter your password'],
    minLength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function(el) {
        return el === this.password;
      },
      message: "Passwords don't match"
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  // If password wasn't modified, or the user was just created
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// query middleware
userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

// Instance method
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const passwordChangedTime = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return passwordChangedTime > JWTTimeStamp;
  }
  return false;
};

userSchema.methods.generatePasswordResetToken = function() {
  const randomToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(randomToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  console.log(randomToken, this.passwordResetToken);

  return randomToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
