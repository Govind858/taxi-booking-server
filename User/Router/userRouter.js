const express = require('express')
const router =  express.Router()
const { userRegistration,userLogin } = require("../../User/Controller/userController")

router.route('/signup').post(userRegistration)
router.route('/signin').post(userLogin)




module.exports = router;