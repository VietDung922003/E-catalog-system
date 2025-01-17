const Product = require('./../models/productModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
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

exports.uploadProductImages = upload.fields([
 { name: 'imageCover', maxCount: 1},
 { name: 'images', maxCount: 3},
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
 console.log(req.files);
 if(!req.files.imageCover || !req.files.images) return next();

 req.body.imageCover = `product-${req.params.id}-${Date.now()}-cover.jpeg`;
 await sharp(req.files.imageCover[0].buffer).resize(1000, 1000).toFormat('jpeg').jpeg({quality: 90}).toFile(`public/img/products/${req.body.imageCover}`);

 //2 images
 req.body.images = [];
 await Promise.all(
  req.files.images.map(async (file, i) => {
   const filename = `product-${req.params.id}-${Date.now()}-${i+1}.jpeg`;

   await sharp(file.buffer).resize(1000, 1000).toFormat('jpeg').jpeg({quality: 90 }).toFile(`public/img/products/${filename}`);

   req.body.images.push(filename);
  })
 );
 next();
});

exports.aliasTopCheapestProducts = (req, res, next) => {
 req.query.limit = '7';
 req.query.sort = 'price';
 req.query.fields = 'name,price,description';
 next();
}

exports.getAllProducts = factory.getAll(Product);

exports.getProduct = factory.getOne(Product, {
 path: 'reviews',
});

exports.createProduct = factory.createOne(Product);

exports.updateProduct = factory.updateOne(Product);

exports.deleteProduct = factory.deleteOne(Product);

exports.searchProduct = factory.Search(Product, ['name']);