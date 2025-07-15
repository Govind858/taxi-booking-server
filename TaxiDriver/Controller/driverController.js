const express = require('express')
const { passwordHashing,loginFunction,findDrivers, } = require('../UseCase/driverUseCase')
const { createVechicle,saveRide } = require("../Repo/driverRepo")
const axios = require('axios')

const userRegistration = async (req,res) =>{
    console.log(req.body,"arrived")
    let data = req.body;
    const result = await passwordHashing(data);
    console.log(result,"data in controller")
    res.json({
        success:'true',
        message:'user registration successfull',
        result: data

    })
    
}

const userLogin = async (req,res) => {
    const data = req.body
    const user = await loginFunction(data)
    console.log(user,"token")    
    res.json({
        success:true,
        message:'login data',
        result:user
    })
}

const addvechicle = async (req,res) => {
    const data  = req.body
    console.log(data)
    const  vechile = await createVechicle(data)
    res.json({
        success:true,
        message:'successfully add vechile data',
        result:vechile
    })
}
 
const findAvailableDrivers = async (req,res) => {
    const { start,end } = req.query
    if(!start || !end){
        return res.status(400).json({error:"both location are required"})
        }

    const availableDrivers = await findDrivers(start, end, req.io, req.driverSockets)
    res.json({
        success:true,
        message:"successfully fetched available drivers",
        availableDrivers
    })
}

const createRide = async (req,res) => {
    const data = req.body
    console.log('request is received',data)
    const ride = await saveRide(data)
    res.json({
        success:false,
        message:"successfully save ride in db",
        ride
    })
}





module.exports = { userRegistration,userLogin,addvechicle,findAvailableDrivers,createRide }