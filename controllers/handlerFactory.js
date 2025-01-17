const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');
const client = require('./../redis/client');

exports.deleteOne = (Model) => catchAsync(async (req, res, next) => {
 const doc = await Model.findByIdAndDelete(req.params.id);
 if(!doc) {
  return next(new AppError('No document found with that ID'), 404);
 }
 res.status(204).json({
  status: 'success',
  data: null,
 });
});

exports.updateOne = (Model) => catchAsync(async (req,res,next) => {
 const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
  new: true,
  runValidators: true,
 });

 if(!doc) {
  return next(new AppError('No document found with that ID'), 404);
 };

 res.status(200).json({
  status: 'success',
  data: {
   data: doc,
  },
 });
});

exports.createOne = (Model) => catchAsync(async (req, res, next)=> {
 const doc = await Model.create(req.body);

 res.status(201).json({
  status: 'success',
  data: {
   data: doc,
  },
 });
});

exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
 const cacheKey = `${Model.collection.name}:${req.params.id}`;
 const cacheDoc = await client.get(cacheKey);

 if(cacheDoc) {
  return res.status(200).json({
   status: 'success',
   data: {
     data: JSON.parse(cachedDoc),
   },
  });
 }


 let query = Model.findById(req.params.id);
 if(popOptions) query = query.populate(popOptions);
 const doc = await query;

 if(!doc) {
  return next(new AppError('No document found with that ID'), 404);
 };

 await client.setEx(cacheKey, 3600, JSON.stringify(doc));

 res.status(200).json({
  status: 'success',
  data: {
   data: doc,
  },
 });

});

exports.getAll = (Model) => 
 catchAsync(async (req, res, next) => {
  const cacheKey = `${Model.collection.name}:all:${JSON.stringify(req.query)}`;
  console.log(cacheKey);
  const cacheDocs = await client.get(cacheKey);

  if(cacheDocs) {
    console.log('use redis')
   return res.status(200).json({
    status: 'success',
    results: JSON.parse(cacheDocs).length,
    data: {
      data: JSON.parse(cacheDocs),
    },
   });
  }


  //to allow for nested get reviews on product(hack)
  let filter = {};
  if(req.params.productId) filter = {
   product: req.params.productId
  };
  if(req.params.brandId) filter = {
    brand: req.params.brandId
  };
  if(req.params.categoryId) filter = {
    category: req.params.categoryId
  };


  // execute query
  const features = new APIFeatures(Model.find(), req.query).filter().sort().limitFields().paginate();

  const doc = await features.query;
  //explain()
  await client.setEx(cacheKey, 3600, JSON.stringify(doc));
  // send res
  res.status(200).json({
   status: 'success',
   results: doc.length,
   data: {
    data: doc,
   },
  });
 });

exports.Search = (Model, searchableFields) => catchAsync(async (req, res, next) => {
 let filter = {};
 if(req.params.productId) filter = { product: req.params.productId };

 // handle search keyword
 if(req.query.keyword) {
  const keyword = req.query.keyword;
  const searchConditions = searchableFields.map((field) => ({
   [field]: { $regex: keyword, $options: 'i'},
  }));
  filter = {...filter, $or: searchConditions };
 }

 const features = new APIFeatures(Model.find(filter), req.query).sort().limitFields().paginate();

 const doc = await features.query;

 res.status(200).json({
  status: 'success',
  results: doc.length,
  data: {
   data: doc,
  },
 });
});