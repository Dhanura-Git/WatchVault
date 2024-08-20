const mongoose = require('mongoose')
require('dotenv').config()
const path = require('path')

const express = require('express')
const app = express()

const nocache = require('nocache')
app.use(nocache())

const session = require('express-session')

const userRoute = require('./routes/userRoute')
const adminRoute = require('./routes/adminRoute')

mongoose.connect(process.env.mongoUrl)
    .then(() => {
        console.log('Db working')
    })
    .catch((error) => {
        console.log(error)
    })

app.use('/public', express.static('public'));

//for parsing body data
app.use(express.json())

app.use(express.urlencoded({ extended: true }))

app.use(express.static(path.join(__dirname, 'public')))

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(session({
    secret: process.env.secret,
    resave: false,
    saveUninitialized: true
}))

app.use('/', userRoute)
app.use('/admin', adminRoute)

app.use((err, req, res, next) => {
    console.log(err.stack)
    res.status(500).send('Server broke')
})

const PORT = process.env.PORT

app.use((req, res, next) => {
    if (req.url.startsWith('/admin')) {
        res.status(404).render('admin404')
    } else {
        res.status(404).render('404')
    }
})

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`)
})