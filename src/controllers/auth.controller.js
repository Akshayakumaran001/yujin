const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const config = require('../config');
const logger = require('../services/logger.service');

/**
 * POST /auth/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Email and password required' } });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    logger.info('User logged in', { userId: user.id, role: user.role });

    return res.json({
      success: true,
      data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    });
  } catch (err) {
    logger.error('Login error', { error: err.message });
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * GET /auth/me
 */
async function me(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return res.json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * POST /auth/register — used only for first admin setup
 */
async function register(req, res) {
  try {
    const { name, email, password, role = 'CORE_MEMBER', adminKey } = req.body;

    // Only allow if admin key matches (or if no users exist yet)
    const userCount = await prisma.user.count();
    if (userCount > 0 && adminKey !== process.env.ADMIN_SETUP_KEY) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Use /users endpoint to create users' } });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        id: require('crypto').randomUUID(),
        name,
        email,
        passwordHash,
        role: userCount === 0 ? 'ADMIN' : role, // First user is always admin
      },
    });

    logger.info('User registered', { userId: user.id, role: user.role });
    return res.status(201).json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Email already in use' } });
    }
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

module.exports = { login, me, register };
