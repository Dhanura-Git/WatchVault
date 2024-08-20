const mongoose = require('mongoose')

const addressSchema = mongoose.Schema({
    userId: {
        type: String,
        ref: 'User',
        required: true
    },
    Address: [{
        name:{
            type:String,
            required: true,
        },
        address:{
            type:String,
            required: true
        },
        addressType: {
            type: String,
            enum:['home', 'work'],
            required: true
        },
        city:{
            type:String,
            required:true
        },
        state: {
            type:String,
            required:true
        },
        country: {
            type:String,
            required:true
        },
        pincode:{
            type: Number,
            required: true
        },
        phone:{
            type: Number,
            required: true
        },
        altphone:{
            type:Number,
            required:true
        }
    }]
})

module.exports = mongoose.model('address',addressSchema)