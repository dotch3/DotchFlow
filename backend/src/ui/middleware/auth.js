// src/ui/middleware/auth.js
const jwt = require('jsonwebtoken');
const { createTranslator } = require('../../i18n');

const JWT_SECRET = process.env.JWT_SECRET || 'dotchflow_secret';

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const translate = await createTranslator(req);
    return res.status(401).json({ error: await translate('errors.authTokenMissing') });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    const translate = await createTranslator(req);
    return res.status(401).json({ error: await translate('errors.authTokenInvalid') });
  }
}

module.exports = { authMiddleware };
