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
router.post('/remove/cast/:id',userCtrl.updateUserRemoveCastToList);
router.post('/add/points/:id',userCtrl.updateUserAddPoints);
router.post('/remove/points/:id',userCtrl.updateUserRemovePoints);
router.get('/bookmarks/:id', userCtrl.getUserBookmarks);
router.post('/add/bookmarks/:id', userCtrl.addUserBookmark);
router.delete('/remove/bookmarks/:id/:castId', userCtrl.removeUserBookmark);
router.post('/mark/cast/as/answered/:id', userCtrl.markCastAsAnswered);
//Preferences
router.get('/:id/suggested/for/you',userCtrl.getSuggestedForYou);
router.get('/:id/preferences', userCtrl.getUserPreferences);


module.exports = router;