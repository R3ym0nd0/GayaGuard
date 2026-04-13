const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { asyncHandler } = require('../utils/asyncHandler');

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

const signup = asyncHandler(async (req, res) => {
  const { fullName, email, username, password, confirmPassword } = req.body;

  if (!fullName || !email || !username || !password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required.'
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match.'
    });
  }

  const existingUser = await pool.query(
    'SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1',
    [email.trim().toLowerCase(), username.trim()]
  );

  if (existingUser.rows.length > 0) {
    return res.status(409).json({
      success: false,
      message: 'Email or username is already in use.'
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (full_name, email, username, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, full_name, email, username, role, created_at`,
    [fullName.trim(), email.trim().toLowerCase(), username.trim(), passwordHash]
  );

  const user = result.rows[0];
  const token = signToken(user);

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    token,
    user
  });
});

const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username/email and password are required.'
    });
  }

  const result = await pool.query(
    `SELECT id, full_name, email, username, password_hash, role
     FROM users
     WHERE email = $1 OR username = $2
     LIMIT 1`,
    [identifier.trim().toLowerCase(), identifier.trim()]
  );

  const user = result.rows[0];

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials.'
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials.'
    });
  }

  const token = signToken(user);

  res.status(200).json({
    success: true,
    message: 'Login successful.',
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      username: user.username,
      role: user.role
    }
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT id, full_name, email, username, role, created_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [req.user.id]
  );

  res.status(200).json({
    success: true,
    user: result.rows[0] || null
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email address is required.'
    });
  }

  const userResult = await pool.query(
    `SELECT id, email
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email]
  );

  if (userResult.rows.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'If an account exists for that email, reset instructions have been prepared.'
    });
  }

  const user = userResult.rows[0];
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await pool.query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE user_id = $1
       AND used_at IS NULL`,
    [user.id]
  );

  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '30 minutes')`,
    [user.id, tokenHash]
  );

  const allowDemoPasswordReset = process.env.ALLOW_DEMO_PASSWORD_RESET === 'true';
  const responsePayload = {
    success: true,
    message: allowDemoPasswordReset
      ? 'Reset instructions are ready for demo mode.'
      : 'If an account exists for that email, reset instructions have been prepared.'
  };

  if (allowDemoPasswordReset) {
    responsePayload.resetToken = rawToken;
  }

  res.status(200).json(responsePayload);
});

const resetPassword = asyncHandler(async (req, res) => {
  const token = String(req.body.token || '').trim();
  const password = String(req.body.password || '');
  const confirmPassword = String(req.body.confirmPassword || '');

  if (!token || !password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Token, password, and confirmation are required.'
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match.'
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long.'
    });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const tokenResult = await pool.query(
    `SELECT prt.id, prt.user_id
     FROM password_reset_tokens prt
     WHERE prt.token_hash = $1
       AND prt.used_at IS NULL
       AND prt.expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );

  const resetRecord = tokenResult.rows[0];

  if (!resetRecord) {
    return res.status(400).json({
      success: false,
      message: 'This reset link is invalid or has already expired.'
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await pool.query('BEGIN');

  try {
    await pool.query(
      `UPDATE users
       SET password_hash = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, resetRecord.user_id]
    );

    await pool.query(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE id = $1`,
      [resetRecord.id]
    );

    await pool.query('COMMIT');
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }

  res.status(200).json({
    success: true,
    message: 'Password reset successful. You can now sign in with your new password.'
  });
});

module.exports = {
  signup,
  login,
  getCurrentUser,
  forgotPassword,
  resetPassword
};
