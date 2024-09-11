const Topic = require('../models/topic_model.js');

exports.createTopic = async (req, res, next) => {
    const topic = new Topic({
        name: req.body.name,
        departmentId: req.body.departmentId
    });

    try {
        await topic.save();
        res.status(201).json({ message: 'Topic created successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Error creating topic.' });
    }
};

exports.getTopicsByDepartment = async (req, res, next) => {
    try {
        const topics = await Topic.find({ departmentId: req.params.departmentId });
        res.status(200).json(topics);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching topics.' });
    }
};

exports.getAllTopics = async (req, res, next) => {
    try {
        const topics = await Topic.find();  // Fetch all topics from the database
        res.status(200).json(topics);  // Respond with the list of topics
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
