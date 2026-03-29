const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../services/logger.service');

/**
 * POST /users — Admin creates a new user
 */
async function createUser(req, res) {
  try {
    const { name, email, password, role = 'CORE_MEMBER' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'name, email, and password required' } });
    }
    if (!['ADMIN', 'CORE_MEMBER'].includes(role)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Role must be ADMIN or CORE_MEMBER' } });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { id: require('crypto').randomUUID(), name, email, passwordHash, role },
    });

    await prisma.auditLog.create({
      data: {
        id: require('crypto').randomUUID(),
        userId: req.user.userId,
        action: 'create_user',
        metadata: JSON.stringify({ targetUserId: user.id, role }),
      },
    });

    logger.info('User created by admin', { adminId: req.user.userId, newUserId: user.id });
    return res.status(201).json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Email already in use' } });
    }
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * GET /users
 */
async function getUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return res.json({ success: true, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * PATCH /users/:id/role
 */
async function updateRole(req, res) {
  try {
    const { role } = req.body;
    if (!['ADMIN', 'CORE_MEMBER'].includes(role)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid role' } });
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    logger.info('User role updated', { adminId: req.user.userId, targetUserId: user.id, role });
    return res.json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

module.exports = { createUser, getUsers, updateRole };
