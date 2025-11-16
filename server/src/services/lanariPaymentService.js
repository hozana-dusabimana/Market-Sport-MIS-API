import axios from 'axios';

class LanariPaymentService {
  constructor() {
    this.apiUrl = 'https://www.lanari.rw/lanari_pay/api/payment/process.php';
    this.apiKey = 'da0209a4e5f3be1b932ba53b5bfc54d66033bd19b3277ef00a8106d4f41f30bf';
    this.apiSecret = 'e723b314c53846ac7f3645d1a62398fad5039a25e9f7121fb84d561e0c52567bc5aa2f66cfe48f702485d999924858792c0e262439ff1c3eeedccf57c2790a4f';
  }

  formatPhoneNumber(phone) {
    let formattedPhone = String(phone || '').trim().replace(/\s+/g, '').replace(/^\+/, '');
    
    if (!formattedPhone) {
      throw new Error('Phone number is empty after formatting');
    }

    // Convert 250 format to 0 format
    if (formattedPhone.startsWith('250')) {
      formattedPhone = '0' + formattedPhone.substring(3);
    }

    // Add 0 prefix if missing
    if (!formattedPhone.startsWith('0')) {
      if (formattedPhone.length === 9 || formattedPhone.length === 8) {
        formattedPhone = '0' + formattedPhone;
      }
    }

    // Validate format
    if (!formattedPhone.match(/^0[789]\d{8}$/)) {
      console.warn(`Phone number format may be incorrect: ${formattedPhone}`);
    }

    return formattedPhone;
  }

  async processPayment(paymentData) {
    try {
      const { amount, customer_phone, description, currency = '' } = paymentData;

      if (!amount || amount <= 0) {
        throw new Error('Invalid payment amount');
      }

      if (!customer_phone) {
        throw new Error('Customer phone number is required');
      }

      const formattedPhone = this.formatPhoneNumber(customer_phone);
      const cleanDescription = (description || 'Market Spot Payment')
        .replace(/#/g, '')
        .replace(/@/g, '')
        .replace(/[^\w\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const requestData = {
        api_key: this.apiKey,
        api_secret: this.apiSecret,
        amount: Math.round(amount),
        customer_phone: formattedPhone,
        currency,
        description: cleanDescription
      };

      console.log('[PAYMENT] Processing payment:', amount, ' for', formattedPhone);

      const response = await axios.post(this.apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 180000, // 3 minutes for mobile money confirmation
        transformResponse: [(data) => {
          try {
            return typeof data === 'string' ? JSON.parse(data) : data;
          } catch (e) {
            return { rawResponse: data, parseError: e.message };
          }
        }]
      });

      const responseData = response.data;

      // Handle parse errors
      if (responseData?.parseError) {
        return {
          success: false,
          error: 'Invalid JSON response from gateway',
          data: responseData,
          gatewayError: true
        };
      }

      // Check for transaction ID/ref
      const transactionId = responseData?.transaction_id ||
        responseData?.transactionId ||
        responseData?.transaction_ref ||
        responseData?.txn_id;

      const hasTransaction = !!transactionId;
      const isSuccess = (
        responseData?.status === 'success' ||
        responseData?.success === true ||
        (response.status === 200 && hasTransaction)
      );

      if (hasTransaction) {
        console.log('✓ [PAYMENT] Payment successful. Transaction ID:', transactionId);
        return {
          success: true,
          transaction_id: transactionId,
          reference_id: responseData?.reference_id,
          status: responseData?.status || 'success',
          message: responseData?.message || 'Payment processed successfully',
          raw_response: responseData
        };
      }

      if (isSuccess) {
        return {
          success: true,
          transaction_id: 'pending',
          status: 'pending',
          message: responseData?.message || 'Payment is being processed',
          raw_response: responseData
        };
      }

      // Payment failed
      const errorMessage = responseData?.error ||
        responseData?.message ||
        'Payment processing failed';

      return {
        success: false,
        error: errorMessage,
        status: responseData?.status || 'failed',
        raw_response: responseData
      };

    } catch (error) {
      console.error('✗ [PAYMENT] Payment error:', error.message);
      
      if (error.response) {
        const errorData = error.response.data;
        return {
          success: false,
          error: errorData?.message || `Payment API error (${error.response.status})`,
          statusCode: error.response.status,
          raw_response: errorData
        };
      }
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return {
          success: false,
          error: 'Payment request timed out. Please try again.',
          timeout: true
        };
      }
      
      return {
        success: false,
        error: error.message || 'Payment service unavailable',
        networkError: true
      };
    }
  }

  // Market-specific payment methods
  async processSpacePayment(phone, amount, spaceName, sellerName) {
    return await this.processPayment({
      amount,
      customer_phone: phone,
      description: `Space payment for ${spaceName} - ${sellerName}`
    });
  }

  async processRegistrationFee(phone, amount, sellerName) {
    return await this.processPayment({
      amount,
      customer_phone: phone,
      description: `Registration fee - ${sellerName}`
    });
  }
}

export default new LanariPaymentService();