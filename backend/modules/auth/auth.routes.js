const express = require('express');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const { validateBody } = require('../../middleware/validate');
const { AppError } = require('../../shared/errors');
const authService = require('./auth.service');

const router = express.Router();

router.post(
  '/login',
  validateBody(['email', 'password']),
  async (req, res, next) => {
    try {
      const result = await authService.login(req.body.email, req.body.password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/refresh',
  validateBody(['refreshToken']),
  async (req, res, next) => {
    try {
      const result = await authService.refresh(req.body.refreshToken);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

router.post('/logout', authenticate, async (req, res, next) => {
  try {
    await authService.revokeAccessToken(req.accessToken);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await authService.getUserWithRoles(req.user.id);
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User was not found.');
    }
    res.json({ user: authService.toUserResponse(user) });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/users/:userId/password',
  authenticate,
  authorize('users:manage'),
  validateBody(['password']),
  async (req, res, next) => {
    try {
      if (String(req.body.password).length < 8) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Password must be at least 8 characters long.',
        );
      }
      await authService.resetPassword(req.user.id, req.params.userId, req.body.password);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
