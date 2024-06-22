const Article = require('../models/article_model.js');
const generateEvaluation = require('../backend/generate_question');
const generateArticleImage = require('../backend/generate_article_image');
const fs = require('fs');
const User = require('../models/user_model.js');
const departments = require('../lists/departments.js');

const isValidDepartment = (department) => departments.includes(department);

exports.createArticle = async (req, res, next) => {
    try {
        const url = req.protocol + "://" + req.get('host');

        if (!isValidDepartment(req.body.department)) {
            return res.status(400).json({
                error: 'Invalid department'
            });
        }

        const evaluation = await generateEvaluation(req.body.articleDescription); // Directly use req.body.articleDescription
        if (!evaluation) {
            return res.status(400).json({
                error: 'Failed to generate evaluation'
            });
        }

        const imagePath = await generateArticleImage(req.body.articleDescription); // Directly use req.body.articleDescription
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

        await article.save();

        // Add article ID to the user's articlePublications
        const user = await User.findById(req.body.brightmindid);
        if (user) {
            user.articlePublications.push(article._id);
            await user.save();
        }

        res.status(201).json({ response: 'Article Created.' });
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
    if (!isValidDepartment(req.body.department)) {
        return res.status(400).json({
            error: 'Invalid department'
        });
    }

    const article = {
        _id: req.params.id,
        ...req.body
    };

    Article.updateOne({ _id: req.params.id }, article)
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

const removeArticleFromUsers = async (articleId) => {
    try {
        const users = await User.find({
            $or: [
                { 'bookmarked_elements.castId': articleId },
                { 'evaluation_list.contentid': articleId }
            ]
        });

        // Update each user
        for (let user of users) {
            // Remove article from bookmarked elements
            user.bookmarked_elements = user.bookmarked_elements.filter(
                bookmark => bookmark.castId !== articleId
            );

            user.evaluation_list = user.evaluation_list.filter(
                evaluation => !(evaluation.contentid === articleId && !evaluation.answered)
            );

            // Save the updated user
            await user.save();
        }
    } catch (error) {
        console.error('Error removing article from users:', error);
    }
};

exports.deleteOneArticle = async (req, res, next) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ message: 'Article not found.' });
        }

        let imageDeleteError = false;

        // Delete associated image file
        const imagePath = article.articleimageurl.split('/backend/media/article_images/')[1];
        if (imagePath) {
            fs.unlink(`./backend/media/article_images/${imagePath}`, async (err) => {
                if (err) {
                    console.error('Error deleting article image:', err);
                    imageDeleteError = true;
                }

                try {
                    // Proceed to delete the article record after attempting to delete the image
                    await Article.deleteOne({ _id: req.params.id });

                    // Remove the article from users' bookmarked elements and evaluation list
                    await removeArticleFromUsers(req.params.id);

                    let responseMessage = 'Article deleted and references removed from users.';
                    if (imageDeleteError) {
                        responseMessage += ' However, there was an error deleting the associated article image.';
                    }

                    res.status(200).json({ response: responseMessage });
                } catch (error) {
                    console.error('Error deleting article:', error);
                    res.status(500).json({ error: 'Error deleting article.' });
                }
            });
        } else {
            // No image path found, directly delete the article
            try {
                await Article.deleteOne({ _id: req.params.id });

                // Remove the article from users' bookmarked elements and evaluation list
                await removeArticleFromUsers(req.params.id);

                res.status(200).json({ response: 'Article deleted and references removed from users.' });
            } catch (error) {
                console.error('Error deleting article:', error);
                res.status(500).json({ error: 'Error deleting article.' });
            }
        }
    } catch (error) {
        console.error('Error finding article:', error);
        res.status(500).json({ error: 'Error finding article.' });
    }
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

