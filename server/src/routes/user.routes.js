import express from 'express';
const router = express.Router();
import userController from '../controllers/user.controller.js'; // Adjust path as needed
import { authenticate } from '../middleware/auth.middleware.js';
// Optional: Add role-based middleware, e.g., requireRole(['admin', 'manager'])

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users with filters and pagination
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_type
 *         schema:
 *           type: string
 *           enum: [admin, manager, seller]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, suspended, inactive]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                     pagination:
 *                       type: object
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/users/stats:
 *   get:
 *     summary: Get user statistics by type
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics
 */

/**
 * @swagger
 * /api/v1/users/count/{user_type}:
 *   get:
 *     summary: Get count by user type
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [admin, manager, seller]
 *     responses:
 *       200:
 *         description: Count
 */

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID with profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 *   put:
 *     summary: Update user and profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, suspended, inactive]
 *               full_name:
 *                 type: string
 *               # Add other profile fields as needed based on user_type
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/v1/users/status/{id}:
 *   patch:
 *     summary: Update user status
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, suspended, inactive]
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid status
 */

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create new user (admin/manager only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               user_type:
 *                 type: string
 *                 enum: [admin, manager, seller]
 *               # Add profile fields: full_name, id_number, etc.
 *               status:
 *                 type: string
 *                 default: active
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Missing fields or invalid type
 *       409:
 *         description: Duplicate username/email/ID
 */

// Protected routes: Order matters! Specific/exact paths first, then param-based, then POST
router.get('/', authenticate, userController.getAllUsers); // List all (with filters)
router.get('/stats', authenticate, userController.getStatistics); // Stats endpoint
router.get('/count/:user_type', authenticate, userController.getCountByType); // Count by type

// Param-based routes next
router.get('/:id', authenticate, userController.getUserById);
router.put('/:id', authenticate, userController.updateUser);
router.patch('/status/:id', authenticate, userController.updateStatus);
router.delete('/:id', authenticate, userController.deleteUser);

// POST last
router.post('/', authenticate, userController.createUser);

export default router;