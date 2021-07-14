const { promisify } = require('util');

const jwt = require('jsonwebtoken');

const crypto = require('crypto');

const AppError = require('../utils/appError');

const User = require('../models/userModel');

const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};
const cookieOptions = {
  expires: new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 60 * 24 * 1000
  ),
  httpOnly: true
};
const createSendToken = (user, res, statusCode) => {
  const token = signToken(user._id);

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  // Remove password from the output
  user.password = undefined;

  res.cookie('jwt', token, { cookieOptions });
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    name: req.body.name,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role // for testing purposes only, should be deleted for security reasons!
  });

  createSendToken(newUser, res, 202);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check that email and password exist
  if (!email || !password) {
    return next(new AppError(400, 'Please provide both email and password'));
  }

  // 2. Check that the user exosts, and check that password is correct
  const user = await User.findOne({ email }).select('password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError(401, 'Incorrect email or password'));
  }
  // 3. If everything is OK, send the token to the client

  createSendToken(user, res, 200);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1. Check that the token is there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError(401, 'You are not logged in, please log in to access!')
    );
  }

  // 2. Token verification

  const decodedPayload = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  // 3. Check if the user Still exists
  const currentUser = await User.findById(decodedPayload.id);
  if (!currentUser) {
    return next(
      new AppError(401, "The user belonging to this token doesn't exist")
    );
  }

  // 4. Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decodedPayload.iat)) {
    return next(
      new AppError(401, 'Password changed after the token was issued')
    );
  }

  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(403, "You don't have permission to perform this action")
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on the POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(AppError(404, 'There is no user with this email address'));
  }
  // 2. Generate random reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. Send the reset url to the user's email
  // This url is suitable for both production and development environments
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/reset-password/${resetToken}`;

  const message = `Forgot your password? Submit a patch request with your new password and password confirm to : ${resetUrl}.
  \nIf you didn't forgot your password, then ignore this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token is valid for 10 min',
      message
    });

    res.send(200).json({
      status: 'success',
      message: 'reset url was sent successsfully'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        500,
        `There was an error sending the email, please try again ${err}`
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on the token
  const hashedVersion = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedVersion,
    passwordResetExpires: { $gt: Date.now() }
  });
  if (!user) {
    return next(new AppError(400, 'Token is invalid, or expired'));
  }

  // 2. Setting new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 4. Log the user in, send a new JWT
  createSendToken(user, res, 200);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. get user from the collection
  const user = await User.findById(req.user.id).select('password');

  // 2. Check that the POSted currentPassword is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError(401, 'Your current password is wrong'));
  }
  //3. Update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //4. logged the user in (send JWT)
  createSendToken(user, res, 200);
});
