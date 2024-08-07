const cart = require('../model/cartModel')
const product = require('../model/productModel')
const User = require('../model/userModel')

const loadCart = async(req, res)=>{
    try {
        const userId = req.session.user
        const userData = await User.findOne({_id: userId})
        const cartData = await cart.findOne({userId: userId}).populate('product.productId')
        const cartLength = cartData? cartData.product.length: 0
        res.render('cart',{cartData})
    } catch (error) {
        console.log(error)
    }
}

const addToCart = async(req, res)=>{
    try {
        const productId = req.session.id
        const userId = req.session.user
    } catch (error) {
        console.log(error);
        
    }
}

module.exports = {
    loadCart
}