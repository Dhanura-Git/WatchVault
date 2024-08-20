const mongoose = require('mongoose')

const orderSchema = mongoose.Schema({
    product:{
        type: Array,
        required: true,
        ref:'product'
    },
    totalPrice:{
        type: Number,
        required: true
    },
    address: {
        type: Array,
        required: true
    },
    paymentMethod:{
        type: String,
        required: true
    },
    paymentStatus:{
        type: String,
        required: true
    },
    status:{
        type: String,
        required: true
    },
    userId:{
        type: String,
        required: true
    },
    placed:{
        type: Date,
        required: true
    },
    date:{
        type: String
    },
    orderVerified:{
        type: Boolean,
        default: true
    }
})

module.exports = mongoose.model('order',orderSchema)