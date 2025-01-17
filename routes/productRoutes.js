const express = require('express');

const productController = require('./../controllers/productController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./reviewRoutes');
const router = express.Router({mergeParams: true});
router.use(authController.protect);

router.use('/:productId/reviews', reviewRouter);

router.get('/search', productController.searchProduct);

router.route('/').get(productController.getAllProducts).post(authController.restrictTo('seller'),productController.createProduct);

router
 .route('/:id')
 .get(productController.getProduct)
 .patch(
  authController.restrictTo('seller'),
  productController.uploadProductImages,
  productController.resizeTourImages,
  productController.updateProduct
 )
 .delete(
  authController.restrictTo('seller'),
  productController.deleteProduct
 );

module.exports = router;