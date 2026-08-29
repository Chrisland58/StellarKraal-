# Admin Routes Configuration

## Overview
This document describes how to add and manage admin routes in the StellarKraal- backend.

## Architecture

### Route Guard Mechanism
Admin routes are protected by a multi-layer security system:

1. **JWT Authentication** - Validates the user's token
2. **Role-Based Access Control** - Checks the user's role claim
3. **Admin Middleware** - Ensures the user has admin privileges

### JWT Role Claim
The JWT token contains a `role` claim that determines the user's permissions:

```typescript
interface JwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  iat: number;
  exp: number;
}
// src/controllers/adminController.ts

import { Request, Response } from 'express';
import { AdminService } from '../services/adminService';

/**
 * Get system statistics
 * @route GET /api/v1/admin/stats
 * @access Admin only
 */
export const getSystemStats = async (req: Request, res: Response) => {
  try {
    const stats = await AdminService.getSystemStats();
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch system stats'
    });
  }
};
// src/validators/adminValidators.ts

import { body, param, query } from 'express-validator';

export const validateAdminAction = [
  body('action')
    .isString()
    .notEmpty()
    .withMessage('Action is required'),
  body('targetId')
    .optional()
    .isUUID()
    .withMessage('Target ID must be a valid UUID'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];
// src/routes/adminRoutes.ts

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import { validateAdminAction } from '../validators/adminValidators';
import {
  getSystemStats,
  // ... other admin controllers
} from '../controllers/adminController';

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/v1/admin/stats - Get system statistics
router.get('/stats', getSystemStats);

// POST /api/v1/admin/action - Perform admin action
router.post('/action', validateAdminAction, performAdminAction);

// ... other admin routes

export default router;
/**
 * Get system statistics
 * @route GET /api/v1/admin/stats
 * @group Admin - Administrative operations
 * @param {string} Authorization.header - JWT token - required
 * @returns {Object} 200 - System statistics
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 403 - Forbidden
 * @security JWT
 */
export const getSystemStats = async (req: Request, res: Response) => {
  // Implementation
};
// __tests__/integration/admin.test.ts

import request from 'supertest';
import app from '../../src/app';

describe('Admin Routes', () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    // Setup test users and tokens
  });

  describe('GET /api/v1/admin/stats', () => {
    it('should allow admin users to access', async () => {
      const response = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
    });

    it('should deny non-admin users', async () => {
      const response = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Forbidden');
    });

    it('should deny unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/v1/admin/stats');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });
  });
});
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
{
  "error": "Validation Error",
  "message": "Invalid input provided",
  "details": [
    {
      "field": "action",
      "message": "Action is required"
    }
  ]
}
// src/middleware/admin.ts

import { Request, Response, NextFunction } from 'express';

/**
 * Admin middleware - ensures user has admin role
 */
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'User not authenticated'
    });
  }

  // Check if user has admin or moderator role
  if (user.role !== 'admin' && user.role !== 'moderator') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Insufficient permissions for admin access'
    });
  }

  // For moderator, check if the route allows moderator access
  if (user.role === 'moderator') {
    // Check if the route is allowed for moderators
    // (This can be configured per route)
    const allowedModeratorRoutes = [
      '/stats',
      '/users',
      '/collateral'
    ];
    
    const isAllowed = allowedModeratorRoutes.some(route => 
      req.path.startsWith(route)
    );
    
    if (!isAllowed) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions for this admin action'
      });
    }
  }

  next();
};
// __tests__/unit/middleware/admin.test.ts

import { adminMiddleware } from '../../../src/middleware/admin';

describe('adminMiddleware', () => {
  it('should allow admin users to proceed', () => {
    // Test implementation
  });

  it('should block non-admin users', () => {
    // Test implementation
  });

  it('should block unauthenticated users', () => {
    // Test implementation
  });
});
// src/middleware/audit.ts

export const auditLog = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    res.send = function(body: any) {
      // Log admin action
      console.log({
        timestamp: new Date().toISOString(),
        user: (req as any).user?.id,
        action,
        path: req.path,
        method: req.method,
        ip: req.ip,
        status: res.statusCode
      });
      
      return originalSend.call(this, body);
    };
    next();
  };
};
