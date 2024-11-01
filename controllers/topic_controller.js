const Topic = require('../models/topic_model.js');

exports.createTopicIfNotExist = async ({ name, departmentName, contentId }) => {
    try {
        // Search for an existing topic with the same name and departmentName
        let topic = await Topic.findOne({ name, departmentName });

        if (topic) {
            // If topic exists, increment contentCount and add contentId to content_ids if not already present
            if (!topic.content_ids.includes(contentId)) {
                topic.content_ids.push(contentId);
                topic.contentCount += 1;
            }
            await topic.save();
            return { message: 'Topic updated successfully.', topic, status: 200 };
        } else {
            // If topic does not exist, create a new one
            topic = new Topic({
                name,
                departmentName,
                contentCount: 1,
                content_ids: [contentId]
            });
            await topic.save();
            return { message: 'Topic created successfully.', topic, status: 201 };
        }
    } catch (error) {
        console.error('Error creating or updating topic:', error);
        throw new Error('Error creating or updating topic.');
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

exports.removeExistingTopic = async ({ name, departmentName, contentId }) => {
    try {
        // Find the topic with matching name and departmentName
        const topic = await Topic.findOne({ name, departmentName });
        console.log("Decrementing the following topic:");
        console.log("name"+name);
        console.log("department"+departmentName);
        console.log("ID of the cast "+contentId)
        if (!topic) {
            return { status: 404, message: 'Topic not found.' };
        }   

        // Remove the contentId and decrement the contentCount
        console.log("list before: "+topic.content_ids)
        topic.content_ids = topic.content_ids.filter(id => id !== contentId);
        topic.contentCount -= 1;
        console.log("list after: "+topic.content_ids)

        if (topic.contentCount <= 0) {
            // If no more content is associated, delete the topic
            await Topic.deleteOne({ _id: topic._id });
            return { status: 200, message: 'Topic removed as no more content is associated.' };
        } else {
            await topic.save();
            return { status: 200, message: 'Content removed from topic successfully.', topic };
        }
    } catch (error) {
        console.error('Error removing content from topic:', error);
        throw new Error('Error removing content from topic.');
    }
};
