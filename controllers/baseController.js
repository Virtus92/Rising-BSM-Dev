const pool = require('../services/db.service');

class BaseController {
    constructor() {
        if (new.target === BaseController) {
            throw new TypeError("Abstract classes can't be instantiated.");
        }
    }

    async executeQuery(callback, next) {
        try {
            return await callback();
        } catch (error) {
            console.error('Query execution error:', error);
            if (next && typeof next === 'function') {
                next(error);
            } else {
                throw error;
            }
        }
    }

    buildWhereClause(conditions, params) {
        let whereClause = '';
        if (conditions && conditions.length > 0) {
            whereClause = 'WHERE ' + conditions.join(' AND ');
        }
        return { whereClause, paramIndex: params.length + 1 };
    }
}

module.exports = BaseController;