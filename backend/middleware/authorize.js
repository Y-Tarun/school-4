const { AppError } = require('../shared/errors');

const rolePermissions = {
  admin: [
    'students:read', 'students:write', 'students:archive',
    'fees:read', 'fees:write',
    'staff:read', 'staff:write', 'staff:archive',
    'id_cards:generate', 'users:manage', 'gallery:write',
  ],
  teacher: ['students:read', 'students:write', 'fees:read', 'staff:read'],
  caretaker: ['students:read', 'staff:read'],
  driver: ['students:read', 'staff:read'],
};

function hasPermission(roles, permission) {
  return roles.some((role) => (rolePermissions[role] || []).includes(permission));
}

function authorize(permission) {
  return (req, res, next) => {
    if (!req.user || !hasPermission(req.user.roles, permission)) {
      next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action.'));
      return;
    }
    next();
  };
}

module.exports = { authorize, hasPermission, rolePermissions };
