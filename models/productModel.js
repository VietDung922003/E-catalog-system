const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
 {
  name: {
    type: String,
    required: [true, 'a product must have name'],
    unique: true,
    trim: true,
  },
  slug: String,
  rating: {
   type: Number,
   default: 4.5,
  },
  ratingsAverage: {
   type: Number,
   default: 0,
   min: [0, 'Rating must be above 0'],
   max: [5, 'Rating must be below 5.0'],
   set: (val) => Math.round(val * 10) / 10,
  },
  ratingsQuantity: {
    type: Number,
    default: 0,
  },
  description: {
   type: String,
   trim: true,
   required: [true, 'A product must have description']
  },
  price: {
   type: Number,
   required: [true, 'a product must have price'],
  },
  numberPurchases: {
    type: Number,
    default: 0,
  },
  priceDiscount: {
    type: Number,
    validate: {
      validator: function (val) {
         // this only points to current doc on new doc creation
         return val < this.price;
      },
      message: 'Discount price ({VALUE}) should be below regular price',
    }
  },
  imageCover: {
    type: String,
    required: [true, 'A product must have a cover img'],
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  stocks: {
    type: Number,
    required: [true, 'A product must have a stock'],
    min: [0, 'stock must be above 0'],
    validate: {
      validator: Number.isInteger,
      message: 'Stock must be an integer value',
    }
  },

  brand: {
    type: mongoose.Schema.ObjectId,
    ref: 'Brand',
    required: [true, 'Product must belong to a brand'],
  },

  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: [true, 'Product must belong to one category']
  },
 },
 {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  }
);

productSchema.index({ price: 1, ratingsAverage: -1});
productSchema.index({ slug: 1 });

productSchema.virtual('revenue').get(function () {
  return this.price * this.numberPurchases;
})

//virtual populate
productSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id',
});

productSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});


productSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'brand',
    select: '-__v -phoneNum -email -photo'
  }).populate({
    path: 'category',
    select: '-__v -createdAt'
  });
});


const Product = mongoose.model('Product', productSchema);

module.exports = Product;