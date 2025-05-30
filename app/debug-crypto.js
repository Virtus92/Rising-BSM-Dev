// Debug script to check crypto implementation
console.log('=== Crypto Module Debug ===');
console.log('Node version:', process.version);
console.log('Crypto module:', typeof crypto);
console.log('Crypto constructor:', crypto?.constructor?.name);
console.log('randomUUID available:', typeof crypto?.randomUUID);

// Check if it's the native Node.js crypto
const isNativeCrypto = crypto && crypto.constructor && crypto.constructor.name === 'Object';
console.log('Is native Node.js crypto:', isNativeCrypto);

// Try to use randomUUID
try {
  if (crypto && crypto.randomUUID) {
    const uuid = crypto.randomUUID();
    console.log('✓ crypto.randomUUID() works! Generated:', uuid);
  } else {
    console.log('✗ crypto.randomUUID is not available');
  }
} catch (error) {
  console.error('✗ Error calling crypto.randomUUID():', error.message);
}

// Check what's in the crypto object
if (crypto) {
  console.log('\nAvailable crypto methods:');
  const methods = Object.getOwnPropertyNames(crypto).filter(name => typeof crypto[name] === 'function');
  console.log(methods.slice(0, 10).join(', '), '...');
}
