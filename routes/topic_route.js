const express = require('express');
const router = express.Router();
const topic_controller = require('../controllers/topic_controller.js');

router.post('/', topic_controller.createTopic);
router.get('/department/:departmentId', topic_controller.getTopicsByDepartment);
router.get('/:id', topic_controller.getOneTopic);
router.put('/:id', topic_controller.updateTopic);
router.get('/', topic_controller.getAllTopics);

module.exports = router;
