const Cast = require('../models/cast_model.js');

exports.postOne = (req, res, next) => {
    const cast = new Cast({
        title: req.body.title,
        description: req.body.description,
        department: req.body.department,
        type: req.body.type,
        brightmindid: req.body.brightmindid,
        casturl: req.body.casturl,
        universitylogourl: req.body.universitylogourl
    });
    cast.save().then(
        () => {
            res.status(201).json({response:'Cast Created.'})
        }
    ).catch((error) => {
        res.status(400).json({
            error: error
        });
    });
}


exports.getAll = (req, res, next) => {
    Cast.find().then(
        (casts) => {
            res.status(200).json(casts);
        }
    ).catch((error) => {
        res.status(400).json({
            error: error
        });
    });
}


exports.getOne = (req, res, next) => {
    Cast.findOne({
        _id:req.params.id
    }).then(
        (cast) => {
            res.status(200).json(cast);
        }
    ).catch((error) => {
        res.status(404).json({
            error: error
        });
    });
}


exports.updateOne = (req, res, next) => {
    const cast = new Cast({
        _id:req.params.id,
        title: req.body.title,
        description: req.body.description,
        department: req.body.department,
        type: req.body.type,
        brightmindid: req.body.brightmindid,
        casturl: req.body.casturl,
        universitylogourl: req.body.universitylogourl
    });
    Cast.updateOne({_id:req.params.id}, cast)
    .then(() => {
        res.status(201).json({
            response: "message updated"
        })})
    .catch((error) => {
        res.status(400).json({
            error: error
        });
    });
}


exports.deleteOne = (req, res, next) => {
    Cast.deleteOne({_id:req.params.id}).then(() => {
        res.status(200).json({
            response: 'Cast Deleted'
        });
    }).catch((error) => {
        res.status(404).json({
            error: error
        });
    })
}
