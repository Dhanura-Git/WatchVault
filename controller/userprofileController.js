const User = require('../model/userModel')
const Address = require('../model/addressModel')

const loadProfile = async (req, res) => {
    try {
        const userId = req.session.user
        const Iamuser = req.session.user
        const userData = await User.findOne({ _id: userId })
        const cartData = await User.findOne({ userId: userId })
        const addressData = await Address.findOne({userId: userId})
        res.render('profile', { user: req.session.user, userData, Iamuser, addressData })
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
        console.log(req.body,"body address");
        
        let userAddress = await Address.findOne({ userId: userData._id })
        console.log(userAddress,'fslkdjfsl');
        
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

const editAddress = async(req,res)=>{
    try {
        const addressId = req.query.id
        const userId = req.session.user
        const addressEdit = await Address.findOne({userId:userId, 'Address._id':addressId})
        if(!addressEdit){
            return res.status(404).send('no addressId error')
        }
        res.render('editAddress',{addressEdit})
    } catch (error) {
        console.log(error)
    }
}

const updateAddress = async(req, res)=>{
    try {
        const userId = req.session.user
        const addressId = req.query.id 
        const userAddress = await Address.findOneAndUpdate(
            {userId:userId,'Address._id':addressId},
            {
                $set:{
                    'Address.$.name':req.body.name,
                    'Address.$.address':req.body.address,
                    'Address.$.addressType':req.body.addressType,
                    'Address.$.city':req.body.city,
                    'Address.$.state':req.body.state,
                    'Address.$.country':req.body.country,
                    'Address.$.pincode':req.body.pincode,
                    'Address.$.phone':req.body.phone,
                    'Address.$.altphone':req.body.altphone
                }
            },
            {new:true}
        )
        res.redirect('/profile')
    } catch (error) {
        console.log(error);
    }
}

const deleteAddress = async(req, res)=>{
    try {
        const addressId = req.query.id
        const deleteAddress = await Address.findOne({'Address._id':addressId})
        await Address.updateOne(
            {'Address._id':addressId},
            {
                $pull:{
                    'Address':{
                        _id:addressId
                    }
                }
            }
        )
        res.redirect('/profile')
    } catch (error) {
        console.log(error);
        
    }
}

module.exports = {
    loadProfile,
    loadAddAddress,
    addAddress,
    editAddress,
    updateAddress,
    deleteAddress
}