const Article = require('../models/article_model.js');
const generateEvaluation = require('../backend/generate_question');
const generateArticleImage = require('../backend/generate_article_image');
const fs = require('fs');
const User = require('../models/user_model.js');
const departments = require('../lists/departments.js');
const Topic = require('../models/topic_model.js');
const { createTopicIfNotExist, removeExistingTopic  } = require('../controllers/topic_controller.js');

const isValidDepartment = (department) => departments.includes(department);

exports.createArticle = async (req, res, next) => {
    try {
        const url = req.protocol + "://" + req.get('host');

        if (!isValidDepartment(req.body.department)) {
            return res.status(400).json({
                error: 'Invalid department'
            });
        }

        // Check if the title exceeds 65 characters
        if (req.body.title && req.body.title.length > 65) {
            return res.status(400).json({
                error: 'Title must be 65 characters or less'
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

        // Call createTopicIfNotExist with the required fields
        const topicResult = await createTopicIfNotExist({
            name: req.body.topic,
            departmentName: req.body.department,
            contentId: article._id
        });

        // Send topicResult status and message
        if (topicResult.status === 201) {
            console.log(topicResult.message);
        } else if (topicResult.status === 200) {
            console.log(topicResult.message);
        }

        // Add article ID to the user's articlePublications
        const user = await User.findById(req.body.brightmindid);
        if (user) {
            user.articlePublications.push(article._id);
            await user.save();
        }

        res.status(201).json({ response: 'Article created and topic updated.' });
    } catch (error) {
        console.error('Error creating article:', error);
        res.status(500).json({ error: 'Internal server error' });
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

exports.updateOneArticle = async (req, res, next) => {
    try {
        let article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ message: 'Article not found.' });
        }

        if (!isValidDepartment(req.body.department)) {
            return res.status(400).json({ error: 'Invalid department' });
        }

        // Handle the old topic if the topic is being changed
        if (article.topic !== req.body.topic) {
            await removeExistingTopic({
                body: {
                    name: article.topic,
                    departmentName: article.department,
                    contentId: article._id
                }
            }, res, next);
        }

        // Ensure the new topic exists or create it
        await createTopicIfNotExist({
            body: {
                name: req.body.topic,
                departmentName: req.body.department,
                contentId: article._id
            }
        }, res, next);

        // Update article details
        article = Object.assign(article, req.body);

        await article.save();
        res.status(201).json({ response: 'Article updated and topic adjusted.' });
    } catch (error) {
        console.error('Error updating article:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
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

                    // Remove article ID from the user's articlePublications
                    const user = await User.findById(article.brightmindid);
                    if (user) {
                        user.articlePublications = user.articlePublications.filter(pubId => !pubId.equals(article._id));
                        await user.save();
                    }

                    // Update or remove topic association
                    await removeExistingTopic({
                        body: {
                            name: article.topic,
                            departmentName: article.department,
                            contentId: article._id
                        }
                    }, res, next);

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

                // Remove article ID from the user's articlePublications
                const user = await User.findById(article.brightmindid);
                if (user) {
                    user.articlePublications = user.articlePublications.filter(pubId => !pubId.equals(article._id));
                    await user.save();
                }

                // Update or remove topic association
                await removeExistingTopic({
                    body: {
                        name: article.topic,
                        departmentName: article.department,
                        contentId: article._id
                    }
                }, res, next);

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

exports.getArticleRating = (req, res, next) => {
    Article.findById(req.params.id)
        .then(article => {
            if (!article) {
                return res.status(404).json({ message: 'Article not found.' });
            }
            res.status(200).json({ rating: article.rating });
        })
        .catch(error => {
            res.status(500).json({ error: 'An error occurred.' });
        });
};

exports.updateArticleRating = (req, res, next) => {
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
                article.rating.value = ((article.rating.value * article.rating.count) + 10) / (article.rating.count + 1);
            } else {
                article.rating.value = ((article.rating.value * article.rating.count)) / (article.rating.count + 1);
            }
            article.rating.count += 1;

            article.save()
                .then(() => res.status(200).json({ message: 'Rating updated.', rating: article.rating }))
                .catch(error => res.status(400).json({ error: 'Unable to update rating.' }));

        })
        .catch(error => {
            res.status(500).json({ error: 'An error occurred.' });
        });
};

exports.getArticleTrending = (req, res, next) => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    Article.find({ dateAdded: { $gte: twoWeeksAgo } })
        .sort({ 'rating.value': -1 })
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

