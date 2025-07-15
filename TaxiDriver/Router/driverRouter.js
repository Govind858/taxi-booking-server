const express = require('express')
const router =  express.Router()
const { userRegistration,userLogin,addvechicle,findAvailableDrivers,createRide } = require("../../TaxiDriver/Controller/driverController")

router.route('/signup').post(userRegistration)
router.route('/signin').post(userLogin)
router.route('/vechicle').post(addvechicle)
router.route('/nearby').get(findAvailableDrivers)
router.route('/ride').post(createRide)



module.exports = router;