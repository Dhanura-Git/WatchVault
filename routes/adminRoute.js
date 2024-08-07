const express = require('express')
const adminRoute = express()

const path = require('path')
const multer = require('multer')
const MulterImg = require('../config/multer')

const adminAuth = require('../middleware/adminAuth')

const adminController = require('../controller/adminController')
const categoryController = require('../controller/categoryController')
const productController = require('../controller/productController')

adminRoute.use(express.static('public'))
adminRoute.use(express.static(path.join(__dirname, '..', 'public', 'adminAssets')))

adminRoute.set('view engine', 'ejs')
adminRoute.set('views', './views/adminViews')

adminRoute.get('/', adminController.adminLogin)

adminRoute.post('/adminLogin', adminController.adminVerify)
adminRoute.get('/adminDashboard', adminAuth.isLogin, adminController.adminDashboard)

adminRoute.get('/logout', adminAuth.isLogin, adminController.adminLogout)

adminRoute.get('/category', adminAuth.isLogin, categoryController.loadCategory)
adminRoute.post('/category', adminAuth.isLogin, categoryController.addCategory)
adminRoute.get('/loadEditCategory', adminAuth.isLogin, categoryController.loadEditCategory)
adminRoute.post('/editCategory', adminAuth.isLogin, categoryController.editCategory)
adminRoute.get('/unlistCategory', adminAuth.isLogin, categoryController.categoryUnlist)
adminRoute.get('/listCategory', adminAuth.isLogin, categoryController.categoryList)

adminRoute.get('/products', adminAuth.isLogin, productController.loadProducts)
adminRoute.get('/addProduct', adminAuth.isLogin, productController.loadAddProduct)
adminRoute.post('/addProduct', adminAuth.isLogin, MulterImg.upload.array('images', 5), productController.addProduct)
adminRoute.get('/loadEditProduct', adminAuth.isLogin, productController.loadEditProduct)
adminRoute.post('/editProduct', adminAuth.isLogin, MulterImg.upload.array('images', 5), productController.editProduct)
adminRoute.get('/unlistProduct', adminAuth.isLogin, productController.unlistProduct)
adminRoute.get('/listProduct', adminAuth.isLogin, productController.listProduct)

adminRoute.get('/userManagement', adminAuth.isLogin, adminController.loadUsers)
adminRoute.get('/blockUser', adminAuth.isLogin, adminController.blockUser)
adminRoute.get('/unblockUser', adminAuth.isLogin, adminController.unblockUser)













module.exports = adminRoute