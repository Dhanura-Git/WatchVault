const express = require('express')
const userRoute = express()

const path = require('path')

const userAuth = require('../middleware/userAuth')

const userController = require('../controller/userController')
const cartController = require('../controller/cartController')
const userprofileController = require('../controller/userprofileController')
const orderController = require('../controller/orderController')

const passport = require('passport')
require('../passport')

userRoute.use(express.static('public'))
userRoute.use(express.static(path.join(__dirname, '..', 'public', 'userAssets')))

userRoute.set('view engine', 'ejs')
userRoute.set('views', './views/userViews')

userRoute.use(passport.initialize())
userRoute.use(passport.session())

userRoute.get('/', userController.loadHome)
userRoute.get('/login/google', passport.authenticate('google', { scope: ['email', 'profile'] }))
userRoute.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), userController.googleAut)
userRoute.get('/userSignup', userController.userSignup)
userRoute.post('/userSignup', userController.insertUser)
userRoute.get('/login', userAuth.isLogout, userController.loginLoad)
userRoute.post('/login', userAuth.isLogout, userController.verifyUser)
userRoute.get('/forgotPassword', userAuth.isLogout, userController.loadForgotPassword)
userRoute.post('/forgotPassword', userAuth.isLogout, userController.forgotPassword)
userRoute.get('/resetPassword', userController.resetPasswordPg)
userRoute.post('/resetPassword', userController.resetPassword)


userRoute.get('/getOtp', userAuth.isLogout, userController.getOtp)
userRoute.post('/verifyOtp', userAuth.isLogout, userController.verifyOtp)

userRoute.get('/home', userAuth.isLogin, userAuth.isBlocked, userController.loadHome)

userRoute.get('/logout', userAuth.isLogin, userAuth.isBlocked, userController.userLogout)

userRoute.get('/shop', userAuth.isLogin, userAuth.isBlocked, userController.loadShop)
userRoute.get('/productDetails', userAuth.isLogin, userAuth.isBlocked, userController.productDetails)
userRoute.get('/productToCart', userAuth.isLogin, userAuth.isBlocked, userController.productToCart)
userRoute.get('/wishlist', userAuth.isLogin, userAuth.isBlocked, userController.getWishlist)
userRoute.get('/addWishlist', userAuth.isLogin, userAuth.isBlocked, userController.addWishlist)
userRoute.delete('/deleteWishlist', userAuth.isLogin, userAuth.isBlocked, userController.deleteWishlist)

userRoute.get('/profile', userAuth.isLogin, userAuth.isBlocked, userprofileController.loadProfile)
userRoute.get('/orderDetails', userAuth.isLogin, userAuth.isBlocked, userprofileController.orderDetails)
userRoute.post('/cancelOrder/:id', userAuth.isLogin, userAuth.isBlocked, userprofileController.cancelOrder)
userRoute.post('/returnOrder', userAuth.isLogin, userAuth.isBlocked, userprofileController.returnOrder)

userRoute.get('/addAddress', userAuth.isLogin, userAuth.isBlocked, userprofileController.loadAddAddress)
userRoute.post('/addAddress', userAuth.isLogin, userAuth.isBlocked, userprofileController.addAddress)
userRoute.get('/editAddress', userAuth.isLogin, userAuth.isBlocked, userprofileController.editAddress)
userRoute.post('/editAddress', userAuth.isLogin, userAuth.isBlocked, userprofileController.updateAddress)
userRoute.get('/deleteAddress', userAuth.isLogin, userAuth.isBlocked, userprofileController.deleteAddress)

userRoute.get('/changePassword', userAuth.isLogin, userAuth.isBlocked, userprofileController.loadChangePassword)
userRoute.post('/changePassword', userAuth.isLogin, userAuth.isBlocked, userprofileController.changePassword)

userRoute.get('/loadCart', userAuth.isLogin, userAuth.isBlocked, cartController.loadCart)
userRoute.get('/addToCart', userAuth.isLogin, userAuth.isBlocked, cartController.addToCart)
userRoute.post('/updateCart', userAuth.isLogin, userAuth.isBlocked, cartController.updateCart)
userRoute.delete('/cartDelete', userAuth.isLogin, userAuth.isBlocked, cartController.cartDelete)

userRoute.get('/checkout', cartController.loadCheckout)
userRoute.post('/placeOrder', userAuth.isLogin, userAuth.isBlocked, orderController.placeOrder)

userRoute.get('/orderSuccess/:orderId', userAuth.isLogin, userAuth.isBlocked, orderController.orderSuccess)
userRoute.post('/verifyRazorpay', userAuth.isLogin, userAuth.isBlocked, orderController.verifyRazorpay)

userRoute.post('/addToWallet', userAuth.isLogin, userAuth.isBlocked, userprofileController.addToWallet)
userRoute.post('/verifyPaymentWallet', userAuth.isLogin, userAuth.isBlocked, userprofileController.verifyPaymentWallet)

userRoute.post('/applyCoupon', userAuth.isLogin, userAuth.isBlocked, orderController.applyCoupon)
userRoute.post('/removeCoupon', userAuth.isLogin, userAuth.isBlocked, orderController.removeCoupon)

userRoute.get('/invoicePdf/:orderId', userAuth.isLogin, userAuth.isBlocked, userprofileController.invoicePdf)



module.exports = userRoute