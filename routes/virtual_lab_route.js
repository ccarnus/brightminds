const express = require('express');
const router = express.Router();
const virtualLabCtrl = require('../controllers/virtual_lab_controller.js');
const multer = require('../backend/multer-config_virtuallab.js');

router.post('/', multer, virtualLabCtrl.createVirtualLab);
router.get('/',virtualLabCtrl.getAllVirtualLabs);
router.get('/:id',virtualLabCtrl.getOneVirtualLab);
router.delete('/:id', virtualLabCtrl.deleteOneVirtualLab);
router.put('/:id', multer, virtualLabCtrl.updateOneVirtualLab);
//Topics
router.post('/:id/add/topic', virtualLabCtrl.addTopic);
router.put('/:labId/update/topic/:topicId', virtualLabCtrl.updateTopic);
router.delete('/:labId/remove/topic/:topicId', virtualLabCtrl.removeTopic);

module.exports = router;