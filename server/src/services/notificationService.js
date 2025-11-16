import { Notification } from '../models/Notification.model.js';
import db from '../config/database.js';

class NotificationService {
  // Auto-create notification for allocation creation
  static async createAllocationNotification(allocationData, createdBy) {
    try {
      const { allocation_id, seller_id, space_id } = allocationData;
      
      // Get seller and space details
      const [sellerRows] = await db.query('SELECT user_id, business_name FROM sellers WHERE seller_id = ?', [seller_id]);
      const [spaceRows] = await db.query('SELECT space_name, space_number, zone_id FROM spaces WHERE space_id = ?', [space_id]);
      const [zoneRows] = await db.query('SELECT zone_name FROM zones WHERE zone_id = ?', [spaceRows[0]?.zone_id]);
      
      if (sellerRows[0] && spaceRows[0]) {
        const spaceName = spaceRows[0].space_name || `Space ${spaceRows[0].space_number}`;
        const notificationId = await Notification.create({
          user_id: sellerRows[0].user_id,
          seller_id,
          title: 'New Space Allocation',
          message: `You have been allocated ${spaceName} in zone "${zoneRows[0]?.zone_name}".`,
          notification_type: 'allocation',
          related_id: allocation_id,
          action_url: `/allocations/${allocation_id}`
        });

        // Real-time notification
        const socketService = (await import('./socketService.js')).default;
        socketService.emitNotification(sellerRows[0].user_id, {
          notification_id: notificationId,
          title: 'New Space Allocation',
          message: `You have been allocated ${spaceName} in zone "${zoneRows[0]?.zone_name}".`,
          type: 'allocation'
        });
      }
    } catch (error) {
      console.error('Error creating allocation notification:', error);
    }
  }

  // Auto-create notification for allocation updates
  static async updateAllocationNotification(allocationId, updates, updatedBy) {
    try {
      const [allocationRows] = await db.query(`
        SELECT sa.seller_id, s.user_id, s.business_name, sp.space_name, z.zone_name
        FROM space_allocations sa
        JOIN sellers s ON sa.seller_id = s.seller_id
        JOIN spaces sp ON sa.space_id = sp.space_id
        JOIN zones z ON sp.zone_id = z.zone_id
        WHERE sa.allocation_id = ?
      `, [allocationId]);
      
      if (allocationRows[0]) {
        const allocation = allocationRows[0];
        let message = `Your allocation for space "${allocation.space_name}" has been updated.`;
        
        if (updates.status) {
          message = `Your allocation status has been changed to "${updates.status}".`;
        }
        
        await Notification.create({
          user_id: allocation.user_id,
          seller_id: allocation.seller_id,
          title: 'Allocation Updated',
          message,
          notification_type: 'allocation',
          related_id: allocationId,
          action_url: `/allocations/${allocationId}`
        });
      }
    } catch (error) {
      console.error('Error creating allocation update notification:', error);
    }
  }

  // Auto-create notification for payment creation
  static async createPaymentNotification(paymentData, createdBy) {
    try {
      const { payment_id, allocation_id, seller_id, amount, status } = paymentData;
      
      const [sellerRows] = await db.query('SELECT user_id, business_name FROM sellers WHERE seller_id = ?', [seller_id]);
      
      if (sellerRows[0]) {
        const statusMessage = status === 'completed' ? 'confirmed' : status;
        await Notification.create({
          user_id: sellerRows[0].user_id,
          seller_id,
          title: 'Payment Processed',
          message: `Your payment of ${amount}  has been ${statusMessage}.`,
          notification_type: 'payment',
          related_id: payment_id,
          action_url: `/payments/${payment_id}`
        });
      }
    } catch (error) {
      console.error('Error creating payment notification:', error);
    }
  }

  // Auto-create notification for payment updates
  static async updatePaymentNotification(paymentId, updates, updatedBy) {
    try {
      const [paymentRows] = await db.query(`
        SELECT p.seller_id, p.amount, s.user_id, s.business_name
        FROM payments p
        JOIN sellers s ON p.seller_id = s.seller_id
        WHERE p.payment_id = ?
      `, [paymentId]);
      
      if (paymentRows[0] && updates.status) {
        const payment = paymentRows[0];
        await Notification.create({
          user_id: payment.user_id,
          seller_id: payment.seller_id,
          title: 'Payment Status Updated',
          message: `Your payment status has been updated to "${updates.status}".`,
          notification_type: 'payment',
          related_id: paymentId,
          action_url: `/payments/${paymentId}`
        });
      }
    } catch (error) {
      console.error('Error creating payment update notification:', error);
    }
  }

  // Auto-create notification for seller creation
  static async createSellerNotification(sellerData, createdBy) {
    try {
      const { seller_id, user_id } = sellerData;
      
      await Notification.create({
        user_id,
        seller_id,
        title: 'Welcome to Market Spot',
        message: 'Your seller account has been created successfully. You can now apply for space allocations.',
        notification_type: 'account',
        related_id: seller_id,
        action_url: '/dashboard'
      });
    } catch (error) {
      console.error('Error creating seller notification:', error);
    }
  }

  // Auto-create notification for seller updates
  static async updateSellerNotification(sellerId, updates, updatedBy) {
    try {
      const [sellerRows] = await db.query('SELECT user_id FROM sellers WHERE seller_id = ?', [sellerId]);
      
      if (sellerRows[0]) {
        await Notification.create({
          user_id: sellerRows[0].user_id,
          seller_id: sellerId,
          title: 'Account Updated',
          message: 'Your seller account information has been updated.',
          notification_type: 'account',
          related_id: sellerId,
          action_url: '/profile'
        });
      }
    } catch (error) {
      console.error('Error creating seller update notification:', error);
    }
  }

  // Auto-create notification for space creation
  static async createSpaceNotification(spaceData, createdBy) {
    try {
      const { space_id, zone_id } = spaceData;
      
      // Notify all sellers in the zone about new space availability
      const [sellerRows] = await db.query(`
        SELECT DISTINCT s.user_id, s.seller_id
        FROM sellers s
        JOIN space_allocations sa ON s.seller_id = sa.seller_id
        JOIN spaces sp ON sa.space_id = sp.space_id
        WHERE sp.zone_id = ? AND sa.status = 'active'
      `, [zone_id]);
      
      const [zoneRows] = await db.query('SELECT zone_name FROM zones WHERE zone_id = ?', [zone_id]);
      const [spaceRows] = await db.query('SELECT space_name, space_number FROM spaces WHERE space_id = ?', [space_id]);
      
      for (const seller of sellerRows) {
        const spaceName = spaceRows[0]?.space_name || `Space ${spaceRows[0]?.space_number}`;
        await Notification.create({
          user_id: seller.user_id,
          seller_id: seller.seller_id,
          title: 'New Space Available',
          message: `A new space "${spaceName}" is now available in zone "${zoneRows[0]?.zone_name}".`,
          notification_type: 'space',
          related_id: space_id,
          action_url: `/spaces/${space_id}`
        });
      }
    } catch (error) {
      console.error('Error creating space notification:', error);
    }
  }

  // Auto-create notification for zone creation
  static async createZoneNotification(zoneData, createdBy) {
    try {
      const { zone_id, zone_name } = zoneData;
      
      // Notify all sellers about new zone
      const [sellerRows] = await db.query('SELECT user_id, seller_id FROM sellers WHERE verification_status = "verified"');
      
      for (const seller of sellerRows) {
        await Notification.create({
          user_id: seller.user_id,
          seller_id: seller.seller_id,
          title: 'New Zone Available',
          message: `A new zone "${zone_name}" has been created and is now available for allocations.`,
          notification_type: 'zone',
          related_id: zone_id,
          action_url: `/zones/${zone_id}`
        });
      }
    } catch (error) {
      console.error('Error creating zone notification:', error);
    }
  }

  // Auto-create notification for zone updates
  static async updateZoneNotification(zoneId, updates, updatedBy) {
    try {
      const [zoneRows] = await db.query('SELECT zone_name FROM zones WHERE zone_id = ?', [zoneId]);
      
      if (zoneRows[0]) {
        // Notify sellers with allocations in this zone
        const [sellerRows] = await db.query(`
          SELECT DISTINCT s.user_id, s.seller_id
          FROM sellers s
          JOIN space_allocations sa ON s.seller_id = sa.seller_id
          JOIN spaces sp ON sa.space_id = sp.space_id
          WHERE sp.zone_id = ? AND sa.status = 'active'
        `, [zoneId]);
        
        for (const seller of sellerRows) {
          await Notification.create({
            user_id: seller.user_id,
            seller_id: seller.seller_id,
            title: 'Zone Updated',
            message: `Zone "${zoneRows[0].zone_name}" has been updated.`,
            notification_type: 'zone',
            related_id: zoneId,
            action_url: `/zones/${zoneId}`
          });
        }
      }
    } catch (error) {
      console.error('Error creating zone update notification:', error);
    }
  }

  // Auto-create notification for user creation
  static async createUserNotification(userData, createdBy) {
    try {
      const { user_id, username, user_type } = userData;
      
      await Notification.create({
        user_id,
        title: 'Welcome to Market Spot',
        message: `Welcome ${username}! Your ${user_type} account has been created successfully.`,
        notification_type: 'account',
        related_id: user_id,
        action_url: '/dashboard'
      });
    } catch (error) {
      console.error('Error creating user notification:', error);
    }
  }

  // Auto-create notification for user updates
  static async updateUserNotification(userId, updates, updatedBy) {
    try {
      const [userRows] = await db.query('SELECT username FROM users WHERE user_id = ?', [userId]);
      
      if (userRows[0]) {
        let message = 'Your account information has been updated.';
        if (updates.status) {
          message = `Your account status has been changed to "${updates.status}".`;
        }
        
        await Notification.create({
          user_id: userId,
          title: 'Account Updated',
          message,
          notification_type: 'account',
          related_id: userId,
          action_url: '/profile'
        });
      }
    } catch (error) {
      console.error('Error creating user update notification:', error);
    }
  }

  // Auto-create notification for space updates
  static async updateSpaceNotification(spaceId, updates, updatedBy) {
    try {
      const [spaceRows] = await db.query(`
        SELECT s.space_name, s.space_number, z.zone_name
        FROM spaces s
        JOIN zones z ON s.zone_id = z.zone_id
        WHERE s.space_id = ?
      `, [spaceId]);
      
      if (spaceRows[0]) {
        // Notify sellers with allocations for this space
        const [sellerRows] = await db.query(`
          SELECT DISTINCT sel.user_id, sel.seller_id
          FROM sellers sel
          JOIN space_allocations sa ON sel.seller_id = sa.seller_id
          WHERE sa.space_id = ? AND sa.status = 'active'
        `, [spaceId]);
        
        const spaceName = spaceRows[0].space_name || `Space ${spaceRows[0].space_number}`;
        
        for (const seller of sellerRows) {
          await Notification.create({
            user_id: seller.user_id,
            seller_id: seller.seller_id,
            title: 'Space Updated',
            message: `Your allocated space "${spaceName}" has been updated.`,
            notification_type: 'space',
            related_id: spaceId,
            action_url: `/spaces/${spaceId}`
          });
        }
      }
    } catch (error) {
      console.error('Error creating space update notification:', error);
    }
  }

  // Generic notification for any create operation
  static async createGenericNotification(entityType, entityData, createdBy) {
    try {
      const notifications = {
        allocation: () => this.createAllocationNotification(entityData, createdBy),
        payment: () => this.createPaymentNotification(entityData, createdBy),
        seller: () => this.createSellerNotification(entityData, createdBy),
        space: () => this.createSpaceNotification(entityData, createdBy),
        zone: () => this.createZoneNotification(entityData, createdBy),
        user: () => this.createUserNotification(entityData, createdBy)
      };
      
      if (notifications[entityType]) {
        await notifications[entityType]();
      }
    } catch (error) {
      console.error(`Error creating ${entityType} notification:`, error);
    }
  }

  // Generic notification for any update operation
  static async updateGenericNotification(entityType, entityId, updates, updatedBy) {
    try {
      const notifications = {
        allocation: () => this.updateAllocationNotification(entityId, updates, updatedBy),
        payment: () => this.updatePaymentNotification(entityId, updates, updatedBy),
        seller: () => this.updateSellerNotification(entityId, updates, updatedBy),
        space: () => this.updateSpaceNotification(entityId, updates, updatedBy),
        zone: () => this.updateZoneNotification(entityId, updates, updatedBy),
        user: () => this.updateUserNotification(entityId, updates, updatedBy)
      };
      
      if (notifications[entityType]) {
        await notifications[entityType]();
      }
    } catch (error) {
      console.error(`Error updating ${entityType} notification:`, error);
    }
  }
}

export default NotificationService;