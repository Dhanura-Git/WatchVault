const mongoose = require('mongoose');
const { Schema } = mongoose;

const cartSchema = mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    product: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'product',
                required: true
            },
            productName: {
                type: String
            },
            price: {
                type: Number
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
                default: 1
            },
            image: {
                type: String
            },
            category: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'category'
            },
            stock: {
                type: Number
            },
            offer: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'offer',
                default: null
            },
            originalPrice: {
                type: Number
            }
        }
    ]
});

module.exports = mongoose.model('cart', cartSchema);