const category = require('../model/categoryModel')
const product = require('../model/productModel')

const loadCategory = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1
        const limit = 4
        const categoryData = await category.find()
            .limit(limit)
            .skip((page - 1) * limit)
            .exec()

        const count = await category.countDocuments()
        const totalpages = Math.ceil(count / limit)

        if (categoryData) {
            res.render('category', {
                categories: categoryData,
                totalpages: totalpages,
                currentpage: page
            })
        }
    } catch (error) {
        console.log(error);
    }
}

const addCategory = async (req, res) => {
    try {
        const { categoryName, description } = req.body
        const categoryData = await category.find()
        const existingCategory = await category.findOne({ categoryName: { $regex: new RegExp('^' + categoryName + '$', 'i') } })
        if (existingCategory) {
            res.render('category', { categoryExists: true, categories: categoryData })
        } else if (!existingCategory) {
            const categories = new category({
                categoryName: categoryName,
                description: description
            })
            const savedCategories = await categories.save()
            res.redirect('/admin/category')
        }
    } catch (error) {
        console.log(error);
    }
}

const loadEditCategory = async (req, res) => {
    try {
        const categories = await category.findById(req.query.id)
        req.session.catId = req.query.id
        res.render('editCategory', { categories })
    } catch (error) {
        console.log(error);
    }
}

const editCategory = async (req, res) => {
    try {
        const { categoryName, description, catId } = req.body
        const categoryData = await category.find()
        const existingCategory = await category.findOne({ _id: { $ne: catId }, categoryName: { $regex: new RegExp('^' + categoryName + '$', 'i') } })
        if (existingCategory) {
            res.redirect('/admin/category?message=Category already exists&type=error')
        } else {
            const updated = await category.findByIdAndUpdate({ _id: req.session.catId }, { $set: { categoryName, description } })
            res.redirect('/admin/category?message=Category updated successfully&type=success')
        }
    } catch (error) {
        console.log(error);
    }
}

const categoryUnlist = async (req, res) => {
    try {
        const catId = req.query.id
        const categoryUnlist = await category.findByIdAndUpdate(catId, { is_Active: false })
        res.redirect('/admin/category')
    } catch (error) {
        console.log(error);
    }
}

const categoryList = async (req, res) => {
    try {
        const catId = req.query.id
        const categoryList = await category.findByIdAndUpdate(catId, { is_Active: true })
        res.redirect('/admin/category')
    } catch (error) {
        console.log(error);
    }
}


module.exports = {
    loadCategory,
    addCategory,
    loadEditCategory,
    editCategory,
    categoryUnlist,
    categoryList
}