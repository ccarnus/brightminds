const VirtualLab = require('../models/virtual_lab_model.js');

exports.createVirtualLab = async (req, res, next) => {
    const virtualLab = new VirtualLab({
        name: req.body.name,
        followers: req.body.followers, // Array of objects with userID
        members: req.body.members, // Array of objects with brightmindsID
        topics: req.body.topics // Array of topic objects
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

module.exports = exports;
