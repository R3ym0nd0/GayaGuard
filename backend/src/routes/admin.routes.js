const express = require('express');
const { getAllRequests, getDashboardSummary, getResidentsList, getReportsSummary, updateRequestStatus, updateRequestPayment, updateRequestReleaseProof } = require('../controllers/admin.controller');
const { requireAuth } = require('../middleware/requireAuth');
const { requireRole } = require('../middleware/requireRole');
const { uploadReleaseProof } = require('../middleware/uploadReleaseProof');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('admin', 'staff'));

router.get('/dashboard', getDashboardSummary);
router.get('/requests', getAllRequests);
router.get('/residents', getResidentsList);
router.get('/reports', getReportsSummary);
router.patch('/requests/:id/status', updateRequestStatus);
router.patch('/requests/:id/payment', updateRequestPayment);
router.patch('/requests/:id/release-proof', uploadReleaseProof.single('releaseProof'), updateRequestReleaseProof);

module.exports = router;
