const User = require('../models/user_model.js');
const bcrypt = require('bcrypt');

exports.signup = (req, res, next) => {
    bcrypt.hash(req.body.password, 10).then(
        (hash) => {
            const user = new User({
                email: req.body.email,
                password: hash,
                position: req.body.position,
                department: req.body.department
            });
            user.save().then(
                () => {
                    res.status(201).json({response:'User Created.'});
                }
            ).catch(
                (error) => {
                    res.status(500).json({
                        error: error
                    });
                }
            );
        }
    ).catch(
        (error) => {
            res.status(500).json({
                error: error
            });
        }
    );
};

exports.login = (req, res, next) => {
    console.log('loginin');
};