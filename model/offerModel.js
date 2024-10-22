const mongoose = require('mongoose')

const offerSchema = mongoose.Schema({
    offerName: {
        type: String,
        required: true
    },
    offerPercentage: {
        type: Number,
        required: true
    },
    is_Active: {
        type: Boolean,
        default: true
    }
})

module.exports = mongoose.model('offer', offerSchema)