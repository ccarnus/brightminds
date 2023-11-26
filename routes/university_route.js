const express = require('express');
const router = express.Router();
const university_controller = require('../controllers/university_controller.js');
const auth = require('../backend/auth.js');
const multer = require('../backend/multer-config_university.js');

router.post("/", multer, university_controller.createUniversity);
router.get("/", university_controller.getAllUniversity);
router.put('/:id', multer, university_controller.updateOneUniversity);
router.delete('/:id', university_controller.deleteOneUniversity);
router.get("/by/name/:id",university_controller.getOneUniversityByName);

module.exports = router;