const express = require('express');

const router = express.Router();

const appendParams = (baseUrl, params) => {
  const separator = baseUrl.includes('?') ? '&' : '?';
  const query = new URLSearchParams(params).toString();
  return `${baseUrl}${separator}${query}`;
};

router.get('/khalti/redirect', (req, res) => {
  const {
    deeplink,
    flow,
    intentId,
    pidx,
    status,
    transaction_id,
    tidx,
    amount,
    total_amount,
    purchase_order_id,
  } = req.query;

  const appDeepLink =
    typeof deeplink === 'string' && deeplink.length > 0
      ? deeplink
      : 'musclegarage://payment-callback';

  const target = appendParams(appDeepLink, {
    flow: flow || '',
    intentId: intentId || '',
    pidx: pidx || '',
    status: status || '',
    transaction_id: transaction_id || '',
    tidx: tidx || '',
    amount: amount || '',
    total_amount: total_amount || '',
    purchase_order_id: purchase_order_id || '',
  });

  return res.redirect(302, target);
});

module.exports = router;
