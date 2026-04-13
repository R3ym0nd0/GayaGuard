const express = require('express');
const { getAllRequests, getDashboardSummary, getResidentsList, getReportsSummary, updateRequestStatus } = require('../controllers/admin.controller');
const { requireAuth } = require('../middleware/requireAuth');
const { requireRole } = require('../middleware/requireRole');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('admin', 'staff'));

router.get('/dashboard', getDashboardSummary);
router.get('/requests', getAllRequests);
router.get('/residents', getResidentsList);
router.get('/reports', getReportsSummary);
router.patch('/requests/:id/status', updateRequestStatus);

module.exports = router;
