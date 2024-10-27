const Topic = require('../models/topic_model.js');

exports.createTopic = async (req, res, next) => {
    const topic = new Topic({
        name: req.body.name,
        departmentName: req.body.department,
        contentId: req.body.contentId
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
        const topics = await Topic.find({ departmentName: req.params.departmentName });
        
        // Group topics by name and department, then aggregate the content IDs and count
        const groupedTopics = topics.reduce((acc, topic) => {
            const key = `${topic.name}-${topic.departmentName}`;
            if (!acc[key]) {
                acc[key] = {
                    name: topic.name,
                    departmentName: topic.departmentName,
                    count: 0,
                    contentIds: []
                };
            }
            acc[key].count += 1;
            acc[key].contentIds.push(topic.contentId);
            return acc;
        }, {});

        // Convert the result to an array of grouped topic summaries
        const topicSummaries = Object.values(groupedTopics);

        res.status(200).json(topicSummaries);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching topics by department.' });
    }
};

exports.getAllTopics = async (req, res, next) => {
    try {
        const topics = await Topic.find();
        
        // Group topics by name and department, then aggregate the content IDs and count
        const groupedTopics = topics.reduce((acc, topic) => {
            const key = `${topic.name}-${topic.departmentName}`;
            if (!acc[key]) {
                acc[key] = {
                    name: topic.name,
                    departmentName: topic.departmentName,
                    count: 0,
                    contentIds: []
                };
            }
            acc[key].count += 1;
            acc[key].contentIds.push(topic.contentId);
            return acc;
        }, {});

        // Convert the result to an array of grouped topic summaries
        const topicSummaries = Object.values(groupedTopics);

        res.status(200).json(topicSummaries);
    } catch (error) {
        console.error('Error fetching all topics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getOneTopic = async (req, res, next) => {
    try {
        const topic = await Topic.findById(req.params.id);

        if (!topic) {
            return res.status(404).json({ message: 'Topic not found.' });
        }

        // Count other topics with the same name and department and gather their content IDs
        const relatedTopics = await Topic.find({ name: topic.name, departmentName: topic.departmentName });
        const contentIds = relatedTopics.map(t => t.contentId);
        const count = relatedTopics.length;

        res.status(200).json({
            name: topic.name,
            departmentName: topic.departmentName,
            count,
            contentIds
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching topic.' });
    }
};

exports.updateTopic = async (req, res, next) => {
    try {
        const topic = await Topic.findByIdAndUpdate(req.params.id, req.body, { new: true });
        
        if (!topic) {
            return res.status(404).json({ message: 'Topic not found.' });
        }

        // Count related topics with the same name and department and collect their content IDs
        const relatedTopics = await Topic.find({ name: topic.name, departmentName: topic.departmentName });
        const contentIds = relatedTopics.map(t => t.contentId);
        const count = relatedTopics.length;

        res.status(200).json({
            name: topic.name,
            departmentName: topic.departmentName,
            count,
            contentIds
        });
    } catch (error) {
        res.status(500).json({ error: 'Error updating topic.' });
    }
};
