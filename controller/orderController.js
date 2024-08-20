const cart = require('../model/cartModel')
const product = require('../model/productModel')
const address = require('../model/addressModel')
const order = require('../model/orderModel')
const User = require('../model/userModel')

const getOrder = async (req, res) => {
    try {
        const userId = req.session.user._id
        const userCart = await cart.findOne({ user_id: userId }).populate('product.productId')
        let total = 0
        if (userCart) {
            total = userCart.product.reduce((acc, prod) => acc + (prod.price * prod.quantity), 0)
        }
        const userAddress = await address.findOne({ userId: userId })
        res.render('checkout', { userAddress, total })
    } catch (error) {
        console.log(error)
    }
}

const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user;
        const addressId = req.body.addressId;
        const paymentMethod = req.body.paymentOption;
        const cartData = await cart.findOne({ userId: userId });
        const userData = await User.findOne({ _id: userId });
        console.log(cartData, 'cartData');

        if (cartData) {
            // Create an array of products with their details
            const products = cartData.product.map(items => ({
                product: items.productId,
                quantity: items.quantity,
                price: items.price,
                total: items.quantity * items.price
            }));

            // Loop through the products to update their stock
            for (let i = 0; i < products.length; i++) {
                const productId = products[i].product;
                const productQty = products[i].quantity;
                const finalProduct = await product.findOne({ _id: productId });

                if (finalProduct.stock >= productQty) {
                    finalProduct.stock -= productQty;
                    await finalProduct.save();
                } else {
                    return res.status(400).json({ success: false, message: 'Not enough stock for product: ' + finalProduct.name });
                }
            }

            const addressSelected = await address.findOne({ userId: userId, 'Address._id': addressId });

            if (paymentMethod === 'COD') {
                const totalPrice = products.reduce((acc, item) => acc + item.total, 0);

                const newOrder = new order({
                    product: products,
                    totalPrice: totalPrice,
                    Address: addressSelected.Address,
                    paymentMethod: paymentMethod,
                    userId: userId,
                    paymentStatus: 'Pending',
                    status: 'Confirmed',
                    date: new Date().toLocaleString(),
                    placed: new Date()
                });

                await newOrder.save()
                cartData.product = []
                await cartData.save()

                res.status(200).json({ success: true, message: 'Order placed successfully', orderId: newOrder._id })
            }
        } else {
            res.status(404).json({ success: false, message: 'Cart is empty' })
        }
    } catch (error) {
        console.log(error)
    }
};


const orderSuccess = async(req, res)=>{
    try {
        const orderId = req.params.orderId
        const Order = await order.findById(orderId)
        if(!Order){
            return res.status(404).send('Order not found')
        }
        res.render('orderSuccess',{Order})
    } catch (error) {
        console.log(error)
    }
}


module.exports = {
    getOrder,
    placeOrder,
    orderSuccess
}