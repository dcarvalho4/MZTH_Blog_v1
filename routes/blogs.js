var express = require("express");
var router  = express.Router();
var Blog = require("../models/blog");
var Comment = require("../models/comment");
var middleware = require("../middleware");
var geocoder = require('geocoder');
var { isLoggedIn, checkBlogOwnership, checkCommentOwnership, isAdmin, isSafe } = middleware; // destructuring assignment
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'duvxhjmwd', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//INDEX Route (GET) - displays all blogs
router.get("/", function(req, res) {
  if(req.query.search && req.xhr) {  //req.xhr is true for ajax request
      const regex = new RegExp(escapeRegex(req.query.search), 'gi');
      // Get all blogs from DB
      Blog.find({name: regex}, function(err, allBlogs){
         if(err){
            console.log(err);
         } else {
            res.status(200).json(allBlogs);
         }
      });
  } else {
    //Get all blogs from DB
    Blog.find({}, function(err, allBlogs){
        if(err){
            console.log(err);
         } else {
            if(req.xhr) {
              res.json(allBlogs);
            } else {
              res.render("blogs/index",{blogs: allBlogs, page: 'blogs'});
        }
        }
    });
  }
});


//CREATE Route (POST) - Add new Blog to DB
//router.post("/", isLoggedIn, isSafe, upload.single('image'), function(req, res){ 
router.post("/", isLoggedIn, upload.single('imageUpload'), function(req, res){ 
    cloudinary.uploader.upload(req.file.path, function(result) {
      // add cloudinary url for the image to the blog object under image property
      req.body.image = result.secure_url;
       //get data from form and add data to blogs array
       var name = req.body.name;
       var image = req.body.image;
      var desc = req.body.description;
       var author = {
            id: req.user._id,
            username: req.user.username
       }
      var cost = req.body.cost;
      
      /*
       geocoder.geocode(req.body.location, function (err, data) {
        if (err || data.status === 'ZERO_RESULTS') {
          req.flash('error', 'Invalid address');
          return res.redirect('back');
        }
        var lat = data.results[0].geometry.location.lat;
        var lng = data.results[0].geometry.location.lng;
        var location = data.results[0].formatted_address; //*/
        //var newBlog = {name: name, image: image, description: desc, cost: cost, author:author, location: location, lat: lat, lng: lng};
        
        var newBlog = {name: name, image: image, description: desc, cost: cost, author:author, location: req.body.location, lat: 0, lng: 0};
       //Create a new blog and save to DB
       Blog.create(newBlog, function(err, newlyCreated){
          if(err){
              console.log(err);
          } 
          else
          {
               //redirect back to blogs page
                console.log(newlyCreated);
               res.redirect("/blogs");
          }
        //});
      });
    });
});

//NEW Route (GET) - Display a form to add a new Blog
router.get("/new", isLoggedIn, function(req, res){
    res.render("blogs/new");
});

//SHOW Route (GET) - Shows info about one blog (Blogs/:id)
router.get("/:id", function(req, res){
    //find the blog with provided ID
    Blog.findById(req.params.id).populate("comments").exec(function(err, foundBlog){
        if(err || !foundBlog){
            console.log(err);
            req.flash('error', 'Sorry, that blog does not exist!');
            return res.redirect('/blogs');
        }
        console.log(foundBlog)
            //render show template with that blog
            res.render("blogs/show", {blog: foundBlog});
    });
});

// EDIT Blog Route - shows edit form for a blog
router.get("/:id/edit", isLoggedIn, checkBlogOwnership, function(req, res){
  //render edit template with that blog
  res.render("blogs/edit", {blog: req.blog});
});


// UPDATE Blog Route - updates blog in the database
//router.put("/:id", isSafe, function(req, res){ 
router.put("/:id", upload.single('imageUpload'), function(req, res){ 
    cloudinary.uploader.upload(req.file.path, function(result) {
      // add cloudinary url for the image to the blog object under image property
      req.body.image = result.secure_url;
       //get data from form and add data to blogs array
       var name = req.body.name;
       var image = req.body.image;
      var desc = req.body.description;
       var author = {
            id: req.user._id,
            username: req.user.username
       }
      var cost = req.body.cost;

 //geocoder.geocode(req.body.location, function (err, data) 
 //{
    
    //if (err || data.status === 'ZERO_RESULTS') {
      //req.flash('error', 'Invalid address');
      //return res.redirect('back');
    //}
    /*
    var lat = data.results[0].geometry.location.lat;
    var lng = data.results[0].geometry.location.lng;
    var location = data.results[0].formatted_address; //*/

    // find and update the correct blog
    //var newData = {name: name, image: image, description: desc, cost: cost, author:author, location: location, lat: lat, lng: lng};
    var newData = {name: name, image: image, description: desc, author:author, lat: 0, lng: 0};
    Blog.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, blog){

        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/blogs/" + blog._id);
        }
        //});
        });
    });
});

// DELETE Blog Route  - removes blog and its comments from the database
router.delete("/:id", isLoggedIn, checkBlogOwnership, function(req, res) {
    Comment.remove({
      _id: {
        $in: req.blog.comments
      }
    }, function(err) {
      if(err){
          req.flash('error', err.message);
          res.redirect('/');
      } else {
          req.blog.remove(function(err) {
            if(err) {
                req.flash('error', err.message);
                return res.redirect('/');
      		}
            req.flash('error', 'Blog deleted!');
            res.redirect('/blogs');
   		  });
      }
    })
});

module.exports = router;

