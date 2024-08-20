require('dotenv').config()

const config = {
    EMAIL: process.env.EMAIL,
    PASSKEY: process.env.PASSKEY
}

module.exports = {
    config
}