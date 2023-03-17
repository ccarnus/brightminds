const express = require('express');
const router = express.Router();
const cast_controller = require('../controllers/cast_controller.js');
const auth = require('../backend/auth.js');

router.post("/", cast_controller.postOne);
router.get("/", cast_controller.getAll);
router.get('/:id', cast_controller.getOne);
router.put('/:id', cast_controller.updateOne);
router.delete('/:id',  cast_controller.deleteOne);

module.exports = router;