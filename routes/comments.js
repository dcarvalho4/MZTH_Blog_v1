var express = require("express");
var router  = express.Router({mergeParams: true});  //merge params from the Blog and Comments routes
var Blog = require("../models/blog");   // mongoose Blog Schema
var Comment = require("../models/comment");         // mongoose Comment Schema
var middleware = require("../middleware");
const { isLoggedIn, checkCommentOwnership, isAdmin } = middleware;

//==================================================
// COMMENT ROUTES
//==================================================

//COMMENTS NEW
router.get("/new", isLoggedIn, function(req, res){
    // find blog by id
    Blog.findById(req.params.id, function(err, blog){
        if(err)
        {
            console.log(err);
        }
        else
        {
            res.render("comments/new", {blog: blog});
        }
    });
});

//COMMENT CREATE
router.post("/", isLoggedIn,function(req, res){
    //lookup blog by id
    Blog.findById(req.params.id, function(err, blog) {
        if(err)
        {
            console.log(err);
            res.redirect("/blogs");
        }
        else
        {
            Comment.create(req.body.comment, function(err, comment){
                if(err)
                {
                    req.flash("error", "Something went wrong");
                    console.log(err);
                }
                else
                {
                    //add username and id to comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    //save comment
                    comment.save();
                    blog.comments.push(comment);
                    blog.save();
                    console.log(comment);
                    req.flash("success", "Successfully added comment");
                    res.redirect('/blogs/' + blog._id);
                }
            });
        }
    });
});

// COMMENT EDIT ROUTE
//router.get("/:comment_id/edit", isLoggedIn, checkCommentOwnership, function(req, res)
router.get("/:commentId/edit", isLoggedIn, checkCommentOwnership, function(req, res)
{
	res.render("comments/edit", {blog_id: req.params.id, comment: req.comment});
});
/*
   Blog.findById(req.params.id, function(err, foundBlog)
   {
        if(err || !foundBlog)
        {
            req.flash("error", "Blog not found");
            return res.redirect("back");
        }
        Comment.findById(req.params.comment_id, function(err, foundComment)
        {
              if(err || !foundComment)
              {
                  req.flash("error", "Comment not found");
                  res.redirect("back");
              } 
              else 
              {
                res.render("comments/edit", {blog_id: req.params.id, comment: foundComment});
              }
        });
   });
}); */

// COMMENT UPDATE
//router.put("/:comment_id", checkCommentOwnership, function(req, res){
router.put("/:commentId", checkCommentOwnership, function(req, res){
   Comment.findByIdAndUpdate(req.params.commentId, req.body.comment, function(err, updatedComment)
   {
      if(err || !updatedComment)
      {
          req.flash("error", "Updated Comment error -or- not found");
          //res.redirect("back");
		  res.render("edit");
      } 
      else 
      {
          res.redirect("/blogs/" + req.params.id );
      }
   });
});

// COMMENT DESTROY ROUTE
router.delete("/:commentId", isLoggedIn, checkCommentOwnership, function(req, res)
{
    // find blog, remove comment from comments array, delete comment in db
    Comment.findByIdAndUpdate(req.params.id,
    {
		$pull: 
		{
	      comments: req.comment.id
	    }
	}, function(err) 
	    {	
           if(err)
           {
    		   console.log(err)
               req.flash("error", "ERROR: Deleting Comment Failed");
               //res.redirect("back");
           } 
           else 
           {
    		  req.comment.remove(function(err) 
    		  {
    	          if(err) 
    	          {
    	            req.flash('error', err.message);
    	            return res.redirect('/');
    	          }
    	          req.flash('alert', 'Comment deleted.');
    	          res.redirect("/blogs/" + req.params.id); 
        	  });
           }
	 });   
});

module.exports = router;