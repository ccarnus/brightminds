const User = require('../models/user_model.js');
const VirtualLab = require('../models/virtual_lab_model.js');
const bcrypt = require('bcrypt');
const emailVerificator = require('../backend/email_verificator.js');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const Cast = require('../models/cast_model.js');

exports.signup = (req, res, next) => {
    req.body.user = JSON.parse(req.body.user);
    if(!emailVerificator(req.body.user.email)) {
        return res.status(400).json({
            error: "The email domain name id not a valid one."
        });
    }
    bcrypt.hash(req.body.user.password, 10).then(
        (hash) => {
            const url = req.protocol + "://" + req.get('host');
            const user = new User({
                email: req.body.user.email,
                password: req.body.user.password,
                username: req.body.user.username,
                role: req.body.user.role,
                department: req.body.user.department,
                score: req.body.user.score,
                profilePictureUrl: url + '/backend/media/profile_pictures/' + req.file.filename,
            });
            user.save().then(
                () => {
                    res.status(201).json({response:'User Created.'});
                }
            ).catch(
                (error) => {
                    res.status(501).json({
                        error: error
                    });
                }
            );
        }
    ).catch(
        (error) => {
            res.status(501).json({
                error: error
            });
        }
    );
};

exports.login = (req, res, next) => {
    User.findOne({email: req.body.email}).then(
        (user) => {
            if(!user) {
                return res.status(401).json({
                    response: 'user not found.'
                });
            }
            bcrypt.compare(req.body.password,user.password).then(
                (valid) => {
                    if(!valid) {
                        return res.status(401).json({
                            response: 'incorrect password'
                        });
                    }
                    const token = jwt.sign(
                        {userId: user._id},
                        'RANDOM_TOKEN_SECRET',
                        {expiresIn: '24h'});
                    res.status(200).json({
                        userId: user._id,
                        email: user.email,
                        token: token
                    });
                }
            ).catch((error) => {
                res.status(500).json({
                    error: error
                });
            })
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error : error
            });
        }
    );
};

exports.getAllUser = async (req, res, next) => {
    try {
      const users = await User.find()
        .select('_id email username role department score profilePictureUrl evaluation_list virtual_labs preferences tracking')
        .sort({ score: -1 }); 
  
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: 'An error occurred.' });
    }
  };
  

exports.getOneUser = async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      const userScore = user.score;
      const countBelowScore = await User.countDocuments({ score: { $lt: userScore } });
      const totalUsers = await User.countDocuments();
      const percentage = Math.round((countBelowScore / (totalUsers-1)) * 100);
      const userWithPercentage = {
        _id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        department: user.department,
        score: user.score,
        profilePictureUrl: user.profilePictureUrl,
        evaluation_list: user.evaluation_list,
        percentage: percentage,
        tracking: user.tracking,
        virtual_labs: user.virtual_labs,

      };
  
      res.status(200).json(userWithPercentage);
    } catch (error) {
      res.status(500).json({ error: 'An error occurred.' });
    }
  };
  

exports.updateOneUser = (req, res, next) => {
    let user = new User({_id: req.params._id});
    if (req.file) {
        const url = req.protocol + "://" + req.get('host');
        req.body.user = JSON.parse(req.body.user);
        user = {
            _id: req.params.id,
            email: req.body.user.email,
            username: req.body.user.username,
            role: req.body.user.role,
            department: req.body.user.department,
            score: req.body.user.score,
            profilePictureUrl: url + '/backend/media/profile_pictures/' + req.file.filename,
            evaluation_list: req.body.user.evaluation_list,
            preferences: req.body.user.preferences,
            tracking: req.body.user.tracking,
            virtual_labs: req.body.user.virtual_labs,
        };
    } else {
        user = {
            _id: req.params.id,
            email: req.body.email,
            username: req.body.username,
            role: req.body.role,
            department: req.body.department,
            score: req.body.score,
            profilePictureUrl: req.body.profilePictureUrl,
            evaluation_list: req.body.evaluation_list,
            preferences: req.body.preferences,
            tracking: req.body.tracking,
            virtual_labs: req.body.virtual_labs,
        };
    }
    User.updateOne({_id:req.params.id}, user).then(
        (user) => {
            res.status(200).json({
                response: 'User updated.'
            });
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error : error
            });
        }
    );
}

exports.deleteOneUser = (req, res, next) => {
    User.findOne({_id:req.params.id}).then(
        (user) => {
            const filename = user.profilePictureUrl.split('/backend/media/profile_pictures/')[1];
            fs.unlink('./backend/media/profile_pictures/' + filename, () => {
                User.deleteOne({_id: req.params.id}).then(
                    () => {
                        res.status(200).json({
                            response: "user removed."
                        });
                    }
                ).catch((error) => {
                    res.status(404).json({
                        error: error
                    });
                });
            })
        }
    )
}

exports.getAllByScore = (req, res, next) => {
    User.find().select('_id email username role department score profilePictureUrl evaluation_list preferences tracking').sort({score: 1}).then(
        (users) => {
            res.status(200).json(users);
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
}

exports.updateUserAddContentToList = (req, res, next) => {
    const userId = req.params.id;
    const castId = req.body.cast_id;
    const type = req.body.type;

    User.findById(userId)
        .then((user) => {
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            // Check if an evaluation with the same castId already exists
            const existingEvaluation = user.evaluation_list.find(evaluation => evaluation.castid === castId);

            if (existingEvaluation) {
                return res.status(200).json({ message: 'Cast already in the evaluation list.' });
            } else {
                // Create the evaluation object
                const evaluationObject = {
                    castid: castId,
                    watched: true,
                    answered: false,
                    type: type,
                };
                user.evaluation_list.push(evaluationObject);

                return user.save()
                    .then(() => {
                        res.status(200).json({ message: 'Cast added to evaluation list.' });
                    })
                    .catch((error) => {
                        res.status(500).json({ error: 'An error occurred while saving the user.' });
                    });
            }
        })
        .catch((error) => {
            res.status(500).json({ error: 'An error occurred.' });
        });
};


exports.updateUserAddPoints = (req, res, next) => {
    const userId = req.params.id;
    const points = req.body.Points;

    User.findById(userId)
        .then((user) => {
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }
            if (typeof points !== 'number') {
                return res.status(400).json({ message: 'Points must be a valid number' });
            }
        
            user.score += points;

            return user.save();
        })
        .then(() => {
            res.status(200).json({ message: 'Points added.' });
        })
        .catch((error) => {
            res.status(500).json({ error: 'An error occurred.' });
        });
}

exports.updateUserRemovePoints = (req, res, next) => {
    const userId = req.params.id;
    const points = req.body.Points;

    User.findById(userId)
        .then((user) => {
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }
            if (typeof points !== 'number') {
                return res.status(400).json({ message: 'Points must be a valid number' });
            }
        
            user.score -= points;

            return user.save();
        })
        .then(() => {
            res.status(200).json({ message: 'Points removed.' });
        })
        .catch((error) => {
            res.status(500).json({ error: 'An error occurred.' });
        });
}

exports.updateUserRemoveContentFromList = (req, res, next) => {
    const userId = req.params.id;
    const castId = req.body.cast_id;

    User.findById(userId)
        .then((user) => {
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            // Filter out the evaluation object with the specified castId
            user.evaluation_list = user.evaluation_list.filter((evaluationObject) => {
                return evaluationObject.castid !== castId;
            });

            return user.save();
        })
        .then(() => {
            res.status(200).json({ message: 'Cast removed from evaluation list.' });
        })
        .catch((error) => {
            res.status(500).json({ error: 'An error occurred.' });
        });
};

exports.getUserBookmarks = async (req, res, next) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const bookmarks = user.bookmarked_elements;
        res.status(200).json(bookmarks);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred.' });
    }
};

exports.addUserBookmark = async (req, res, next) => {
    const userId = req.params.id;
    const castId = req.body.castId;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if the castId is already in the user's bookmarks
        if (user.bookmarked_elements.some((bookmark) => bookmark.castId === castId)) {
            return res.status(400).json({ message: 'Element is already bookmarked.' });
        }

        // Add the castId to the user's bookmarks
        user.bookmarked_elements.push({ castId });
        await user.save();

        res.status(201).json({ message: 'Element bookmarked.' });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred.' });
    }
};

exports.removeUserBookmark = async (req, res, next) => {
    const userId = req.params.id;
    const castId = req.params.castId;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Filter out the bookmarked element with the specified castId
        user.bookmarked_elements = user.bookmarked_elements.filter(
            (bookmark) => bookmark.castId !== castId
        );

        await user.save();

        res.status(200).json({ message: 'Element removed from bookmarks.' });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred.' });
    }
};

exports.markCastAsAnswered = async (req, res, next) => {
    const userId = req.params.id;
    const castId = req.body.castId;

    User.findById(userId)
        .then((user) => {
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            // Find the specific evaluation in the user's "evaluation_list" array
            const evaluation = user.evaluation_list.find(item => item.castid === castId);

            if (!evaluation) {
                return res.status(404).json({ message: 'Evaluation not found.' });
            }

            // Update the "answered" field to true
            evaluation.answered = true;

            // Save the user object with the updated evaluation
            return user.save();
        })
        .then(() => {
            res.status(200).json({ message: 'Cast marked as answered.' });
        })
        .catch((error) => {
            res.status(500).json({ error: 'An error occurred.' });
        });
}

exports.getSuggestedForYou = (req, res, next) => {
    // Step 1: Fetch the user
    User.findById(req.params.id)
        .then(user => {
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            // Step 2: Find the highest weighted category
            let maxWeight = 0;
            let preferredCategory = '';

            user.preferences.forEach(pref => {
                if (pref.weight > maxWeight) {
                    maxWeight = pref.weight;
                    preferredCategory = pref.category;
                }
            });

            // If no preferences are set, you might want to handle it differently
            if (!preferredCategory) {
                return res.status(404).json({ message: 'No preferences set for user.' });
            }

            // Step 3: Find casts in that category
            Cast.find({ department: preferredCategory }).sort({ _id: 1 })
                .then(casts => {
                    res.status(200).json(casts);
                })
                .catch(error => {
                    res.status(400).json({ error: error });
                });
        })
        .catch(error => {
            res.status(500).json({ error: 'An error occurred.' });
        });
};

exports.getUserPreferences = (req, res, next) => {
    User.findById(req.params.id)
        .then(user => {
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            res.status(200).json({ preferences: user.preferences });
        })
        .catch(error => {
            res.status(500).json({ error: 'An error occurred while fetching user preferences.' });
        });
};

exports.updateUserPreferences = async (req, res, next) => {
    const userId = req.params.id;
    const { category, modification } = req.body;

    // Verification for 'modification' field
    if (!modification || (modification !== 'positive' && modification !== 'negative')) {
        return res.status(400).json({ message: 'Invalid modification type. Must be either "positive" or "negative".' });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if the category already exists in user preferences
        let existingCategory = user.preferences.find(pref => pref.category === category);

        if (existingCategory) {
            // Update the weight based on the modification type
            existingCategory.weight += modification === 'positive' ? 1 : -1;
        } else if (modification === 'positive') {
            // If category doesn't exist and modification is positive, create new category
            user.preferences.push({ category: category, weight: 1 });
        } // If category doesn't exist and modification is negative, ignore

        // Ensure the sum of weights equals 100
        let totalWeight = user.preferences.reduce((acc, pref) => acc + pref.weight, 0);
        user.preferences.forEach(pref => {
            pref.weight = (pref.weight / totalWeight) * 100;
        });

        // Save the updated user
        await user.save();

        res.status(200).json({ message: 'User preferences updated.', preferences: user.preferences });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred.' });
    }
};

exports.updateUserTracking = async (req, res) => {
    const userId = req.params.id;
    const { objective } = req.body;

    // Define the valid objectives
    const validObjectives = ['Follower', 'Explorer', 'DeepLearner', 'Career', 'Researcher'];

    try {
        // Validate the objective value
        if (!validObjectives.includes(objective)) {
            return res.status(400).json({ message: 'Invalid objective value. Must be one of Follower, Explorer, DeepLearner, Career, or Researcher.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user.tracking.objective = objective;

        await user.save();
        res.status(200).json({ message: 'Tracking updated successfully.', tracking: user.tracking });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred.' });
    }
};


exports.getUserTracking = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId).select('tracking');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ tracking: user.tracking});
    } catch (error) {
        res.status(500).json({ error: 'An error occurred.' });
    }
};


exports.getVirtualLabs = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('virtual_labs');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json({ virtualLabs: user.virtual_labs });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred.' });
    }
};

exports.addVirtualLabMember = async (req, res) => {
    const userId = req.params.id;
    const labId = req.body.labId;
    
    try {
        const user = await User.findById(userId);
        const virtualLab = await VirtualLab.findById(labId);

        if (!user || !virtualLab) {
            return res.status(404).json({ message: 'User or Virtual Lab not found.' });
        }

        if (!virtualLab.members.some(member => member.brightmindsID === userId)) {
            virtualLab.members.push({ brightmindsID: userId });
            await virtualLab.save();
        }

        if (!user.virtual_labs.member.some(lab => lab.labId === labId)) {
            user.virtual_labs.member.push({ labId });
            await user.save();
        }

        res.status(200).json({ message: 'Member added to the virtual lab and vice versa.' });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred.' });
    }
};

exports.removeVirtualLabMember = async (req, res) => {
    const userId = req.params.id;
    const labId = req.body.labId;

    try {
        const user = await User.findById(userId);
        const virtualLab = await VirtualLab.findById(labId);

        if (!user || !virtualLab) {
            return res.status(404).json({ message: 'User or Virtual Lab not found.' });
        }

        // Remove user from virtual lab's member list
        virtualLab.members = virtualLab.members.filter(member => member.brightmindsID !== userId);
        await virtualLab.save();

        // Remove virtual lab from user's member list
        user.virtual_labs.member = user.virtual_labs.member.filter(member => member.labId !== labId);
        await user.save();

        res.status(200).json({ message: 'Member removed from the virtual lab and vice versa.' });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred.' });
    }
};

exports.addVirtualLabFollower = async (req, res) => {
    const userId = req.params.id;
    const labId = req.body.labId;

    try {
        const user = await User.findById(userId);
        const virtualLab = await VirtualLab.findById(labId);

        if (!user || !virtualLab) {
            return res.status(404).json({ message: 'User or Virtual Lab not found.' });
        }

        // Add user to virtual lab's follower list
        if (!virtualLab.followers.some(follower => follower.userID === userId)) {
            virtualLab.followers.push({ userID: userId });
            await virtualLab.save();
        }

        // Add virtual lab to user's follower list
        if (!user.virtual_labs.follower.some(lab => lab.labId === labId)) {
            user.virtual_labs.follower.push({ labId });
            await user.save();
        }

        res.status(200).json({ message: 'Follower added to the virtual lab and vice versa.' });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred.' });
    }
};


exports.removeVirtualLabFollower = async (req, res) => {
    const userId = req.params.id;
    const labId = req.body.labId;

    try {
        const user = await User.findById(userId);
        const virtualLab = await VirtualLab.findById(labId);

        if (!user || !virtualLab) {
            return res.status(404).json({ message: 'User or Virtual Lab not found.' });
        }

        // Remove user from virtual lab's follower list
        virtualLab.followers = virtualLab.followers.filter(follower => follower.userID !== userId);
        await virtualLab.save();

        // Remove virtual lab from user's follower list
        user.virtual_labs.follower = user.virtual_labs.follower.filter(follower => follower.labId !== labId);
        await user.save();

        res.status(200).json({ message: 'Follower removed from the virtual lab and vice versa.' });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred.' });
    }
};
