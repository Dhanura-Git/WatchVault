const mongoose = require('mongoose')

const orderSchema = mongoose.Schema({
    product: {
        type: Array,
        required: true,
        ref: 'product'
    },
    orderId: {
        type: String,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    address: {
        type: Array,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    placed: {
        type: Date,
        required: true
    },
    date: {
        type: String
    },
    orderVerified: {
        type: Boolean,
        default: true
    },
    returnReason:{
        type: String,
        default: ''
    },
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'coupon',
        default: null
    }
})

module.exports = mongoose.model('order', orderSchema)