const mongoose = require('mongoose')

const { Schema } = mongoose

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
            }
        }
    ]
})

module.exports = mongoose.model('cart', cartSchema) 