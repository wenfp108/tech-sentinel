/**
 * 通用重试包装器
 */

export async function withRetry(fn, { maxRetries = 3, delay = 2000, label = 'request' } = {}) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            const isLast = attempt === maxRetries;
            const status = err.response ? err.response.status : 'NO_RESPONSE';
            console.warn(`   ⚠️ ${label} failed (${status}) [${attempt}/${maxRetries}]`);
            if (isLast) throw err;
            const wait = delay * Math.pow(2, attempt - 1);
            console.log(`   💤 Retrying in ${wait / 1000}s...`);
            await new Promise(r => setTimeout(r, wait));
        }
    }
}
