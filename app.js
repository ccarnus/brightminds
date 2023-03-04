//MongoDB
//mongodb+srv://ccarnus:<password>@cast.xwxgb0o.mongodb.net/?retryWrites=true&w=majority
//totodu30

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();

mongoose.connect('mongodb+srv://ccarnus:totodu30@cast.xwxgb0o.mongodb.net/?retryWrites=true&w=majority')
    .then(() => {
        console.log('Succesully Connected to MongoDB Atlas!');
    })
    .catch((error) => {
        console.log('Unable to connect to MongoDB Atlas');
        console.error(error);
    });

app.use(express.json());
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.post("/cast", (req, res, next) => {
    res.status(200).json({
        message:'received and saved'
    });
});

app.get("/cast", (req, res, next) => {
    res.status(201);
    res.json({message:'here is the cast'});
});

module.exports = app;