const mongoose = require('mongoose')
const couponSchema = new mongoose.Schema({
    couponName: {
        type: String,
        required: true
    },
    couponCode: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    expiryTime: {
        type: String,
        required: true
    },
    minOrderValue: {
        type: Number,
        required: true
    },
    discountValue: {
        type: Number,
        default: 0
    },
    created: {
        type: Date,
        default: Date.now
    }
})
module.exports = mongoose.model('coupon', couponSchema)