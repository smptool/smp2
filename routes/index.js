var express = require("express");
var router = express.Router();
const User = require("../models/User");
const mongoose = require("mongoose");

/* GET home page. */
router.get("/", function (req, res, next) {
  if (req.user) {
    if (req.user.usertype == "admin") {
      res.redirect("/admin");
    } else {
      res.redirect("/user");
    }
  }
  res.render("index", { title: "Home" });
});

/* GET register page. */
router.get("/register", function (req, res, next) {
  res.render("register", { title: "Register" });
});

router.post("/register", (req, res) => {
  const data = req.body;

  const newUser = new User(data);

  newUser.save((error) => {
    if (error) {
      res.redirect("/register");
      return;
    }
    // User
    return res.redirect("/login");
  });
});

router.get("/changepassword", function (req, res, next) {
  res.render("changepassword", {
    title: "Change Password",
    useremail: req.user.email,
  });
});

router.post("/changepassword", function (req, res, next) {
  if (req.user.password != req.body.oldpassword) {
    req.flash("error", "Invalid password");
    res.redirect("/changepassword");
    return;
  } else {
    User.update(
      { _id: mongoose.Types.ObjectId(req.user.id) },
      { password: req.body.newpassword }
    )
      .then(function (success) {
        res.redirect("/");
      })
      .catch(function (error) {
        res.status(404).send(err);
      });
  }
});

module.exports = router;
