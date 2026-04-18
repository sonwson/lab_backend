const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    location: { type: String, default: "" },
    description: { type: String, default: "" },
    occupation: { type: String, default: "" },
  },
  {
    collection: "users",
  }
);

const commentSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    date_time: { type: Date, required: true },
    comment: { type: String, required: true },
    user: {
      type: String,
      ref: "User",
      required: true,
    },
    photo_id: { type: String, required: true },
  },
  {
    _id: false,
  }
);

const photoSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    date_time: { type: Date, required: true },
    file_name: { type: String, required: true },
    user_id: {
      type: String,
      ref: "User",
      required: true,
      index: true,
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
  },
  {
    collection: "photos",
  }
);

const schemaInfoSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    load_date_time: { type: Date, required: true },
  },
  {
    collection: "schema_info",
  }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Photo = mongoose.models.Photo || mongoose.model("Photo", photoSchema);
const SchemaInfo =
  mongoose.models.SchemaInfo || mongoose.model("SchemaInfo", schemaInfoSchema);

module.exports = {
  User,
  Photo,
  SchemaInfo,
};
