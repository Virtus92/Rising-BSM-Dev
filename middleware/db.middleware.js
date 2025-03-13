const db = require('../services/db.service');

module.exports = (req, res, next) => {
  req.db = {
    query: db.query,
    transaction: db.transaction
  };
  next();
};