const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const { createUser,findUser,findDriversIn5km } = require('../Repo/driverRepo')
const sendRideRequestToDrivers = require('./sendRideRequestToDrivers')

module.exports.passwordHashing =async (data) =>{
    let {password} = data
    let saltRound = 10
    const hashed = await bcrypt.hash(password,saltRound)
    data.password = hashed
    //console.log(data)
    await createUser(data);
    return data;
}

module.exports.loginFunction = async (data) => {
    let user = await findUser(data)
    let {password} = data;
    console.log('password:',password)
    const isMatch = await bcrypt.compare(password,user[0].password)
    if(!isMatch){   
        throw new Error('invalid password');
    }
    
    let {id} = user[0]
    const token = jwt.sign({id}, "this_is_secretKey", {expiresIn: '1h'})
    let {name} = user[0]
    let {mobile} = user[0]
    let {email} = user[0]
    let userData = {
        id,
        name,
        mobile,
        email,
        token
    }
    return(userData)
}

    const getDistanceAndTime = async (startCor,endCor) => {
        const apiKey =  "5b3ce3597851110001cf62488ce5b566479c459988a877094e2a0746"

        try {
            const response = await axios.post( 'https://api.openrouteservice.org/v2/directions/driving-car',
                {
                    coordinates:[
                        [parseFloat(startCor.lon),parseFloat(startCor.lat)],
                        [parseFloat(endCor.lon),parseFloat(endCor.lat)]
                    ]
                },
                {
                    headers:{
                        Authorization:apiKey,
                        "Content-Type":"application/json"
                    }
                }
            )

            const route = response.data.routes[0]
            const distanceMeters = route.summary.distance
            const durationSeconds = route.summary.duration
            
            const distanceKm = (distanceMeters / 1000).toFixed(2);
            const duration = (durationSeconds / 3600).toFixed(2);


            return {distanceKm, duration }

        } catch (error) {
            console.log(error)
            console.error('Routing error:', error.response?.data || error.message);
    return { error: 'Failed to calculate distance and duration' };
        }
    }


module.exports.findDrivers = async (start,end,io, driverSockets) => {  
    console.log(start,end)
    try {
        const [startRes,endRes] = await Promise.all([
            axios.get('https://nominatim.openstreetmap.org/search',{
                params:{ q: start ,format:'json', limit:1}
            }),
            axios.get('https://nominatim.openstreetmap.org/search',{
                params:{ q:end , format:'json', limit:1}
            })
        ])

        const startCor = startRes.data[0]
        const endCor = endRes.data[0]
        // console.log(startCor.lat,startCor.lon)
        const  pickuplat = startCor.lat
        const pickuplon = startCor.lon
        const dropofflon = endCor.lon
        const dropofflat = endCor.lat

        const pickupCoordinates = {pickuplon,pickuplat}
        const dropoffCoordinates = {dropofflon,dropofflat}

        
            if (!startCor || !endCor) {
      return { error: 'Could not find coordinates for one or both locations' };
    }

           const [routeData, nearbyDrivers] = await Promise.all([
            getDistanceAndTime(startCor, endCor),
            findDriversIn5km(pickuplat, pickuplon)
        ]);

        const {distanceKm} =  routeData 
        const {duration} = routeData
        const minRate = 40
        let fare = minRate * distanceKm

        const ridedetails = {
            start, 
            end,
            pickupCoordinates,
            dropoffCoordinates,
            distanceKm,
            duration,
            fare,
        }

        const acceptedDriver =  await sendRideRequestToDrivers(nearbyDrivers,ridedetails,io, driverSockets)

         return{
            ridedetails,
            acceptedDriver
        }
       
    } catch (error) {
          console.error(error); 
          return {error: 'geocoding is failed'}  
    }    

}