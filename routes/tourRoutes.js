const express = require('express');
const tourController = require('./../controllers/tourController');
const authedController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

router.use('/:tourId/reviews', reviewRouter);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authedController.protect,
    authedController.restrictTo('guide', 'lead-guide', 'admin'),
    tourController.getMonthlyPlan
  );

router
  .route('/top-5')
  .get(tourController.aliasingMiddleware, tourController.getAllTours);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authedController.protect,
    authedController.restrictTo('lead-guide', 'admin'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authedController.protect,
    authedController.restrictTo('lead-guide', 'admin'),
    tourController.updateTour
  )
  .delete(
    authedController.protect,
    authedController.restrictTo('admin', 'tour-guide'),
    tourController.deleteTour
  );

module.exports = router;
