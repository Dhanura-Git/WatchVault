const cart = require('../model/cartModel')
const product = require('../model/productModel')
const address = require('../model/addressModel')
const order = require('../model/orderModel')
const Wallet = require('../model/walletModel')
const User = require('../model/userModel')
const Coupon = require('../model/couponModel')
const crypto = require('crypto')
const Razorpay = require('razorpay')
var instance = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret
})


const razorpay = async (total) => {
    return new Promise((resolve, reject) => {
        console.log(total, 'total in razorpay');

        var options = {
            amount: total * 100,
            currency: 'INR',
            receipt: crypto.randomBytes(10).toString('hex')
        }
        instance.orders.create(options, (err, order) => {
            if (err) {
                console.log(err);
                reject(err)
            } else {
                resolve(order)
            }
        })
    })
}

const verifyRazorpay = async (req, res) => {
    try {
        console.log(req.body, 'req.body in verifyrazorpy');

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const hmac = crypto.createHmac('sha256', instance.key_secret);
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const generated_signature = hmac.digest('hex');

        if (generated_signature === razorpay_signature) {
            console.log("Signatures match, proceeding with payment verification");
            const orderId = req.session.pendingOrderId
            console.log(`Order ID from session: ${orderId}`);
            if (!orderId) {
                console.log("Order ID not found in session");
                return res.status(400).json({ success: false, message: 'Order ID not found in session' });
            }
            const Order = await order.findById(orderId);
            if (!order) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }
            Order.paymentStatus = "Paid";
            Order.status = "Confirmed";
            await Order.save();
            cartData.product = [];
            await cartData.save();
            console.log("Order status updated to 'Paid' and 'Confirmed'");
            res.status(200).json({ success: true, message: 'Payment verified and order confirmed', orderId: Order._id });
        } else {
            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
    } catch (error) {
        console.log(error)
    }
}

const placeOrder = async (req, res) => {
    try {
        let totalPrice = parseFloat(req.body.totalPrice);
        const userId = req.session.user;
        const addressId = req.body.addressId;
        console.log(addressId, 'Address ID in placeOrder:', req.body);

        const { couponCode } = req.body;
        const paymentMethod = req.body.paymentOption;

        const cartData = await cart.findOne({ userId: userId }).populate('product')
        console.log(cartData, 'cartdta in placeordser');

        const userData = await User.findOne({ _id: userId });
        const wallet = await Wallet.findOne({ userId });

        if (!cartData) {
            return res.status(404).json({ success: false, message: 'Cart is empty' });
        }

        const products = cartData.product.map(items => ({
            product: items.productId,
            productName: items.productName,
            quantity: items.quantity,
            price: items.price,
            total: items.quantity * items.price
        }));

        for (let i = 0; i < products.length; i++) {
            const productId = products[i].product;
            const productQty = products[i].quantity;
            const finalProduct = await product.findOne({ _id: productId });

            if (finalProduct.stock >= productQty) {
                finalProduct.stock -= productQty;
                await finalProduct.save();
            } else {
                return res.status(400).json({ success: false, message: `Not enough stock for product: ${finalProduct.productName}` });
            }
        }

        const selectedAddress = await address.findOne({ 'userId': userId, 'Address._id': addressId });
        if (!selectedAddress) {
            return res.status(400).json({ success: false, message: 'Invalid address selected' });
        }
        const addressSelected = selectedAddress.Address.find(address => address._id.toString() === addressId);
        console.log(addressSelected, 'Selected address:', addressSelected);

        let couponData = null;
        if (couponCode) {
            couponData = await Coupon.findOne({ couponCode });
            if (!couponData) {
                return res.status(400).json({ success: false, message: 'Coupon data is not found' });
            }

            if (totalPrice < couponData.minOrderValue) {
                return res.status(400).json({ success: false, message: 'Total price is below the minimum amount required for this coupon' });
            }

            const couponUsage = userData.Coupon.find(a => a.couponCode === couponCode);
            if (couponUsage) {
                return res.status(400).json({ success: false, message: 'You have already used this coupon' });
            }

            userData.Coupon.push({ couponCode: couponCode });
            await userData.save();

            console.log(`Total price after coupon discount: ${totalPrice}`);
        }

        const totalAmountInPaise = Math.round(totalPrice)
        const randomOrderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

        if (paymentMethod === 'COD') {
            console.log('Cash on Delivery');

            const newOrder = new order({
                product: products,
                totalPrice: totalPrice,
                address: addressSelected,
                paymentMethod: paymentMethod,
                userId: userId,
                paymentStatus: 'Pending',
                status: 'Confirmed',
                date: new Date().toLocaleString(),
                placed: new Date(),
                coupon: couponCode ? couponData._id : null,
                orderId: randomOrderId
            });

            await newOrder.save();
            req.session.user.cart = cart;

            cartData.product = [];
            await cartData.save();

            req.session.coupon = null;

            res.status(200).json({ success: true, message: 'Order placed successfully', orderId: newOrder._id });
        } else if (paymentMethod === 'razorpay') {
            console.log('Razorpay payment');

            const razorpayOrder = await razorpay(totalAmountInPaise);
            console.log(razorpayOrder, 'razorpayOrder in fskjdhfwh' );
            

            const newOrder = new order({
                product: products,
                totalPrice: totalPrice,
                address: addressSelected,
                paymentMethod: paymentMethod,
                userId: userId,
                paymentStatus: 'Pending',
                status: 'Pending',
                date: new Date().toLocaleString(),
                placed: new Date(),
                coupon: couponCode ? couponData._id : null,
                orderId: randomOrderId
            });

            const amtPaid = razorpayOrder.amount_paid
            const amtDue = razorpayOrder.amount
            

            await newOrder.save();

            req.session.pendingOrderId = newOrder._id;
            req.session.user.cart = cart;

            cartData.product = [];
            await cartData.save();

            req.session.coupon = null;

            res.status(200).json({
                success: true,
                razorpayOrder,
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency
            });
        } else if (paymentMethod === 'wallet') {
            console.log('Wallet payment');

            if (wallet && wallet.balance >= totalPrice) {
                wallet.balance -= totalPrice;
                await wallet.save();

                const newOrder = new order({
                    product: products,
                    totalPrice: totalPrice,
                    address: addressSelected,
                    paymentMethod: paymentMethod,
                    userId: userId,
                    paymentStatus: 'Paid',
                    status: 'Confirmed',
                    date: new Date().toLocaleString(),
                    placed: new Date(),
                    coupon: couponCode ? couponData._id : null,
                    orderId: randomOrderId
                });

                await newOrder.save();
                req.session.user.cart = cart;

                cartData.product = [];
                await cartData.save();

                req.session.coupon = null;

                res.status(200).json({ success: true, message: 'Order placed successfully', orderId: newOrder._id });
            } else {
                return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
            }
        }
    } catch (error) {
        console.log('Error in placeOrder:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};



const orderSuccess = async (req, res) => {
    try {
        const randomOrderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000)
        const orderId = req.params.orderId
        const Order = await order.findById(orderId)
        console.log(Order, 'order in orderSuccess');

        if (!Order) {
            return res.status(404).send('Order not found')
        }
        res.render('orderSuccess', { Order, randomOrderId })
    } catch (error) {
        console.log(error)
    }
}

const applyCoupon = async (req, res) => {
    try {
        const { coupon, totalsubtotal } = req.body;

        if (!totalsubtotal) {
            return res.status(400).json({ success: false, message: 'Total subtotal is required' });
        }

        const userId = req.session.user._id;
        const parsedSubtotal = parseFloat(totalsubtotal);
        if (isNaN(parsedSubtotal)) {
            console.error('Total Subtotal is not a valid number:', totalsubtotal);
            req.session.coupon = null;
            req.session.discountTotal = null;
            return res.status(400).json({ success: false, message: 'Invalid total subtotal' });
        }

        const couponData = await Coupon.findOne({ couponCode: new RegExp(`^${coupon}$`, 'i') });

        if (!couponData) {
            req.session.coupon = null;
            req.session.discountTotal = null;
            return res.status(400).json({ success: false, message: 'Coupon code not found' });
        }

        if (parsedSubtotal < couponData.minOrderValue) {
            req.session.coupon = null;
            req.session.discountTotal = null;
            return res.status(400).json({ success: false, message: 'Total subtotal is below the minimum amount required for this coupon' });
        }

        const parsedDiscountValue = parseFloat(couponData.discountValue);
        if (isNaN(parsedDiscountValue)) {
            console.error('Discount Value is not a valid number:', couponData.discountValue);
            req.session.coupon = null;
            req.session.discountTotal = null;
            return res.status(400).json({ success: false, message: 'Invalid discount value' });
        }

        const discountAmount = parsedSubtotal * (parsedDiscountValue / 100);
        const discountTotal = parsedSubtotal - discountAmount;
        console.log('Discount Amount:', discountAmount);
        console.log('Discount Total:', discountTotal);

        req.session.coupon = coupon;
        req.session.discountTotal = discountTotal;

        console.log('coupon applied');


        return res.status(200).json({ success: true, discountTotal });
    } catch (error) {
        console.error('Error applying coupon:', error);
        req.session.coupon = null;
        req.session.discountTotal = null;
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


const calculateTotal = (cart) => {
    return cart.product.reduce((acc, item) => {
        return acc + item.price * item.quantity
    }, 0)
}

const removeCoupon = async (req, res) => {
    try {
        req.session.coupon = null
        req.session.discountTotal = null

        let cartData = req.session.user.cart

        if (!cartData) {
            const userId = req.session.user
            cartData = await cart.findOne({ userId: userId })
            if (!cartData) {
                return res.status(400).json({ success: false, message: 'Cart not found' })
            }
        }
        const subTotal = calculateTotal(cartData)
        return res.status(200).json({ success: true, subTotal: subTotal })

    } catch (error) {
        console.log(error);

    }
}

const retryPayment = async (req, res) => {
    const { id } = req.query;
    try {
        const Order = await order.findById(id);
        if (!Order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (Order.paymentStatus === "Pending") {
            const razorpayOrder = await razorpay(Order.totalPrice);

            
            req.session.pendingOrderId = Order._id;
            console.log(`Order ID stored in session: ${req.session.pendingOrderId}`);

            res.status(200).json({
                success: true,
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                orderId: Order._id
            });
        } else {
            res.status(400).json({ success: false, message: 'Order already paid or not eligible for retry' });
        }
    } catch (error) {
        console.log("Error in retry payment:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

module.exports = {
    razorpay,
    verifyRazorpay,
    placeOrder,
    orderSuccess,
    applyCoupon,
    removeCoupon,
    retryPayment
}