const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
  type: String,
  required: [true, 'a category must have name'],
  unique: true,
  },
  description: {
   type: String,
   trim: true,
  },
  parentCategory: [
   {
     type: mongoose.Schema.ObjectId,
     ref: 'Category',
     default: null,
   }
  ],
  createdAt: {
   type: Date,
   default: Date.now(),
   select: false,
  },
 }, 
 {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
 }
);

//query middleware
categorySchema.pre(/^find/, function (next) {
  this.populate({
    path: 'parentCategory',
    select: 'name description'
  });

  next();
});

categorySchema.pre('remove', async function (next) {
  const childCategories = await this.model('Category').find({ parentCategory: this._id});

  if(childCategories.length > 0) {
    return next(new Error('Cannot delete category with child child categories'));
  }
  next();
});

categorySchema.virtual('products', {
  ref: 'Product',
  foreignField: 'category',
  localField: '_id',
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;