const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const APIFeatures = require('../utils/APIFeatures');

exports.deleteOne = model => {
  return catchAsync(async (req, res, next) => {
    const document = await model.findByIdAndDelete(req.params.id);

    if (!document) {
      return next(new AppError(404, 'no document found with that ID'));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  });
};

exports.updateOne = model => {
  return catchAsync(async (req, res, next) => {
    const document = await model.findByIdAndUpdate(req.params.id, req.body, {
      // to return the new object to the client
      new: true,
      // to check that the updated value matched the specified in the schema
      runValidators: true
    });

    if (!document) {
      return next(new AppError(404, 'no document found with that ID'));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: document
      }
    });
  });
};

exports.createOne = model => {
  return catchAsync(async (req, res) => {
    const document = await model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: document
      }
    });
  });
};

exports.getOne = (model, populateOptions) => {
  return catchAsync(async (req, res, next) => {
    let document = model.findById(req.params.id);
    if (populateOptions) {
      document.populate(populateOptions);
    }
    document = await document;

    if (!document) {
      return next(new AppError(404, 'no document found with that ID'));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: document
      }
    });
  });
};

exports.getAll = model => {
  return catchAsync(async (req, res) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const features = new APIFeatures(model.find(filter), req.query)
      .filter()
      .sort()
      .projection()
      .pagination();
    const document = await features.query;

    res.status(200).json({
      status: 'success',
      results: document.length,
      data: {
        data: document
      }
    });
  });
};
