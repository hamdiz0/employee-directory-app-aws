const express = require('express');
const router = express.Router();

const settingsController = require('../controllers/settings');

//GET
router.get('/', settingsController.getSettings);
router.get('/info', settingsController.getInfo);

//POST
router.post('/stress', settingsController.stressServer);
router.post('/cpu', settingsController.cpuUsage);
router.post('/set-bucket', settingsController.setBucket);

module.exports = router;
