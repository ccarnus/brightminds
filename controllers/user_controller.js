const User = require('../models/user_model.js');
const bcrypt = require('bcrypt');
const emailVerificator = require('../backend/email_verificator.js');
const jwt = require('jsonwebtoken');

exports.signup = (req, res, next) => {
    if(!emailVerificator(req.body.email)) {
        return res.status(400).json({
            error: "The email domain name id not a valid one."
        });
    }
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
    User.findOne({email: req.body.email}).then(
        (user) => {
            if(!user) {
                return res.status(401).json({
                    response: 'user not found.'
                });
            }
            bcrypt.compare(req.body.password,user.password).then(
                (valid) => {
                    if(!valid) {
                        return res.status(401).json({
                            response: 'incorrect password'
                        });
                    }
                    const token = jwt.sign(
                        {userId: user._id},
                        'RANDOM_TOKEN_SECRET',
                        {expiresIn: '24h'});
                    res.status(200).json({
                        userId: user._id,
                        email: user.email,
                        token: token
                    });
                }
            ).catch((error) => {
                res.status(500).json({
                    error: error
                });
            })
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error : error
            });
        }
    );
};


exports.getAllUser = (req, res, next) => {
    User.find().select('email position department').then(
        (users) => {
            res.status(200).json(
                users
            );
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
}

exports.getOneUser = (req, res, next) => {
    User.findOne({
        email:req.params.id
    }).select('email position department').then(
        (user) => {
            res.status(200).json(user);
        }
    ).catch((error) => {
        res.status(400).json({
            error: error
        });
    });
}

exports.updateOneUser = (req, res, next) => {

}

exports.deleteOneUser = (req, res, next) => {
    User.deleteOne({email: req.params.id}).then(
        () => {
            res.status(200).json({
                response: "user removed."
            });
        }
    ).catch((error) => {
        res.status(404).json({
            error: error
        });
    });
}