const User = require('../models/user_model.js');
const bcrypt = require('bcrypt');
const emailVerificator = require('../backend/email_verificator.js');
const jwt = require('jsonwebtoken');
const fs = require('fs');

exports.signup = (req, res, next) => {
    req.body.user = JSON.parse(req.body.user);
    if(!emailVerificator(req.body.user.email)) {
        return res.status(400).json({
            error: "The email domain name id not a valid one."
        });
    }
    bcrypt.hash(req.body.user.password, 10).then(
        (hash) => {
            const url = req.protocol + "://" + req.get('host');
            const user = new User({
                email: req.body.user.email,
                password: req.body.user.password,
                username: req.body.user.username,
                role: req.body.user.role,
                department: req.body.user.department,
                score: req.body.user.score,
                profilePictureUrl: url + '/backend/media/profile_pictures/' + req.file.filename,
            });
            user.save().then(
                () => {
                    res.status(201).json({response:'User Created.'});
                }
            ).catch(
                (error) => {
                    res.status(501).json({
                        error: error
                    });
                }
            );
        }
    ).catch(
        (error) => {
            res.status(501).json({
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
    User.find().select('_id email username role department score profilePictureUrl').then(
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
        _id:req.params.id
    }).select('_id email username role department score profilePictureUrl').then(
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
    let user = new User({_id: req.params._id});
    if (req.file) {
        const url = req.protocol + "://" + req.get('host');
        req.body.user = JSON.parse(req.body.user);
        user = {
            _id: req.params.id,
            email: req.body.user.email,
            username: req.body.user.username,
            role: req.body.user.role,
            department: req.body.user.department,
            score: req.body.user.score,
            profilePictureUrl: url + '/backend/media/profile_pictures/' + req.file.filename,
        };
    } else {
        user = {
            _id: req.params.id,
            email: req.body.email,
            username: req.body.username,
            role: req.body.role,
            department: req.body.department,
            score: req.body.score,
            profilePictureUrl: req.body.profilePictureUrl
        };
    }
    User.updateOne({_id:req.params.id}, user).then(
        (user) => {
            res.status(200).json({
                response: 'User updated.'
            });
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error : error
            });
        }
    );
}

exports.deleteOneUser = (req, res, next) => {
    User.findOne({_id:req.params.id}).then(
        (user) => {
            const filename = user.profilePictureUrl.split('/backend/media/profile_pictures/')[1];
            fs.unlink('./backend/media/profile_pictures/' + filename, () => {
                User.deleteOne({_id: req.params.id}).then(
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
            })
        }
    )
}

exports.getAllByScore = (req, res, next) => {
    User.find().select('_id email username role department score profilePictureUrl').sort({score: -1}).then(
        (users) => {
            res.status(200).json(users);
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
}