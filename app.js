//jshint esversion:6
import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from 'mongoose';
import encrypt from "mongoose-encryption";

const app = express();

console.log(process.env.SECRET); //confirm it is working

app.use(express.static("public"));
app.set ('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const secret = process.env.SECRET;                                                           // level 3
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"]});                // level 2

const User = new mongoose.model("User", userSchema);

app.get("/",(req, res)=>{
    res.render("home");
});
app.get("/login",(req, res)=>{
    res.render("login");
});
app.get("/register",(req, res)=>{
    res.render("register");
});

app.post("/register",async(req, res)=>{
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
try {
    await newUser.save();
    res.render("secrets");
} catch (err) {
    console.log(err);
    res.status(500).send("Error saving user");
}
});

app.post("/login",async(req, res)=>{
    const username = req.body.username;
    const password = req.body.password;
    try{
        const foundUser = await User.findOne({email: username});
        
        if(!foundUser) return res.status(404).send("No User Found!");
        
        if(foundUser.password === password){                                       // level 1
            console.log(password); //still password is accsessible 
            return res.render("secrets");
        }
        else{
            return res.status(401).send("Wrong password!");
        }
    } catch (err){
        console.log(err);
        res.status(500).send("Internal Server Error!");
    }
});

app.listen(3000, function() {
console. log("Server started on port 3000.");

});