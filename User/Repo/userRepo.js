const express = require('express')
const pool = require('../../db')

module.exports.createUser = async (data) => {
    const { name,email,mobile,password } = data

    const query = `
        INSERT INTO users (name,email,mobile,password)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, created_at`

    const values = [name,email,mobile,password] 

    const result = await pool.query(query,values)
    
    try {
        if(result.rows.length > 0){
            console.log("user created successfully:",result.rows[0])
            return result.rows[0]
        }else{
            throw error("user creation failded")
        }
    } catch (error) {
        console.error('Error creating user:', error.message, error.stack);  
        throw error
    }

}

module.exports.findUser = async (data) => {
    const {email} = data
    const query = `SELECT * FROM users WHERE email=$1`
    const values = [email]

    try {
        const result = await pool.query(query, values)
        return result.rows;
    } catch (error) {
        console.error('Error finding user:', error);
        throw error;
    }
}
