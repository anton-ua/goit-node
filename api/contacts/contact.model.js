const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { Schema } = require("mongoose");

const contactSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },

  subscription: { type: String, required: true },
});

contactSchema.plugin(mongoosePaginate);

const contactModel = mongoose.model("Contact", contactSchema);

module.exports = contactModel;
