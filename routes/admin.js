var express = require("express");
var router = express.Router();
var fs = require("fs");
var multer = require("multer");
const mongoose = require("mongoose");

const Company = require("../models/Company");
const User = require("../models/User");
const Post = require("../models/Post");

var storageCompany = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/companylogo");
  },
  filename: function (req, file, cb) {
    cb(null, "templogo.png");
  },
});
var uploadCompany = multer({ storage: storageCompany });

/* GET admin dashboard. */
router.get("/", function (req, res, next) {
  if (req.user.companyId) {
    try {
      Company.findOne(
        { _id: mongoose.Types.ObjectId(req.user.companyId) },
        function (err, company) {
          if (!err) {
            console.log(company);
            res.render("admin", { title: "Admin", user: req.user, company });
          } else {
            console.log("err: ", err);
          }
        }
      );
    } catch (err) {
      next(err);
    }
  } else {
    res.redirect("/admin/addcompany");
  }
});

router.get("/addcompany", function (req, res, next) {
  res.render("addcompany", { title: "Admin", user: req.user });
});

router.post(
  "/addcompany",
  uploadCompany.single("logo"),
  function (req, res, next) {
    const newCompany = new Company(req.body);
    newCompany.save((error) => {
      if (error) {
        console.log("Errorr:", error);
        return res.redirect("/admin/addcompany");
      }
      if (fs.existsSync("public/companylogo/templogo.png")) {
        fs.rename(
          "public/companylogo/templogo.png",
          "public/companylogo/" + newCompany.id + ".png",
          function (err) {
            if (err) console.log("ERROR: " + err);
            else {
              User.updateOne(
                { _id: mongoose.Types.ObjectId(req.user.id) },
                { companyId: newCompany.id }
              )
                .then(function (success) {
                  res.redirect("/admin");
                })
                .catch(function (error) {
                  res.status(404).send(err);
                });
            }
          }
        );
      }
    });
  }
);

router.get("/editcompany", function (req, res, next) {
  try {
    Company.findOne(
      { _id: mongoose.Types.ObjectId(req.user.companyId) },
      function (err, company) {
        if (!err) {
          console.log(company);
          res.render("editcompany", {
            title: "Admin",
            user: req.user,
            company,
          });
        } else {
          console.log("err: ", err);
        }
      }
    );
  } catch (err) {
    next(err);
  }
});

router.post("/editcompany", function (req, res) {
  Company.update({ _id: mongoose.Types.ObjectId(req.user.companyId) }, req.body)
    .then(function (success) {
      res.redirect("/admin");
    })
    .catch(function (error) {
      res.status(404).send(err);
    });
});

router.post(
  "/editcompanypic",
  uploadCompany.single("logo"),
  function (req, res) {
    fs.unlink(
      "public/companylogo/" + req.user.companyId + ".png",
      function (err) {
        if (err) return console.log(err);
        console.log("file deleted successfully");
        if (fs.existsSync("public/companylogo/templogo.png")) {
          fs.rename(
            "public/companylogo/templogo.png",
            "public/companylogo/" + req.user.companyId + ".png",
            function (err) {
              if (err) console.log("ERROR: " + err);
              else {
                res.redirect("/admin");
              }
            }
          );
        }
      }
    );
  }
);

router.get("/manageusers", function (req, res, next) {
  if (req.user.companyId) {
    try {
      User.find({ usertype: "user" }, function (err, allusers) {
        if (!err) {
          // console.log(allusers);
          res.render("manageusers", {
            title: "Admin",
            user: req.user,
            allusers,
          });
        } else {
          console.log("err: ", err);
        }
      });
    } catch (err) {
      next(err);
    }
  } else {
    res.redirect("/admin/addcompany");
  }
});

// User.deleteMany({ usertype: "user" }, function (err) {
//     console.log("all users del: ");
// });

router.post("/adduser", (req, res) => {
  const data = req.body;
  data.companyId = req.user.companyId;
  const newUser = new User(data);

  newUser.save((error) => {
    if (error) {
      console.log(error);
      res.redirect("/admin/manageusers");
      return;
    }
    // User
    return res.redirect("/admin/manageusers");
  });
});

router.post("/updateuser", function (req, res) {
  User.update({ _id: mongoose.Types.ObjectId(req.body.id) }, req.body)
    .then(function (success) {
      res.redirect("/admin/manageusers");
    })
    .catch(function (error) {
      res.status(404).send(err);
    });
});

router.get("/manageaccounts", function (req, res, next) {
  try {
    Company.findOne(
      { _id: mongoose.Types.ObjectId(req.user.companyId) },
      function (err, company) {
        if (!err) {
          // console.log(company.fb);
          res.render("manageaccounts", {
            title: "Admin",
            user: req.user,
            company,
          });
        } else {
          console.log("err: ", err);
        }
      }
    );
  } catch (err) {
    next(err);
  }
});

router.post("/add/fb", function (req, res) {
  Company.update(
    { _id: mongoose.Types.ObjectId(req.user.companyId) },
    { fb: { ...req.body } }
  )
    .then(function (success) {
      res.redirect("/admin/manageaccounts");
    })
    .catch(function (error) {
      res.status(404).send(err);
    });
});

router.get("/del/fb", function (req, res) {
  Company.update(
    { _id: mongoose.Types.ObjectId(req.user.companyId) },
    { fb: {} }
  )
    .then(function (success) {
      res.redirect("/admin/manageaccounts");
    })
    .catch(function (error) {
      res.status(404).send(err);
    });
});

router.post("/add/twitter", function (req, res) {
  Company.update(
    { _id: mongoose.Types.ObjectId(req.user.companyId) },
    { twitter: { ...req.body } }
  )
    .then(function (success) {
      res.redirect("/admin/manageaccounts");
    })
    .catch(function (error) {
      res.status(404).send(err);
    });
});

router.get("/del/twitter", function (req, res) {
  Company.update(
    { _id: mongoose.Types.ObjectId(req.user.companyId) },
    { twitter: {} }
  )
    .then(function (success) {
      res.redirect("/admin/manageaccounts");
    })
    .catch(function (error) {
      res.status(404).send(err);
    });
});

router.post("/add/ig", function (req, res) {
  Company.update(
    { _id: mongoose.Types.ObjectId(req.user.companyId) },
    { ig: { ...req.body } }
  )
    .then(function (success) {
      res.redirect("/admin/manageaccounts");
    })
    .catch(function (error) {
      res.status(404).send(err);
    });
});

router.get("/del/ig", function (req, res) {
  Company.update(
    { _id: mongoose.Types.ObjectId(req.user.companyId) },
    { ig: {} }
  )
    .then(function (success) {
      res.redirect("/admin/manageaccounts");
    })
    .catch(function (error) {
      res.status(404).send(err);
    });
});

router.get("/manageposts", function (req, res, next) {
  try {
    Post.find({}, function (err, posts) {
      if (!err) {
        console.log(posts);
        res.render("manageposts", { title: "Admin", user: req.user, posts });
      } else {
        console.log("err: ", err);
      }
    });
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
