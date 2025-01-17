const Category = require('./../models/categoryModel');
const Product = require('./../models/productModel');
const factory = require('./handlerFactory');
const catchAsync = require('./../utils/catchAsync');



exports.getCheapestProductsByCategory = catchAsync(async (req, res, next) => {
 const { categoryId } = req.params;

 const category = await Category.findById(categoryId);
 if(!category) {
  return res.status(404).json({ message: 'Category not found' });
 }

 const result = await Product.aggregate([
  {
   $match: { category: mongoose.Types.ObjectId(categoryId) },
  },
  {
   $group: {
     _id: '$category',
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
   category: category.name,
   result,
  },
 });
});


exports.getAllCategories = factory.getAll(Category);
exports.getCategory = factory.getOne(Category);
exports.createCategory = factory.createOne(Category);
exports.updateCategory = factory.updateOne(Category);
exports.deleteCategory = factory.deleteOne(Category);
exports.searchCategory = factory.Search(Category, ['name']);

