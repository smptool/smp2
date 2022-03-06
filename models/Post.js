const mongoose = require("mongoose");

// Schema
const Schema = mongoose.Schema;
const PostSchema = new Schema({
  message: String,
  fb: Boolean,
  fbPostId: { type: String, default: null },
  ig: Boolean,
  igPostId: { type: String, default: null },
  twitter: Boolean,
  twitterPostId: { type: String, default: null },
  companyId: { type: mongoose.ObjectId, default: null },
  userId: { type: mongoose.ObjectId, default: null },
});

// Model
const Post = mongoose.model("Post", PostSchema);

module.exports = Post;
