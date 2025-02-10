const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const { z, any } = require('zod');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_USER_SECRET, MONGO_URL } = require('./config');
const { UserModel, TodosModel } = require('./db');
const { userAuthMiddleware } = require('./middlewares/userAuthMiddleware');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());


app.post("/signup", async (req,res)=>{

    try {
        const requiredBody = z.object({
            username : z.string().min(3, 'Username must contain at least 3 characters').max(20,'Username should not contain more than 30 characters'),
            email : z.string().min(10).max(50).email(),
            password : z.string().min(8, 'Password must contain at least 8 characters').max(30, 'Password should not contain more than 30 characters').regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])/, {
                message:
                  "Password must include: uppercase, lowercase, number, and special character",
              })
        });
    
        const parsedDataWithSuccess = requiredBody.safeParse(req.body);
    
        if(!parsedDataWithSuccess.success){
            res.status(411).json({
                message : "Incorrect Format",
                error : parsedDataWithSuccess.error
            })
            return;
        }
    
        const {username, email, password} = req.body;
    
        const existingUser = await UserModel.findOne({
            $or:[{username},{email}]
        });
    
        if(existingUser){
            res.status(403).json({
                message : "User already exists"
            })
            return;
        }
    
        const hashedPassword = await bcrypt.hash(password,12)
       
        await UserModel.create({
            username,
            email,
            password : hashedPassword
        })
        res.status(200).json({
            message: "Welcome aboard"
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error during signup",
            error: error
        });
    }   
});

app.post("/signin", async (req,res)=>{
    const {username, email, password} = req.body;

    try {
        const user = await UserModel.findOne({
            $and:[{username},{email}]
        })
        if(!user){
            res.status(411).json({
                message :"Wrong credentials..Please Signup!"
            })
        }
    
        const passwordMatch = await bcrypt.compare(password,user.password);
    
        if(!passwordMatch){
            res.status(401).json({
                message : "Invalid Credentials!"
            });
            return;
        }
    
        const token = jwt.sign({
            id: user._id.toString()
        },JWT_USER_SECRET, {expiresIn:'24h'});
    
        res.status(200).json({
            token,
            message : "You are signed in!"
        })
    } catch (error) {
        res.status(500).json({
            message : "Server Error!",
            error : error.message
        });
    }
});

app.post("/addtodo", userAuthMiddleware, async (req,res)=>{
    const userId = req.userId;
    const title = req.body.title;

    const newTodo = await TodosModel.create({
        title,
        userId
    })
    res.status(200).json({
        newTodo
        
    })
});

app.get("/todos", userAuthMiddleware, async (req,res)=>{
    const userId = req.userId;

    const user = await UserModel.findById(userId);
    const username = user.username

    const todos = await TodosModel.find({
        userId
    })
    // console.log(todos);
    // todosTitle = todos.title ;
    res.status(200).json({
        todos,
        username
    })
});

app.delete("/deletetodo", userAuthMiddleware, async (req,res)=>{
    const userId = req.userId;
    const todoId = req.body._id;

    const todoToBeDeleted = await TodosModel.findOneAndDelete({
        _id: todoId,
        userId: userId
    })

    if (!todoToBeDeleted) {
        res.status(404).json({
            message: "Todo not found or you don't have permission to delete it"
        });
        return;
    }

    res.status(200).json({
        message : "Todo deleted"
    })
});

app.delete("/signout", userAuthMiddleware, async (req,res) => {
    localStorage.removeItem("token");
})

async function Server() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Database connection successful! The application is up and running.");

        app.listen(process.env.PORT || 3000, ()=>{
            console.log(`Server is listening on port ${process.env.PORT || 3000}...`);
        }); 
    } catch (error) {
        console.error("Database connection error: ", error);    
        process.exit(1); 
    }
}

Server();


