//MongoDB
//mongodb+srv://ccarnus:<password>@cast.xwxgb0o.mongodb.net/?retryWrites=true&w=majority
//totodu30

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const castRoutes = require('./routes/cast_route.js');
const userRoutes = require('./routes/user_route.js');
const universityRoutes = require('./routes/university_route.js');
const app = express();
const path = require('path');

mongoose.connect('mongodb+srv://ccarnus:totodu30@cast.xwxgb0o.mongodb.net/?retryWrites=true&w=majority')
    .then(() => {
        console.log('Succesully Connected to MongoDB Atlas!');
    })
    .catch((error) => {
        console.log('Unable to connect to MongoDB Atlas');
        console.error(error);
    });

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.use(bodyParser.json());

app.use('/backend/media/cast_videos', express.static(path.join(__dirname,'/backend/media/cast_videos')));
app.use('/backend/media/profile_pictures', express.static(path.join(__dirname,'/backend/media/profile_pictures')));
app.use('/backend/media/university_icon', express.static(path.join(__dirname,'/backend/media/university_icon')));

app.use('/cast', castRoutes);
app.use('/user', userRoutes);
app.use('/university', universityRoutes);

module.exports = app;