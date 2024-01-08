const express = require('express');
const router = express.Router();
const virtualLabCtrl = require('../controllers/virtual_lab_controller.js');

router.post('/', virtualLabCtrl.createVirtualLab);
router.get('/',virtualLabCtrl.getAllVirtualLabs);
router.get('/:id',virtualLabCtrl.getOneVirtualLab);
router.delete('/:id', virtualLabCtrl.deleteOneVirtualLab);
router.put('/:id', virtualLabCtrl.updateOneVirtualLab);
//Topics
router.post('/:id/add/topic', virtualLabCtrl.addTopic);

module.exports = router;