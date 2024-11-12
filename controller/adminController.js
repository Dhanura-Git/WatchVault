const User = require('../model/userModel')
const bcrypt = require('bcrypt')
const orders = require('../model/orderModel')
const cart = require('../model/cartModel')
const product = require('../model/productModel')
const address = require('../model/addressModel')
const Coupon = require('../model/couponModel')
const Order = require('../model/orderModel')
const Category = require('../model/categoryModel')
const Wallet = require('../model/walletModel')
const mongoose = require('mongoose')
const PDFDocument = require('pdfkit-table')
const ExcelJS = require('exceljs');
const moment = require('moment');



const adminLogin = async (req, res) => {
  try {
    res.render('adminLogin')
  } catch (error) {
    console.log(error);
  }
}

const adminVerify = async (req, res) => {
  try {
    const { email, password } = req.body
    const adminData = await User.findOne({ email: email })
    if (adminData) {
      const matchedPw = await bcrypt.compare(password, adminData.password);
      if (matchedPw) {
        req.session.admin = adminData._id
        res.redirect('/admin/adminDashboard')
      } else {
        res.render('adminLogin', { message: 'Invalid email or password' })
      }
    } else {
      res.render('adminLogin', { message: 'Admin not found' })
    }

  } catch (error) {
    console.log(error);
  }
}

const adminDashboard = async (req, res) => {
  try {
    const topSellingProduct = await bestSellingProduct()
    const orders = await Order.find({ orderVerified: true })
    const products = await product.find({ is_Active: true })
    const revenue = await getRevenueData()

    res.render('adminDashboard', {
      topSellingProduct,
      orders,
      products,
      revenue
    })
  } catch (error) {
    console.log(error);
  }
}

const adminLogout = async (req, res) => {
  try {
    req.session.destroy()
    res.redirect('/admin')
  } catch (error) {
    console.log(error);
  }
}

const loadUsers = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1
    const limit = 5
    const searchTerm = req.query.search ? req.query.search.trim() : ''
    const query = searchTerm ? { name: { $regex: new RegExp(searchTerm, 'i') } } : {}
    const userData = await User.find(query)
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    const count = await User.countDocuments(query);
    const totalpages = Math.ceil(count / limit);

    res.render('userManagement', {
      users: userData,
      totalpages: totalpages,
      currentpage: page,
      search: searchTerm
    })
  } catch (error) {
    console.log(error);
  }
}

const blockUser = async (req, res) => {
  try {
    const userId = req.query.id
    const userData = await User.findByIdAndUpdate(userId, { is_active: false })
    await userData.save()
    res.redirect('/admin/userManagement')
    console.log('User blocked');
  } catch (error) {
    console.log(error);
  }
}

const unblockUser = async (req, res) => {
  try {
    const userId = req.query.id
    const userData = await User.findByIdAndUpdate(userId, { is_active: true })
    await userData.save()
    res.redirect('/admin/userManagement')
    console.log('User unblocked');
  } catch (error) {
    console.log(error);
  }
}

const listOrders = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1
    const limit = 10
    const orderData = await orders.find({ orderVerified: true })
      .sort({ placed: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec()
    const count = await orders.countDocuments()
    const totalpages = Math.ceil(count / limit)
    const userData = await User.find({ is_admin: false })

    res.render('orders', {
      orders: orderData,
      users: userData,
      totalpages,
      currentpage: page
    })
  } catch (error) {
    console.log(error);
  }
};

const orderDetails = async (req, res) => {
  try {
    const orderId = req.query.id
    const orderData = await orders.findById(orderId)

    const userData = await User.findById(orderData.userId)
    const addressData = await address.find({ 'Address._id': orderData.address[0]._id })

    const productIds = orderData.product.map(product => product.product)
    const productData = await product.find({ _id: { $in: productIds } })
    res.render('order-Details', { user: userData, orders: orderData, product: productData, addressData: addressData })
  } catch (error) {
    console.log(error);

  }
}

const updateOrder = async (req, res) => {
  try {
    const { orderID, newStatus } = req.body

    if (!orderID || !newStatus) {
      return res.status(400).send({ success: false, message: 'orderID and new status are required' })
    }
    const updatedOrder = await orders.findOneAndUpdate(
      { _id: orderID },
      { status: newStatus },
      { new: true }
    )
    if (newStatus === 'Cancelled' && updatedOrder) {
      for (const productItem of updateOrder.products) {
        const productId = productItem.product
        const quantity = productItem.quantity

        const product = await product.findById(productId)
        if (product) {
          product.stock += quantity
          await product.save()
        }
      }
    } else if (newStatus === 'Delivered' && updateOrder) {
      await orders.findOneAndUpdate(
        { _id: orderID },
        { $set: { paymentStatus: 'Paid' } }
      )
    }
    res.status(200).json({ success: true, updatedOrder });
  } catch (error) {
    console.log(error);

  }
}

const listCoupon = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1
    const limit = 4
    const coupons = await Coupon.find()
      .limit(limit)
      .skip((page - 1) * limit)
      .exec()
    const count = await Coupon.countDocuments()
    const totalpages = Math.ceil(count / limit)

    res.render('coupon', {
      coupons,
      totalpages,
      currentpage: page
    })
  } catch (error) {
    console.log(error);

  }
}
const addCoupon = async (req, res) => {
  try {
    const { couponName, couponCode, description, expiryTime, discountValue, minOrderValue } = req.body;

    let errMessage = '';

    if (!couponName || !couponCode || !description || !expiryTime || !discountValue || !minOrderValue) {
      errMessage = 'All fields are required';
    } else if (new Date(expiryTime) < new Date()) {
      errMessage = 'Expiry time must be a future date';
    } else if (isNaN(discountValue) || discountValue <= 0) {
      errMessage = 'Discount value must be a positive number';
    } else if (isNaN(minOrderValue) || minOrderValue <= 0) {
      errMessage = 'Minimum order value must be a positive number';
    }

    if (!errMessage) {
      const existingCoupon = await Coupon.findOne({ couponCode: new RegExp(`^${couponCode}$`, 'i') });

      if (existingCoupon) {
        errMessage = 'Coupon code already exists';
      }
    }

    if (errMessage) {
      const coupons = await Coupon.find({});
      return res.status(400).render('coupon', { errMessage, coupons });
    }

    const coupon = new Coupon({
      couponName,
      couponCode,
      description,
      expiryTime,
      discountValue,
      minOrderValue
    });

    await coupon.save();

    res.redirect('/admin/coupon');

  } catch (error) {
    console.log('Error occurred:', error);
  }
};


const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.query.id
    const couponDelete = await Coupon.findOneAndDelete({ _id: couponId })

    if (!couponDelete) {
      console.log('Coupon not found');
      return res.status(404).send('Coupon not found')
    }
    res.status(200).json({ message: 'Coupon deleted successfully' })
  } catch (error) {
    console.log(error);

  }
}

const salesReport = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pagelimit = 6;
    const { startDate, endDate, timeRange = 'yearly', status = 'All' } = req.query;

    const filter = {
      orderVerified: true,
      status: 'Delivered',
      ...(startDate && endDate ? { placed: { $gte: new Date(startDate), $lte: new Date(endDate) } } : {})
    };

    const numberoforders = await Order.countDocuments(filter);
    const totalpages = Math.ceil(numberoforders / pagelimit);

    const validpage = Math.min(Math.max(page, 1), totalpages);
    const skip = (validpage - 1) * pagelimit;

    const orders = await Order.find(filter)
    // .sort({ placed: -1 })
    // .skip(skip)
    // .limit(pagelimit);


    const userData = await User.findOne(req.session.user_id);

    const productdata = await product.findOne({ Verified: true });
    const category = await Category.find();

    res.render('salesReport', {
      username: userData.name,
      totalpages,
      page: validpage,
      product: productdata,
      timeRange,
      status,
      orders,
      categories: category
    });

  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server Error');
  }
}

const dailySales = async (req, res) => {
  try {
    const startOfDay = moment().startOf('day').toDate();
    const endOfDay = moment().endOf('day').toDate();

    console.log("From the backend - Day start:", startOfDay);
    console.log("From the backend - Day end:", endOfDay);

    const dailyOrders = await Order.find({
      placed: { $gte: startOfDay, $lte: endOfDay },
      status: "Delivered"
    }).sort({ placed: -1 });

    res.json(dailyOrders);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const weeklySales = async (req, res) => {
  try {
    const startOfWeek = moment().startOf('week').toDate();
    const endOfWeek = moment().endOf('week').toDate();

    console.log("From the backend - Week start:", startOfWeek);
    console.log("From the backend - Week end:", endOfWeek);

    const weeklyOrders = await Order.find({
      placed: { $gte: startOfWeek, $lte: endOfWeek },
      status: "Delivered"
    }).sort({ placed: -1 });

    console.log("From the backend - Weekly Orders:", weeklyOrders);

    res.json(weeklyOrders);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const monthlySales = async (req, res) => {
  try {
    const startOfMonth = moment().startOf('month').toDate();
    const endOfMonth = moment().endOf('month').toDate();

    console.log("From the backend - Month start:", startOfMonth);
    console.log("From the backend - Month end:", endOfMonth);

    const monthOrders = await Order.find({
      placed: { $gte: startOfMonth, $lte: endOfMonth },
      status: "Delivered"
    }).sort({ placed: -1 });

    res.json(monthOrders);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const yearlySales = async (req, res) => {
  try {

    console.log("hi from the yearly");

    const startOfYear = moment().startOf('year').toDate();
    const endOfYear = moment().endOf('year').toDate();

    console.log("From the backend - Year start:", startOfYear);
    console.log("From the backend - Year end:", endOfYear);

    const yearlyOrders = await Order.find({
      placed: { $gte: startOfYear, $lte: endOfYear },
      status: "Delivered"
    }).sort({ placed: -1 });

    res.json(yearlyOrders);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getCustomDate = async (req, res) => {
  try {
    const { start, end } = req.query;
    console.log(req.query, "Received query parameters");

    if (!start || !end) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate) || isNaN(endDate)) {
      return res.status(400).json({ error: 'Invalid date format' });
    }


    if (startDate > endDate) {
      return res.status(400).json({ error: 'End date must be greater than start date' });
    }

    endDate.setHours(23, 59, 59, 999);

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({
      placed: {
        $gte: startDate,
        $lte: endDate
      },
      status: 'Delivered',
      paymentStatus: 'Paid'
    }).skip(skip).limit(limit);


    const totalOrders = await Order.countDocuments({
      placed: {
        $gte: startDate,
        $lte: endDate
      },
      status: 'Delivered'
    });

    const totalPages = Math.ceil(totalOrders / limit);


    res.json({ orders, currentPage: page, totalPages });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



const getAllSales = async (req, res) => {
  try {
    const allDeliveredOrders = await Order.find({
      status: "Delivered",
      paymentStatus: "Paid",
    }).sort({ placed: -1 });

    // console.log("From the backend - All Delivered Orders:", allDeliveredOrders);

    res.json(allDeliveredOrders);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const downloadPdf = async (req, res) => {
  try {
    const doc = new PDFDocument({ margin: 40 }); // Adjust margins if needed
    const { timeRange, startDate, endDate, category = 'all' } = req.query;
    console.log(req.query, 'req.query in downloadpdf');

    let filter = { status: "Delivered" };

    if (timeRange === 'daily') {
      filter.placed = { $gte: moment().startOf('day').toDate(), $lte: moment().endOf('day').toDate() };
    } else if (timeRange === 'weekly') {
      filter.placed = { $gte: moment().startOf('week').toDate(), $lte: moment().endOf('week').toDate() };
    } else if (timeRange === 'monthly') {
      filter.placed = { $gte: moment().startOf('month').toDate(), $lte: moment().endOf('month').toDate() };
    } else if (timeRange === 'yearly') {
      filter.placed = { $gte: moment().startOf('year').toDate(), $lte: moment().endOf('year').toDate() };
    } else if (timeRange === 'custom' && startDate && endDate) {
      filter.placed = {
        $gte: new Date(startDate),
        $lte: moment(endDate).endOf('day').toDate()
      };
    }

    let orderdata = await Order.find(filter).sort({ placed: -1 });
    let productIds = [];
    if (category !== 'all') {
      const products = await product.find({ category: new mongoose.Types.ObjectId(category) });
      productIds = products.map(product => product._id);
    }

    if (productIds.length > 0) {
      filter['product.product'] = { $in: productIds };
    }

    const overallSalesCount = orderdata.length;
    let overallOrderAmount = 0;
    let totalDiscount = 0;
    let totalCouponDeduction = 0;

    const detailedOrders = await Promise.all(orderdata.map(async order => {
      let orderDiscount = 0;
      let orderCouponDeduction = 0;

      const products = await product.find({ _id: { $in: order.product.map(p => p.productId) } });
      products.forEach(product => {
        if (product.offer > 0) {
          const discountAmount = product.offerType === 'percentage'
            ? product.price * (product.offer / 100)
            : product.offer;
          orderDiscount += discountAmount;
        }
      });

      if (order.couponCode) {
        const coupon = await Coupon.findOne({ couponCode: order.couponCode });
        if (coupon) {
          orderCouponDeduction = coupon.offer;
        }
      }

      overallOrderAmount += order.totalPrice;
      totalDiscount += orderDiscount;
      totalCouponDeduction += orderCouponDeduction;

      return {
        ...order._doc,
        orderDiscount,
        orderCouponDeduction
      };
    }));

    const currentdate = new Date();
    const time = currentdate.getTime();
    res.setHeader('Content-Disposition', `attachment; filename="sales_report-${time}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);

    // Center-aligned Title
    doc.fontSize(14).text(`Sales Report - ${currentdate.toLocaleDateString()}`, {
      align: 'center',
      lineGap: 5 // Adjust line gap
    }).moveDown();

    // Center-aligned statistics
    doc.fontSize(12).text(`Overall Sales Count: ${overallSalesCount}`, { align: 'center' }).moveDown();
    doc.fontSize(12).text(`Overall Order Amount: ₹${overallOrderAmount.toFixed(2)}`, { align: 'center' }).moveDown();

    // Table rendering
    const table = {
      headers: ['Order ID', 'Customer Name', 'Date', 'Total', 'Payment Status', 'Payment Method', 'Order Status'],
      rows: detailedOrders.map(order => [
        order.orderId,
        order.address[0].name,
        order.date,
        `₹${order.totalPrice.toFixed(2)}`,
        order.paymentStatus,
        order.paymentMethod,
        order.status
      ])
    };

    doc.table(table, {
      columnSpacing: 10,
      padding: 5,
      columnsSize: [80, 80, 80, 80, 80, 80, 80],
      align: "center",
      columnAlignment: 'center', // Center the content within each column
      prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
      prepareRow: (row, i) => doc.font('Helvetica').fontSize(10),
    });

    doc.end();
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};


const downloadExcel = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    const { timeRange, startDate, endDate, category = 'all' } = req.query;

    console.log('Received query params:', req.query);
    console.log(`Start Date: ${startDate}, End Date: ${endDate}, Time Range: ${timeRange}, Category: ${category}`);

    let filter = { status: "Delivered" };

    if (timeRange === 'daily') {
      filter.placed = { $gte: moment().startOf('day').toDate(), $lte: moment().endOf('day').toDate() };
    } else if (timeRange === 'weekly') {
      filter.placed = { $gte: moment().startOf('week').toDate(), $lte: moment().endOf('week').toDate() };
    } else if (timeRange === 'monthly') {
      filter.placed = { $gte: moment().startOf('month').toDate(), $lte: moment().endOf('month').toDate() };
    } else if (timeRange === 'yearly') {
      filter.placed = { $gte: moment().startOf('year').toDate(), $lte: moment().endOf('year').toDate() };
    } else if (timeRange === 'custom' && startDate && endDate) {
      filter.placed = {
        $gte: new Date(startDate),
        $lte: moment(endDate).endOf('day').toDate()
      };
    }

    console.log('Applied filter:', JSON.stringify(filter, null, 2));

    const orderdata = await Order.find(filter).sort({ placed: -1 });
    console.log(`Number of orders found: ${orderdata.length}`);


    let productIds = [];
    if (category !== 'all') {
      const products = await product.find({ category: new mongoose.Types.ObjectId(category) });
      productIds = products.map(product => product._id);
    }

    if (productIds.length > 0) {
      filter['product.product'] = { $in: productIds };
    }


    // const orderdata = await Order.find(filter).sort({ placed: -1 });

    const overallSalesCount = orderdata.length;
    let overallOrderAmount = 0;
    let totalDiscount = 0;
    let totalCouponDeduction = 0;

    const detailedOrders = await Promise.all(orderdata.map(async order => {
      let orderDiscount = 0;
      let orderCouponDeduction = 0;

      const products = await product.find({ _id: { $in: order.product.map(p => p.productId) } });
      products.forEach(product => {
        if (product.offer > 0) {
          const discountAmount = product.offerType === 'percentage'
            ? product.price * (product.offer / 100)
            : product.offer;
          orderDiscount += discountAmount;
        }
      });

      if (order.couponCode) {
        const coupon = await Coupon.findOne({ couponCode: order.couponCode });
        if (coupon) {
          orderCouponDeduction = coupon.offer;
        }
      }

      overallOrderAmount += order.totalPrice;
      totalDiscount += orderDiscount;
      totalCouponDeduction += orderCouponDeduction;

      return {
        ...order._doc,
        orderDiscount,
        orderCouponDeduction
      };
    }));

    const currentdate = new Date();
    const time = currentdate.getTime();
    res.setHeader('Content-Disposition', `attachment; filename="sales_report-${time}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    worksheet.addRow(['Sales Report', currentdate.toLocaleDateString()]);
    worksheet.addRow([]);
    worksheet.addRow(['Overall Sales Count', overallSalesCount]);
    worksheet.addRow(['Overall Order Amount', `₹${overallOrderAmount.toFixed(2)}`]);
    // worksheet.addRow(['Total Discount', `₹${totalDiscount.toFixed(2)}`]);
    // worksheet.addRow(['Total Coupon Deduction', `₹${totalCouponDeduction.toFixed(2)}`]);
    worksheet.addRow([]);

    worksheet.addRow(['Order ID', 'Customer Name', 'Date', 'Total', 'Payment Status', 'Payment Method', 'Order Status']);

    detailedOrders.forEach(order => {
      worksheet.addRow([
        order.orderId,
        order.address[0].name,
        order.date,
        order.totalPrice.toFixed(2),
        order.paymentStatus,
        order.paymentMethod,
        order.status
      ]);
    });

    worksheet.columns.forEach(column => {
      column.width = 20;
    });

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};

const salesChart = async (req, res) => {
  try {
    const timeRange = req.query.timeRange || 'monthly';

    let dateFormat;
    if (timeRange === 'weekly') {
      dateFormat = { $dateToString: { format: "%Y-%U", date: "$placed" } };
    } else if (timeRange === 'yearly') {
      dateFormat = { $dateToString: { format: "%Y", date: "$placed" } };
    } else {
      dateFormat = { $dateToString: { format: "%Y-%m", date: "$placed" } };
    }

    const saleDate = await Order.aggregate([
      {
        $match: {
          orderVerified: true,
          status: 'Delivered'
        }
      },
      {
        $group: {
          _id: dateFormat,
          totalSales: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const labels = saleDate.map(item => item._id);

    const datasets = [{
      label: 'Sales',
      data: saleDate.map(item => item.totalSales)
    }];

    res.json({ labels, datasets });
  } catch (error) {
    console.error('Error fetching sales chart data:', error);
    res.status(500).json({ error: 'Failed to fetch sales chart data' });
  }
};

const revenueChart = async (req, res) => {
  try {
    const timeRange = req.query.timeRange || 'monthly';

    let dateFormat;
    if (timeRange === 'weekly') {
      dateFormat = { $dateToString: { format: "%Y-%U", date: "$placed" } };
    } else if (timeRange === 'yearly') {
      dateFormat = { $dateToString: { format: "%Y", date: "$placed" } };
    } else {
      dateFormat = { $dateToString: { format: "%Y-%m", date: "$placed" } };
    }

    const revenueData = await Order.aggregate([
      {
        $match: {
          orderVerified: true,
          status: 'Delivered',
          paymentStatus: 'Paid'
        }
      },
      {
        $group: {
          _id: dateFormat,
          totalRevenue: { $sum: "$totalPrice" },
          totalOrders: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const labels = revenueData.map(item => item._id);

    const datasets = [
      {
        label: 'Revenue',
        data: revenueData.map(item => item.totalRevenue),
      },
      {
        label: 'Orders Count',
        data: revenueData.map(item => item.totalOrders),
      }
    ];

    res.json({ labels, datasets });
  } catch (error) {
    console.error('Error fetching revenue chart data:', error);
    res.status(500).json({ error: 'Failed to fetch revenue chart data' });
  }
};


const bestSellingProduct = async () => {
  try {

    const products = await product.find({ is_Active: true })
    const topsellingproduct = await Order.aggregate([
      { $match: { orderVerified: true } },
      { $unwind: "$product" },
      { $group: { _id: "$product", ordersCount: { $sum: 1 } } },
      { $limit: 3 }
    ]);

    for (const product of products) {
      const topproduct = topsellingproduct.find(items => items._id.toString() === product._id.toString())
      if (topproduct) {
        product.ordersCount = topproduct.orderCount;
      } else {
        product.ordersCount = 0
      }
    }

    products.sort((a, b) => b.totalQuantity - a.totalQuantity);

    return products
  } catch (error) {

    console.error('Error fetching top selling products:', error);
    throw new Error('Failed to fetch top selling products');

  }
}

const getRevenueData = async () => {
  try {
    const revenueData = await Order.aggregate([
      {
        $match: {
          orderVerified: true,
          $or: [
            { status: "Delivered" },
            { paymentStatus: "Paid" }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" }
        }
      }
    ]);
    return revenueData[0] ? revenueData[0].totalRevenue : 0;
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return 0;
  }
};

const getReturnReq = async (req, res) => {
  const perPage = 5;
  const page = parseInt(req.query.page) || 1;

  try {
    const returnedOrdersCount = await Order.countDocuments({ status: "Return requested" });
    const totalPages = Math.ceil(returnedOrdersCount / perPage);

    const returnedOrders = await Order.find({ status: "Return requested" })
      .skip((page - 1) * perPage)
      .limit(perPage);

    if (returnedOrders.length === 0) {
      return res.render('return', {
        orders: [],
        users: [],
        status: 'Return Requested',
        currentPage: page,
        totalPages: totalPages,
        message: 'No returned orders found'
      });
    }

    const userIds = [];
    for (let order of returnedOrders) {
      userIds.push(order.userId);
    }

    const users = await User.find({ _id: { $in: userIds } });

    for (let order of returnedOrders) {
      order.productDetails = [];
      for (let productItem of order.product) {
        const productId = productItem.product;
        const productDetail = await product.findById(productId);
        order.productDetails.push(productDetail);
      }
    }

    res.render('return', {
      orders: returnedOrders,
      users: users,
      status: 'Return Requested',
      currentPage: page,
      totalPages: totalPages,
      message: null
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ message: 'Internal Server Error' });
  }
};


const acceptReturn = async (req, res) => {
  try {
    const { id } = req.query;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).send('Order not found');
    }

    order.status = 'Return request Accepted';
    await order.save();

    res.status(200).json({ message: 'Return request accepted' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}

const processReturn = async (req, res) => {
  try {
    const orderId = req.query.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send("Order not found");
    }

    if (order.status !== "Return request Accepted") {
      return res.status(400).send('Return request must be accepted before processing.');
    }

    order.status = "Returned";
    await order.save();

    for (const item of order.product) {
      const productItem = await product.findById(item.product);
      if (productItem) {
        productItem.countInstock += item.quantity;
        await productItem.save();
      }
    }

    if (order.paymentMethod !== 'COD' && order.paymentStatus.toLowerCase() === 'paid'.toLowerCase()) {
      const userId = order.userId;
      let wallet = await Wallet.findOne({ userId: userId });

      if (!wallet) {
        wallet = new Wallet({
          userId: userId,
          balance: 0,
          history: []
        });
      }

      const refundAmount = order.totalPrice;

      if (isNaN(refundAmount) || refundAmount === undefined || refundAmount === null) {
        throw new Error('Invalid totalPrice value');
      }

      wallet.balance += refundAmount;
      wallet.history.push({
        amount: refundAmount,
        type: 'credit',
        reason: 'Order Return'
      });

      await wallet.save();
      console.log("Refund added to wallet");
    }

    res.status(200).send('Product returned and refund processed successfully');
  } catch (error) {
    console.error('Error processing return:', error);
    res.status(500).send('An error occurred while processing the return');
  }
};

const rejectReturn = async (req, res) => {
  try {
    const { id } = req.query;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).send('Order not found');
    }

    order.status = 'Rejected by the admin';
    await order.save();

    res.status(200).json({ message: 'Return request rejected' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}



module.exports = {
  adminLogin,
  adminVerify,
  adminDashboard,
  adminLogout,
  loadUsers,
  blockUser,
  unblockUser,
  listOrders,
  orderDetails,
  updateOrder,
  listCoupon,
  addCoupon,
  deleteCoupon,
  salesReport,
  dailySales,
  weeklySales,
  monthlySales,
  yearlySales,
  getCustomDate,
  getAllSales,
  downloadPdf,
  downloadExcel,
  salesChart,
  revenueChart,
  bestSellingProduct,
  getReturnReq,
  acceptReturn,
  processReturn,
  rejectReturn
}