const express = require('express');
const router = express.Router();
const article_controller = require('../controllers/article_controller.js');

router.post("/", article_controller.createArticle);
router.get("/", article_controller.getAllArticle);
router.get('/:id', article_controller.getOneArticle);
router.put('/:id', article_controller.updateOneArticle);
router.delete('/:id',  article_controller.deleteOneArticle);
router.get('/category/:id', article_controller.getAllArticleByCategory);
router.get('/department/:id', article_controller.getAllArticleByDepartment);
router.get("/brightmindid/:id", article_controller.getAllArticleByBrightmindid);
router.get("/evaluation/:id",article_controller.getEvaluationForArticle);
//grading
router.get('/:id/rating', article_controller.getArticleRating);
router.post('/:id/rating', article_controller.updateArticleRating);
//trending
router.get('/trending/right/now', article_controller.getArticleTrending);

module.exports = router;