const User = require('../model/userModel')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const product = require('../model/productModel')
const Wishlist = require('../model/wishlistModel')
const Otp = require('../model/otpModel')
const randomString = require('randomstring')
const Cart = require('../model/cartModel')
const Category = require('../model/categoryModel')
const Offer = require('../model/offerModel')


const loadHome = async (req, res) => {
    try {
        const Iamuser = req.session.user
        const cartData = await Cart.findOne({ userId: Iamuser })
        const wishlistData = await Wishlist.findOne({ userId: Iamuser })
        const cartCount = cartData ? cartData.product.length : 0
        const wishlistCount = cartData ? wishlistData.product.length : 0
        res.render('home', { Iamuser, cartData, wishlistData, cartCount, wishlistCount })
    } catch (error) {
        console.log(error)
    }
}

const userSignup = async (req, res) => {
    try {
        res.render('signUp')
    } catch (error) {
        console.log(error);
    }
}

const insertUser = async (req, res) => {
    try {

        const existEmail = await User.findOne({ email: req.body.email })

        if (existEmail) {
            res.render('signUp', { message: 'Email is already registered. Sign in to your account' })
        }
        if (req.body.password === req.body.cPassword) {
            const userData = {
                name: req.body.name,
                email: req.body.email,
                mobile: req.body.mobile,
                password: req.body.password
            }
            req.session.data = userData
            res.redirect('/getOtp')
        }
    } catch (error) {
        console.log(error);
    }
}

const getOtp = async (req, res) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSKEY
            }
        })
        let randomOtp = Math.floor(1000 + Math.random() * 9000).toString()
        req.session.otp = randomOtp
        const { email, name } = req.session.data
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: `Hello ${name}`,
            text: 'The verification otp is ${randomOtp}'
        }
        console.log(randomOtp)
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error sending mail ' + error)
            } else {
                console.log('Email sent ' + info.response)
            }
        })
        res.render('otp')
    } catch (error) {
        console.log(error);
    }
}

const verifyOtp = async (req, res) => {
    try {
        console.log(req.session.otp, 'sessionotp');
        console.log(req.body.otp, 'bodyotp');

        if (req.session.otp === req.body.otp) {
            const { email, name, mobile, password } = req.session.data
            const hashedPw = await bcrypt.hash(password, 10)

            const user = new User({
                name: name,
                email: email,
                mobile: mobile,
                password: hashedPw
            })
            const userData = await user.save()
            if (userData) {
                req.session.user = userData._id
                res.redirect('/login')
            } else {
                res.render('signUp', { message: 'error' })
            }
        } else {
            res.render('otp', { errmessage: 'Enter a valid OTP' })
        }
    } catch (error) {
        console.log(error);
    }
}

const loginLoad = async (req, res) => {
    try {
        res.render('login')
    } catch (error) {
        console.log(error);
    }
}

const verifyUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email: email });
        if (userData) {
            const matchedPw = await bcrypt.compare(password, userData.password);
            if (matchedPw) {
                if (userData.is_active) {
                    req.session.user = userData._id;
                    res.redirect('/home');
                } else if (userData.is_active == false) {
                    return res.render('login', { message: 'Your account is currently blocked' });
                }
            } else {
                res.render('login', { message: 'Incorrect password' });
            }
        } else {
            res.render('login', { message: 'Please enter your valid email and password' });
        }
    } catch (error) {
        console.log(error)
    }
}

const forgotPassword = async (req, res) => {
    try {
        const email = req.body.email

        const userData = await User.findOne({ email: email })

        if (userData) {
            const randomstring = randomString.generate()
            await User.updateOne({ email: email }, { $set: { token: randomstring } })
            await getResetPassword(userData.name, userData.email, randomstring)
            res.render('forgotPassword', { message: 'Please check your mail to reset password' })
        } else {
            throw new Error('User not found')
        }
    } catch (error) {
        console.log(error)
    }
}

const loadForgotPassword = async (req, res) => {
    try {
        res.render('forgotPassword')
    } catch (error) {
        console.log(error);

    }
}

const getResetPassword = async (name, email, token) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.EMAIL,
                pass: 'gpat alni nmro mspi'
            }
        })
        const mailOptions = {
            from: 'gpat alni nmro mspi',
            to: email,
            subject: 'Reset your password',
            html: `<p> Hi ${name}, </p>
                   <p> Please click on the following link to reset your password: </p>
                   <a href=http://localhost:${process.env.PORT}/resetpassword?token=${token}> Reset Password </a>`
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error)
            } else {
                console.log('Mail sent', info.response)
            }
        })
    } catch (error) {
        console.log(error);

    }
}

const resetPasswordPg = async (req, res) => {
    try {
        const token = req.query.token
        res.render('resetPassword', { token })
    } catch (error) {
        console.log(error)
    }
}

const resetPassword = async (req, res) => {
    try {
        const { token, newpassword, confirmpassword } = req.body
        if (newpassword !== confirmpassword) {
            return res.status(400).send({ success: false, message: 'Passwords do not match' })
        }
        const user = await User.findOne({ token })
        if (!user) {
            return res.status(400).send({ success: false, message: 'Invalid token' })
        }
        const hashedPw = await bcrypt.hash(newpassword, 10)
        user.password = hashedPw
        user.token = undefined
        await user.save()
        res.redirect('/')
    } catch (error) {
        console.log(error);

    }
}

const googleAut = async (req, res) => {
    try {
        const googleUser = req.user

        const email = googleUser.emails[0].value
        const user = await User.findOne({ email })
        if (!user) {
            res.redirect('/userSignup')
        }
        if (user.is_active) {
            req.session.user = user
            res.redirect('/home');
        } else if (user.is_active == false) {
            return res.render('login', { message: 'Your account is currently blocked' });
        }
    } catch (error) {
        console.log(error)
    }
}

const userLogout = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/login')
    } catch (error) {
        console.log(error);
    }
}

const loadShop = async (req, res) => {
    try {
        const userId = req.session.user
        const cart = await Cart.findOne({ userId: userId })
        const cartCount = cart ? cart.product.length : 0
        const wishlist = await Wishlist.findOne({ userId: userId })
        const wishlistCount = wishlist ? wishlist.product.length : 0


        let page = 1
        if (req.query.page) {
            page = parseInt(req.query.page, 10)
        }
        const limit = 4

        const category = await Category.find()
        const { categoryId, sortByName, sortByPrice, search } = req.query

        const query = { is_Active: true }
        if (categoryId) {
            query.category = categoryId
        }
        if (search) {
            query.productName = { $regex: '.*' + search + '.*', $options: 'i' }
        }
        let sortCriteria = {};

        if (sortByPrice) {
            sortCriteria.price = sortByPrice === 'price_asc' ? 1 : -1;
        }
        if (sortByName) {
            sortCriteria.productName = sortByName === 'name_asc' ? 1 : -1;
        }

        const productCount = await product.countDocuments(query);
        const totalPages = Math.ceil(productCount / limit);

        const prodData = await product.find(query)
            .sort(sortCriteria)
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        res.render('shop', {
            prodData,
            category,
            sortByName,
            sortByPrice,
            search,
            categoryId,
            totalPages,
            currentPage: page,
            cartCount,
            wishlistCount
        })
    } catch (error) {
        console.log(error);
    }
}

const productDetails = async (req, res) => {
    try {
        const user = req.session.user
        const proId = req.query.id
        const prodData = await product.findOne({ _id: proId }).populate('offer')
        const cartData = await Cart.findOne({ userId: user })
        const wishlistData = await Wishlist.findOne({ userId: user })
        const cartCount = cartData ? cartData.product.length : 0
        const wishlistCount = wishlistData ? wishlistData.product.length : 0
        res.render('productDetails', { prodData, cartCount, wishlistCount })
    } catch (error) {
        console.log(error);
    }
}

const productToCart = async (req, res) => {
    try {
        const proId = req.query.id;
        const prodData = await product.findOne({ _id: proId });

        if (prodData) {
            res.json({
                success: true,
                stock: prodData.stock,
                product: prodData
            });
        } else {
            res.json({
                success: false,
                message: 'Product not found'
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching product details'
        });
    }
};

const getWishlist = async (req, res) => {
    try {
        const user = req.session.user
        const wishlist = await Wishlist.findOne({ userId: user }).populate('product.productId')
        const wishlistCount = wishlist ? wishlist.product.length : 0
        res.render('wishlist', { wishlist, wishlistCount })
    } catch (error) {
        console.log(error);

    }
}

const addWishlist = async (req, res) => {
    try {
        const user = req.session.user;
        const productId = req.query.id;


        let wishlist = await Wishlist.findOne({ userId: user });
        if (!wishlist) {
            wishlist = new Wishlist({ userId: user, product: [] });
        }

        const existingProductIndex = wishlist.product.findIndex(item => item.productId.toString() === productId);
        if (existingProductIndex !== -1) {
            wishlist.product[existingProductIndex].quantity += 1;
        } else {
            wishlist.product.push({ productId, quantity: 1 });
        }
        await wishlist.save();
        res.redirect('/wishlist')

    } catch (error) {
        console.log(error);
    }
}


const deleteWishlist = async (req, res) => {
    try {
        const user = req.session.user
        const { productId } = req.body
        const wishlist = await Wishlist.findOne({ userId: user })
        if (!wishlist) {
            console.log('No wishlist is found');
            return res.status(400).send('Wishlist is not found')
        }
        const productIndex = wishlist.product.findIndex((item) => item.productId.toString() === productId)
        if (productIndex !== -1) {
            wishlist.product.splice(productIndex, 1)
            await wishlist.save()
            return res.status(200).send('Success')
        } else {
            return res.status(400).send('Product is not found in the wishlist')
        }
    } catch (error) {
        console.log(error);
    }
}





module.exports = {
    loadHome,
    userSignup,
    insertUser,
    loginLoad,
    getOtp,
    verifyOtp,
    verifyUser,
    forgotPassword,
    loadForgotPassword,
    getResetPassword,
    resetPasswordPg,
    resetPassword,
    googleAut,
    userLogout,
    loadShop,
    productDetails,
    productToCart,
    getWishlist,
    addWishlist,
    deleteWishlist
}