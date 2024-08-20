const cart = require('../model/cartModel')
const product = require('../model/productModel')
const User = require('../model/userModel')
const address = require('../model/addressModel')

const loadCart = async (req, res) => {
    try {
        const userId = req.session.user
        const userData = await User.findOne({ _id: userId })
        const cartData = await cart.findOne({ userId: userId }).populate('product.productId')
        const cartLength = cartData ? cartData.product.length : 0
        if (cartData && cartLength > 0) {
            res.render('cart', { cartData })
        } else {
            console.log('cart empty or not found')
            res.render('emptyCart')
        }
    } catch (error) {
        console.log(error)
    }
}

const addToCart = async (req, res) => {
    try {
        const productId = req.query.id
        console.log(productId, ' are youuu');

        const userId = req.session.user
        console.log(userId, 'usereeee');

        const Product = await product.findOne({ _id: productId })
        console.log(Product, ' this isss');

        if (!Product || Product.stock == 0) {
            return res.status(404).json({ success: false, error: 'Product is out of stock' })
        }
        let Cart = await cart.findOne({ userId })
        if (!Cart) {
            Cart = new cart({ userId, Product: [] })
        }
        console.log(Cart, 'new cart createed');

        const existingProduct = Cart.product.findIndex(item => item.productId.toString() === productId)
        if (existingProduct !== -1) {
            const totalQuantity = Cart.product[existingProduct].quantity + 1
            if (totalQuantity > product.stock) {
                return res.status(400).json({ success: false, error: 'Stock unavailable' })
            }
            Cart.product[existingProduct].quantity = totalQuantity
        } else {
            Cart.product.push({ productId: Product._id, quantity: 1, price: Product.price })
        }
        await Cart.save()
        const cartLength = Cart.product.reduce((total, item) => total + item.quantity, 0)
        res.status(200).json({ success: true, message: 'Product added to cart', cartLength })

    } catch (error) {
        console.log(error);
    }
}

const updateCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.session.user;

        let Cart = await cart.findOne({ userId });
        if (!Cart) {
            Cart = new cart({ userId, product: [] });
        }

        const productIndex = Cart.product.findIndex(item => item.productId.toString() === productId);

        if (productIndex !== -1) {
            if (quantity > 0) {
                Cart.product[productIndex].quantity += quantity;
            } else if (quantity < 0 && Cart.product[productIndex].quantity + quantity > 0) {
                Cart.product[productIndex].quantity += quantity;
            } else {
                Cart.product.splice(productIndex, 1);
            }
        } else if (quantity > 0) {
            Cart.product.push({ productId, quantity });
        }

        await Cart.save();

        const quantityData = {
            quantity: quantity
        };

        res.status(200).json({ quantityData });
    } catch (error) {
        console.log(error);
    }
}

const cartDelete = async (req, res) => {
    try {
        const userId = req.session.user
        const { productId } = req.body
        console.log(req.body, 'req.body indo');
        console.log(productId, 'productId indo');

        let Cart = await cart.findOne({ userId: userId })
        if (!Cart) {
            console.log(Cart, 'no cart is found');
        }
        const productIndex = Cart.product.findIndex((item => item.productId.toString() === productId))
        if (productIndex !== -1) {
            Cart.product.splice(productIndex, 1)
            await Cart.save()
            return res.status(200).send('success')
        } else {
            return res.status(400).send('not found')
        }
    } catch (error) {
        console.log(error)
    }
}

const loadCheckout = async(req, res)=>{
    try {
        let userId = req.session.user
        const Cart = await cart.findOne({userId})
        const userData = await User.findOne({_id: userId})
        const addressData = await address.findOne({userId: userId})
        const cartData = await cart.findOne({userId: userId}).populate('product.productId')
        const cartLength = cartData?cartData.product.length:0
        res.render('checkout',{name:userData.name, cartData, addresses:addressData, cartLength})
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    loadCart,
    addToCart,
    updateCart,
    cartDelete,
    loadCheckout
}