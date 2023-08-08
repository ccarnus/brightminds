const University = require('../models/university_model.js');
const fs = require('fs');

exports.createUniversity = (req, res, next) => {

        const url = req.protocol + "://" + req.get('host');
        req.body.university = JSON.parse(req.body.university);
        const university = new University({
            name: req.body.university.name,
            iconurl: url + '/backend/media/university_icon/' + req.file.filename,
            score: req.body.university.score
        });
        university.save().then(
            () => {
                res.status(201).json({response:'University Created.'})
            }
        ).catch((error) => {
            res.status(400).json({
                error: error
            });
        });
}


exports.getAllUniversity = (req, res, next) => {
    University.find().sort({ _id: 1 }).then(
        (University) => {
            res.status(200).json(University);
        }
    ).catch((error) => {
        res.status(400).json({
            error: error
        });
    });
}


exports.updateOneUniversity = (req, res, next) => {
    let university = new University({_id: req.params._id});
    if (req.file){
        const url = req.protocol + "://" + req.get('host');
        req.body.university = JSON.parse(req.body.university);
        university = {
            _id:req.params.id,
            name:req.body.university.name,
            iconurl: url + '/backend/media/university_icon/' + req.file.filename,
            score: req.body.university.score
        };
    } else {university = {
            _id:req.params.id,
            name: req.body.name,
            score: req.body.score,
            iconurl: req.body.iconurl
        };
    }
    University.updateOne({_id:req.params.id}, university)
    .then(() => {
        res.status(201).json({
            response: "university updated"
        })})
    .catch((error) => {
        res.status(400).json({
            error: error
        });
    });
}


exports.deleteOneUniversity = (req, res, next) => {
    University.findOne({_id:req.params.id}).then(
        (university) => {
            const filename = university.iconurl.split('/media/university_icon/')[1];
            fs.unlink('./backend/media/university_icon/' + filename, () => {
                console.log('./backend/media/university_icon/' + filename);
                University.deleteOne({_id:req.params.id}).then(() => {
                    res.status(200).json({
                        response: 'University Deleted'
                    });
                }).catch((error) => {
                    res.status(404).json({
                        error: error
                    });
                });
            });
        }
    );
}
