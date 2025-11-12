// ============================================
// Lanari Payment Integration Service
// ============================================

import https from 'https';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LanariPaymentService {
  constructor() {
    // Lanari API Configuration
    this.apiUrl = 'https://www.lanari.rw/lanari_pay/api/payment/process.php';
    this.apiKey = process.env.LANARI_API_KEY || '';
    this.apiSecret = process.env.LANARI_API_SECRET || '';
    this.timeout = 30000; // 30 seconds timeout
  }

  /**
   * Process payment through Lanari API
   * @param {Object} paymentData - Payment data
   * @param {number} paymentData.amount - Amount in RWF
   * @param {string} paymentData.customer_phone - Customer phone number (250788123456 format)
   * @param {string} paymentData.description - Payment description
   * @param {string} paymentData.currency - Currency code (default: RWF)
   * @param {string} paymentData.reference_id - Optional: Your internal reference ID
   * @returns {Promise<Object>} - Lanari API response
   */
  async processPayment(paymentData) {
    try {
      const {
        amount,
        customer_phone,
        description,
        currency = 'RWF',
        reference_id = `MKT-${Date.now()}`
      } = paymentData;

      // Validate required fields
      if (!amount || !customer_phone || !description) {
        throw new Error('Missing required fields: amount, customer_phone, description');
      }

      // Format phone number FIRST
      const formattedPhone = this.formatPhoneNumber(customer_phone);

      // THEN validate the formatted phone number
      if (!this.validatePhoneNumber(formattedPhone)) {
        throw new Error('Invalid phone number format. Expected: 250788123456');
      }

      // Validate amount
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Prepare request payload
      const payload = {
        api_key: this.apiKey,
        api_secret: this.apiSecret,
        amount: Math.round(amount), // Ensure integer
        customer_phone: formattedPhone,
        currency: currency,
        description: description,
        reference_id: reference_id
      };

      console.log('🔄 Lanari Payment Request:', {
        amount: payload.amount,
        customer_phone: payload.customer_phone,
        currency: payload.currency,
        description: payload.description,
        reference_id: payload.reference_id
      });

      // Make request to Lanari API using PowerShell wrapper
      // (Node.js HTTPS requests to Lanari have been fixed)
      let responseStatus, responseText, result;
      
      try {
        const response = await this.callLanariAPI({
          api_key: this.apiKey,
          api_secret: this.apiSecret,
          amount: payload.amount,
          customer_phone: payload.customer_phone,
          currency: payload.currency,
          description: payload.description,
          reference_id: payload.reference_id
        });

        responseStatus = response.statusCode;
        responseText = response.body;
        
        try {
          result = JSON.parse(responseText);
        } catch (e) {
          console.error('❌ Failed to parse Lanari response:', responseText);
          throw new Error(`Invalid JSON response from Lanari: ${responseText.substring(0, 200)}`);
        }
      } catch (fetchError) {
        console.error('❌ Lanari API Connection Error:', fetchError.message);
        throw new Error(`Failed to connect to Lanari API: ${fetchError.message}`);
      }

      console.log(`📊 Lanari Response (Status ${responseStatus}):`, JSON.stringify(result, null, 2));

      // Check if response indicates error
      if (responseStatus >= 400 || !result.success) {
        const errorMsg = result.message || result.error || `API returned status ${responseStatus}`;
        console.error('⚠️ Lanari Error Details:', {
          statusCode: responseStatus,
          message: result.message,
          error: result.error,
          gateway_response: result.gateway_response,
          full_response: result
        });
        throw new Error(`Lanari API error: ${errorMsg}`);
      }

      // Validate response
      if (!result) {
        throw new Error('Empty response from Lanari API');
      }

      // Extract transaction ID from various possible locations
      const transactionId = result.transaction_id || 
                           result.transaction_ref || 
                           result.gateway_response?.data?.transaction_id ||
                           result.id;

      // Return structured response
      return {
        success: result.success || result.status === 'success',
        transaction_id: transactionId,
        reference_id: reference_id,
        status: result.status || (result.success ? 'pending' : 'failed'),
        message: result.message || 'Payment processed',
        raw_response: result
      };
    } catch (error) {
      console.error('❌ Lanari Payment Error:', error.message);
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  /**
   * Check payment status (if Lanari API supports it)
   * @param {string} transaction_id - Transaction ID from Lanari
   * @returns {Promise<Object>} - Payment status
   */
  async checkPaymentStatus(transaction_id) {
    try {
      if (!transaction_id) {
        throw new Error('Transaction ID is required');
      }

      // Note: This is a placeholder for status check
      // Actual implementation depends on Lanari API capabilities
      console.log('🔍 Checking payment status for:', transaction_id);

      // Placeholder response
      return {
        transaction_id: transaction_id,
        status: 'pending',
        message: 'Status check feature coming soon'
      };
    } catch (error) {
      console.error('❌ Status Check Error:', error.message);
      throw error;
    }
  }

  /**
   * Validate phone number format
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} - True if valid
   */
  validatePhoneNumber(phoneNumber) {
    // Rwanda phone number format: 250788123456 (12 digits starting with 250)
    const phoneRegex = /^250\d{9}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Format phone number to Lanari format
   * @param {string} phoneNumber - Phone number in any format
   * @returns {string} - Formatted phone number (250788123456)
   */
  formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // If starts with 0, replace with 250
    if (cleaned.startsWith('0')) {
      return '250' + cleaned.substring(1);
    }

    // If already has country code, return as is
    if (cleaned.startsWith('250')) {
      return cleaned;
    }

    // If 10 digits (local format), add 250
    if (cleaned.length === 10) {
      return '250' + cleaned;
    }

    // Return as is if we can't determine format
    return cleaned;
  }

  /**
   * Call Lanari API directly via HTTPS
   * Implements the working curl approach
   */
  async callLanariAPI(paymentData) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.apiUrl);
      
      console.log('🚀 Calling Lanari API (Direct HTTPS)');
      console.log('📊 Payment Request:', {
        amount: paymentData.amount,
        customer_phone: paymentData.customer_phone,
        currency: paymentData.currency
      });

      // Build the exact payload that curl sends
      const bodyData = JSON.stringify({
        api_key: paymentData.api_key,
        api_secret: paymentData.api_secret,
        amount: paymentData.amount,
        customer_phone: paymentData.customer_phone,
        currency: paymentData.currency,
        description: paymentData.description,
        reference_id: paymentData.reference_id
      });

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyData)
        },
        timeout: 30000
      };

      console.log('🔗 Lanari URL:', this.apiUrl);
      console.log('📋 Request Body:', bodyData);

      const req = https.request(this.apiUrl, options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          console.log('📨 HTTP Status:', res.statusCode);
          console.log('📨 Raw Response:', data.substring(0, 500));

          try {
            const parsed = JSON.parse(data);
            console.log('✅ Parsed Response:', JSON.stringify(parsed, null, 2).substring(0, 300));
            
            resolve({
              statusCode: res.statusCode,
              body: data,
              data: parsed
            });
          } catch (e) {
            // Response might not be JSON
            reject(new Error(`Failed to parse Lanari response: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ HTTPS Request Error:', error.message);
        reject(new Error(`Failed to call Lanari API: ${error.message}`));
      });

      req.on('timeout', () => {
        console.error('❌ Request Timeout');
        req.destroy();
        reject(new Error('Lanari API request timeout'));
      });

      // Send the request body
      req.write(bodyData);
      req.end();
    });
  }

  /**
   * Initialize payment webhook listener (for future use)
   * Note: You'll need to configure webhook URL in Lanari dashboard
   */
  async handleWebhook(webhookData) {
    try {
      console.log('📥 Lanari Webhook Received:', webhookData);

      // Verify webhook signature if Lanari provides one
      // Placeholder for actual verification logic
      const isValid = true; // Implement verification here

      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }

      return {
        success: true,
        message: 'Webhook processed successfully',
        transaction_id: webhookData.transaction_id
      };
    } catch (error) {
      console.error('❌ Webhook Processing Error:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
export default new LanariPaymentService();
