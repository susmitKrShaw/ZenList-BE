const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectId = mongoose.ObjectId;

const UserSchema = new Schema({
    username : {type : String, required: true},
    email: {type: String, unique : true, required: true},
    password : {type: String, required: true},
});

const TodosSchema = new Schema({
    title : String,
    userId : ObjectId
});

const UserModel = mongoose.model("Users", UserSchema);
const TodosModel = mongoose.model("Todos", TodosSchema);

module.exports = {
    UserModel,
    TodosModel
}
