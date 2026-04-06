const https = require('https');

const KHALTI_HOST = 'dev.khalti.com';
const KHALTI_BASE_PATH = '/api/v2';

const getSecretKey = () => {
  const key =
    process.env.KHALTI_SECRET_KEY ||
    process.env.KHALTI_SECRET ||
    process.env.KHALTI_SECRETKEY;
  if (!key) {
    throw new Error(
      'Khalti secret key is not configured. Set KHALTI_SECRET_KEY in Backend/.env'
    );
  }
  return key;
};

const requestKhalti = async (path, payload) => {
  const secretKey = getSecretKey();
  const body = JSON.stringify(payload);

  const data = await new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: KHALTI_HOST,
        path: `${KHALTI_BASE_PATH}${path}`,
        method: 'POST',
        headers: {
          Authorization: `Key ${secretKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          let parsed = {};
          try {
            parsed = raw ? JSON.parse(raw) : {};
          } catch (parseErr) {
            parsed = { message: raw || 'Invalid response from Khalti' };
          }
          if (res.statusCode < 200 || res.statusCode >= 300) {
            const message =
              parsed?.detail || parsed?.message || `Khalti request failed with ${res.statusCode}`;
            const error = new Error(message);
            error.statusCode = res.statusCode;
            return reject(error);
          }
          resolve(parsed);
        });
      }
    );

    req.on('error', (err) => {
      reject(err);
    });

    req.write(body);
    req.end();
  });

  return data;
};

const initiateKhaltiPayment = async ({
  amount,
  purchaseOrderId,
  purchaseOrderName,
  returnUrl,
  websiteUrl,
}) => {
  return requestKhalti('/epayment/initiate/', {
    amount,
    purchase_order_id: purchaseOrderId,
    purchase_order_name: purchaseOrderName,
    return_url: returnUrl,
    website_url: websiteUrl,
  });
};

const lookupKhaltiPayment = async (pidx) => {
  return requestKhalti('/epayment/lookup/', { pidx });
};

module.exports = {
  initiateKhaltiPayment,
  lookupKhaltiPayment,
};
