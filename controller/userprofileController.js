const User = require('../model/userModel')
const Address = require('../model/addressModel')
const order = require('../model/orderModel')
const product = require('../model/productModel')
const cart = require('../model/cartModel')
const Wallet = require('../model/walletModel')
const Wishlist = require('../model/wishlistModel')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const Razorpay = require('razorpay')
var easyinvoice = require('easyinvoice')
var instance = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret
})

const loadProfile = async (req, res) => {
    try {
        const userId = req.session.user
        const Iamuser = req.session.user
        const userData = await User.findOne({ _id: userId })
        const cartData = await cart.findOne({ userId: userId })
        const wishlistData = await Wishlist.findOne({ userId: userId })
        const addressData = await Address.findOne({ userId: userId })
        const orders = await order.find({ userId: userId }).sort({ placed: -1 }).populate('product.product')
        let wallet = await Wallet.findOne({ userId: userId })
        if (!wallet) {
            wallet = {
                balance: 0,
                history: []
            }
        }
        const cartCount = cartData ? cartData.product.length : 0
        const wishlistCount = wishlistData ? wishlistData.product.length : 0
        res.render('profile', { user: req.session.user, userData, Iamuser, addressData, orders, cartData, wallet, cartCount, wishlistCount })
    } catch (error) {
        console.log(error)
    }
}

const loadAddAddress = async (req, res) => {
    try {
        res.render('addAddress')
    } catch (error) {
        console.log(error);

    }
}

const addAddress = async (req, res) => {
    try {
        const userId = req.session.user
        const userData = await User.findOne({ _id: userId })
        const { name, address, addressType, city, state, country, pincode, phone, altphone } = req.body

        let userAddress = await Address.findOne({ userId: userData._id })

        if (!userAddress) {
            const curAddress = new Address({
                userId: userData._id,
                Address: [{
                    name,
                    address,
                    addressType,
                    city,
                    state,
                    country,
                    pincode,
                    phone,
                    altphone
                }]
            })
            await curAddress.save()
        } else {
            userAddress.Address.push({
                name,
                address,
                addressType,
                city,
                state,
                country,
                pincode,
                phone,
                altphone
            })
            await userAddress.save()
        }
        res.redirect('/profile')
    } catch (error) {
        console.log(error)
    }
}

const editAddress = async (req, res) => {
    try {
        const addressId = req.query.id
        const userId = req.session.user
        const addressEdit = await Address.findOne({ userId: userId, 'Address._id': addressId })
        if (!addressEdit) {
            return res.status(404).send('no addressId error')
        }
        res.render('editAddress', { addressEdit })
    } catch (error) {
        console.log(error)
    }
}

const updateAddress = async (req, res) => {
    try {
        const userId = req.session.user
        const addressId = req.query.id
        const userAddress = await Address.findOneAndUpdate(
            { userId: userId, 'Address._id': addressId },
            {
                $set: {
                    'Address.$.name': req.body.name,
                    'Address.$.address': req.body.address,
                    'Address.$.addressType': req.body.addressType,
                    'Address.$.city': req.body.city,
                    'Address.$.state': req.body.state,
                    'Address.$.country': req.body.country,
                    'Address.$.pincode': req.body.pincode,
                    'Address.$.phone': req.body.phone,
                    'Address.$.altphone': req.body.altphone
                }
            },
            { new: true }
        )
        res.redirect('/profile')
    } catch (error) {
        console.log(error);
    }
}

const deleteAddress = async (req, res) => {
    try {
        const addressId = req.query.id
        const deleteAddress = await Address.findOne({ 'Address._id': addressId })
        await Address.updateOne(
            { 'Address._id': addressId },
            {
                $pull: {
                    'Address': {
                        _id: addressId
                    }
                }
            }
        )
        res.redirect('/profile')
    } catch (error) {
        console.log(error);

    }
}

const orderDetails = async (req, res) => {
    try {
        const userId = req.session.user
        const orderId = req.query.id.toString()

        const orderData = await order.findById(orderId)
            .populate('coupon', 'product')

        console.log(orderData, 'orderData is orderDetails');


        const userData = await User.findById(orderData.userId)
        const productsInOrder = orderData.product.map(product => product.product._id || product.product)

        const productData = await product.find({ _id: { $in: productsInOrder } })


        let productsWithCoupon = 0
        orderData.product.forEach(item => {
            const product = productData.find(p => p._id.equals(item.product))

            if (product) {
                product.quantity = orderData.quantity
                product.originalPrice = product.originalPrice || 0
                product.discountedPrice = orderData.totalPrice || 0

                product.discountPercentage = ((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100 || 0

                product.discountAmount = product.originalPrice - product.discountedPrice || 0
                if (product.discountPercentage > 0) {
                    productsWithCoupon += 1
                }
            }
        })

        const addressData = await Address.findOne({ userId: userId })
        const cartData = await cart.findOne({ userId: userId })

        const cartCount = cartData ? cartData.product.length : 0
        const wishlistData = await Wishlist.findOne({ userId })
        const wishlistCount = wishlistData ? wishlistData.product.length : 0

        let couponDiscount = 0
        let couponPercentage = 0
        let discountedTotalPrice = orderData.totalPrice
        if (orderData.Coupon) {
            couponDiscount = discountedTotalPrice * (orderData.Coupon.discountValue / 100)
            couponPercentage = orderData.Coupon.discountValue
            couponName = orderData.Coupon.couponName
            discountedTotalPrice -= couponDiscount
        }

        res.render('orderDetails', {
            user: userData,
            order: orderData,
            products: productData,
            address: addressData,
            cart: cartData,
            cartCount,
            wishlistCount,
            couponDiscount,
            couponPercentage,
            productsWithCoupon,
            discountedTotalPrice
        })
    } catch (error) {
        console.log(error);
    }
}

const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.session.user;
        const orderData = await order.findById(orderId);

        if (!orderData) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (orderData.status === 'Cancelled') {
            return res.status(400).json({ success: false, message: 'Order is already cancelled' });
        }

        orderData.status = 'Cancelled';
        await orderData.save();

        for (const item of orderData.product) {
            const productItem = await product.findById(item.product);
            if (productItem) {
                productItem.countInstock += item.quantity;
                await productItem.save();
            }
        }

        if (orderData.paymentMethod !== 'COD' && orderData.paymentStatus === 'Paid') {
            let wallet = await Wallet.findOne({ userId });

            if (!wallet) {
                wallet = new Wallet({
                    userId: userId,
                    balance: 0,
                    history: []
                });
            }

            const refundAmount = orderData.totalPrice;
            wallet.balance += refundAmount;
            wallet.history.push({
                amount: refundAmount,
                type: 'credit'
            });
            await wallet.save();
        }

        res.status(200).json({ success: true, message: 'Order cancelled successfully' });
    } catch (error) {
        console.error('Error in cancelOrder:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


const returnOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId

        const { returnReason } = req.body
        console.log(req.body, 'req.body in returnOrder');

        const orderData = await order.findById(orderId)
        console.log(orderData, 'orderData in returnOrder');

        if (!orderData) {
            return res.status(400).send('Order not found')
        }
        if (orderData.status !== 'Delivered') {
            return res.status(400).send('Only delivered orders can be returned')
        }
        orderData.status = 'Return requested'
        orderData.returnReason = returnReason

        await orderData.save()
    } catch (error) {
        console.log(error)
    }
}

const addToWallet = async (req, res) => {
    try {
        const amount = parseFloat(req.body.amount);

        if (amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount. Amount cannot be zero or negative.' });
        }

        const userId = req.session.user;

        const order = await instance.orders.create({
            amount: amount * 100,
            currency: 'INR',
            receipt: userId.toString()
        });
        res.json({ order });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'An error occurred while creating the order.' });
    }
}


const verifyPaymentWallet = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

        console.log(req.body, 'req.body in verifypaymentwallet');

        if (parseFloat(amount) <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount. Amount cannot be zero or negative.' });
        }

        const userId = req.session.user;

        const hmac = crypto.createHmac('sha256', instance.key_secret);
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const generated_signature = hmac.digest('hex');

        if (generated_signature === razorpay_signature) {
            let wallet = await Wallet.findOne({ userId });
            if (!wallet) {
                wallet = new Wallet({
                    userId,
                    balance: parseFloat(amount),
                    history: [{
                        amount: parseFloat(amount),
                        type: 'credit',
                        createdAt: Date.now()
                    }]
                });
            } else {
                wallet.balance = parseFloat(wallet.balance) + parseFloat(amount);
                wallet.history.push({
                    amount: parseFloat(amount),
                    type: 'credit',
                    createdAt: Date.now()
                });
            }
            await wallet.save();
            res.status(200).json({ success: true, message: 'Wallet balance updated successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'An error occurred' });
    }
};



const invoicePdf = async (req, res) => {
    try {
        const orderId = req.params.orderId
        const Order = await order.findById(orderId).populate('product.product').populate('coupon')
        console.log(Order, 'order in invoicePdf');


        if (!Order) {
            return res.status(404).send('Order not found')
        }
        const products = []
        let totalAmount = 0
        let totalDiscount = 0

        for (let i = 0; i < Order.product.length; i++) {

            const productInOrder = Order.product[i]
            console.log(productInOrder, 'productinorder in invoice');


            const productDetails = await product.findById(productInOrder.product)
            console.log(productDetails, 'invoicePdf');

            if (!productDetails) continue

            const originalPrice = productDetails.originalPrice || productDetails.price || 0
            const offerDiscount = originalPrice * (productDetails.offer / 100 || 0)
            const discountPrice = originalPrice - offerDiscount

            const couponDiscount = order.coupon ? (discountPrice * order.coupon.discountValue / 100 || 0) : 0
            const finalPrice = discountPrice - couponDiscount
            const totalPrice = finalPrice * productInOrder.quantity

            products.push({
                quantity: productInOrder.quantity,
                description: productDetails.productName,
                originalPrice: originalPrice.toFixed(2),
                price: finalPrice.toFixed(2),
                offerDiscount: offerDiscount.toFixed(2),
                couponDiscount: couponDiscount.toFixed(2),
                totalPrice: totalPrice.toFixed(2)
            })
            totalAmount += totalPrice
            totalDiscount += offerDiscount + couponDiscount
        }

        const data = {
            apiKey: "free",
            mode: "development",
            images: {},
            sender: {
                company: "WatchVault",
                address: "WatchVault Kochi",
                zip: "657845",
                city: "Kochi",
                country: "India"
            },
            information: {
                number: Order._id,
                date: Order.date,
                dueDate: new Date(Order.placed.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
            },
            products: products.map(productInOrder => ({
                quantity: productInOrder.quantity,
                description: productInOrder.description,
                originalPrice: productInOrder.originalPrice,
                price: productInOrder.price,
                offerDiscount: productInOrder.offerDiscount,
                couponDiscount: productInOrder.couponDiscount,
                total: productInOrder.totalPrice
            })),
            bottomNotice: "Kindly pay your invoice",
            settings: {
                currency: "INR"
            },
            totals: {
                totalPrice: totalAmount.toFixed(2),
                totalDiscount: totalDiscount.toFixed(2)
            },
            discounts: Order.coupon ? [{
                description: `Coupon Discount (${Order.coupon.couponCode})`,
                amount: totalDiscount.toFixed(2)
            }] : []
        };

        const result = await easyinvoice.createInvoice(data)
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${Order._id}.pdf`);
        res.send(Buffer.from(result.pdf, 'base64'));

    } catch (error) {
        console.log(error);

    }
}

const loadChangePassword = async (req, res) => {
    try {
        res.render('changePassword',)
    } catch (error) {
        console.log(error.message);
    }
}

const changePassword = async (req, res) => {
    try {
        const userId = req.session.user;
        const { 'Current-password': currentPassword, 'new-password': newPassword, 'confirm-password': confirmPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


module.exports = {
    loadProfile,
    loadAddAddress,
    addAddress,
    editAddress,
    updateAddress,
    deleteAddress,
    orderDetails,
    cancelOrder,
    returnOrder,
    addToWallet,
    verifyPaymentWallet,
    invoicePdf,
    loadChangePassword,
    changePassword
}