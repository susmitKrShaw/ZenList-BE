require('dotenv').config();

const JWT_USER_SECRET = process.env.JWT_USER_SECRET;
const MONGO_URL = process.env.MONGO_URL;
module.exports = {
    JWT_USER_SECRET,
    MONGO_URL
}