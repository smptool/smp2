var express = require("express");
var multer = require("multer");
var fs = require("fs");
var router = express.Router();
const mongoose = require("mongoose");

const Company = require("../models/Company");
const User = require("../models/User");
const Post = require("../models/Post");

/* GET users dashboard. */
router.get("/", function (req, res, next) {
  try {
    Post.find({}, function (err, posts) {
      if (!err) {
        console.log(posts);
        res.render("user", { title: "User", user: req.user, posts });
      } else {
        console.log("err: ", err);
      }
    });
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
