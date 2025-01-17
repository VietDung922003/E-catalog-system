const User = require('./../models/userModel');
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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
 if(!req.file) return next();

 req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

 await sharp(req.file.buffer).resize(500,500).toFormat('jpeg').jpeg({quality: 90}).toFile(`public/img/users/${req.file.filename}`);
 next();
});

const filterObj = (obj, ...allowedFields) => {
 const newObj = {};
 Object.keys(obj).forEach((el) => {
  if(allowedFields.includes(el)) newObj[el] = obj[el];
 });
 return newObj;
};

exports.getMe = (req, res, next) => {
 req.params.id = req.user.id;
 next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
 //1 Create error if user Posts password data
 if(req.body.password || req.body.passwordConfirm) {
  return next(
   new AppError(
    'this route is not for password updates. Please use another',
    400
   )
  );
 }
 //2, filter out unwanted 
 const filteredBody = filterObj(req.body, 'name', 'email');
 if(req.file) filteredBody.photo = req.file.filename;
 //3 update user doc
 const updatedUser = await User.findByIdAndUpdate(req.user.id, filterObj, {
  new: true,
  runValidators: true,
 });

 res.status(200).json({
  status: 'success',
  data: {
   user: updatedUser,
  },
 });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
 await User.findByIdAndUpdate(req.user.id, {active: false});

 res.status(204).json({
  status: 'success',
  data: null,
 });
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

//delete after
exports.createUser = factory.createOne(User);

//do not update password with this
exports.updatedUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);