const mongoose = require('mongoose')
const { ObjectId } = require('mongodb')

const productSchema = mongoose.Schema({
    productName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: ObjectId,
        ref: 'category'
    },
    price: {
        type: Number,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    stock: {
        type: Number,
        required: true
    },
    images: {
        type: Array,
        required: true
    },
    is_Active: {
        type: Boolean,
        default: true
    },
    offer: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'offer',
        default: null
    },
    originalPrice:{
        type: Number
    }
})

module.exports = mongoose.model('product', productSchema)