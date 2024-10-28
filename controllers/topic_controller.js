const Topic = require('../models/topic_model.js');

exports.createTopicIfNotExist = async (req, res, next) => {
    try {
        const { name, departmentName, contentId } = req.body;

        // Search for an existing topic with the same name and departmentName
        let topic = await Topic.findOne({ name, departmentName });

        if (topic) {
            // If topic exists, increment contentCount and add contentId to content_ids if not already present
            if (!topic.content_ids.includes(contentId)) {
                topic.content_ids.push(contentId);
                topic.contentCount += 1;
            }
            await topic.save();
            res.status(200).json({ message: 'Topic updated successfully.', topic });
        } else {
            // If topic does not exist, create a new one
            topic = new Topic({
                name,
                departmentName,
                contentCount: 1,
                content_ids: [contentId]
            });
            await topic.save();
            res.status(201).json({ message: 'Topic created successfully.', topic });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error creating or updating topic.' });
    }
};

exports.getTopicsByDepartment = async (req, res, next) => {
    try {
        const topics = await Topic.find({ departmentName: req.params.departmentName });
        res.status(200).json(topics);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching topics.' });
    }
};

exports.getAllTopics = async (req, res, next) => {
    try {
        const topics = await Topic.find();
        res.status(200).json(topics);
    } catch (error) {
        console.error('Error fetching topics:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

exports.getOneTopic = async (req, res, next) => {
    try {
        const topic = await Topic.findById(req.params.id);
        res.status(200).json(topic);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching topic.' });
    }
};

exports.updateTopic = async (req, res, next) => {
    try {
        const topic = await Topic.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(topic);
    } catch (error) {
        res.status(500).json({ error: 'Error updating topic.' });
    }
};

exports.removeExistingTopic = async (req, res, next) => {
    try {
        const { name, departmentName, contentId } = req.body;

        // Find the topic with matching name and departmentName
        const topic = await Topic.findOne({ name, departmentName });
        if (!topic) {
            return res.status(404).json({ message: 'Topic not found.' });
        }

        // Remove the contentId and decrement the contentCount
        topic.content_ids = topic.content_ids.filter(id => id !== contentId);
        topic.contentCount -= 1;

        if (topic.contentCount <= 0) {
            // If no more casts are associated, delete the topic
            await Topic.deleteOne({ _id: topic._id });
            res.status(200).json({ message: 'Topic removed as no more casts are associated.' });
        } else {
            await topic.save();
            res.status(200).json({ message: 'Content removed from topic successfully.', topic });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error removing content from topic.' });
    }
};