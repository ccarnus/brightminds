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
//add remove content
router.post('/add/content/:id',userCtrl.updateUserAddContentToList);
router.post('/remove/content/:id',userCtrl.updateUserRemoveContentFromList);
router.post('/mark/content/as/answered/:id', userCtrl.markContentAsAnswered);
//Points
router.post('/add/points/:id',userCtrl.updateUserAddPoints);
router.post('/remove/points/:id',userCtrl.updateUserRemovePoints);
//Bookmarks
router.get('/bookmarks/:id', userCtrl.getUserBookmarks);
router.post('/add/bookmarks/:id', userCtrl.addUserBookmark);
router.delete('/remove/bookmarks/:id/:castId', userCtrl.removeUserBookmark);
//Preferences
router.get('/:id/preferences', userCtrl.getUserPreferences);
router.post('/:id/preferences', userCtrl.updateUserPreferences);
//Tracking
router.get('/:id/suggested/for/you',userCtrl.getSuggestedForYou);
router.put('/:id/update/tracking', userCtrl.updateUserTracking);
router.get('/:id/tracking', userCtrl.getUserTracking);
//Virtual Labs
router.get('/:id/virtual/labs',userCtrl.getVirtualLabs);
router.post('/:id/add/member', userCtrl.addVirtualLabMember);
router.delete('/:id/remove/member', userCtrl.removeVirtualLabMember);
router.post('/:id/add/follower', userCtrl.addVirtualLabFollower);
router.delete('/:id/remove/follower', userCtrl.removeVirtualLabFollower);

module.exports = router;