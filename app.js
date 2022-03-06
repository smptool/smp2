if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const mongoose = require("mongoose");
var hbs = require("hbs");
var passport = require("passport");
var flash = require("express-flash");
var session = require("cookie-session");
var methodOverride = require("method-override");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var adminRouter = require("./routes/admin");
var smpRouter = require("./routes/smp");
const User = require("./models/User");
const Company = require("./models/Company");

const initializePassport = require("./passport-config");
initializePassport(
  passport,
  (email) => users.find((user) => user.email === email),
  (id) => users.find((user) => user.id === id)
);

const users = [];

var app = express();

// const uri =
//   "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000";

const uri =
  "mongodb+srv://root:socialmedia@12@cluster0.yubl0.mongodb.net/socialmediamanager?retryWrites=true&w=majority";

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

mongoose.connection.on("connected", () => {
  try {
    User.find({}, function (err, data) {
      if (!err) {
        // console.log("users: ", data);
        users.length = 0;
        users.push(...data);
      } else {
        console.log("err: ", err);
      }
    });
  } catch (err) {
    console.log(err);
  }
  console.log("Connected to mongodb ...");
});

// view engine setup
hbs.registerPartials(__dirname + "/views/partials");
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    keys: ["secret", "secret2"],
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

/* GET login page. */
app.get("/login", function (req, res, next) {
  try {
    User.find({}, function (err, data) {
      if (!err) {
        // console.log("users: ", data);
        users.length = 0;
        users.push(...data);
        res.render("login", { title: "Login" });
      } else {
        console.log("err: ", err);
      }
    });
  } catch (err) {
    console.log(err);
  }
});

app.get("/deactivateduser", function (req, res, next) {
  res.render("deactivateduser", { title: "Deactivated User" });
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.delete("/logout", (req, res) => {
  req.logOut();
  res.redirect("/");
});

app.use("/", indexRouter);
app.use("/user", checkactiveuser, usersRouter);
app.use("/admin", adminRouter);
app.use("/smp", smpRouter);

function checkactiveuser(req, res, next) {
  if (req.user.isActive) {
    return next();
  }
  res.redirect("/deactivateduser");
}

// helpers
hbs.registerHelper("ifCond", function (v1, v2, options) {
  if (v1 === v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

hbs.registerHelper(
  "trimString",
  function (passedString, startstring, endstring) {
    var theString = passedString.toString().substring(startstring, endstring);
    return new hbs.SafeString(theString);
  }
);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
