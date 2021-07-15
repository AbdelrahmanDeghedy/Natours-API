const express = require('express');
const morgan = require('morgan');

const helmet = require('helmet');

const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const rateLimit = require('express-rate-limit');

const hpp = require('hpp');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const AppError = require('./utils/appError');
const globalError = require('./controllers/errorController');

const app = express();
app.set('view engine', 'pug');
app.set('views', './views');

// 1) GLOBAL MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 1. Set security HTTP headers
app.use(helmet());

// 2. Body parser (reading data from body into req.body)
app.use(express.json({ limit: '10kb' }));

// 3. Serving static files
app.use(express.static(`${__dirname}/public`));

// Protect against against NoSQL query injection
app.use(mongoSanitize());

// Protect against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duaration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// Rate limiter
const limit = rateLimit({
  max: 100,
  windowMs: 1000 * 60 * 60,
  message: 'Too many requests from this IP, please try again in one hour!'
});
app.use('/api', limit);

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(404, `Can't find ${req.originalUrl}`));
});

app.use(globalError);

module.exports = app;
