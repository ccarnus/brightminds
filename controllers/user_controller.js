const User = require('../models/user_model.js');
const VirtualLab = require('../models/virtual_lab_model.js');
const bcrypt = require('bcrypt');
const emailVerificator = require('../backend/email_verificator.js');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const Cast = require('../models/cast_model.js');
const Article = require('../models/article_model.js');
const departments = require('../lists/departments.js');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const EMAIL_PWD = process.env.EMAIL_PWD;

const getTargetValue = (objective) => {
    switch (objective) {
        case 'Follower':
            return 5;
        case 'Explorer':
            return 10;
        case 'Deep Learner':
            return 20;
        case 'Researcher':
            return 30;
        case 'Career':
            return 50;
        default:
            return 10;
    }
};

exports.signup = async (req, res, next) => {
    req.body.user = JSON.parse(req.body.user);
    
    // Validate email domain
    if (!emailVerificator(req.body.user.email)) {
        return res.status(400).json({
            error: "The email domain name is not a valid one."
        });
    }

    try {
        // Hash the password
        const hash = await bcrypt.hash(req.body.user.password, 10);

        // Generate the verification token
        const token = crypto.randomBytes(16).toString('hex');
        const url = req.protocol + "://" + req.get('host');

        // Prepare the user data
        const userData = {
            email: req.body.user.email,
            password: hash,
            username: req.body.user.username,
            role: req.body.user.role,
            score: 0,
            profilePictureUrl: url + '/backend/media/profile_pictures/' + req.file.filename,
            verificationToken: token,
            tracking: {
                objective: req.body.user.objective || 'Explorer',
                target: getTargetValue(req.body.user.objective || 'Explorer')
            }
        };

        if (['Professor', 'PhD Student', 'Researcher'].includes(req.body.user.role)) {
            userData.university = req.body.user.university;
        }

        // Configure nodemailer
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'clement.carnus@brightmindsresearch.com',
                pass: EMAIL_PWD
            }
        });

        const mailOptions = {
            from: 'clement.carnus@brightmindsresearch.com',
            to: req.body.user.email,
            subject: 'Account Verification - BrightMinds Research',
            html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>BrightMinds Research - Email Confirmation</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap');

                    body {
                        margin: 0;
                        padding: 0;
                        font-family: 'Montserrat', sans-serif;
                        background-color: #f1f1f1;
                        color: #1c1c1c;
                    }

                    .email-container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border: 1px solid #b2b2b2;
                        border-radius: 8px;
                        padding: 20px;
                    }

                    .email-container .logo {
                        text-align: center;
                        margin-bottom: 20px;
                    }

                    .email-container .logo img {
                        max-width: 500px;
                    }

                    .email-container h2 {
                        text-align: center;
                        color: #00407A;
                        font-family: 'MontserratBold', sans-serif;
                    }

                    .email-container p {
                        font-size: 16px;
                        line-height: 1.5;
                        text-align: center;
                        color: #1c1c1c;
                    }

                    .email-container .button-container {
                        text-align: center;
                        margin: 30px 0;
                    }

                    .email-container .button-container a {
                        background-color: #00407A;
                        color: #ffffff;
                        padding: 12px 24px;
                        text-decoration: none;
                        border-radius: 5px;
                        font-size: 16px;
                        font-family: 'MontserratBold', sans-serif;
                    }

                    .email-container .footer {
                        text-align: center;
                        margin-top: 20px;
                    }

                    .email-container .footer img {
                        max-width: 100px;
                        margin-top: 20px;
                    }

                    .email-container .footer p {
                        font-size: 12px;
                        line-height: 1.5;
                        text-align: center;
                        color: #b2b2b2;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="logo">
                        <img src="http://${req.headers.host}/backend/media/verification_email/BrightMinds_research_icon.png" alt="BrightMinds Research">
                    </div>
                    <h2>Welcome to BrightMinds Research!</h2>
                    <p>Thank you for signing up with us. To complete your registration, please confirm your email address by clicking the button below.</p>
                    <div class="button-container">
                        <a href="http://${req.headers.host}/user/confirmation/${token}">Verify Email</a>
                    </div>
                    <p>If you did not create an account with us, please ignore this email.</p>
                    <div class="footer">
                        <img src="http://${req.headers.host}/backend/media/verification_email/brightminds_icon_resized.png" alt="BrightMinds Footer">
                        <p>&copy; 2024 BrightMinds Research. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            `
        };

        await transporter.sendMail(mailOptions);

        const user = new User(userData);
        await user.save();

        res.status(201).json({ response: 'User created. Please check your email to verify your account.' });

    } catch (error) {
        // Handle errors in email sending or user creation
        console.error('Error during signup:', error);

        // Return a meaningful error message
        res.status(500).json({
            error: 'An error occurred during signup. Please try again later.'
        });
    }
};


exports.confirmation = (req, res, next) => {
    User.findOne({ verificationToken: req.params.token }, (err, user) => {
        if (!user) {
            return res.status(400).send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Verification Failed - BrightMinds Research</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap');
                        
                        body {
                            margin: 0;
                            padding: 0;
                            font-family: 'Montserrat', sans-serif;
                            background-color: #f1f1f1;
                            color: #1c1c1c;
                        }

                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #f1f1f1;
                            border: 1px solid #1c1c1c;
                            border-radius: 8px;
                            padding: 20px;
                            text-align: center;
                        }

                        .container .logo {
                            margin-bottom: 20px;
                        }

                        .container .logo img {
                            max-width: 500px;
                        }

                        .container h2 {
                            color: #cc0000;
                            font-family: 'MontserratBold', sans-serif;
                        }

                        .container p {
                            font-size: 16px;
                            line-height: 1.5;
                            color: #1c1c1c;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="logo">
                            <img src="http://${req.headers.host}/backend/media/verification_email/BrightMinds_research_icon.png" alt="BrightMinds Research">
                        </div>
                        <h2>Verification Failed</h2>
                        <p>We were unable to find a user for this token.</p>
                        <p>Please check the link or contact support.</p>
                    </div>
                </body>
                </html>
            `);
        }
        if (user.isVerified) {
            return res.status(400).send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Already Verified - BrightMinds Research</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap');
                        
                        body {
                            margin: 0;
                            padding: 0;
                            font-family: 'Montserrat', sans-serif;
                            background-color: #f1f1f1;
                            color: #1c1c1c;
                        }

                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #f1f1f1;
                            border: 1px solid #1c1c1c;
                            border-radius: 8px;
                            padding: 20px;
                            text-align: center;
                        }

                        .container .logo {
                            margin-bottom: 20px;
                        }

                        .container .logo img {
                            max-width: 500px;
                        }

                        .container h2 {
                            color: #00407A;
                            font-family: 'MontserratBold', sans-serif;
                        }

                        .container p {
                            font-size: 16px;
                            line-height: 1.5;
                            color: #1c1c1c;
                        }

                        .container a {
                            color: #00407A;
                            text-decoration: none;
                            font-weight: bold;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="logo">
                            <img src="http://${req.headers.host}/backend/media/verification_email/BrightMinds_research_icon.png" alt="BrightMinds Research">
                        </div>
                        <h2>Already Verified</h2>
                        <p>This user has already been verified.</p>
                        <a href="https://www.brightmindsresearch.com/">Visit our Site</a>
                    </div>
                </body>
                </html>

            `);
        }

        user.isVerified = true;
        user.verificationToken = undefined;

        user.save((err) => {
            if (err) { return res.status(500).send({ msg: err.message }); }
            res.status(200).send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Verification Successful - BrightMinds Research</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap');
                        
                        body {
                            margin: 0;
                            padding: 0;
                            font-family: 'Montserrat', sans-serif;
                            background-color: #f1f1f1;
                            color: #1c1c1c;
                        }

                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #f1f1f1;
                            border: 1px solid #1c1c1c;
                            border-radius: 8px;
                            padding: 20px;
                            text-align: center;
                        }

                        .container .logo {
                            margin-bottom: 20px;
                        }

                        .container .logo img {
                            max-width: 500px;
                        }

                        .container h2 {
                            color: #00407A;
                            font-family: 'MontserratBold', sans-serif;
                        }

                        .container p {
                            font-size: 16px;
                            line-height: 1.5;
                            color: #1c1c1c;
                        }

                        .container a {
                            background-color: #00407A;
                            color: #ffffff;
                            padding: 12px 24px;
                            text-decoration: none;
                            border-radius: 5px;
                            font-size: 16px;
                            font-family: 'MontserratBold', sans-serif;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="logo">
                            <img src="http://${req.headers.host}/backend/media/verification_email/BrightMinds_research_icon.png" alt="BrightMinds Research">
                        </div>
                        <h2>Verification Successful!</h2>
                        <p>Your account has been verified. You can now log in.</p>
                        <a href="https://www.brightmindsresearch.com/">Visit our Site</a>
                    </div>
                </body>
                </html>
            `);
        });
    });
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
        .select('_id email username role department score profilePictureUrl evaluation_list virtual_labs preferences tracking castPublications articlePublications university verificationToken isVerified')
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
        university: user.university,
        score: user.score,
        profilePictureUrl: user.profilePictureUrl,
        evaluation_list: user.evaluation_list,
        percentage: percentage,
        preferences: user.preferences,
        tracking: user.tracking,
        virtual_labs: user.virtual_labs,
        castPublications: user.castPublications,
        articlePublications: user.articlePublications,
        isVerified : user.isVerified,
        verificationToken: user.verificationToken,
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
            castPublications: req.body.user.castPublications,
            articlePublications: req.body.user.articlePublications,
            university: req.body.user.university
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
            castPublications: req.body.castPublications,
            articlePublications: req.body.articlePublications,
            university: req.body.university
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

exports.updateUserAddContentToList = async (req, res, next) => {
    const userId = req.params.id;
    const contentId = req.body.contentId;
    const type = req.body.type;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const existingEvaluation = user.evaluation_list.find(evaluation => evaluation.contentid === contentId);
        if (existingEvaluation) {
            return res.status(200).json({ message: 'Content already in the evaluation list.' });
        }

        // Determine the category of the content
        let category;
        if (type === 'cast') {
            const cast = await Cast.findById(contentId);
            if (!cast) {
                return res.status(404).json({ message: 'Cast not found.' });
            }
            category = cast.department;
        } else if (type === 'article') {
            const article = await Article.findById(contentId);
            if (!article) {
                return res.status(404).json({ message: 'Article not found.' });
            }
            category = article.department;
        } else {
            return res.status(400).json({ message: 'Invalid content type.' });
        }

        user.evaluation_list.push({
            contentid: contentId,
            type: type,
            watched: true,
            answered: false
        });

        // Update the history field
        const historyItem = user.tracking.history.find(item => item.category === category);
        if (historyItem) {
            historyItem.count += 1;
        } else {
            user.tracking.history.push({ category: category, count: 1 });
        }

        await user.save();
        res.status(200).json({ message: 'Content added to evaluation list and history updated.' });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred.' });
    }
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
    const contentId = req.body.contentId;

    User.findById(userId)
        .then((user) => {
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            // Filter out the evaluation object with the specified castId
            user.evaluation_list = user.evaluation_list.filter((evaluationObject) => {
                return evaluationObject.contentid !== contentId;
            });

            return user.save();
        })
        .then(() => {
            res.status(200).json({ message: 'Content removed from evaluation list.' });
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

exports.markContentAsAnswered = async (req, res, next) => {
    const userId = req.params.id;
    const contentId = req.body.contentId;

    User.findById(userId)
        .then((user) => {
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            // Find the specific evaluation in the user's "evaluation_list" array
            const evaluation = user.evaluation_list.find(item => item.contentid === contentId);

            if (!evaluation) {
                return res.status(404).json({ message: 'Evaluation not found.' });
            }

            // Update the "answered" field to true
            evaluation.answered = true;

            // Save the user object with the updated evaluation
            return user.save();
        })
        .then(() => {
            res.status(200).json({ message: 'Content marked as answered.' });
        })
        .catch((error) => {
            res.status(500).json({ error: 'An error occurred.' });
        });
}

exports.getSuggestedForYou = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (!user.preferences || user.preferences.length === 0) {
            return res.status(404).json({ message: 'No preferences set for user.' });
        }

        // Step 1: Fetch user preferences
        const preferences = user.preferences;

        // Step 2: Fetch casts for each preference category
        const castsByCategory = await Promise.all(preferences.map(async (pref) => {
            const casts = await Cast.find({ department: pref.category }).sort({ _id: 1 }).lean();
            return casts.map(cast => ({ ...cast, weight: pref.weight }));
        }));

        // Step 3: Flatten the array and sort the casts by weight
        const allCasts = castsByCategory.flat();
        allCasts.sort((a, b) => b.weight - a.weight);

        // Removing duplicates using a Set
        const uniqueCasts = [];
        const seenCasts = new Set();

        for (const cast of allCasts) {
            if (!seenCasts.has(cast._id.toString())) {
                uniqueCasts.push(cast);
                seenCasts.add(cast._id.toString());
            }
        }

        // Removing the weight property for the final response
        const finalCasts = uniqueCasts.map(({ weight, ...rest }) => rest);

        res.status(200).json(finalCasts);
    } catch (error) {
        console.error('Error fetching suggested casts:', error);
        res.status(500).json({ error: 'An error occurred.' });
    }
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

    // Verification for 'category' field
    if (!departments.includes(category)) {
        return res.status(400).json({ message: 'Invalid category. Must be one of the predefined departments.' });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if the category already exists in user preferences
        let existingCategory = user.preferences.find(pref => pref.category === category);

        if (existingCategory) {
            // Update the count based on the modification type
            existingCategory.count += modification === 'positive' ? 1 : -1;
            if (existingCategory.count < 0) existingCategory.count = 0; // Ensure count does not go negative
        } else if (modification === 'positive') {
            // If category doesn't exist and modification is positive, create new category with count 1
            user.preferences.push({ category: category, weight: 0, count: 1 });
        } // If category doesn't exist and modification is negative, ignore

        // Calculate the total count of all preferences
        const totalCount = user.preferences.reduce((acc, pref) => acc + pref.count, 0);

        // Update the weights based on the count
        user.preferences.forEach(pref => {
            if (totalCount > 0) {
                pref.weight = (pref.count / totalCount) * 100;
            } else {
                pref.weight = 0;
            }
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
    const validObjectives = ['Follower', 'Explorer', 'Deep Learner', 'Career', 'Researcher'];

    try {
        // Validate the objective value
        if (!validObjectives.includes(objective)) {
            return res.status(400).json({ message: 'Invalid objective value. Must be one of Follower, Explorer, Deep Learner, Career, or Researcher.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Set the objective and target fields
        user.tracking.objective = objective;
        user.tracking.target = getTargetValue(objective); // Set or update the target field

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

        res.status(200).json({ tracking: user.tracking, target: user.tracking.target});
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
