const { pool } = require('../config/db');
const { asyncHandler } = require('../utils/asyncHandler');
const { calculateScreeningResult } = require('../utils/screeningScore');

const getMyRequests = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT
      id,
      full_name,
      complete_address,
      contact_number,
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
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [req.user.id]
  );

  res.status(200).json({
    success: true,
    requests: result.rows
  });
});

const createRequest = asyncHandler(async (req, res) => {
  const {
    fullName,
    completeAddress,
    contactNumber,
    requestType,
    dateNeeded,
    purpose,
    additionalNotes
  } = req.body;

  if (!fullName || !completeAddress || !contactNumber || !requestType || !dateNeeded || !purpose) {
    return res.status(400).json({
      success: false,
      message: 'Please complete all required request fields.'
    });
  }

  if (
    fullName.trim().length > 150 ||
    completeAddress.trim().length > 255 ||
    contactNumber.trim().length > 30 ||
      purpose.trim().length > 220 ||
      (additionalNotes && additionalNotes.trim().length > 180)
  ) {
    return res.status(400).json({
      success: false,
      message: 'One or more request fields are too long.'
    });
  }

  const allowedTypes = ['clearance', 'indigency', 'letter', 'complaint', 'other'];

  if (!allowedTypes.includes(requestType)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request type.'
    });
  }

  const userId = req.user ? req.user.id : null;
  const uploadedFileName = req.file ? req.file.filename : null;
  const screeningResult = calculateScreeningResult({
    requestType,
    dateNeeded,
    purpose,
    additionalNotes,
    supportingFileName: uploadedFileName
  });

  const result = await pool.query(
    `INSERT INTO requests (
      user_id,
      full_name,
      complete_address,
      contact_number,
      request_type,
      date_needed,
      purpose,
      additional_notes,
      supporting_file_name,
      screening_score,
      screening_summary,
      screening_status,
      final_status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING id, full_name, request_type, final_status, screening_score, screening_summary, screening_status, created_at`,
    [
      userId,
      fullName.trim(),
      completeAddress.trim(),
      contactNumber.trim(),
      requestType,
      dateNeeded,
      purpose.trim(),
      additionalNotes ? additionalNotes.trim() : null,
      uploadedFileName,
      screeningResult.score,
      screeningResult.summary,
      screeningResult.screeningStatus,
      'submitted'
    ]
  );

  res.status(201).json({
    success: true,
    message: 'Request submitted successfully.',
    request: result.rows[0]
  });
});

module.exports = { createRequest, getMyRequests };
