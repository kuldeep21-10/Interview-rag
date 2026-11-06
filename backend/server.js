import express from 'express';
import "dotenv/config";
import { app } from './src/app.js';
import { db_connect } from './db.con.js';

const port =  5000;

db_connect()
.then(()=>{
    app.listen(port,()=>{
        console.log("connection successful");
        
    })
})
.catch((err)=>{
    console.log("connection failed err :",err );
    process.exit(1);
})


