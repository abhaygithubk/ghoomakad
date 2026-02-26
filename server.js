// ============================================
// VOYAGR — Paytm Payment Backend (Node.js)
// ============================================
// 
// SETUP:
//   npm install express cors paytmchecksum dotenv
//   node server.js
//
// ENV FILE (.env):
//   PAYTM_MID=YOUR_MERCHANT_ID
//   PAYTM_KEY=YOUR_MERCHANT_KEY
//   PAYTM_WEBSITE=DEFAULT
//   PAYTM_ENV=production  (or staging)
//   PORT=5000
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const https = require('https');
const PaytmChecksum = require('paytmchecksum');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- CONFIG ----
const PAYTM_MID = process.env.PAYTM_MID;
const PAYTM_KEY = process.env.PAYTM_KEY;
const PAYTM_WEBSITE = process.env.PAYTM_WEBSITE || 'DEFAULT';
const IS_STAGING = process.env.PAYTM_ENV !== 'production';

const PAYTM_HOST = IS_STAGING
  ? 'securegw-stage.paytm.in'
  : 'securegw.paytm.in';

// ============================================
// STEP 1: INITIATE PAYMENT
// POST /api/payment/initiate
// ============================================
app.post('/api/payment/initiate', async (req, res) => {
  try {
    const { orderId, amount, customerId, customerEmail, customerPhone } = req.body;

    if (!orderId || !amount || !customerId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const paytmParams = {
      body: {
        requestType: 'Payment',
        mid: PAYTM_MID,
        websiteName: PAYTM_WEBSITE,
        orderId: orderId,
        callbackUrl: `${req.protocol}://${req.get('host')}/api/payment/callback`,
        txnAmount: {
          value: parseFloat(amount).toFixed(2),
          currency: 'INR'
        },
        userInfo: {
          custId: customerId,
          email: customerEmail,
          mobile: customerPhone
        }
      }
    };

    // Generate checksum
    const checksum = await PaytmChecksum.generateSignature(
      JSON.stringify(paytmParams.body),
      PAYTM_KEY
    );

    paytmParams.head = {
      signature: checksum
    };

    // Call Paytm API to get transaction token
    const data = JSON.stringify(paytmParams);
    const txnToken = await callPaytmAPI(
      PAYTM_HOST,
      `/theia/api/v1/initiateTransaction?mid=${PAYTM_MID}&orderId=${orderId}`,
      'POST',
      data
    );

    const response = JSON.parse(txnToken);

    if (response.body.resultInfo.resultStatus === 'S') {
      return res.json({
        success: true,
        txnToken: response.body.txnToken,
        orderId: orderId,
        amount: amount,
        mid: PAYTM_MID,
        host: PAYTM_HOST
      });
    } else {
      return res.status(400).json({
        success: false,
        error: response.body.resultInfo.resultMsg
      });
    }

  } catch (err) {
    console.error('Initiate payment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// STEP 2: PAYTM CALLBACK (After Payment)
// POST /api/payment/callback
// ============================================
app.post('/api/payment/callback', async (req, res) => {
  try {
    const { CHECKSUMHASH, ...paytmParams } = req.body;

    // Verify checksum
    const isValid = PaytmChecksum.verifySignature(
      paytmParams,
      PAYTM_KEY,
      CHECKSUMHASH
    );

    if (!isValid) {
      console.error('Checksum mismatch!');
      return res.redirect('/payment-failed.html?reason=checksum');
    }

    if (paytmParams.STATUS === 'TXN_SUCCESS') {
      // 🔐 Verify transaction with Paytm API (important!)
      const verified = await verifyTransaction(paytmParams.ORDERID, paytmParams.TXNID);

      if (verified) {
        // ✅ Payment confirmed — save to database here
        console.log('✅ Payment Success:', {
          orderId: paytmParams.ORDERID,
          txnId: paytmParams.TXNID,
          amount: paytmParams.TXNAMOUNT
        });

        return res.redirect(`/success.html?orderId=${paytmParams.ORDERID}&txnId=${paytmParams.TXNID}`);
      }
    }

    return res.redirect(`/payment-failed.html?reason=${paytmParams.RESPMSG}`);

  } catch (err) {
    console.error('Callback error:', err);
    res.redirect('/payment-failed.html?reason=server_error');
  }
});

// ============================================
// STEP 3: VERIFY TRANSACTION
// POST /api/payment/verify
// ============================================
app.post('/api/payment/verify', async (req, res) => {
  try {
    const { orderId, txnId } = req.body;

    const paytmParams = {
      body: {
        mid: PAYTM_MID,
        orderId: orderId
      }
    };

    const checksum = await PaytmChecksum.generateSignature(
      JSON.stringify(paytmParams.body),
      PAYTM_KEY
    );
    paytmParams.head = { signature: checksum };

    const data = JSON.stringify(paytmParams);
    const result = await callPaytmAPI(
      PAYTM_HOST,
      '/v3/order/status',
      'POST',
      data
    );

    const response = JSON.parse(result);

    if (
      response.body.resultInfo.resultStatus === 'TXN_SUCCESS' &&
      response.body.txnId === txnId
    ) {
      return res.json({ success: true, txnId, orderId });
    }

    return res.json({ success: false });

  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// HELPER: Verify transaction amount
// ============================================
async function verifyTransaction(orderId, txnId) {
  try {
    const paytmParams = {
      body: { mid: PAYTM_MID, orderId }
    };
    const checksum = await PaytmChecksum.generateSignature(
      JSON.stringify(paytmParams.body), PAYTM_KEY
    );
    paytmParams.head = { signature: checksum };
    const result = await callPaytmAPI(PAYTM_HOST, '/v3/order/status', 'POST', JSON.stringify(paytmParams));
    const resp = JSON.parse(result);
    return resp.body.resultInfo.resultStatus === 'TXN_SUCCESS' && resp.body.txnId === txnId;
  } catch { return false; }
}

// ============================================
// HELPER: HTTPS call to Paytm API
// ============================================
function callPaytmAPI(host, path, method, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: IS_STAGING ? 'staging' : 'production' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Voyagr Payment Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${IS_STAGING ? 'STAGING' : 'PRODUCTION'}`);
  console.log(`🏪 Merchant ID: ${PAYTM_MID}`);
});
