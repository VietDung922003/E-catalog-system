const Brand = require('./../models/brandModel');
const Product = require('./../models/productModel');
const factory = require('./handlerFactory');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const multer = require('multer');
const sharp = require('sharp');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
 if(file.mimetype.startsWith('image')) {
  cb(null, true);
 } else {
  cb(new AppError('not an image! only update img', 400), false);
 }
};

const upload = multer({
 storage: multerStorage,
 fileFilter: multerFilter,
});

exports.uploadBrandImages = upload.single('photo');

exports.resizeBrandPhoto = catchAsync(async (req, res, next) => {
 if(!req.file) return next();

 req.file.filename = `brand-${req.brand.id}-${Date.now()}.jpeg`;

 await sharp(req.file.buffer).resize(700, 700).toFormat('jpeg').jpeg({ quality: 90 }).toFile(`public/img/brands/${req.file.filename}`);

 next();
});

exports.getCheapestProductsByBrand = catchAsync(async (req, res, next) => {
 const { brandId } = req.params;

 const brand = await Brand.findById(brandId);
 if(!brand) {
  return res.status(404).json({ message: 'Brand not found' });
 }

 const result = await Product.aggregate([
  {
   $match: { brand: mongoose.Types.ObjectId(brandId) },
  },
  {
   $group: {
     _id: '$brand',
     numProducts: { $sum: 1 },
     avgPrice: { $avg: '$price' },
     minPrice: { $min: '$price' },
     maxPrice: { $max: '$price' },
     products: { $push: { name: '$name', price: '$price' }},
   },
  },
  {
   $sort: { minPrice: 1}
  },
  {
   $limit: 7
  },
 ]);

 res.status(200).json({
  status: 'success',
  data: {
   brand: brand.name,
   result,
  },
 });
});

exports.getAllBrands = factory.getAll(Brand);
exports.getBrand = factory.getOne(Brand);
exports.createBrand = factory.createOne(Brand);
exports.updateBrand = factory.updateOne(Brand);
exports.deleteBrand = factory.deleteOne(Brand);
exports.searchBrand = factory.Search(Brand, ['name']);