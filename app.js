var express     = require("express"),               // Fast, unopinionated, minimalist web framework for Node.js
    app         = express(), 
    bodyParser  = require("body-parser"),           // Node.js body parsing middleware - needed to be able access post request.body
    mongoose    = require("mongoose"),              // Mongoose provides a straight-forward, schema-based solution to model your application data. It includes built-in type casting, validation, query building, business logic hooks and more, out of the box.
    passport    = require("passport"),              // Simple, unobtrusive authentication for Node.js
    cookieParser = require("cookie-parser"),		// cookie-parser is a module that handles cookies in your Node.js app, see here for more info: https://www.codementor.io/noddy/cookie-management-in-express-js-du107rmna
    LocalStrategy = require("passport-local"),      // Passport strategy for authenticating with a username and password
    flash       = require("connect-flash"),         // Display Successful, Error, and Informational messages to the user
    //MODEL (SCHEMA) SETUP
    Blog        = require("./models/blog"),
    Comment     = require("./models/comment"),
    User        = require("./models/user"),
    session 	= require("express-session"), 	    // Helps maintain our user data
    seedDB      = require("./seeds"),
    methodOverride = require("method-override");    // Lets you use HTTP verbs such as PUT or DELETE in places where the client doesn't support it.
// configure dotenv
require('dotenv').load();                           // Dotenv is a zero-dependency module that loads environment variables from a .env file into process.env.


//requiring routes
var commentRoutes    = require("./routes/comments"),
    blogRoutes       = require("./routes/blogs"),
    indexRoutes      = require("./routes/index")
    
// assign mongoose promise library and connect to database
mongoose.Promise = global.Promise; // removes warning about promises (we are not using promises) --> (node:4174) DeprecationWarning: Mongoose: mpromise (mongoose's default promise library) is deprecated, plug in your own promise library instead: http://mongoosejs.com/docs/promises.html

var url = process.env.DATABASEURL;
mongoose.connect(url, {useMongoClient: true}) //creates the db if it does not exist and useMongoClient removes (node:2285) DeprecationWarning: `open()` is deprecated
      .then(() => console.log(`Database connected`))
      .catch(err => console.log(`Database connection error: ${err.message}`));

app.use(bodyParser.urlencoded({extended: true})); //The "extended: true" syntax allows for rich objects and arrays to be encoded into the URL-encoded format, allowing for a JSON-like experience with URL-encoded.
app.set("view engine", "ejs");  //removes the need to have the .ejs file name extension
app.use(express.static(__dirname + "/public"));  //To serve static files such as images, CSS files, and JavaScript files from our /public direction
app.use(methodOverride("_method")); //Lets you use HTTP verbs such as PUT or DELETE in places where the client doesn't support it. 
app.use(cookieParser('secret')); //Parse Cookie header and populate req.cookies with an object keyed by the cookie names. Optionally you may enable signed cookie support by passing a secret string, which assigns req.secret so it may be used by other middleware.
//require moment
app.locals.moment = require('moment'); //A lightweight JavaScript date library for parsing, validating, manipulating, and formatting dates.
//seedDB(); //seed the database

//===================================================================================================================================
//PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Shuffle your deck thoroughly!",
    resave: false,
    saveUninitialized: false
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Comes from UserSchema.plugin(passportLocalMongoose);
passport.use(new LocalStrategy(User.authenticate())); 
passport.serializeUser(User.serializeUser());  //encoding/serializing the data and putting the data back into session
passport.deserializeUser(User.deserializeUser()); //reading the session, taking data from the session, and decoding the encoded data
//===================================================================================================================================

const loginFailedError = 'Password or username is incorrect';    // TODO: find a better way to compare for this type of error - with a bool probably.
const loginFailedError2 = 'Password or username are incorrect';  // TODO: find a better way to compare for this type of error - with a bool probably.

//Pass the currentUser, error, success to every single template (header.ejs, etc.)
app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   res.locals.loginFailedMsg = loginFailedError;
   res.locals.loginFailedMsg2 = loginFailedError2;
   next();  
});

app.use("/", indexRoutes);
app.use("/blogs", blogRoutes);
app.use("/blogs/:id/comments", commentRoutes);

// =====================================================
// Tell Express to listen for requests (start server)
// =====================================================
app.listen(process.env.PORT, process.env.IP, function(){
    console.log("The *Magic: Zero to Hero Blog (MZTH_Blog)* Server Has Started!");
});
