const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/user_controller.js');

router.post('/signup', userCtrl.signup);
router.post('/login', userCtrl.login);
router.get('/',userCtrl.getAllUser);
router.get('/:id',userCtrl.getOneUser);
router.delete('/:id', userCtrl.deleteOneUser);
router.put('/:id', userCtrl.updateOneUser);
router.get('/leaderboard/by/score',userCtrl.getAllByScore);

module.exports = router;