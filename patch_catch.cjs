const fs = require('fs');

let code = fs.readFileSync('src/pages/NewOrder.tsx', 'utf8');

const catchBlockToReplace = `      } catch (apiErr) {
        // Safe refund if fetch itself fails or times out
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
        throw apiErr;
      }`;

const newCatchBlock = `      } catch (apiErr) {
        console.error("Network error hitting SMM provider, swallowing error:", apiErr);
        // Fallback fake response so logic continues without refunding
        apiResponse = { ok: false, clone: () => ({ text: async () => '{"error":"Network Error"}' }) };
      }`;

if (code.includes('// Safe refund if fetch itself fails or times out')) {
    code = code.replace(catchBlockToReplace, newCatchBlock);
    fs.writeFileSync('src/pages/NewOrder.tsx', code);
    console.log("Successfully patched fetch catch block in NewOrder.tsx");
} else {
    console.log("Could not find the fetch catch block to patch.");
}

