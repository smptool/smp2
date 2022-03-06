var express = require("express");
var router = express.Router();
var fs = require("fs");
var multer = require("multer");
var mongoose = require("mongoose");
var Twit = require("twit");
const request = require("request-promise");
const Instagram = require("instagram-web-api");
// var twitterKeys = require("./twitterkeys");
// var fbKeys = require("./fbkeys");
// var igKeys = require("./igkeys");
var config = require("./config");

const Company = require("../models/Company");
const User = require("../models/User");
const Post = require("../models/Post");
const { CommandCursor } = require("mongodb");

var storagePost = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/posts");
  },
  filename: function (req, file, cb) {
    cb(null, "temppost.jpg");
  },
});
var uploadPost = multer({ storage: storagePost });

// twitter cred
var T;

// fb cred
var page_id;
var access_token;

// ig cred
var igu;
var igp;

var client;

function setCred(companyId) {
  return new Promise(function (resolve, reject) {
    Company.findOne({
      _id: mongoose.Types.ObjectId(companyId),
    })
      .then((company) => {
        T = new Twit({
          consumer_key: company.twitter.API_key,
          consumer_secret: company.twitter.API_secret_key,
          access_token: company.twitter.Access_token,
          access_token_secret: company.twitter.Access_token_secret,
          timeout_ms: 60 * 1000,
          strictSSL: false,
        });

        page_id = company.fb.page_id;
        access_token = company.fb.access_token;

        igu = company.ig.email;
        igp = company.ig.password;

        resolve("set cred done");
      })
      .catch((err) => {
        console.log(err);
        reject(null);
      });
  });
}

//twitter functions

function twitter_post(filename, mssg) {
  return new Promise(function (resolve, reject) {
    var b64content = fs.readFileSync("public/posts/" + filename + ".jpg", {
      encoding: "base64",
    });

    // first we must post the media to Twitter
    T.post("media/upload", { media_data: b64content }, function (
      err,
      data,
      response
    ) {
      // now we can assign alt text to the media, for use by screen readers and
      // other text-based presentations and interpreters
      var mediaIdStr = data.media_id_string;
      var altText = "picture";
      var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } };

      T.post("media/metadata/create", meta_params, function (
        err,
        data,
        response
      ) {
        if (!err) {
          // now we can reference the media and post a tweet (media will attach to the tweet)
          var params = {
            status: mssg,
            media_ids: [mediaIdStr],
          };
          T.post("statuses/update", params, function (err, data, response) {
            console.log("twitter done");
            console.log(data.id_str);
            resolve(data.id_str);
          });
        } else {
          // reject(err);
          reject("twitter failed to post");
        }
      });
    });
  });
}

function twitter_delete(tweetId) {
  T.post("statuses/destroy/:id", { id: tweetId }, function (
    err,
    data,
    response
  ) {
    // console.log(data);
    console.log("tweet deleted");
  });
}

// fb functions

function fb_post(filename, mssg) {
  return new Promise(function (resolve, reject) {
    const postTextOptions = {
      method: "POST",
      uri: `https://graph.facebook.com/v8.0/${page_id}/photos`,
      qs: {
        access_token: access_token,
        caption: mssg,
        url: "http://smptool.herokuapp.com/posts/" + filename + ".jpg",
      },
    };

    request(postTextOptions)
      .then(function (data) {
        post_id = JSON.parse(data).post_id;
        console.log(post_id);
        console.log("fb posted");
        resolve(post_id);
      })
      .catch(function (err) {
        console.log("fb failed to post");
        reject(err);
      });
  });
}

function fb_delete(page_post_id) {
  const deletePostOptions = {
    method: "DELETE",
    uri: `https://graph.facebook.com/v8.0/${page_post_id}`,
    qs: {
      access_token: access_token,
    },
  };

  request(deletePostOptions)
    .then(function (data) {
      console.log(data);
    })
    .catch(function (err) {
      console.log(err);
    });
}

//instagram

function ig_post(filename, mssg) {
  client = new Instagram({ igu, igp });
  return new Promise(function (resolve, reject) {
    client
      .login({ username: igu, password: igp })
      .then((data) => {
        // const photo = "http://smptool.herokuapp.com/images/post2.jpg";
        const photo = "http://smptool.herokuapp.com/posts/" + filename + ".jpg";
        console.log(photo);
        return client.uploadPhoto({
          photo: photo,
          caption: mssg,
          post: "feed",
        });
      })
      .then((media) => {
        if (!media) {
          reject(null);
        }
        console.log(media.media.id);
        console.log("ig posted");
        resolve(media.media.id);
      })
      .catch((err) => {
        console.log(err);
      });
  });
}

function ig_delete(mediaId) {
  client = new Instagram({ igu, igp });
  (async () => {
    await client.login({ username: igu, password: igp });
    await client.deleteMedia({ mediaId: mediaId });
    console.log("ig deleted");
  })();
}

router.post("/create", uploadPost.single("pic"), (req, res) => {
  console.log("req body - ", req.body);
  const data = {
    message: req.body.message,
    companyId: req.user.companyId,
    userId: req.user.id,
    fb: req.body.fb ? true : false,
    twitter: req.body.twitter ? true : false,
    ig: req.body.ig ? true : false,
  };
  setCred(req.user.companyId)
    .then((setcred) => {
      return Company.findOne({
        _id: mongoose.Types.ObjectId(req.user.companyId),
      });
    })
    .then((company) => {
      if (req.body.addtocaption) {
        data.message += `\n${company.name} ( ${company.website} )`;
      }

      if (data.twitter) {
        return twitter_post("temppost", data.message);
      } else {
        return null;
      }
    })
    .then((twitterPostId) => {
      data.twitterPostId = twitterPostId;
      if (data.fb) {
        return fb_post("temppost", data.message);
      } else {
        return null;
      }
    })
    .then((fbPostId) => {
      data.fbPostId = fbPostId;
      if (data.ig) {
        return ig_post("temppost", data.message);
      } else {
        return null;
      }
    })
    .then((igPostId) => {
      data.igPostId = igPostId;
      console.log("data", data);
      const newPost = new Post(data);
      newPost.save((error) => {
        if (error) {
          console.log(error);
          res.redirect("/");
          return;
        }
        if (fs.existsSync("public/posts/temppost.jpg")) {
          fs.rename(
            "public/posts/temppost.jpg",
            "public/posts/" + newPost.id + ".jpg",
            function (err) {
              if (err) console.log("ERROR: " + err);
              else {
                return res.redirect("/");
              }
            }
          );
        }
      });
    });
});

router.post("/delete", (req, res) => {
  var post;
  Post.findOne({
    _id: mongoose.Types.ObjectId(req.body.postId),
  })
    .then((data) => {
      post = data;
      return setCred(req.user.companyId);
    })
    .then((setcred) => {
      if (post.twitter) {
        twitter_delete(post.twitterPostId);
      }

      if (post.fb) {
        fb_delete(post.fbPostId);
      }

      if (post.ig) {
        ig_delete(post.igPostId);
      }

      Post.deleteOne(
        { _id: mongoose.Types.ObjectId(req.body.postId) },
        function (err) {
          if (err) {
            console.log(err);
          }
          return res.redirect("/");
        }
      );
    });
});

module.exports = router;
