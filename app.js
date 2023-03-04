//MongoDB
//mongodb+srv://ccarnus:<password>@cast.xwxgb0o.mongodb.net/?retryWrites=true&w=majority
//totodu30

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();

const Cast = require('./models/cast.js');

mongoose.connect('mongodb+srv://ccarnus:totodu30@cast.xwxgb0o.mongodb.net/?retryWrites=true&w=majority')
    .then(() => {
        console.log('Succesully Connected to MongoDB Atlas!');
    })
    .catch((error) => {
        console.log('Unable to connect to MongoDB Atlas');
        console.error(error);
    });

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.post("/cast", (req, res, next) => {
    const cast = new Cast({
        title: req.body.title,
        description: req.body.description,
        department: req.body.department,
        type: req.body.type,
        brightmindid: req.body.brightmindid,
        casturl: req.body.casturl,
        universitylogourl: req.body.universitylogourl
    });
    cast.save().then(
        () => {
            res.status(201).json({response:'Cast Casted.'})
        }
    ).catch((error) => {
        res.status(400).json({
            error: error
        });
    });
});

app.get("/cast", (req, res, next) => {
    Cast.find().then(
        (casts) => {
            res.status(200).json(casts);
        }
    ).catch((error) => {
        res.status(400).json({
            error: error
        });
    });
});

app.get('/cast/:id', (req, res, next) => {
    Cast.findOne({
        _id:req.params.id
    }).then(
        (cast) => {
            res.status(200).json(cast);
        }
    ).catch((error) => {
        res.status(404).json({
            error: error
        });
    });
});

app.put('/cast/:id', (req, res, next) => {
    const cast = new Cast({
        _id:req.params.id,
        title: req.body.title,
        description: req.body.description,
        department: req.body.department,
        type: req.body.type,
        brightmindid: req.body.brightmindid,
        casturl: req.body.casturl,
        universitylogourl: req.body.universitylogourl
    });
    Cast.updateOne({_id:req.params.id}, cast)
    .then(() => {
        res.status(201).json({
            response: "message updated"
        })})
    .catch((error) => {
        res.status(400).json({
            error: error
        });
    });
});

app.delete('/cast/:id', (req, res, next) => {
    Cast.deleteOne({_id:req.params.id}).then(() => {
        res.status(200).json({
            response: 'Cast Deleted'
        });
    }).catch((error) => {
        res.status(404).json({
            error: error
        });
    })
});

module.exports = app;