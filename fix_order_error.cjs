const fs = require('fs');

let code = fs.readFileSync('src/pages/NewOrder.tsx', 'utf8');

// Replace the api error handling
const targetToReplace = `      if (!apiResponse.ok || resData.error) {
        let providerError = '';
        if (resData.error) {
          providerError = resData.error;
        } else if (parseFailed && rawText) {
          // If response is HTML or text, sanitize it slightly or show first 150 chars
          const cleanText = rawText.replace(/<[^>]*>/g, '').trim();
          providerError = \`Server responded with status \${apiResponse.status}: \${cleanText.slice(0, 150)}\`;
        } else {
          providerError = \`API Provider failed to process order (Status \${apiResponse.status})\`;
        }

        // Safe refund if SMM provider rejects the order
        await runTransaction(db, async (refundTx) => {
          const userSnap = await refundTx.get(userRef);
          if (userSnap.exists()) {
            const currentBalance = userSnap.data().balance || 0;
            const currentTotalSpent = userSnap.data().totalSpent || 0;
            refundTx.update(userRef, {
              balance: currentBalance + orderCharge,
              totalSpent: Math.max(0, currentTotalSpent - orderCharge),
              updatedAt: Date.now()
            });
          }
        });
        throw new Error(providerError);
      }`;

const newLogic = `      let providerOrderId = '';
      if (!apiResponse.ok || resData.error) {
        let providerError = '';
        if (resData.error) {
          providerError = resData.error;
        } else if (parseFailed && rawText) {
          const cleanText = rawText.replace(/<[^>]*>/g, '').trim();
          providerError = \`Server responded with status \${apiResponse.status}: \${cleanText.slice(0, 150)}\`;
        } else {
          providerError = \`API Provider failed to process order (Status \${apiResponse.status})\`;
        }
        console.error("Provider Error swallowed to not show to user:", providerError);
        // We do NOT refund here because the user wants the order to always be placed successfully on the frontend.
        // The admin will have to handle this order manually.
        providerOrderId = 'API_ERROR_PENDING_MANUAL';
      } else {
        providerOrderId = String(resData.orderId || resData.order || '');
      }`;

if(code.includes('if (!apiResponse.ok || resData.error) {')) {
  // Try string replacement first
  const startIndex = code.indexOf('if (!apiResponse.ok || resData.error) {');
  const endIndex = code.indexOf('const providerOrderId = String(resData.orderId || resData.order || \'\');');
  
  if(startIndex !== -1 && endIndex !== -1) {
      const blockToReplace = code.substring(startIndex, endIndex + "const providerOrderId = String(resData.orderId || resData.order || '');".length);
      code = code.replace(blockToReplace, newLogic);
      fs.writeFileSync('src/pages/NewOrder.tsx', code);
      console.log('Successfully patched NewOrder.tsx to swallow SMM provider errors and not refund.');
  } else {
      console.log('Failed to find end index.');
  }
} else {
  console.log('Failed to find start block.');
}
