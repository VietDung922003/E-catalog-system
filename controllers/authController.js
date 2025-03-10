const crypto = require('crypto');
const {promisify} = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/apiFeatures');

const signToken = (id) => {
 return jwt.sign({id}, promisify.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN,
 });
};

const createSendToken = (user, statusCode, res) => {
 const token = signToken(user._id);
 const cookieOptions = {
  expires: new Date(
   Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 100 
  ),
  httpOnly: true,
 };
 if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;
 res.cookie('jwt', token, cookieOptions);

 //remove password from output
 user.password = undefined;

 res.status(statusCode).json({
  status: 'success',
  token,
  data: {
   user,
  },
 });
};

exports.signup = catchAsync(async (req, res, next) => {
 const newUser = await User.create(req.body);
 const url = `${req.protocol}://${req.get('host')}/me`;
 console.log(url);
 createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
 const {email, password} = req.body;

 //check if email and password exists
 if (!email || !password) {
  return next(new AppError('Please provide email and password', 400));
 }
 //2 check user exists and pass correct
 const user = await User.findOne({ email }).select('+password');
 if (!user || !(await user.correctPassword(password, user.password))) {
   return next(new AppError('Incorrect email or password', 401));
 }
 //3 if every ok send token to client
 createSendToken(user, 200, res);

});

exports.logout = (req, res) => {
 res.cookie('jwt', 'loggedout', {
   expires: new Date(Date.now() + 10 * 1000),
   httpOnly: true,
 });
 res.status(200).json({
   status: 'success',
 });
};

exports.protect = catchAsync(async (req, res, next) => {
 // 1, getting token and check of it's there
 let token;
 if (
   req.headers.authorization &&
   req.headers.authorization.startsWith('Bearer')
 ) {
   token = req.headers.authorization.split(' ')[1];
 } else if (req.cookies.jwt) {
   token = req.cookies.jwt;
 }
 if (!token) {
   return next(
     new AppError('You are not logged in! Please log in to get access.', 401)
   );
 }
 // 2, verification token
 const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
 console.log(decoded);
 // 3, check if user still exists
 const currentUser = await User.findById(decoded.id);
 if (!currentUser) {
   return next(
     new AppError('The user belonging to this token no longer exist', 401)
   );
 }
 // 4, check if user changed password after the token was issued
 if (currentUser.channgedPasswordAfter(decoded.iat)) {
   return next(
     new AppError('user recenty changed password! Please log in again', 401)
   );
 }
 // Grant access to protected route
 req.user = currentUser;
 res.locals.user = currentUser;

 next();
});

// only for render page no errors
exports.isLoggedIn = async (req, res, next) => {
 if (req.cookies.jwt) {
   try {
     // 1, verification token
     const decoded = await promisify(jwt.verify)(
       req.cookies.jwt,
       process.env.JWT_SECRET
     );
     // 2, check if user still exists
     const currentUser = await User.findById(decoded.id);
     if (!currentUser) {
       return next();
     }
     // 3, check if user changed password after the token was issued
     if (currentUser.channgedPasswordAfter(decoded.iat)) {
       next();
     }
     // THere is a logged in user
     res.locals.user = currentUser;
     return next();
   } catch (err) {
     return next();
   }
 }
 next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'seller']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
 // 1, Get user based on Posted email
 const user = await User.findOne({ email: req.body.email });
 if (!user) {
   return next(new AppError('There is no user with this email address', 404));
 }
 // 2, Generate the random reset
 const resetToken = user.createPasswordResetToken();
 await user.save({ validateBeforeSave: false });
 // 3, Send it to user's email

 try {
   // await sendEmail({
   //   email: user.email,
   //   subject: 'Your password reset token in 10 min',
   //   message,
   // });
   const resetURL = `${req.protocol}://${req.get(
     'host'
   )}/api/v1/users/resetPassword/${resetToken}`;
   await new Email(user, resetURL).sendPasswordReset();

   res.status(200).json({
     status: 'sucess',
     message: 'token send to email',
   });
 } catch (err) {
   user.passwordResetToken = undefined;
   user.passwordResetExpires = undefined;
   await user.save({ validateBeforeSave: false });

   return next(new AppError('there was error send the email'), 500);
 }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
 // 1, get user based on th token
 const hashedToken = crypto
   .createHash('sha256')
   .update(req.params.token)
   .digest('hex');

 const user = await User.findOne({
   passwordResetToken: hashedToken,
   passwordResetExpires: { $gt: Date.now() },
 });
 // 2, if token has not expired and there is user set the new password
 if (!user) return next(new AppError('token is invalid or has expired', 400));

 user.password = req.body.password;
 user.passwordConfirm = req.body.passwordConfirm;
 user.passwordResetToken = undefined;
 user.passwordResetExpires = undefined;

 await user.save();

 // 3, Update changePasswordAt property for the user
 // 4,Log the user in , send JWT
 createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
 // 1, get user from collection
 const user = await User.findById(req.user.id).select('+password');
 // 2, check if posted current password is corrert
 if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
   return next(new AppError('your current password is wrong', 401));

 //3 if so, update password

 user.password = req.body.password;
 user.passwordConfirm = req.body.passwordConfirm;

 await user.save();
 //User.findbyIdandUpdate doesn't work
 //4 log user in, send JWT
 createSendToken(user, 200, res);
});