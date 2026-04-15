const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');

const router = express.Router();

router.use(ensureAuthenticated);

router.get('/', getNotifications);

router.put('/:id/read', markAsRead);

router.put('/read-all', markAllAsRead);

router.delete('/:id', deleteNotification);

module.exports = router;
