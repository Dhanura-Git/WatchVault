const session = require('express-session')
const User = require('../model/userModel')

const isLogin = async (req, res, next) => {
    try {
        if (req.session.admin) {
            next()
        } else {
            res.redirect('/')
            return
        }
    } catch (error) {
        console.log(error);
    }
}

const isLogout = async (req, res, next) => {
    try {
        if (req.session.admin) {
            res.redirect('/')
        } else {
            next()
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    isLogin,
    isLogout
}