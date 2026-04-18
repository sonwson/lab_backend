require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { connectToDatabase } = require("./db/connect");
const { User, Photo, SchemaInfo } = require("./models");

const app = express();
const PORT = Number(process.env.PORT || 8080);

app.use(cors());
app.use(express.json());

app.get("/test/info", async (req, res, next) => {
  try {
    const schemaInfo = await SchemaInfo.findOne().lean();

    if (!schemaInfo) {
      return res.status(404).json({ error: "Schema info not found" });
    }

    return res.json(schemaInfo);
  } catch (error) {
    return next(error);
  }
});

app.get("/user/list", async (req, res, next) => {
  try {
    const [users, photoCounts, commentCounts] = await Promise.all([
      User.find()
        .select("_id first_name last_name")
        .sort({ last_name: 1, first_name: 1 })
        .lean(),
      Photo.aggregate([
        {
          $group: {
            _id: "$user_id",
            photoCount: { $sum: 1 },
          },
        },
      ]),
      Photo.aggregate([
        { $unwind: "$comments" },
        {
          $group: {
            _id: "$comments.user",
            commentCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const photoCountByUserId = new Map(
      photoCounts.map((item) => [item._id, item.photoCount])
    );
    const commentCountByUserId = new Map(
      commentCounts.map((item) => [item._id, item.commentCount])
    );

    const usersWithCounts = users.map((user) => ({
      ...user,
      photoCount: photoCountByUserId.get(user._id) || 0,
      commentCount: commentCountByUserId.get(user._id) || 0,
    }));

    return res.json(usersWithCounts);
  } catch (error) {
    return next(error);
  }
});

app.get("/user/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("_id first_name last_name location description occupation")
      .lean();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return next(error);
  }
});

app.get("/photosOfUser/:id", async (req, res, next) => {
  try {
    const userExists = await User.exists({ _id: req.params.id });

    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }

    const photos = await Photo.find({ user_id: req.params.id })
      .select("_id user_id file_name date_time comments")
      .populate("comments.user", "_id first_name last_name")
      .lean();

    const normalizedPhotos = photos.map((photo) => ({
      _id: photo._id,
      date_time: photo.date_time,
      file_name: photo.file_name,
      user_id: photo.user_id,
      comments: (photo.comments || []).map((comment) => ({
        _id: comment._id,
        date_time: comment.date_time,
        comment: comment.comment,
        user: comment.user,
        photo_id: comment.photo_id,
      })),
    }));

    return res.json(normalizedPhotos);
  } catch (error) {
    return next(error);
  }
});

app.get("/commentsOfUser/:id", async (req, res, next) => {
  try {
    const userExists = await User.exists({ _id: req.params.id });

    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }

    const comments = await Photo.aggregate([
      { $unwind: "$comments" },
      { $match: { "comments.user": req.params.id } },
      {
        $project: {
          _id: "$comments._id",
          comment: "$comments.comment",
          date_time: "$comments.date_time",
          photo_id: "$_id",
          photo_user_id: "$user_id",
          file_name: "$file_name",
        },
      },
      { $sort: { date_time: -1 } },
    ]);

    return res.json(comments);
  } catch (error) {
    return next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    error: "Internal server error",
  });
});

async function startServer() {
  await connectToDatabase();
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Failed to start backend server:", error);
    process.exit(1);
  });
}

module.exports = {
  app,
  startServer,
};
