const User = require('../model/userModel')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const product = require('../model/productModel')


const loadHome = async (req, res) => {
    try {
        const Iamuser = req.session.user
        res.render('home', { Iamuser })
    } catch (error) {
        console.log(error)
    }
}

//function to render the signUp form
const userSignup = async (req, res) => {
    try {
        res.render('signUp')
    } catch (error) {
        console.log(error);
    }
}

const insertUser = async (req, res) => {
    try {
        const { name, email, mobile, password, } = req.body

        //checking if the email already exist or not
        const existEmail = await User.findOne({ email: req.body.email })

        if (existEmail) {
            res.render('signUp', { message: 'Email is already registered. Sign in to your account' })
        }
        //checking if the password and confirm password is the same
        if (req.body.password === req.body.cPassword) {
            const userData = {
                name: name,
                email: email,
                mobile: mobile,
                password: password
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
        console.log(req.session.data, 'asdfgh');
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
        console.log(req.body, 'loginn');
        const { email, password } = req.body
        const userData = await User.findOne({ email: email })
        if (userData) {
            const matchedPw = await bcrypt.compare(password, userData.password);
            if (matchedPw) {
                if (userData.is_active) { //checking if the user is blocked
                    req.session.user = userData._id
                    res.redirect('/home')
                } else {
                    res.render('login', { message: 'Your account is currently blocked' });
                }
            } else {
                res.render('login', { message: 'Incorrect password' });
            }
        } else {
            res.render('login', { message: 'Please enter your valid email and password' });
        }
    }
    catch (error) {
        console.log(error);
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
        const prodData = await product.find({ is_Active: true })
        res.render('shop', { prodData })
    } catch (error) {
        console.log(error);
    }
}

const productDetails = async (req, res) => {
    try {
        const proId = req.query.id
        console.log(proId, 'sdfghfkjf');
        const prodData = await product.findOne({ _id: proId })
        console.log(prodData, 'sdkjf');
        res.render('productDetails', { prodData })
    } catch (error) {
        console.log(error);
    }
}

const loadProfile = async(req, res)=>{
    try {
        const userId = req.session.user
        const Iamuser = req.session.user
        const userData = await User.findOne({_id: userId})
        const cartData = await User.findOne({userId: userId})
        res.render('userprofile', {user: req.session.user,userData,Iamuser})
    } catch (error) {
        console.log(error)
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
    userLogout,
    loadShop,
    productDetails,
    loadProfile
}