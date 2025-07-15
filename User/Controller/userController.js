const express = require('express')
const { passwordHashing,userLoginFunction } = require('../UseCase/userUseCase')

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
    console.log(req.body, "controller")
    const user = await userLoginFunction(data)
    console.log(user,"token")    
    res.json({
        success:true,
        message:'login data',
        result:user
    })
}





module.exports = { userRegistration,userLogin }