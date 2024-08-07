const User = require('../model/userModel')
const bcrypt = require('bcrypt')

const adminLogin = async (req, res) => {
    try {
        res.render('adminLogin')
    } catch (error) {
        console.log(error);
    }
}

const adminVerify = async (req, res) => {
    try {
        const { email, password } = req.body
        const adminData = await User.findOne({ email: email })
        if (adminData) {
            const matchedPw = await bcrypt.compare(password, adminData.password);
            if (matchedPw) {
                req.session.admin = adminData._id
                res.render('adminDashboard')
            } else {
                res.render('adminLogin', { message: 'Invalid email or password' })
            }
        } else {
            res.render('adminLogin', { message: 'Admin not found' })
        }

    } catch (error) {
        console.log(error);
    }
}

const adminDashboard = async (req, res) => {
    try {
        res.render('adminDashboard')
    } catch (error) {
        console.log(error);
    }
}

const adminLogout = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/admin')
    } catch (error) {
        console.log(error);
    }
}

const loadUsers = async (req, res) => {
    try {
        const userData = await User.find({ is_admin: false })
        res.render('userManagement', { users: userData })
    } catch (error) {
        console.log(error);
    }
}

const blockUser = async (req, res) => {
    try {
        const userId = req.query.id
        console.log(userId, 'isthere');
        const userData = await User.findByIdAndUpdate(userId, { is_active: false })
        await userData.save()
        res.redirect('/admin/userManagement')
        console.log('User blocked');
    } catch (error) {
        console.log(error);
    }
}

const unblockUser = async (req, res) => {
    try {
        const userId = req.query.id
        const userData = await User.findByIdAndUpdate(userId, { is_active: true })
        await userData.save()
        res.redirect('/admin/userManagement')
        console.log('User unblocked');
    } catch (error) {
        console.log(error);
    }
}


module.exports = {
    adminLogin,
    adminVerify,
    adminDashboard,
    adminLogout,
    loadUsers,
    blockUser,
    unblockUser
}