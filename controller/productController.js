const product = require('../model/productModel')
const mongoose = require('mongoose');
const category = require('../model/categoryModel');
const Offer = require('../model/offerModel')
const sharp = require('sharp');
const { v4: uuidv4 } = require("uuid")
const fs = require('fs')

const loadProducts = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;
        const limit = 4
        const productData = await product.find()
            .populate('offer')
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        const count = await product.countDocuments()    
        const totalpages =Math.ceil(count/limit)
        res.render('products', { 
            prodData: productData,
            totalpages: totalpages,
            currentpage: page 
        })

    } catch (error) {
        console.log(error);
    }
}

const loadAddProduct = async (req, res) => {
    try {
        const cat = await category.find({})
        res.render('addProduct', { categories: cat })
    } catch (error) {
        console.log(error);
    }
}

const addProduct = async (req, res) => {
    try {
        const { productName, description, category, price, brand, stock } = req.body
        const images = []
        for (const file of req.files) {
            const fileName = `${uuidv4()}.jpg`
            try {
                const img = `${fileName}`
                const path = require('path')
                const outputPath = path.join(__dirname, '../public/uploads', fileName)

                await sharp(file.path)
                    .resize({ height: 640, width: 480 })
                    .toFile(outputPath)

                images.push(img)
                fs.unlink(file.path, (err) => {
                    if (err) {
                        console.error(`Error deleting file: ${err}`);
                    } else {
                        console.log(`File Deleted: ${file.path}`);
                    }
                })
            } catch (sharpError) {
                console.log('Sharp Error:', sharpError);
            }
        }
        const prod = new product({
            productName: productName,
            description: description,
            category: category,
            price: price,
            brand: brand,
            stock: stock,
            images: images
        })
        const prodData = await prod.save()
        if (prodData) {
            res.redirect('/admin/products')
        } else {
            console.log('Error saving product');
        }

    } catch (error) {
        console.log(error);
    }
}

const loadEditProduct = async (req, res) => {
    try {
        const products = await product.findById(req.query.id)
        const categories = await category.find({ _id: products.category })
        const offers = await Offer.find({ is_Active: true })
        const cate = await category.find()
        req.session.proId = req.query.id
        res.render('editProduct', { products, categories, cate, offers })
    } catch (error) {
        console.log(error);
    }
}

const editProduct = async (req, res) => {
    try {
        const { productName, description, category, price, brand, stock, offer } = req.body;
        const uploadedFiles = req.files;

        if (!productName || !description || !category || !price || !brand || !stock) {
            return res.status(400).send('All fields except offer are required.');
        }

        const parsedPrice = parseFloat(price);
        
        const parsedStock = parseInt(stock, 10);

        if (isNaN(parsedPrice) || isNaN(parsedStock)) {
            return res.status(400).send('Price and Stock must be valid numbers.');
        }

        const productId = req.session.proId;
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).send('Invalid Product ID.');
        }

        const editProduct = await product.findById(productId);
        if (!editProduct) {
            return res.status(404).send('Product not found.');
        }

        editProduct.productName = productName;
        editProduct.description = description;
        editProduct.category = category; 
        editProduct.originalPrice = parsedPrice;
        editProduct.brand = brand;
        editProduct.stock = parsedStock;
        

        if (offer && mongoose.Types.ObjectId.isValid(offer)) {
            const offerData = await Offer.findById(offer);

            if (offerData) {
                const offerPercentage = offerData.offerPercentage;

                editProduct.offer = offerData._id;

                if (!editProduct.originalPrice) {
                    editProduct.originalPrice = editProduct.price;
                }

                const originalPrice = editProduct.originalPrice || editProduct.price;
                
                const discountAmount = Math.floor(originalPrice * (offerPercentage / 100));

                editProduct.price = originalPrice - discountAmount;

            } else {
                editProduct.offer = null;
                editProduct.price = editProduct.originalPrice || editProduct.price; 
            }
        } else {
            editProduct.offer = null;
            editProduct.price = editProduct.originalPrice || editProduct.price;
        }

        if (uploadedFiles && uploadedFiles.length > 0) {
            for (const file of uploadedFiles) {
                const fileName = `${uuidv4()}.jpg`;

                try {
                    const outputPath = path.join(__dirname, '../public/uploads', fileName);

                    await sharp(file.path)
                        .resize({ width: 480, height: 640 }) 
                        .toFile(outputPath);

                    editProduct.images.push(fileName);

                    fs.unlink(file.path, (err) => {
                        if (err) {
                            console.error(`Error deleting file: ${err}`);
                        } else {
                            console.log(`File Deleted: ${file.path}`);
                        }
                    });
                } catch (sharpError) {
                    console.error('Sharp Error:', sharpError);
                    return res.status(400).send('Invalid input: Image processing failed.');
                }
            }
        }

        const updatedProduct = await editProduct.save();
        

        if (updatedProduct) {
            res.redirect('/admin/products');
        } else {
            console.log('Error updating product.');
            res.status(500).send('Error updating product.');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
};



const unlistProduct = async (req, res) => {
    try {
        const proId = req.query.id
        const productUnlist = await product.findByIdAndUpdate(proId, { is_Active: false })
        res.redirect('/admin/products')
    } catch (error) {
        console.log(error);
    }
}

const listProduct = async (req, res) => {
    try {
        const proId = req.query.id
        const productList = await product.findByIdAndUpdate(proId, { is_Active: true })
        res.redirect('/admin/products')
    } catch (error) {
        console.log(error);
    }
}

const offerLoad = async (req, res) => {
    try {
        const offerData = await Offer.find()
        if (offerData) {
            res.render('offer', { offers: offerData })
        }
    } catch (error) {
        console.log(error);

    }
}

const offerAdd = async (req, res) => {
    try {
        const { offerName, offerPercentage } = req.body
        const offerData = await Offer.find()
        const existingOffer = await Offer.findOne({ offerName: { $regex: new RegExp('^' + offerName + '$', 'i') } })
        if (existingOffer) {
            res.render('offer', { offereExists: true, offers: offerData })
        } else if (!existingOffer) {
            const offers = new Offer({
                offerName: offerName,
                offerPercentage: offerPercentage
            })
            const savedOffers = await offers.save()
            res.redirect('/admin/offer')
        }
    } catch (error) {
        console.log(error);
    }
}

const deleteOffer = async (req, res) => {
    try {
        const offerId = req.query.id; 

        if (!offerId) {
            return res.status(400).send("Offer ID is missing");
        }

        await Offer.findByIdAndDelete(offerId);

        res.redirect('/admin/offer');
    } catch (error) {
        console.log("Error deleting offer:", error);
        res.status(500).send("Internal Server Error");
    }
};



module.exports = {
    loadProducts,
    loadAddProduct,
    addProduct,
    loadEditProduct,
    editProduct,
    unlistProduct,
    listProduct,
    offerLoad,
    offerAdd,
    deleteOffer
}

