import express from 'express';
const router = express.Router();
import sellerController from '../controllers/seller.controller.js'; // Adjust path as needed
import { authenticate } from '../middleware/auth.middleware.js';
// Optional: Add role-based middleware, e.g., requireRole(['admin', 'manager'])

/**
 * @swagger
 * /api/v1/sellers:
 *   get:
 *     summary: Get all sellers with filters and pagination
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: verification_status
 *         schema:
 *           type: string
 *           enum: [pending, verified, rejected]
 *       - in: query
 *         name: business_type
 *         schema:
 *           type: string
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
 *         description: List of sellers
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
 *                     sellers:
 *                       type: array
 *                     pagination:
 *                       type: object
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/sellers/counts:
 *   get:
 *     summary: Get count by verification status
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Counts
 */

/**
 * @swagger
 * /api/v1/sellers/{id}:
 *   get:
 *     summary: Get seller by ID with user info
 *     tags: [Sellers]
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
 *         description: Seller details
 *       404:
 *         description: Seller not found
 *   put:
 *     summary: Update seller profile and user details
 *     tags: [Sellers]
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
 *               # User fields
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, suspended, inactive]
 *               # Seller fields
 *               full_name:
 *                 type: string
 *               id_number:
 *                 type: string
 *               business_name:
 *                 type: string
 *               business_type:
 *                 type: string
 *               tin_number:
 *                 type: string
 *               emergency_contact:
 *                 type: string
 *               address:
 *                 type: string
 *               registration_date:
 *                 type: string
 *               verification_status:
 *                 type: string
 *                 enum: [pending, verified, rejected]
 *     responses:
 *       200:
 *         description: Seller updated
 *       404:
 *         description: Seller not found
 *   delete:
 *     summary: Delete seller
 *     tags: [Sellers]
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
 *         description: Seller deleted
 *       404:
 *         description: Seller not found
 */

/**
 * @swagger
 * /api/v1/sellers/verification/{id}:
 *   patch:
 *     summary: Update seller verification status
 *     tags: [Sellers]
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
 *                 enum: [pending, verified, rejected]
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid status
 */

/**
 * @swagger
 * /api/v1/sellers/{id}/stats:
 *   get:
 *     summary: Get seller statistics
 *     tags: [Sellers]
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
 *         description: Statistics
 */

/**
 * @swagger
 * /api/v1/sellers/{id}/allocations:
 *   get:
 *     summary: Get seller allocations
 *     tags: [Sellers]
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
 *         description: Allocations
 */

/**
 * @swagger
 * /api/v1/sellers/{id}/payments:
 *   get:
 *     summary: Get seller payments
 *     tags: [Sellers]
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
 *         description: Payments
 */

/**
 * @swagger
 * /api/v1/sellers:
 *   post:
 *     summary: Create new seller profile (for existing seller user)
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               full_name:
 *                 type: string
 *               id_number:
 *                 type: string
 *               business_name:
 *                 type: string
 *               business_type:
 *                 type: string
 *               tin_number:
 *                 type: string
 *               emergency_contact:
 *                 type: string
 *               address:
 *                 type: string
 *               registration_date:
 *                 type: string
 *               verification_status:
 *                 type: string
 *                 default: pending
 *                 enum: [pending, verified, rejected]
 *     responses:
 *       201:
 *         description: Seller created
 *       400:
 *         description: Missing fields
 *       409:
 *         description: Duplicate user or ID
 */

// Protected routes: Order matters! Specific/exact paths first, then param-based, then POST
router.get('/', authenticate, sellerController.getAllSellers); // List all (with filters)
router.get('/counts', authenticate, sellerController.getCountByStatus); // Counts by status

// Param-based routes next
router.get('/:id', authenticate, sellerController.getSellerById);
router.get('/:id/stats', authenticate, sellerController.getStatistics);
router.get('/:id/allocations', authenticate, sellerController.getAllocations);
router.get('/:id/payments', authenticate, sellerController.getPayments);
router.put('/:id', authenticate, sellerController.updateSeller);
router.patch('/verification/:id', authenticate, sellerController.updateVerificationStatus);
router.delete('/:id', authenticate, sellerController.deleteSeller);

// POST last
router.post('/', authenticate, sellerController.createSeller);

export default router;