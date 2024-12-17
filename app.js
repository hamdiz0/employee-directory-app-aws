const path = require('path');
const express = require('express');

var cors = require('cors');
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

// Routes
const employeeRoutes = require('./api/routes/employees');
const settingsRoutes = require('./api/routes/settings');

// Routes which should handle requests
app.use('/api/employees', employeeRoutes);
app.use('/api/settings', settingsRoutes);

// Static Routes
app.use(express.static(path.join(__dirname, 'build')));
app.use(express.static(path.join(__dirname, 'public')));

// index.html route
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Not Found route
app.use((req, res, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
});

// //Other errors route
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

module.exports = app;
