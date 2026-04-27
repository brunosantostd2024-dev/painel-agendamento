// src/middleware/auth.js
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  res.status(401).json({ error: 'Não autenticado. Faça login.' });
}
module.exports = { requireAuth };
