const mongoose = require('mongoose');
const validator = require('validator');


const brandSchema = new mongoose.Schema({
 name: {
  type: String,
  required: [true, 'Brand must have name'],
 },
 email: {
  type: String,
  required: [true, 'Please provide email brand'],
  unique: true,
  lowercase: true,
  validate: [validator.isEmail, 'Please provide a valid email'],
 },
 photo: {
  type: String,
 },
 phoneNum: {
  type: String,
  required: [true, 'Please provide phone number brand'],
 },
 description: {
  type: String,
  trim: true,
 },
 
},
{
 toJSON: { virtuals: true },
 toObject: { virtuals: true },
});

brandSchema.virtual('products', {
 ref: 'Product',
 foreignField: 'brand',
 localField: '_id'
});



const Brand = mongoose.model('Brand', brandSchema);
module.exports = Brand;