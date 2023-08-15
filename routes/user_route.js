const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/user_controller.js');
const multer = require('../backend/multer-config_user.js');

router.post('/signup', multer, userCtrl.signup);
router.post('/login', userCtrl.login);
router.get('/',userCtrl.getAllUser);
router.get('/:id',userCtrl.getOneUser);
router.delete('/:id', userCtrl.deleteOneUser);
router.put('/:id', multer, userCtrl.updateOneUser);
router.get('/leaderboard/by/score',userCtrl.getAllByScore);
router.post('/add/cast/:id',userCtrl.updateUserAddCastToList);

module.exports = router;