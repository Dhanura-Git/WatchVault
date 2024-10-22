const mongoose = require('mongoose')
const timestamp = require('timestamp')

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    mobile: {
        type: Number,
        required: true
    },
    is_admin: {
        type: Boolean,
        default: false
    },
    is_active: {
        type: Boolean,
        default: true
    },
    token: {
        type: String,
        default: ''
    },
    Coupon: [{
        couponCode: String,
        usagecount: Number
    }]

}, {
    timestamp: true
})


module.exports = mongoose.model('User', userSchema)