const Article = require('../models/article_model.js');
const generateEvaluation = require('../backend/generate_question');
const generateCastImage = require('../backend/generate_cast_image');

exports.createArticle = async (req, res, next) => {
    try {
        const url = req.protocol + "://" + req.get('host');

        const evaluation = await generateEvaluation(req.body.articleDescription); // Directly use req.body.articleDescription
        if (!evaluation) {
            return res.status(400).json({
                error: 'Failed to generate evaluation'
            });
        }

        const imagePath = await generateCastImage(req.body.articleDescription); // Directly use req.body.articleDescription
        if (!imagePath) {
            return res.status(400).json({
                error: 'Failed to generate article image'
            });
        }
        const articleImageURL = url + imagePath.replace(/^.*\/backend/, '/backend');

        const article = new Article({
            ...req.body,
            articleimageurl: articleImageURL,
            evaluation: evaluation
        });

        article.save().then(() => {
            res.status(201).json({ response: 'Article Created.' });
        }).catch((error) => {
            res.status(400).json({
                error: error
            });
        });
    } catch (error) {
        console.error('Error creating article:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};



exports.getAllArticle = (req, res, next) => {
    Article.find().sort({ _id: 1 }).then(
        (articles) => {
            res.status(200).json(articles);
        }
    ).catch((error) => {
        res.status(400).json({
            error: error
        });
    });
};

exports.getOneArticle = (req, res, next) => {
    Article.findOne({
        _id: req.params.id
    }).then(
        (article) => {
            res.status(200).json(article);
        }
    ).catch((error) => {
        res.status(404).json({
            error: error
        });
    });
};

exports.updateOneArticle = (req, res, next) => {
    const article = {
        _id: req.params.id,
        ...req.body
    };

    Article.updateOne({_id: req.params.id}, article)
    .then(() => {
        res.status(201).json({
            response: "Article updated"
        })})
    .catch((error) => {
        res.status(400).json({
            error: error
        });
    });
};

exports.deleteOneArticle = (req, res, next) => {
    Article.deleteOne({_id: req.params.id}).then(() => {
        res.status(200).json({
            response: 'Article Deleted'
        });
    }).catch((error) => {
        res.status(404).json({
            error: error
        });
    });
};

exports.getAllArticleByCategory = (req, res, next) => {
    Article.find({ category: { $exists: true, $eq: req.params.id } }).sort({ _id: 1 }).then(
        (articles) => {
            res.status(200).json(articles);
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
};

exports.getAllArticleByDepartment = (req, res, next) => {
    Article.find({ department: { $exists: true, $eq: req.params.id } }).sort({ _id: 1 }).then(
        (articles) => {
            res.status(200).json(articles);
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
};

exports.getAllArticleByBrightmindid = (req, res, next) => {
    Article.find({ brightmindid: { $exists: true, $eq: req.params.id } }).sort({ _id: 1 }).then(
        (articles) => {
            res.status(200).json(articles);
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
};

exports.updateArticleAddComment = (req, res, next) => {
    const author = req.body.author;
    const content = req.body.content;

    if (!author || !content) {
        return res.status(400).json({
            error: "Both 'author' and 'content' fields are required."
        });
    }

    Article.updateOne(
        { _id: req.params.id },
        {
            $inc: { "comments.count": 1 },
            $push: {
                "comments.comment": {
                    author: author,
                    content: content
                }
            }
        }
    )
    .then(() => {
        res.status(201).json({
            response: "comment added"
        })})
    .catch((error) => {
        res.status(400).json({
            error: error
        });
    });
};

exports.updateArticleAddLike = (req, res, next) => {
    const userID = req.body.email;
    Article.updateOne(
        { _id: req.params.id },
        { $inc: { "likes.count": 1 },
          $push: {"likes.user": userID}}
      )
    .then(() => {
        res.status(201).json({
            response: "like added"
        })})
    .catch((error) => {
        res.status(400).json({
            error: error
        });
    });
};

exports.getEvaluationForArticle = (req, res, next) => {
    const articleId = req.params.id;

    Article.findById(articleId)
        .then((article) => {
            if (!article) {
                return res.status(404).json({ message: 'Article not found.' });
            }

            const evaluation = article.evaluation || '';
            res.status(200).json({ evaluation });
        })
        .catch((error) => {
            res.status(500).json({ error: 'An error occurred.' });
        });
};

exports.getArticleVerification = (req, res, next) => {
    Article.findById(req.params.id)
        .then(article => {
            if (!article) {
                return res.status(404).json({ message: 'Article not found.' });
            }
            res.status(200).json({ 
                verificationStatus: article.verificationStatus.status,
                approvals: article.verificationStatus.approvals,
                approvers_id: article.verificationStatus.approvers_id,
                disapprovers_id: article.verificationStatus.disapprovers_id
            });
        })
        .catch(error => {
            res.status(500).json({ error: 'An error occurred.' });
        });
};

exports.IncrementArticleVerification = (req, res, next) => {
    const userId = req.body.userId;
    Article.findById(req.params.id)
        .then(article => {
            if (!article) {
                return res.status(404).json({ message: 'Article not found.' });
            }
            if (!article.verificationStatus.approvers_id.includes(userId)) {
                if (article.verificationStatus.disapprovers_id.includes(userId)) {
                    article.verificationStatus.disapprovers_id.pull(userId);
                    article.verificationStatus.approvals += 1;
                }
                article.verificationStatus.approvals += 1;
                article.verificationStatus.approvers_id.push(userId);
                article.save()
                    .then(() => res.status(200).json({ message: 'Verification incremented.' }))
                    .catch(error => res.status(400).json({ error: 'Unable to update verification.' }));
            } else {
                res.status(400).json({ message: 'User has already approved this article.' });
            }
        })
        .catch(error => {
            res.status(500).json({ error: 'An error occurred.' });
        });
};

exports.DecrementArticleVerification = (req, res, next) => {
    const userId = req.body.userId;
    Article.findById(req.params.id)
        .then(article => {
            if (!article) {
                return res.status(404).json({ message: 'Article not found.' });
            }
            if (!article.verificationStatus.disapprovers_id.includes(userId)) {
                if (article.verificationStatus.approvers_id.includes(userId)) {
                    article.verificationStatus.approvers_id.pull(userId);
                    article.verificationStatus.approvals -= 1;
                }
                article.verificationStatus.disapprovers_id.push(userId);
                article.save()
                    .then(() => res.status(200).json({ message: 'Disapproval recorded.' }))
                    .catch(error => res.status(400).json({ error: 'Unable to update disapproval.' }));
            } else {
                res.status(400).json({ message: 'User has already disapproved this article.' });
            }
        })
        .catch(error => {
            res.status(500).json({ error: 'An error occurred.' });
        });
};

exports.getArticleGrade = (req, res, next) => {
    Article.findById(req.params.id)
        .then(article => {
            if (!article) {
                return res.status(404).json({ message: 'Article not found.' });
            }
            res.status(200).json({ grade: article.grade });
        })
        .catch(error => {
            res.status(500).json({ error: 'An error occurred.' });
        });
};

exports.updateArticleGrade = (req, res, next) => {
    const action = req.body.action;

    if (action !== '+' && action !== '-') {
        return res.status(400).json({ message: 'Invalid action.' });
    }

    Article.findById(req.params.id)
        .then(article => {
            if (!article) {
                return res.status(404).json({ message: 'Article not found.' });
            }

            if (action === '+') {
                article.grade.value = ((article.grade.value * article.grade.count) + 10) / (article.grade.count + 1);
            } else {
                article.grade.value = ((article.grade.value * article.grade.count)) / (article.grade.count + 1);
            }
            article.grade.count += 1;

            article.save()
                .then(() => res.status(200).json({ message: 'Grade updated.', grade: article.grade }))
                .catch(error => res.status(400).json({ error: 'Unable to update grade.' }));

        })
        .catch(error => {
            res.status(500).json({ error: 'An error occurred.' });
        });
};

exports.getArticleTrending = (req, res, next) => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    Article.find({ dateAdded: { $gte: twoWeeksAgo } })
        .sort({ 'grade.value': -1 })
        .then(
            (articles) => {
                res.status(200).json(articles);
            }
        )
        .catch(
            (error) => {
                res.status(400).json({
                    error: error
                });
            }
        );
};

