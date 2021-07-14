const AppError = require('../utils/appError');

// Global middleware error handling function

const handleTokenExpireError = () => {
  return new AppError(401, 'Your Token has Expired, please login again');
};

const handleJsonWebTokenError = () => {
  return new AppError(401, 'Invalid Token, please login again');
};

const handleValidationError = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(400, message);
};

const handleDuplicateError = err => {
  const value = err.keyValue.name;
  const message = `Duplicate field value: / ${value} / , please select another value!`;
  return new AppError(400, message);
};

const handleCastError = err => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(400, message);
};

const sendErrorProd = (res, err) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    console.log(err, '🎈');

    res.status(500).json({
      status: 'error',
      message: 'OOPS, something went wrong!'
    });
  }
};

const sendErrorDev = (res, err) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(res, err);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (error.name === 'CastError') {
      error = handleCastError(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateError(error);
    }
    if (error.name === 'ValidationError') {
      error = handleValidationError(error);
    }
    if (error.name === 'JsonWebTokenError') {
      error = handleJsonWebTokenError(error);
    }
    if (error.name === 'TokenExpiredError') {
      error = handleTokenExpireError(error);
    }

    sendErrorProd(res, error);
  }
};
