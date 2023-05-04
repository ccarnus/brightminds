const express = require('express');
const router = express.Router();
const cast_controller = require('../controllers/cast_controller.js');
const auth = require('../backend/auth.js');
const multer = require('../backend/multer-config_cast.js');

router.post("/", multer, cast_controller.createCast);
router.get("/", cast_controller.getAllCast);
router.get('/:id', cast_controller.getOneCast);
router.put('/:id', multer, cast_controller.updateOneCast);
router.delete('/:id',  cast_controller.deleteOneCast);
router.get('/category/:id', cast_controller.getAllCastByCategory);
router.get("/brightmindid/:id", cast_controller.getAllCastByBrightmindid);

module.exports = router;