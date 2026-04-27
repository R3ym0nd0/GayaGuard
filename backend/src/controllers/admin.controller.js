const { pool } = require('../config/db');
const { asyncHandler } = require('../utils/asyncHandler');

const getDashboardSummary = asyncHandler(async (req, res) => {
  const [requestCountsResult, recentRequestsResult] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*)::int AS total_requests,
        COUNT(*) FILTER (WHERE final_status IN ('pending', 'submitted', 'under_review', 'preparing_document', 'ready_for_pickup'))::int AS active_requests,
        COUNT(*) FILTER (WHERE final_status = 'ready_for_pickup')::int AS ready_for_pickup_requests,
        COUNT(*) FILTER (WHERE final_status IN ('approved', 'completed'))::int AS completed_requests,
        COUNT(*) FILTER (WHERE final_status = 'rejected')::int AS rejected_requests,
        COUNT(*) FILTER (WHERE screening_status = 'needs_review')::int AS needs_review
      FROM requests
    `),
    pool.query(`
      SELECT
        id,
        full_name,
        request_type,
        date_needed,
        purpose,
        additional_notes,
        supporting_file_name,
        screening_score,
        screening_summary,
        screening_status,
        payment_status,
        payment_amount,
        payment_reference,
        paid_at,
        release_proof_file_name,
        final_status,
        created_at
      FROM requests
      ORDER BY created_at DESC
      LIMIT 5
    `)
  ]);

  res.status(200).json({
    success: true,
    summary: requestCountsResult.rows[0],
    recentRequests: recentRequestsResult.rows
  });
});

const getAllRequests = asyncHandler(async (req, res) => {
  const requestsResult = await pool.query(`
    SELECT
      id,
      full_name,
      request_type,
      date_needed,
      purpose,
      additional_notes,
      supporting_file_name,
      screening_score,
      screening_summary,
      screening_status,
      payment_status,
      payment_amount,
      payment_reference,
      paid_at,
      release_proof_file_name,
      final_status,
      created_at,
      updated_at
    FROM requests
    ORDER BY created_at DESC
  `);

  res.status(200).json({
    success: true,
    requests: requestsResult.rows
  });
});

const getResidentsList = asyncHandler(async (req, res) => {
  const residentsResult = await pool.query(`
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.username,
      u.role,
      u.created_at,
      COUNT(r.id)::int AS total_requests,
      MAX(r.created_at) AS latest_request_at
    FROM users u
    LEFT JOIN requests r ON r.user_id = u.id
    WHERE u.role = 'resident'
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `);

  res.status(200).json({
    success: true,
    residents: residentsResult.rows
  });
});

const getReportsSummary = asyncHandler(async (req, res) => {
  const [
    monthlySummaryResult,
    requestTypeBreakdownResult,
    screeningBreakdownResult,
    topResidentsResult,
    recentDecisionsResult
  ] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*)::int AS total_this_month,
        COUNT(*) FILTER (WHERE final_status IN ('approved', 'completed'))::int AS completed_this_month,
        COUNT(*) FILTER (WHERE final_status = 'rejected')::int AS rejected_this_month,
        COUNT(*) FILTER (WHERE final_status IN ('pending', 'submitted', 'under_review', 'preparing_document', 'ready_for_pickup'))::int AS active_this_month
      FROM requests
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
    `),
    pool.query(`
      SELECT
        request_type,
        COUNT(*)::int AS total
      FROM requests
      GROUP BY request_type
      ORDER BY total DESC, request_type ASC
    `),
    pool.query(`
      SELECT
        screening_status,
        COUNT(*)::int AS total
      FROM requests
      GROUP BY screening_status
      ORDER BY total DESC, screening_status ASC
    `),
    pool.query(`
      SELECT
        u.full_name,
        u.username,
        COUNT(r.id)::int AS total_requests
      FROM users u
      JOIN requests r ON r.user_id = u.id
      WHERE u.role = 'resident'
      GROUP BY u.id
      ORDER BY total_requests DESC, u.full_name ASC
      LIMIT 5
    `),
    pool.query(`
      SELECT
        full_name,
        request_type,
        final_status,
        reviewed_at
      FROM requests
      WHERE final_status IN ('approved', 'completed', 'rejected')
      ORDER BY reviewed_at DESC NULLS LAST, updated_at DESC
      LIMIT 5
    `)
  ]);

  res.status(200).json({
    success: true,
    monthlySummary: monthlySummaryResult.rows[0],
    requestTypeBreakdown: requestTypeBreakdownResult.rows,
    screeningBreakdown: screeningBreakdownResult.rows,
    topResidents: topResidentsResult.rows,
    recentDecisions: recentDecisionsResult.rows
  });
});

const updateRequestStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  const actionMap = {
    start_review: {
      screening_status: 'needs_review',
      final_status: 'under_review'
    },
    reject: {
      screening_status: 'high_concern',
      final_status: 'rejected'
    },
    prepare_document: {
      screening_status: 'low_concern',
      final_status: 'preparing_document'
    },
    mark_ready: {
      screening_status: 'low_concern',
      final_status: 'ready_for_pickup'
    },
    complete: {
      screening_status: 'low_concern',
      final_status: 'completed'
    },
    approve: {
      screening_status: 'low_concern',
      final_status: 'completed'
    },
    review: {
      screening_status: 'needs_review',
      final_status: 'under_review'
    }
  };

  if (!actionMap[action]) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request action.'
    });
  }

  const existingRequestResult = await pool.query(
    `SELECT id, payment_status, payment_amount, final_status
     FROM requests
     WHERE id = $1`,
    [id]
  );

  if (existingRequestResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Request not found.'
    });
  }

  const existingRequest = existingRequestResult.rows[0];
  const hasOutstandingPayment = Number(existingRequest.payment_amount) > 0 && existingRequest.payment_status !== 'paid';

  if (action === 'complete' && hasOutstandingPayment) {
    return res.status(400).json({
      success: false,
      message: 'This request cannot be completed until the payment is marked as paid.'
    });
  }

  const result = await pool.query(
    `UPDATE requests
     SET screening_status = $1,
         final_status = $2,
         reviewed_by = $3,
         reviewed_at = NOW(),
         updated_at = NOW()
     WHERE id = $4
     RETURNING id, full_name, screening_status, final_status, reviewed_at`,
    [
      actionMap[action].screening_status,
      actionMap[action].final_status,
      req.user.id,
      id
    ]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Request not found.'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Request status updated successfully.',
    request: result.rows[0]
  });
});

const updateRequestPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentStatus, paymentAmount, paymentReference } = req.body;
  const allowedStatuses = ['unpaid', 'pending_verification', 'paid'];

  if (!allowedStatuses.includes(paymentStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment status.'
    });
  }

  const normalizedAmount = Number(paymentAmount);

  if (!Number.isFinite(normalizedAmount) || normalizedAmount < 0) {
    return res.status(400).json({
      success: false,
      message: 'Payment amount must be a valid non-negative number.'
    });
  }

  const normalizedReference = paymentReference ? String(paymentReference).trim() : null;

  if (normalizedReference && normalizedReference.length > 120) {
    return res.status(400).json({
      success: false,
      message: 'Payment reference is too long.'
    });
  }

  const result = await pool.query(
    `UPDATE requests
     SET payment_status = $1::varchar,
         payment_amount = $2,
         payment_reference = $3,
         paid_at = CASE WHEN $1::varchar = 'paid' THEN NOW() ELSE NULL END,
         updated_at = NOW()
     WHERE id = $4
     RETURNING id, payment_status, payment_amount, payment_reference, paid_at`,
    [
      paymentStatus,
      normalizedAmount,
      normalizedReference,
      id
    ]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Request not found.'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Payment details updated successfully.',
    request: result.rows[0]
  });
});

const updateRequestReleaseProof = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const uploadedFileName = req.file ? req.file.filename : null;

  if (!uploadedFileName) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a proof image first.'
    });
  }

  const result = await pool.query(
    `UPDATE requests
     SET release_proof_file_name = $1,
         updated_at = NOW()
     WHERE id = $2
     RETURNING id, release_proof_file_name, final_status`,
    [uploadedFileName, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Request not found.'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Ready-for-pickup proof uploaded successfully.',
    request: result.rows[0]
  });
});

module.exports = { getAllRequests, getDashboardSummary, getResidentsList, getReportsSummary, updateRequestStatus, updateRequestPayment, updateRequestReleaseProof };
