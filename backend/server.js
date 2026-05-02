require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 5000;
console.log("ENV PORT:", process.env.PORT);

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, '../frontend')));


app.use('/api/auth', require('./routes/auth'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/workshops', require('./routes/workshops'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/gallery', require('./routes/gallery'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    name: 'AIcyberX API',
    version: '1.0.0',
    time: new Date().toISOString(),
  });
});


app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  } else {
    res.status(404).json({ error: 'API route not found.' });
  }
});


app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
