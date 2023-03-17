const jwt = require('jsonwebtoken');

module.exports = (req, res, newt) => {
    try{
        const token = req.headers.authorization.split(" ")[1];
        const token_decoded = jwt.verify(token,'RANDOM_TOKEN_SECRET');
        const email = token_decoded.email;
        if (req.body.email && req.body.email == email){
            next();
        }
    }
    catch{
        res.status(401).json({
            error: new Error('Invalid Request')
        });
    }
}