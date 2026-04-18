require("dotenv").config();

const legacyModels = require("./legacyData");
const { connectToDatabase } = require("./connect");
const { User, Photo, SchemaInfo } = require("../models");

function toDate(value) {
  if (value instanceof Date) {
    return value;
  }

  const rawValue = String(value).trim();
  const normalizedMatch = rawValue.match(
    /^(\d{4}-\d{2}-\d{2}) (\d{1,2}):(\d{2}):(\d{2})$/
  );

  if (normalizedMatch) {
    const [, datePart, hours, minutes, seconds] = normalizedMatch;
    return new Date(
      `${datePart}T${hours.padStart(2, "0")}:${minutes}:${seconds}`
    );
  }

  return new Date(rawValue);
}

function buildSeedPayload() {
  const users = legacyModels.userListModel().map((user) => ({
    ...user,
  }));

  const photos = users.flatMap((user) =>
    legacyModels.photoOfUserModel(user._id).map((photo) => ({
      _id: photo._id,
      date_time: toDate(photo.date_time),
      file_name: photo.file_name,
      user_id: photo.user_id,
      comments: (photo.comments || []).map((comment) => ({
        _id: comment._id,
        date_time: toDate(comment.date_time),
        comment: comment.comment,
        user: comment.user._id,
        photo_id: comment.photo_id || photo._id,
      })),
    }))
  );

  const schemaInfo = legacyModels.schemaInfo();

  return {
    users,
    photos,
    schemaInfo: {
      _id: schemaInfo._id,
      load_date_time: toDate(schemaInfo.load_date_time),
      __v: schemaInfo.__v,
    },
  };
}

async function loadDatabase() {
  await connectToDatabase();

  const { users, photos, schemaInfo } = buildSeedPayload();

  await Promise.all([
    User.deleteMany({}),
    Photo.deleteMany({}),
    SchemaInfo.deleteMany({}),
  ]);

  await User.insertMany(users, { ordered: true });
  await Photo.insertMany(photos, { ordered: true });
  await SchemaInfo.create(schemaInfo);
}

loadDatabase()
  .then(() => {
    console.log("Sample data loaded into MongoDB.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to load sample data:", error);
    process.exit(1);
  });
