const path = require('path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const mongoSantitize = require('express-mongo-sanitize');
const hpp = require('hpp');


const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorControllers');
const brandRouter = require('./routes/brandRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const categoryRouter = require('./routes/categoryRoutes');
const productRouter = require('./routes/productRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

//1 Global middleware
app.use(helmet({ contentSecurityPolicy: false}));

console.log(process.env.NODE_ENV);
if(process.env.NODE_ENV === 'development') {
 app.use(morgan('dev'));
}

//limit request from same api
const limiter = rateLimit({
 max: 100,
 windowMS: 60 * 60 * 100,
 message: 'To many request from this Ip, please try again in an hour',
});

app.use('/api', limiter);

//body parse, reading data from body into req.body
app.use(express.json({limit: '10kb'}));
app.use(express.urlencoded({extended: true, limit: '10kb'}));
app.use(cookieParser());

//data sanitization against NoSQL query injection
app.use(mongoSantitize());

// data sanitization against XSS
app.use(xss());

//prevent paramater pollution
app.use(
 hpp({
  whitelist: [
   'price',
   'ratingsQuantity',
   'ratingsAverage'
  ],
 })
);

// test middleware
app.use((req, res, next) => {
 req.requestTime = new Date().toISOString();
 next();
});

app.use((req, res, next) => {
 res.setHeader(
  'Content-Security-Policy',
  "script-src  'self' connect.facebook.net maps.googleapis.com cdnjs.cloudflare.com cdn.quilljs.com *.aws",
  "script-src-elem 'self' connect.facebook.net maps.googleapis.com cdnjs.cloudflare.com cdn.quilljs.com *.aws",
  "style-src 'self' cdnjs.cloudflare.com; localhost:8000;",
  "img-src 'self'"
 );
 next();
});

//3 ROUTES
app.use('/api/v1/brands', brandRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/users', userRouter);


app.all('*', (req, res, next) => {
 next(new AppError(`Can't find ${req.originalUrl} on the server`), 404);
});

app.use(globalErrorHandler);


module.exports = app;




