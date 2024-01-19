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
router.post("/comment/:id",article_controller.updateArticleAddComment);
router.post("/like/:id",article_controller.updateArticleAddLike);
router.get("/evaluation/:id",article_controller.getEvaluationForArticle);
//verified status
router.get("/verification/:id",article_controller.getArticleVerification);
router.post("/verification/:id/decrement",article_controller.DecrementArticleVerification);
router.post("/verification/:id/increment",article_controller.IncrementArticleVerification);
//grading
router.get('/:id/grade', article_controller.getArticleGrade);
router.post('/:id/grade', article_controller.updateArticleGrade);
//trending
router.get('/trending/right/now', article_controller.getArticleTrending);

module.exports = router;