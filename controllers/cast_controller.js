const Cast = require('../models/cast_model.js');
const fs = require('fs');
const generateEvaluation = require('../backend/generate_question');
const generateCastImage = require('../backend/generate_cast_image');

exports.createCast = async (req, res, next) => {
    try {
      const url = req.protocol + "://" + req.get('host');
      req.body.cast = JSON.parse(req.body.cast);
  
      const evaluation = await generateEvaluation(req.body.cast.description);
      if (!evaluation) {
        return res.status(400).json({
          error: 'Failed to generate evaluation'
        });
      }

      const imagePath = await generateCastImage(req.body.cast.description);
        if (!imagePath) {
            return res.status(400).json({
                error: 'Failed to generate cast image'
            });
        }
      const castImageURL = url + imagePath.replace(/^.*\/backend/, '/backend');


      const cast = new Cast({
        title: req.body.cast.title,
        description: req.body.cast.description,
        department: req.body.cast.department,
        type: req.body.cast.type,
        brightmindid: req.body.cast.brightmindid,
        casturl: url + '/backend/media/cast_videos/' + req.file.filename,
        castimageurl: castImageURL,
        category: req.body.cast.category,
        university: req.body.cast.university,
        likes: req.body.cast.likes,
        comments: req.body.cast.comments,
        visibility: req.body.cast.visibility,
        evaluation: evaluation
      });
  
      cast.save().then(() => {
        res.status(201).json({ response: 'Cast Created.' });
      }).catch((error) => {
        res.status(400).json({
          error: error
        });
      });
    } catch (error) {
      console.error('Error creating cast:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  };


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
            castimageurl: req.body.cast.castimageurl,
            caterogy: req.body.cast.category,
            university: req.body.cast.university,
            likes: req.body.cast.likes,
            comments: req.body.cast.comments,
            evaluation: req.body.cast.evaluation,
            visibility: req.body.cast.visibility,
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
            castimageurl: req.body.castimageurl,
            university: req.body.universitylogourl,
            category: req.body.category,
            likes: req.body.likes,
            comments: req.body.comments,
            question: req.body.question,
            evaluation: req.body.evaluation
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

exports.getAllCastByDepartment = (req, res, next) => {
    Cast.find({department:{$exists:true, $eq: req.params.id}}).sort({ _id: 1 }).then(
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

exports.getCastVerification = (req, res, next) => {
    Cast.findById(req.params.id)
        .then(cast => {
            if (!cast) {
                return res.status(404).json({ message: 'Cast not found.' });
            }
            res.status(200).json({ verified: cast.verified });
        })
        .catch(error => {
            res.status(500).json({ error: 'An error occurred.' });
        });
};

exports.IncrementCastVerification = (req, res, next) => {
    Cast.updateOne({ _id: req.params.id }, { $inc: { verified: 1 } })
        .then(() => {
            res.status(200).json({ message: 'Verification status incremented.' });
        })
        .catch(error => {
            res.status(400).json({ error: 'Unable to update verification status.' });
        });
};

exports.DecrementCastVerification = (req, res, next) => {
    Cast.updateOne({ _id: req.params.id }, { $inc: { verified: -1 } })
        .then(() => {
            res.status(200).json({ message: 'Verification status decremented.' });
        })
        .catch(error => {
            res.status(400).json({ error: 'Unable to update verification status.' });
        });
};

exports.getCastGrade = (req, res, next) => {
    Cast.findById(req.params.id)
        .then(cast => {
            if (!cast) {
                return res.status(404).json({ message: 'Cast not found.' });
            }
            res.status(200).json({ grade: cast.grade });
        })
        .catch(error => {
            res.status(500).json({ error: 'An error occurred.' });
        });
};

exports.updateCastGrade = (req, res, next) => {
    const action = req.body.action;

    if (action !== '+' && action !== '-') {
        return res.status(400).json({ message: 'Invalid action.' });
    }

    Cast.findById(req.params.id)
        .then(cast => {
            if (!cast) {
                return res.status(404).json({ message: 'Cast not found.' });
            }

            // Update logic
            if (action === '+') {
                cast.grade.value = ((cast.grade.value * cast.grade.count) + 10) / (cast.grade.count + 1);
            } else {
                cast.grade.value = ((cast.grade.value * cast.grade.count)) / (cast.grade.count + 1);
            }
            cast.grade.count += 1;

            // Save the updated cast
            cast.save()
                .then(() => res.status(200).json({ message: 'Grade updated.', grade: cast.grade }))
                .catch(error => res.status(400).json({ error: 'Unable to update grade.' }));

        })
        .catch(error => {
            res.status(500).json({ error: 'An error occurred.' });
        });
};

exports.getCastTrending = (req, res, next) => {
    Cast.find().sort({ dateAdded: -1, 'grade.value': -1 }).then(
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

};
