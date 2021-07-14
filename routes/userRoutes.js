const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router
  .route('/me')
  .get(authController.protect, userController.getMeId, userController.getUser);

router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);

router.route('/forgot-password').post(authController.forgotPassword);
router.route('/reset-password/:token').patch(authController.resetPassword);

router.use(authController.protect);

router.route('/update-my-password').patch(authController.updatePassword);

router.route('update-me').patch(userController.updateMe);

router.route('delete-me').delete(userController.deleteMe);

router.use(authController.restrictTo('admin'));

router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUserInfo)
  .delete(userController.deleteUser);

module.exports = router;
