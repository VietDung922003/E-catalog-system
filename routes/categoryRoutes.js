const express = require('express');

const categoryController = require('./../controllers/categoryControllers');
const productRouter = require('./productRoutes');
const authController = require('./../controllers/authController');


const router = express.Router();

router.use(authController.protect);


router.get('/search', categoryController.searchCategory);


router.use('/:categoryId/products', productRouter);

router.route('/:categoryId/cheapest-products').get(categoryController.getCheapestProductsByCategory);


router.route('/').get(categoryController.getAllCategories).post(authController.restrictTo('seller'),categoryController.createCategory);

router.route('/:id').get(categoryController.getCategory).patch(authController.restrictTo('seller'),categoryController.updateCategory).delete(authController.restrictTo('seller'),categoryController.deleteCategory);