//jshint esversion:6
import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from 'mongoose';
import session from "express-session";
import passportLocalMongoose from "passport-local-mongoose";
import passport from "passport";

const app = express();

app.use(express.static("public"));
app.set ('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: "OurSecret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",(req, res)=>{
    res.render("home");
});
app.get("/login",(req, res)=>{
    res.render("login");
});
app.get("/register",(req, res)=>{
    res.render("register");
});

app.get("/secrets",(req, res)=>{
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else{
        res.redirect("login");
    }
});
app.post("/register",async(req, res)=>{
    User.register({username: req.body.username}, req.body.password, function(err, user){
        try{
            passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
          });
        } catch(err){
            console.log(err);
            res.redirect("/register");
        }
    });
});

app.post("/login",async(req, res)=>{
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.logIn(user, function(err){
        try{
            passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
          });
        } catch(err){
            console.log(err);
            res.redirect("/login");
        }
    });
});

app.get("/logout", (req, res)=>{
    req.logOut((err)=>{
        try{
            res.redirect("/");
        }catch(err){
            console.log(err);
        }
    });
});

app.listen(3000, function() {
console. log("Server started on port 3000.");

});