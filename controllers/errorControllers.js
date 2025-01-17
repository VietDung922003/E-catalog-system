const AppError = require('./../utils/appError');
const logger = require("./../loggers/winston.log");


const handleCastErrorDB = (err) => {
 const message = `Invalid ${err.path}: ${err.value}`;
 return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
 const value = err.keyVaule.name;
 const message = `Duplicate field value: ${value}. Please use another value`;
 logger.error(`${this.status} - ${this.message}`);

 return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
 const errors = Object.values(err.errors).map((el) => el.message);
 const message = `Invalid input data. ${errors.join('. ')}`;
 return new AppError(message, 400);
}

const handleJWTError = () => 
  new AppError('Invalid token, please log in again', 401);

const handleJWTExpiredError = () =>
  new AppError('You token has expired be login again', 401);

const sendErrorDev = (err, req, res) => {
 //Api
 if(req.originalUrl.startsWith('/api')) {

  return res.status(err.statusCode).json({
   status: err.status,
   error: err,
   message: err.message,
   stack: err.stack,
  });

 }

 // render website
 console.log('Error', err);

 return res.status(err.statusCode).render(
  'error', {
   title: 'something when wrong!',
   msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
 // trusted error: send message to client
 if(req.originalUrl.startsWith('/api')) {
  if(err.isOperational) {
    logger.error(`${err.status} - ${err.message}`);

   return res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
   });
   //Programming or other unknow error: don't leak error details
  }
  //log err
  console.error('Error', err);
  //send generic message
  return res.status(500).json({
   status: 'error',
   message: 'something went wrong',
  });
 }

 if(err.isOperational) {
  return res.status(err.statusCode).render('error', {
   title: 'something went wrong',
   msg: err.message,
  });
  //Programming or other unknow error: don't leak error details
 }
 //log err
 return res.status(err.statusCode).render(
  'error', {
   title: 'something when wrong!',
   msg: 'Please try again later',
  });
};

module.exports =  (err, req, res, next) => {
 err.statusCode = err.statusCode || 500;
 err.status = err.status || 'error';

 if(process.env.NODE_ENV === 'development') {
  sendErrorDev(err, req, res);
 } else if (process.env.NODE_ENV === 'production') {
  let error = Object.create(err);
  error.message = err.message;
  if(error.name === 'CastError') error = handleCastErrorDB(error);
  if(error.code === 11000) error = handleDuplicateFieldsDB(error);
  if(error.name === 'ValidationError') error = handleValidationErrorDB(error);
  if(error.name === 'JsonWebTokenError') error = handleJWTError();
  if(error.name === 'TokenExpiredError') error= handleJWTExpiredError();
  sendErrorProd(error, req, res);
 }
};