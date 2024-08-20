const express = require('express')
const userRoute = express()

const path = require('path')

const userAuth = require('../middleware/userAuth')

const userController = require('../controller/userController')
const cartController = require('../controller/cartController')
const userprofileController = require('../controller/userprofileController')
const orderController = require('../controller/orderController')

userRoute.use(express.static('public'))
userRoute.use(express.static(path.join(__dirname, '..', 'public', 'userAssets')))

userRoute.set('view engine', 'ejs')
userRoute.set('views', './views/userViews')

userRoute.get('/', userController.loadHome)
userRoute.get('/userSignup', userController.userSignup)
userRoute.post('/userSignup', userController.insertUser)
userRoute.get('/login', userAuth.isLogout, userController.loginLoad)
userRoute.post('/login', userAuth.isLogout, userController.verifyUser)


userRoute.get('/getOtp', userAuth.isLogout, userController.getOtp)
userRoute.post('/verifyOtp', userAuth.isLogout, userController.verifyOtp)
userRoute.get('/home', userAuth.isLogin, userAuth.isBlocked, userController.loadHome)

userRoute.get('/logout', userAuth.isLogin, userAuth.isBlocked, userController.userLogout)

userRoute.get('/shop', userAuth.isLogin, userAuth.isBlocked, userController.loadShop)
userRoute.get('/productDetails', userAuth.isLogin, userAuth.isBlocked, userController.productDetails)

userRoute.get('/profile', userAuth.isLogin, userAuth.isBlocked, userprofileController.loadProfile)

userRoute.get('/addAddress', userAuth.isLogin, userAuth.isBlocked, userprofileController.loadAddAddress)
userRoute.post('/addAddress', userAuth.isLogin, userAuth.isBlocked, userprofileController.addAddress)
userRoute.get('/editAddress', userAuth.isLogin, userAuth.isBlocked, userprofileController.editAddress)
userRoute.post('/editAddress', userAuth.isLogin, userAuth.isBlocked, userprofileController.updateAddress)
userRoute.get('/deleteAddress', userAuth.isLogin, userAuth.isBlocked, userprofileController.deleteAddress)

userRoute.get('/loadCart', userAuth.isLogin, userAuth.isBlocked, cartController.loadCart)
userRoute.get('/addToCart', userAuth.isLogin, userAuth.isBlocked, cartController.addToCart)
userRoute.post('/updateCart', userAuth.isLogin, userAuth.isBlocked, cartController.updateCart)
userRoute.delete('/cartDelete', userAuth.isLogin, userAuth.isBlocked, cartController.cartDelete)

userRoute.get('/checkout', cartController.loadCheckout)
userRoute.post('/placeOrder', userAuth.isLogin, userAuth.isBlocked, orderController.placeOrder)

userRoute.get('/orderSuccess/:orderId', userAuth.isLogin, userAuth.isBlocked, orderController.orderSuccess)



module.exports = userRoute