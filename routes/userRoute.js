const express = require('express')
const userRoute = express()

const path = require('path')

const userAuth = require('../middleware/userAuth')

const userController = require('../controller/userController')
const cartController = require('../controller/cartController')

userRoute.use(express.static('public'))
userRoute.use(express.static(path.join(__dirname, '..', 'public', 'userAssets')))

userRoute.set('view engine', 'ejs')
userRoute.set('views', './views/userViews')



userRoute.get('/', userController.loadHome)
userRoute.get('/userSignup', userController.userSignup)
userRoute.post('/userSignup', userController.insertUser)
userRoute.get('/login', userController.loginLoad)
userRoute.post('/login', userAuth.isLogout, userController.verifyUser)


userRoute.get('/getOtp', userAuth.isLogout, userController.getOtp)
userRoute.post('/verifyOtp', userAuth.isLogout, userController.verifyOtp)
userRoute.get('/home', userAuth.isLogin, userAuth.isBlocked, userController.loadHome)

userRoute.get('/logout', userAuth.isLogin, userAuth.isBlocked, userController.userLogout)

userRoute.get('/shop', userAuth.isLogin, userAuth.isBlocked, userController.loadShop)
userRoute.get('/productDetails', userAuth.isLogin, userAuth.isBlocked, userController.productDetails)

userRoute.get('/userprofile',userAuth.isLogin,userAuth.isBlocked,userController.loadProfile)

userRoute.get('/loadCart',userAuth.isLogin,userAuth.isBlocked,cartController.loadCart)



module.exports = userRoute