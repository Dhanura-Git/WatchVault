const session = require('express-session')
const User = require('../model/userModel')

const isLogin = async (req, res, next) => {
    try {
        if (req.session.user) {
            next()
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error);
    }
}

const isLogout = async (req, res, next) => {
    try {
        if (req.session.user) {
            res.redirect('/login')
        } else {
            next()
        }
    } catch (error) {
        console.log(error);
    }
}

const isBlocked = async (req, res, next) => {
    try {
        const user = await User.findById(req.session.user);
        
        if (user.is_active) {
            next();
        } else if(user && user.is_active == false) {
            res.render('login', {message: 'Your account is currently blocked'});
        }
    } catch (error) { 
        console.log(error);
    }
}




module.exports = {
    isLogin,
    isLogout,
    isBlocked
}