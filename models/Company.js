const mongoose = require("mongoose");

// Schema
const Schema = mongoose.Schema;
const CompanySchema = new Schema({
  name: String,
  website: String,
  fb: {},
  twitter: {},
  ig: {},
});

// Model
const Company = mongoose.model("Company", CompanySchema);

module.exports = Company;
