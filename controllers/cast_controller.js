const Cast = require('../models/cast_model.js');
const fs = require('fs');

exports.createCast = (req, res, next) => {

        const url = req.protocol + "://" + req.get('host');
        req.body.cast = JSON.parse(req.body.cast);
        const cast = new Cast({
            title: req.body.cast.title,
            description: req.body.cast.description,
            department: req.body.cast.department,
            type: req.body.cast.type,
            brightmindid: req.body.cast.brightmindid,
            casturl: url + '/backend/media/cast_videos/' + req.file.filename,
            category: req.body.cast.category,
            university: req.body.cast.university,
            likes: req.body.cast.likes,
            comments: req.body.comments
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


exports.getAllCast = (req, res, next) => {
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
    let cast = new Cast({_id: req.params._id});
    if (req.file){
        const url = req.protocol + "://" + req.get('host');
        req.body.cast = JSON.parse(req.body.cast);
        cast = {
            _id:req.params.id,
            title: req.body.cast.title,
            description: req.body.cast.description,
            department: req.body.cast.department,
            type: req.body.cast.type,
            brightmindid: req.body.cast.brightmindid,
            casturl: url + '/backend/media/user_images/' + req.file.filename,
            caterogy: req.body.cast.category,
            university: req.body.cast.university,
            likes: req.body.cast.likes,
            comments: req.body.cast.comments
        };
    } else {
        cast = {
            _id:req.params.id,
            title: req.body.title,
            description: req.body.description,
            department: req.body.department,
            type: req.body.type,
            brightmindid: req.body.brightmindid,
            casturl: req.body.casturl,
            university: req.body.universitylogourl,
            category: req.body.category,
            likes: req.body.likes,
            comments: req.body.cast.comments
        };
    }
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


exports.deleteOneCast = (req, res, next) => {
    Cast.findOne({_id:req.params.id}).then(
        (cast) => {
            const filename = cast.casturl.split('/media/cast_videos/')[1];
            fs.unlink('./backend/media/cast_videos/' + filename, () => {
                console.log('./backend/media/cast_videos/' + filename);
                Cast.deleteOne({_id:req.params.id}).then(() => {
                    res.status(200).json({
                        response: 'Cast Deleted'
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

exports.getAllNewCast = (req, res, next) => {

}

exports.getAllNewCastByCategory = (req, res, next) => {

}

exports.getAllCastByCategory = (req, res, next) => {
    Cast.find({category:{$exists:true, $eq: req.params.id}}).then(
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
    Cast.find({brightmindid:{$exists:true, $eq: req.params.id}}).then(
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
        { $inc: { "comments.count": 1 }, $push: {"comments.comment.author": author},$push: {"comments.comment.content": content}}
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
