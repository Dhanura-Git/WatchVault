const product = require('../model/productModel')
const category = require('../model/categoryModel');
const sharp = require('sharp');
const { v4: uuidv4 } = require("uuid")
const fs = require('fs')

const loadProducts = async (req, res) => {
    try {
        const productData = await product.find()
        res.render('products', { prodData: productData })
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
        //for image processing and resizing
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
                // throw new Error('Invalid input: Sharp failed to process the image')
            }
        }
        //adding new product
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
        console.log(products, 'proo');
        const categories = await category.find({ _id: products.category })
        const cate = await category.find()
        console.log(categories, 'cateee');
        req.session.proId = req.query.id
        res.render('editProduct', { products, categories, cate })
    } catch (error) {
        console.log(error);
    }
}

const editProduct = async (req, res) => {
    try {
        const { productName, description, category, price, brand, stock } = req.body
        const images = req.files
        const editProduct = await product.findOne({ _id: req.session.proId })
        editProduct.productName = productName;
        editProduct.description = description;
        editProduct.category = category;
        editProduct.price = price;
        editProduct.brand = brand;
        editProduct.stock = stock;
        console.log(editProduct, 'editprod');

        if (images && images.length > 0) {
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
                    throw new Error('Invalid input: Sharp failed to process the image')
                }
            }
        }

        const updatedProduct = await editProduct.save()

        console.log(updatedProduct, 'update[proo');

        if (updatedProduct) {
            res.redirect('/admin/products')
        } else {
            console.log("Error updating product.");
            res.status(500).send("Error updating product.");
        }



    } catch (error) {
        console.log(error);
    }
}

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

module.exports = {
    loadProducts,
    loadAddProduct,
    addProduct,
    loadEditProduct,
    editProduct,
    unlistProduct,
    listProduct
}

