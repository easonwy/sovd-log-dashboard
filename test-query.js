// Test the query parameter count
const levels = ['ERROR', 'WARN', 'INFO', 'SUCCESS'];
const modules = ['VEHICLE_OWNER', 'DIAGNOSIS_PLATFORM', 'SOVD_CLIENT', 'HMI', 'AUTH_SERVER', 'CDA', 'PRIVATE_SERVER', 'SOVD_GATEWAY'];

const levelPlaceholders = levels.map(() => '?').join(',');
const modulePlaceholders = modules.map(() => '?').join(',');

const query = `
SELECT id, timestamp, module, level, message, trace_id, details, create_time
FROM infra_module_logs
WHERE level IN (${levelPlaceholders}) AND module IN (${modulePlaceholders})
ORDER BY timestamp DESC
LIMIT ? OFFSET ?
`.trim();

const params = [...levels, ...modules, 500, 0];

console.log('Query:');
console.log(query);
console.log('\nParameters count:', params.length);
console.log('Parameters:', params);

// Count placeholders
const placeholderCount = (query.match(/\?/g) || []).length;
console.log('\nPlaceholder count:', placeholderCount);
console.log('Match:', params.length === placeholderCount ? '✅ OK' : '❌ MISMATCH');
