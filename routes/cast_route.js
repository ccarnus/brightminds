const express = require('express');
const router = express.Router();
const cast_controller = require('../controllers/cast_controller.js');
const auth = require('../backend/auth.js');

router.post("/", cast_controller.createCast);
router.get("/", cast_controller.getAllCast);
router.get('/:id', cast_controller.getOneCast);
router.put('/:id', cast_controller.updateOneCast);
router.delete('/:id',  cast_controller.deleteOneCast);
router.get('/category/:id', cast_controller.getAllCastByCategory);

module.exports = router;