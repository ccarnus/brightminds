const Cast = require('../models/cast_model.js');
const fs = require('fs');
const generateEvaluation = require('../backend/generate_question');

exports.createCast = (req, res, next) => {
    const url = req.protocol + "://" + req.get('host');
    req.body.cast = JSON.parse(req.body.cast);

    if(!req.file.video){
        return res.status(400).json({ error: 'Missing video file.' });
    }
    if(!req.file.image){
        return res.status(400).json({ error: 'Missing image file.' });
    }

    const videoFilename = 'video_' + req.file.video.filename;
    const imageFilename = 'image_' + req.file.image.filename;

    const cast = new Cast({
        title: req.body.cast.title,
        description: req.body.cast.description,
        department: req.body.cast.department,
        type: req.body.cast.type,
        brightmindid: req.body.cast.brightmindid,
        casturl: url + '/backend/media/cast_videos/' + videoFilename,
        casturlimage: url + '/backend/media/cast_images/' + imageFilename,
        category: req.body.cast.category,
        university: req.body.cast.university,
        likes: req.body.cast.likes,
        comments: req.body.cast.comments,
        visibility: req.body.cast.visibility,
        evaluation: generateEvaluation(req.body.cast.description)
    });

    cast.save()
        .then(() => {
            res.status(201).json({ response: 'Cast Created.' });
        })
        .catch((error) => {
            res.status(400).json({
                error: error
            });
        });
}

exports.getAllCast = (req, res, next) => {
    Cast.find().sort({ _id: 1 }).then(
        (casts) => {
            res.status(200).json(casts);
        }
    ).catch((error) => {
        res.status(400).json({
            error: error
        });
    });
}


exports.getOneCast = (req, res, next) => {
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

exports.updateOneCast = (req, res, next) => {
    if (req.file) {
        const url = req.protocol + "://" + req.get('host');
        req.body.cast = JSON.parse(req.body.cast);

        const cast = {
            title: req.body.cast.title,
            description: req.body.cast.description,
            department: req.body.cast.department,
            type: req.body.cast.type,
            brightmindid: req.body.cast.brightmindid,
            casturl: url + '/backend/media/cast_videos/' + req.file.filename,
            casturlimage: url + '/backend/media/cast_images/' + req.file.filename,
            category: req.body.cast.category,
            university: req.body.cast.university,
            likes: req.body.cast.likes,
            comments: req.body.cast.comments,
            evaluation: req.body.cast.evaluation,
            visibility: req.body.cast.visibility,
        };

        Cast.updateOne({ _id: req.params.id }, cast)
            .then(() => {
                res.status(201).json({ response: "message updated" });
            })
            .catch((error) => {
                res.status(400).json({
                    error: error
                });
            });
    } else {
        const updatedCast = {
            title: req.body.title,
            description: req.body.description,
            department: req.body.department,
            type: req.body.type,
            brightmindid: req.body.brightmindid,
            category: req.body.category,
            university: req.body.university,
            likes: req.body.likes,
            comments: req.body.comments,
            evaluation: req.body.evaluation,
            visibility: req.body.visibility,
        };

        Cast.updateOne({ _id: req.params.id }, updatedCast)
            .then(() => {
                res.status(201).json({ response: "message updated" });
            })
            .catch((error) => {
                res.status(400).json({
                    error: error
                });
            });
    }
}

exports.deleteOneCast = (req, res, next) => {
    Cast.findOne({ _id: req.params.id })
        .then((cast) => {
            const videoFilename = cast.casturl.split('/media/cast_videos/')[1];
            const imageFilename = cast.casturlimage.split('/media/cast_images/')[1];

            fs.unlink('./backend/media/cast_videos/' + videoFilename, (videoError) => {
                if (videoError) {
                    console.error('./backend/media/cast_videos/' + videoFilename);
                    return res.status(500).json({
                        error: 'Error deleting video file',
                    });
                }

                fs.unlink('./backend/media/cast_images/' + imageFilename, (imageError) => {
                    if (imageError) {
                        console.error('./backend/media/cast_images/' + imageFilename);
                        return res.status(500).json({
                            error: 'Error deleting image file',
                        });
                    }

                    Cast.deleteOne({ _id: req.params.id })
                        .then(() => {
                            res.status(200).json({
                                response: 'Cast Deleted',
                            });
                        })
                        .catch((error) => {
                            res.status(404).json({
                                error: error,
                            });
                        });
                });
            });
        })
        .catch((error) => {
            res.status(404).json({
                error: error,
            });
        });
}


exports.getAllNewCast = (req, res, next) => {

}

exports.getAllNewCastByCategory = (req, res, next) => {

}

exports.getAllCastByCategory = (req, res, next) => {
    Cast.find({category:{$exists:true, $eq: req.params.id}}).sort({ _id: 1 }).then(
        (casts) => {
            res.status(200).json(casts);
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
}

exports.getAllCastByBrightmindid = (req, res, next) => {
    Cast.find({brightmindid:{$exists:true, $eq: req.params.id}}).sort({ _id: 1 }).then(
        (casts) => {
            res.status(200).json(casts);
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
}

exports.updateCastAddLike = (req, res, next) => {
    const userID = req.body.email;
    Cast.updateOne(
        { _id: req.params.id },
        { $inc: { "likes.count": 1 },
          $push: {"likes.user": userID}}
      )
    .then(() => {
        res.status(201).json({
            response: "like added"
        })})
    .catch((error) => {
        res.status(400).json({
            error: error
        });
    });
}

exports.updateCastAddComment = (req, res, next) => {
    const author = req.body.author;
    const content = req.body.content;

    if (!author || !content) {
        return res.status(400).json({
            error: "Both 'author' and 'content' fields are required."
        });
    }

    Cast.updateOne(
        { _id: req.params.id },
        {
            $inc: { "comments.count": 1 },
            $push: {
              "comments.comment": {
                author: author,
                content: content
              }
            }
          }
      )
    .then(() => {
        res.status(201).json({
            response: "comment added"
        })})
    .catch((error) => {
        res.status(400).json({
            error: error
        });
    });
}

exports.getEvaluationForCast = (req, res, next) => {
    const castId = req.params.id;

    Cast.findById(castId)
        .then((cast) => {
            if (!cast) {
                return res.status(404).json({ message: 'Cast not found.' });
            }

            const evaluation = cast.evaluation || '';
            res.status(200).json({ evaluation });
        })
        .catch((error) => {
            res.status(500).json({ error: 'An error occurred.' });
        });
};