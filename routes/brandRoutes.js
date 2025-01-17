const express = require('express');
const brandController = require('./../controllers/brandController');
const productRouter = require('./productRoutes');
const authController = require('./../controllers/authController');



const router = express.Router();

router.use(authController.protect);


router.get('/search', brandController.searchBrand);

router.use('/:brandId/products', productRouter);

router.route('/:brandId/cheapest-products').get(brandController.getCheapestProductsByBrand);

router.route('/').get(brandController.getAllBrands).post(authController.restrictTo('seller'),brandController.createBrand);

router.route('/:id').get(brandController.getBrand).patch(authController.restrictTo('seller'),brandController.uploadBrandImages,brandController.resizeBrandPhoto,brandController.updateBrand).delete(authController.restrictTo('seller'),brandController.deleteBrand);

module.exports = router; 