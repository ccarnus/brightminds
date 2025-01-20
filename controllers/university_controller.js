const University = require('../models/university_model.js');
const fs = require('fs');

exports.createUniversity = (req, res, next) => {

        const url = "https://api.brightmindsresearch.com";
        req.body.university = JSON.parse(req.body.university);
        const university = new University({
            name: req.body.university.name,
            displayedName: req.body.university.displayedName,
            iconurl: url + '/backend/media/university_icon/' + req.file.filename,
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

exports.getAllUniversity = async (req, res, next) => {
    try {
      const universities = await University.find();
  
      res.status(200).json(universities);
    } catch (error) {
      res.status(500).json({ error: 'An error occurred.' });
    }
  };
  
  exports.getOneUniversity = (req, res, next) => {
    University.findOne({ _id:req.params.id })
        .then((university) => {
            if (!university) {
                return res.status(404).json({ message: 'University not found.' });
            }
            res.status(200).json(university);
        })
        .catch((error) => {
            res.status(500).json({
                error: 'An error occurred.',
                details: error
            });
        });
};

exports.updateOneUniversity = (req, res, next) => {
    let university = new University({_id: req.params._id});
    if (req.file){
        const url = "https://api.brightmindsresearch.com";
        req.body.university = JSON.parse(req.body.university);
        university = {
            _id:req.params.id,
            name:req.body.university.name,
            iconurl: url + '/backend/media/university_icon/' + req.file.filename,
            displayedName: req.body.university.displayedName
        };
    } else {university = {
            _id:req.params.id,
            name: req.body.name,
            iconurl: req.body.iconurl,
            displayedName: req.body.displayedName
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

exports.getOneUniversityByName = (req, res, next) => {
    const universityName = req.params.id;

    University.findOne({ name: universityName })
        .then((university) => {
            if (!university) {
                return res.status(404).json({ message: 'University not found.' });
            }
            res.status(200).json(university);
        })
        .catch((error) => {
            res.status(500).json({
                error: 'An error occurred.',
                details: error
            });
        });
};

