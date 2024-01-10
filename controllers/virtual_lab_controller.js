const VirtualLab = require('../models/virtual_lab_model.js');


exports.createVirtualLab = async (req, res, next) => {
    const virtualLab = new VirtualLab({
        name: req.body.virtuallab.name,
        followers: req.body.virtuallab.followers,
        members: req.body.virtuallab.members,
        topics: req.body.virtuallab.topics
    });

    try {
        await virtualLab.save();
        res.status(201).json({ message: 'Virtual lab created successfully.' });
    } catch (error) {
        res.status(500).json({ error });
    }
};


exports.getAllVirtualLabs = async (req, res, next) => {
    try {
        const virtualLabs = await VirtualLab.find();
        res.status(200).json(virtualLabs);
    } catch (error) {
        res.status(500).json({ error });
    }
};


exports.getOneVirtualLab = async (req, res, next) => {
    try {
        const virtualLab = await VirtualLab.findById(req.params.id);
        if (!virtualLab) {
            return res.status(404).json({ message: 'Virtual lab not found.' });
        }
        res.status(200).json(virtualLab);
    } catch (error) {
        res.status(500).json({ error });
    }
};


exports.updateOneVirtualLab = async (req, res, next) => {
    const virtualLab = {
        _id: req.params.id,
        name: req.body.name,
        followers: req.body.followers, // Array of objects with userID
        members: req.body.members, // Array of objects with brightmindsID
        topics: req.body.topics // Array of topic objects
    };

    try {
        await VirtualLab.updateOne({ _id: req.params.id }, virtualLab);
        res.status(200).json({ message: 'Virtual lab updated successfully.' });
    } catch (error) {
        res.status(500).json({ error });
    }
};


exports.deleteOneVirtualLab = async (req, res, next) => {
    try {
        await VirtualLab.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: 'Virtual lab deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error });
    }
};


exports.addTopic = async (req, res, next) => {
    const labId = req.params.id;
    const newTopic = {
        name: req.body.name,
        gage: req.body.gage || 0,
        followers: [],
        members: [],
        threads: []
    };

    try {
        const virtualLab = await VirtualLab.findById(labId);
        if (!virtualLab) {
            return res.status(404).json({ message: 'Virtual lab not found.' });
        }

        virtualLab.topics.push(newTopic);
        await virtualLab.save();

        res.status(200).json({ message: 'Topic added successfully to the virtual lab.' });
    } catch (error) {
        res.status(500).json({ error });
    }
};


exports.updateTopic = async (req, res, next) => {
    const { labId, topicId } = req.params;
    const updatedTopicData = req.body; // Data to update the topic

    try {
        const virtualLab = await VirtualLab.findById(labId);
        if (!virtualLab) {
            return res.status(404).json({ message: 'Virtual lab not found.' });
        }

        const topicIndex = virtualLab.topics.findIndex(topic => topic._id.toString() === topicId);
        if (topicIndex === -1) {
            return res.status(404).json({ message: 'Topic not found.' });
        }

        virtualLab.topics[topicIndex] = { ...virtualLab.topics[topicIndex].toObject(), ...updatedTopicData };
        await virtualLab.save();

        res.status(200).json({ message: 'Topic updated successfully.' });
    } catch (error) {
        res.status(500).json({ error });
    }
};


exports.removeTopic = async (req, res, next) => {
    const { labId, topicId } = req.params;

    try {
        const virtualLab = await VirtualLab.findById(labId);
        if (!virtualLab) {
            return res.status(404).json({ message: 'Virtual lab not found.' });
        }

        const topicIndex = virtualLab.topics.findIndex(topic => topic._id.toString() === topicId);
        if (topicIndex === -1) {
            return res.status(404).json({ message: 'Topic not found.' });
        }

        virtualLab.topics.splice(topicIndex, 1);
        await virtualLab.save();

        res.status(200).json({ message: 'Topic removed successfully.' });
    } catch (error) {
        res.status(500).json({ error });
    }
};


module.exports = exports;
