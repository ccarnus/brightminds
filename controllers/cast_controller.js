const Cast = require('../models/cast_model.js');
const User = require('../models/user_model.js');
const { getVideoDurationInSeconds } = require('../backend/videoUtils');
const fs = require('fs').promises;
const departments = require('../lists/departments.js');
const castQueue = require('../queues/castQueue.js');
const Topic = require('../models/topic_model.js');

const isValidDepartment = (department) => departments.includes(department);

exports.createCast = async (req, res, next) => {
    try {
        const url = req.protocol + "://" + req.get('host');
        req.body.cast = JSON.parse(req.body.cast);

        // Validate the department
        if (!isValidDepartment(req.body.cast.department)) {
            return res.status(400).json({
                error: 'Invalid department'
            });
        }

        // Check if the title exceeds 65 characters
        if (req.body.cast.title && req.body.cast.title.length > 65) {
            return res.status(400).json({
                error: 'Title must be 65 characters or less'
            });
        }

        // Check if the topic exists; if not, create it
        let topic = await Topic.findOne({ name: req.body.cast.topic, departmentName: req.body.cast.department });
        if (!topic) {
            // Create the new topic
            console.log("Creating a new topic");
            topic = new Topic({
                name: req.body.cast.topic,
                departmentName: req.body.cast.department,
            });
            await topic.save();
        }

        // Use the utility function to get the video duration
        const videoFilePath = './backend/media/cast_videos/' + req.file.filename;
        const duration = await getVideoDurationInSeconds(videoFilePath);

        // Create the new cast
        const cast = new Cast({
            title: req.body.cast.title,
            description: req.body.cast.description,
            department: req.body.cast.department,
            brightmindid: req.body.cast.brightmindid,
            casturl: url + '/backend/media/cast_videos/' + req.file.filename,
            castimageurl: '',  // Placeholder for now
            category: req.body.cast.category,
            university: req.body.cast.university,
            likes: req.body.cast.likes,
            comments: req.body.cast.comments,
            visibility: req.body.cast.visibility,
            link: req.body.cast.link,
            evaluation: '',  // Placeholder for now
            duration: duration,
            topic: topic.name,  // Store the topic name directly
        });

        await cast.save();

        // Increment the casts count in the related topic
        topic.castsCount += 1;
        await topic.save();

        // Add cast ID to the user's castPublications
        const user = await User.findById(req.body.cast.brightmindid);
        if (user) {
            user.castPublications.push(cast._id);
            await user.save();
        }

        // Add job to the queue for background processing
        castQueue.add({
            castId: cast._id,
            description: req.body.cast.description,
            url: url
        });

        res.status(201).json({ response: 'Cast created and topic updated.' });
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


exports.updateOneCast = async (req, res, next) => {
    try {
        let cast = await Cast.findById(req.params.id);
        if (!cast) {
            return res.status(404).json({ message: 'Cast not found.' });
        }

        req.body.cast = JSON.parse(req.body.cast);

        // Validate the department
        if (!isValidDepartment(req.body.cast.department)) {
            return res.status(400).json({
                error: 'Invalid department'
            });
        }

        const departmentName = req.body.cast.department;

        // Find or create the new topic if it's changed
        let newTopic = await Topic.findOne({ name: req.body.cast.topic, departmentName: departmentName });
        if (!newTopic) {
            // Create the new topic if it doesn't exist
            newTopic = new Topic({
                name: req.body.cast.topic,
                departmentName: departmentName  // Store department name directly
            });
            await newTopic.save();
        }

        // If the topic has changed, update the old and new topic counts
        if (cast.topic !== newTopic.name) {
            const oldTopic = await Topic.findOne({ name: cast.topic, departmentName: cast.department });
            if (oldTopic) {
                oldTopic.castsCount -= 1;
                await oldTopic.save();
            }
            newTopic.castsCount += 1;
            await newTopic.save();
        }

        // If a new file is uploaded, update the cast URL and duration
        if (req.file) {
            const url = req.protocol + "://" + req.get('host');
            const videoFilePath = './backend/media/cast_videos/' + req.file.filename;
            const duration = await getVideoDurationInSeconds(videoFilePath);

            cast.casturl = url + '/backend/media/cast_videos/' + req.file.filename;
            cast.duration = duration;
        }

        // Update the remaining fields
        cast.title = req.body.cast.title;
        cast.description = req.body.cast.description;
        cast.department = departmentName;  // Store department name directly
        cast.brightmindid = req.body.cast.brightmindid;
        cast.castimageurl = req.body.cast.castimageurl;
        cast.category = req.body.cast.category;
        cast.university = req.body.cast.university;
        cast.likes = req.body.cast.likes;
        cast.comments = req.body.cast.comments;
        cast.visibility = req.body.cast.visibility;
        cast.link = req.body.cast.link;
        cast.topic = newTopic.name;  // Update to the new topic name

        await cast.save();

        res.status(200).json({ message: 'Cast updated successfully and topic adjusted.' });
    } catch (error) {
        console.error('Error updating cast:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const removeCastFromUsers = async (castId) => {
    try {
        // Find users with the cast in their bookmarked elements or evaluation list
        const users = await User.find({
            $or: [
                { 'bookmarked_elements.castId': castId },
                { 'evaluation_list.contentid': castId }
            ]
        });

        for (let user of users) {
            // Remove cast from bookmarked elements
            user.bookmarked_elements = user.bookmarked_elements.filter(
                bookmark => bookmark.castId !== castId
            );

            user.evaluation_list = user.evaluation_list.filter(
                evaluation => !(evaluation.contentid === castId && !evaluation.answered)
            );

            // Save the updated user
            await user.save();
        }
    } catch (error) {
        console.error('Error removing cast from users:', error);
    }
};

exports.deleteOneCast = async (req, res, next) => {
    try {
        const cast = await Cast.findOne({ _id: req.params.id });
        if (!cast) {
            return res.status(404).json({ error: 'Cast not found.' });
        }

        let videoDeleteError = false;
        let imageDeleteError = false;

        // Delete video file if it exists
        if (cast.casturl) {
            const videoFilename = cast.casturl.split('/media/cast_videos/')[1];
            if (videoFilename) {
                try {
                    await fs.access('./backend/media/cast_videos/' + videoFilename);  // Check if the video file exists
                    await fs.unlink('./backend/media/cast_videos/' + videoFilename);  // Delete video file
                } catch (videoErr) {
                    if (videoErr.code !== 'ENOENT') {
                        console.error('Error deleting video file:', videoErr);
                        videoDeleteError = true;
                    } else {
                        console.log('Video file does not exist, skipping deletion:', videoFilename);
                    }
                }
            }
        }

        // Delete image file if it exists
        if (cast.castimageurl) {
            const imageFilename = cast.castimageurl.split('/media/cast_images/')[1];
            if (imageFilename) {
                try {
                    await fs.access('./backend/media/cast_images/' + imageFilename);  // Check if the image file exists
                    await fs.unlink('./backend/media/cast_images/' + imageFilename);  // Delete image file
                } catch (imageErr) {
                    if (imageErr.code !== 'ENOENT') {
                        console.error('Error deleting image file:', imageErr);
                        imageDeleteError = true;
                    } else {
                        console.log('Image file does not exist, skipping deletion:', imageFilename);
                    }
                }
            }
        }

        // Delete the cast document from the database
        await Cast.deleteOne({ _id: req.params.id });

        // Remove the cast from users' bookmarked elements and evaluation list
        await removeCastFromUsers(req.params.id);

        // Remove cast ID from the user's castPublications
        const user = await User.findById(cast.brightmindid);
        if (user) {
            user.castPublications = user.castPublications.filter(pubId => !pubId.equals(cast._id));
            await user.save();
        }

        let responseMessage = 'Cast deleted and references removed from users.';
        if (videoDeleteError && imageDeleteError) {
            responseMessage += ' However, there were errors deleting both the video and image files.';
        } else if (videoDeleteError) {
            responseMessage += ' However, there was an error deleting the video file.';
        } else if (imageDeleteError) {
            responseMessage += ' However, there was an error deleting the image file.';
        }

        res.status(200).json({ response: responseMessage });
    } catch (error) {
        console.error('Error deleting cast:', error);
        res.status(500).json({ error: 'Error deleting cast.' });
    }
};


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
            res.status(200).json({ 
                verificationStatus: cast.verificationStatus.status,
                approvals: cast.verificationStatus.approvals,
                approvers_id: cast.verificationStatus.approvers_id,
                disapprovers_id: cast.verificationStatus.disapprovers_id
            });
        })
        .catch(error => {
            res.status(500).json({ error: 'An error occurred.' });
        });
};


exports.IncrementCastVerification = (req, res, next) => {
    const userId = req.body.userId; // Assuming the user's ID is passed in the request body
    Cast.findById(req.params.id)
        .then(cast => {
            if (!cast) {
                return res.status(404).json({ message: 'Cast not found.' });
            }
            if (!cast.verificationStatus.approvers_id.includes(userId)) {
                if (cast.verificationStatus.disapprovers_id.includes(userId)) {
                    cast.verificationStatus.disapprovers_id.pull(userId);
                    cast.verificationStatus.approvals += 1; // Adjust approval count since switching sides
                }
                cast.verificationStatus.approvals += 1;
                cast.verificationStatus.approvers_id.push(userId);
                cast.save()
                    .then(() => res.status(200).json({ message: 'Verification incremented and disapproval reversed.' }))
                    .catch(error => res.status(400).json({ error: 'Unable to update verification.' }));
            } else {
                res.status(400).json({ message: 'User has already approved this cast.' });
            }
        })
        .catch(error => {
            res.status(500).json({ error: 'An error occurred.' });
        });
};


exports.DecrementCastVerification = (req, res, next) => {
    const userId = req.body.userId; // Assuming the user's ID is passed in the request body
    Cast.findById(req.params.id)
        .then(cast => {
            if (!cast) {
                return res.status(404).json({ message: 'Cast not found.' });
            }
            const isApprover = cast.verificationStatus.approvers_id.includes(userId);
            const isDisapprover = cast.verificationStatus.disapprovers_id.includes(userId);

            if (!isDisapprover) {
                if (isApprover) {
                    cast.verificationStatus.approvers_id.pull(userId);
                    cast.verificationStatus.approvals -= 1;
                }
                cast.verificationStatus.disapprovers_id.push(userId);
                cast.save()
                    .then(() => res.status(200).json({ message: 'Disapproval recorded.' }))
                    .catch(error => res.status(400).json({ error: 'Unable to update disapproval.' }));
            } else {
                res.status(400).json({ message: 'User has already disapproved this cast.' });
            }
        })
        .catch(error => {
            res.status(500).json({ error: 'An error occurred.' });
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

    Cast.find()
        .sort({ dateAdded: -1 })
        .then(
            (casts) => {
                res.status(200).json(casts);
            }
        )
        .catch(
            (error) => {
                res.status(400).json({
                    error: error
                });
            }
        );
};

exports.getAllCastByDepartment = (req, res, next) => {
    const departmentId = req.params.id;

    Cast.find({ department: departmentId })
        .sort({ _id: 1 })
        .then((casts) => {
            res.status(200).json(casts);
        })
        .catch((error) => {
            res.status(400).json({
                error: error
            });
        });
};

