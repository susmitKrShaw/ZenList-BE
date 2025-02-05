const jwt = require('jsonwebtoken');
const { JWT_USER_SECRET } = require('../config')


const userAuthMiddleware = (req,res,next) => {
    const token = req.headers["authorization"];
    if (!token) {
        res.status(403).json({
          message: "Token not provided",
        });
        return;
      }
    const decodedUser = jwt.verify(token,JWT_USER_SECRET);
    if(decodedUser){
        req.userId = decodedUser.id;
        next();
    }else{
        res.status(403).json({
            message: "Incorrect Credentials"
        })
    }
}

module.exports = {
    userAuthMiddleware
}