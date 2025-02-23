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
router.get('/department/:id', cast_controller.getAllCastByDepartment);
router.get("/brightmindid/:id", cast_controller.getAllCastByBrightmindid);
router.get("/evaluation/:id",cast_controller.getEvaluationForCast);
router.get('/simplified', cast_controller.getSimplifiedCast);

//rating
router.get('/:id/rating', cast_controller.getCastRating);
router.post('/:id/rating', cast_controller.updateCastRating);
//trending
router.get('/trending/right/now', cast_controller.getCastTrending);
//by department
router.get('/department/:id', cast_controller.getAllCastByDepartment);
//Most popular departments
router.get('/popular/department', cast_controller.getPopularDepartment);

module.exports = router;