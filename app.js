//jshint esversion:6
import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from 'mongoose';
import session from "express-session";
import passportLocalMongoose from "passport-local-mongoose";
import passport from "passport";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import findOrCreate from "mongoose-findorcreate";

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
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",(req, res)=>{
    res.render("home");
});
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));
app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
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
        res.redirect("/login");
    }
});
app.get("/submit",(req, res)=>{
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/login");
    }
});
app.post("/submit",async(req, res)=>{
    const submittedSecret = req.body.secret;
    console.log(req.user.id);
    try {
    const foundUser = await User.findById(req.user.id);
    if (!foundUser) {
            return res.status(404).send("User not found.");
        }
        foundUser.secret = submittedSecret;
        await foundUser.save();
        res.redirect("/secrets");
    } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Server error.");
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