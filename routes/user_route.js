const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/user_controller.js');

router.post('/signup', userCtrl.signup);
router.post('/login', userCtrl.login);