const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminRedeemCodes.tsx', 'utf8');

code = code.replace("import { FALLBACK_REDEEM_CODES } from '../data/raw_redeem_codes_fallback';", "");
const fallbackBlock = `
      if (fetchedCodes.length === 0) {
        // Fallback to static codes so they are instantly visible and ready to copy
        const mappedFallback: RedeemCode[] = FALLBACK_REDEEM_CODES.map(c => ({
          code: c.code,
          amount: c.amount,
          status: c.status
        }));
        setCodes(mappedFallback);
      } else {
        setCodes(fetchedCodes);
      }
`;
code = code.replace(fallbackBlock, "setCodes(fetchedCodes);");
fs.writeFileSync('src/pages/AdminRedeemCodes.tsx', code);
