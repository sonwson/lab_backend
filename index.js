const express = require('express');
const cors = require('cors');
const models = require('./models');

const app = express();
const PORT = 8080;

// Enable CORS for all routes
app.use(cors());

// Routes
app.get('/test/info', (req, res) => {
  res.json(models.schemaInfo());
});

app.get('/user/list', (req, res) => {
  res.json(models.userListModel());
});

app.get('/user/:id', (req, res) => {
  const user = models.userModel(req.params.id);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.get('/photosOfUser/:id', (req, res) => {
  const photos = models.photoOfUserModel(req.params.id);
  if (photos.length > 0) {
    res.json(photos);
  } else {
    res.status(404).json({ error: 'No photos found for this user' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});