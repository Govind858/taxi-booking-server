const express = require('express')
const pool = require('../../db')


module.exports.createUser = async (data) => {
    const { name, email, mobile, password, vech_number, model, color } = data;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Insert driver
        const driverQuery = `
            INSERT INTO drivers (name, email, mobile, password)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, email, created_at`;
        const driverValues = [name, email, mobile, password];
        const driverResult = await client.query(driverQuery, driverValues);

        if (driverResult.rows.length === 0) {
            throw new Error('User creation failed');
        }

        const driver = driverResult.rows[0];

        // Insert vehicle
        const vehicleQuery = `
            INSERT INTO vehicles (driver_id, vech_number, model, color)
            VALUES ($1, $2, $3, $4)
            RETURNING id, vech_number, model, color`;
        const vehicleValues = [driver.id, vech_number, model, color];
        const vehicleResult = await client.query(vehicleQuery, vehicleValues); // ✅

        if (vehicleResult.rows.length === 0) {
            throw new Error('Vehicle creation failed');
        }

        await client.query('COMMIT'); // ✅ use client

        return {
            driver,
            vehicle: vehicleResult.rows[0],
        };
    } catch (error) {
        await client.query('ROLLBACK'); // ✅ use client
        console.error('Error creating user and vehicle:', error.message, error.stack);
        throw error;
    } finally {
        client.release(); // ✅ release client
    }
};


module.exports.findUser = async (data) => {
    const {email} = data
    const query = `SELECT * FROM drivers WHERE email=$1`
    const values = [email]

    try {
        const result = await pool.query(query, values)
        return result.rows;
    } catch (error) {
        console.error('Error finding user:', error);
        throw error;
    }
}

module.exports.createVechicle = async (data) => {
    const {driver_id,model,color,vech_number} = data
    const query = `INSERT INTO vehicles (driver_id,model,color,vech_number)
                   VALUES ($1,$2,$3,$4) 
                   RETURNING driver_id,model,color,vech_number`
    const values = [driver_id,model,color,vech_number]              
          
    try {
        const response = await pool.query(query,values)
        return response.rows;
    } catch (error) {
        console.error("error at adding vechicle data",error)
        throw error
    }
}

module.exports.findDriversIn5km = async (pickuplat, pickuplon) => {
    const query = `
        SELECT
            id,
            name,
            ST_X(location) AS longitude,
            ST_Y(location) AS latitude,
            ST_Distance(location::geography, ST_MakePoint($1, $2)::geography) AS distance
        FROM drivers
        WHERE ST_Distance(location::geography, ST_MakePoint($1, $2)::geography) <= 5 * 1000
            AND is_available = true
        ORDER BY distance ASC`;
    
    const values = [pickuplon, pickuplat];
    
    try {
        const response = await pool.query(query, values);
        
        if (response.rows.length === 0) {
            return { result: "no drivers available" };
        }
        
        return response.rows;
        
    } catch (error) {
        console.error('Error finding drivers:', error);
        return { error: "Failed to fetch drivers" };
    }
};

module.exports.saveRide = async (data) => {
  const {
    userId,
    driverId,
    pickup_location,
    dropoff_location,
    Pickup_coordinates, // { lat, lon }
    dropoff_coordinates, // { lat, lon }
    fare,
    distance,
    duration
  } = data;

  const query = `
    INSERT INTO rides (
      user_id,
      driver_id,
      pickup_location,
      dropoff_location,
      pickup_coordinates,
      dropoff_coordinates,
      fare,
      distance,
      duration
    )
    VALUES (
      $1, $2, $3, $4,
      ST_SetSRID(ST_MakePoint($5, $6), 4326),
      ST_SetSRID(ST_MakePoint($7, $8), 4326),
      $9, $10, $11
    )
    RETURNING
      id,
      user_id,
      driver_id,
      pickup_location,
      dropoff_location,
      ST_AsText(pickup_coordinates) AS pickup_geom,
      ST_AsText(dropoff_coordinates) AS dropoff_geom,
      fare,
      distance,
      duration
  `;

  const rideValues = [
    userId,
    driverId,
    pickup_location,
    dropoff_location,
    Pickup_coordinates.lon,
    Pickup_coordinates.lat,
    dropoff_coordinates.lon,
    dropoff_coordinates.lat,
    fare,
    distance,
    duration
  ];

  const rideresult = await pool.query(query, rideValues);
  console.log(rideresult.rows[0])
  return rideresult.rows[0];
};
