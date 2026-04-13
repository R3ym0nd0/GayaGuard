const { pool } = require('../config/db');
const { asyncHandler } = require('../utils/asyncHandler');

const getDashboardSummary = asyncHandler(async (req, res) => {
  const [requestCountsResult, recentRequestsResult] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*)::int AS total_requests,
        COUNT(*) FILTER (WHERE final_status = 'pending')::int AS pending_requests,
        COUNT(*) FILTER (WHERE final_status = 'approved')::int AS approved_requests,
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
        COUNT(*) FILTER (WHERE final_status = 'approved')::int AS approved_this_month,
        COUNT(*) FILTER (WHERE final_status = 'rejected')::int AS rejected_this_month,
        COUNT(*) FILTER (WHERE final_status = 'pending')::int AS pending_this_month
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
      WHERE final_status IN ('approved', 'rejected')
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
    approve: {
      screening_status: 'low_concern',
      final_status: 'approved'
    },
    reject: {
      screening_status: 'high_concern',
      final_status: 'rejected'
    },
    review: {
      screening_status: 'needs_review',
      final_status: 'pending'
    }
  };

  if (!actionMap[action]) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request action.'
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

module.exports = { getAllRequests, getDashboardSummary, getResidentsList, getReportsSummary, updateRequestStatus };
