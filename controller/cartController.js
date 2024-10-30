const cart = require('../model/cartModel')
const product = require('../model/productModel')
const User = require('../model/userModel')
const address = require('../model/addressModel')
const Coupon = require('../model/couponModel')
const wishlist = require('../model/wishlistModel')

const loadCart = async (req, res) => {
    try {
        const userId = req.session.user
        const cartData = await cart.findOne({ userId: userId }).populate('product.productId')

        const wishlistData = await wishlist.findOne({ userId: userId })
        const wishlistCount = wishlistData ? wishlistData.product.length : 0
        const cartLength = cartData ? cartData.product.length : 0
        if (cartData && cartLength > 0) {
            res.render('cart', { cartData, cartLength, wishlistCount })
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
        const userId = req.session.user
        const Product = await product.findOne({ _id: productId })

        if (!Product || Product.stock == 0) {
            return res.status(404).json({ success: false, error: 'Product is out of stock' })
        }
        let Cart = await cart.findOne({ userId })
        if (!Cart) {
            Cart = new cart({ userId, Product: [] })
        }

        const existingProduct = Cart.product.findIndex(item => item.productId.toString() === productId)
        if (existingProduct !== -1) {
            const totalQuantity = Cart.product[existingProduct].quantity + 1
            console.log(totalQuantity, 'totalquantity in cart frontt');

            if (totalQuantity > Product.stock) {
                console.log('out of stock');

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
        const prodData = await product.findById(productId);

        if (!prodData) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        let Cart = await cart.findOne({ userId });
        if (!Cart) {
            Cart = new cart({ userId, product: [] });
        }

        const cartProduct = Cart.product.find(item => item.productId.toString() === productId);
        const requestedQuantity = parseInt(quantity);

        if (cartProduct) {
            const newQuantity = cartProduct.quantity + requestedQuantity;

            if (newQuantity > prodData.stock) {
                return res.status(409).json({ error: 'Stock limit reached' });
            }

            cartProduct.quantity = newQuantity > 0 ? newQuantity : 0;
        } else if (requestedQuantity > 0) {
            Cart.product.push({ productId, quantity: requestedQuantity, price: prodData.price, productName: prodData.name });
        }

        await Cart.save();
        res.status(200).json({ message: 'Cart updated successfully.' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'An error occurred while updating the cart.' });
    }
};



const cartDelete = async (req, res) => {
    try {
        const userId = req.session.user
        const { productId } = req.body

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

const loadCheckout = async (req, res) => {
    try {
        const userId = req.session.user;
        const cartData = await cart.findOne({ userId }).populate('product.productId');
        const cartCount = cartData ? cartData.product.length : 0
        const wishlistData = await wishlist.findOne({ userId })
        const wishlistCount = wishlistData ? wishlistData.product.length : 0

        if (!cartData) {
            return res.redirect('/loadCart');
        }
        console.log(cartData, 'cartdta inn oadlcheckout');


        const products = cartData.product;
        console.log(products, 'products in loadcheckout');


        const activeProducts = products.filter(item => item.productId.is_Active);
        const inactiveProducts = products.filter(item => !item.productId.is_Active);

        if (inactiveProducts.length > 0) {
            req.session.inactiveProducts = inactiveProducts.map(item => item.productId.productName);
            req.session.message = `The following products are unavailable: ${req.session.inactiveProducts.join(', ')}`;
            return res.redirect('/loadCart');
        }


        let subTotal = activeProducts.reduce((acc, item) => acc + (item.productId.price * item.quantity), 0);
        let discountAmount = 0;
        let discountTotal = subTotal;

        let usedCouponCode = null;
        if (req.session.coupon) {
            const couponData = await Coupon.findOne({ couponCode: new RegExp(`^${req.session.coupon}$`, 'i') });
            if (couponData) {
                discountAmount = subTotal * (couponData.discountValue / 100);
                discountTotal = subTotal - discountAmount;
                usedCouponCode = couponData.couponCode;
            }
        }

        const coupons = await Coupon.find().sort({ created: -1 });
        const availableCoupons = coupons.filter(coupon => coupon.couponCode !== usedCouponCode)

        res.render('checkout', {
            products: activeProducts,
            cart: cartData,
            cartCount,
            wishlistCount,
            addresses: await address.findOne({ userId }),
            username: req.session.user.name,
            subTotal,
            discountAmount,
            discountTotal,
            coupons: availableCoupons
        });
    } catch (error) {
        console.log(error);
        res.redirect('/loadCart');
    }
};


module.exports = {
    loadCart,
    addToCart,
    updateCart,
    cartDelete,
    loadCheckout
}