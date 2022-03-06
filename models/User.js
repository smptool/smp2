const mongoose = require("mongoose");

// Schema
const Schema = mongoose.Schema;
const UserSchema = new Schema({
  name: String,
  email: {
    type: String,
    unique: true,
  },
  password: String,
  usertype: String,
  isActive: Boolean,
  employeenumber: String,
  mobile: String,
  companyId: { type: mongoose.ObjectId, default: null },
});

UserSchema.index({ name: 1, email: 1 }, { unique: true });

// Model
const User = mongoose.model("User", UserSchema);

module.exports = User;
