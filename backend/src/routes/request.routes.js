const express = require('express');
const { createRequest, getMyRequests } = require('../controllers/request.controller');
const { optionalAuth, requireAuth } = require('../middleware/requireAuth');
const { uploadRequestFile } = require('../middleware/uploadRequestFile');

const router = express.Router();

router.get('/mine', requireAuth, getMyRequests);
router.post('/', optionalAuth, uploadRequestFile.single('supportingDocument'), createRequest);

module.exports = router;
