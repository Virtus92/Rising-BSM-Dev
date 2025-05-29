const { parentPort, workerData } = require('worker_threads');

// Reconstruct context from serialized data
function reconstructContext(serialized) {
  return JSON.parse(JSON.stringify(serialized), (key, value) => {
    if (value && value.__function) {
      return new Function('return ' + value.__function)();
    }
    return value;
  });
}

// Create secure console that sends messages to parent
const secureConsole = {
  log: (...args) => parentPort.postMessage({ type: 'log', level: 'log', args }),
  info: (...args) => parentPort.postMessage({ type: 'log', level: 'info', args }),
  warn: (...args) => parentPort.postMessage({ type: 'log', level: 'warn', args }),
  error: (...args) => parentPort.postMessage({ type: 'log', level: 'error', args }),
  debug: (...args) => parentPort.postMessage({ type: 'log', level: 'debug', args })
};

try {
  const { code, context, config } = workerData;
  const reconstructedContext = reconstructContext(context);
  
  // Create a limited global scope
  const sandbox = {
    ...reconstructedContext,
    // Safe globals
    console: secureConsole,
    JSON,
    Math,
    Date,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Map,
    Set,
    Promise,
    // Rising-BSM plugin globals
    RisingBSMPlugin: undefined, // Will be defined by plugin
    // Blocked globals
    require: undefined,
    process: undefined,
    __dirname: undefined,
    __filename: undefined,
    module: undefined,
    exports: undefined,
    global: undefined,
    Buffer: undefined,
    setImmediate: undefined,
    clearImmediate: undefined,
    eval: undefined,
    Function: undefined
  };
  
  // Create function with limited scope
  const keys = Object.keys(sandbox);
  const values = Object.values(sandbox);
  
  // Add resource tracking
  let apiCallCount = 0;
  let storageUsed = 0;
  
  // Wrap API calls with tracking
  if (sandbox.api && sandbox.api.fetch) {
    const originalFetch = sandbox.api.fetch;
    sandbox.api.fetch = async (...args) => {
      apiCallCount++;
      if (apiCallCount > config.maxApiCalls) {
        throw new Error(`API call limit exceeded (${config.maxApiCalls})`);
      }
      return originalFetch(...args);
    };
  }
  
  // Wrap storage with tracking
  if (sandbox.storage && sandbox.storage.set) {
    const originalSet = sandbox.storage.set;
    sandbox.storage.set = async (key, value) => {
      const size = JSON.stringify(value).length;
      storageUsed += size;
      if (storageUsed > config.maxStorageSize * 1024 * 1024) {
        throw new Error(`Storage limit exceeded (${config.maxStorageSize}MB)`);
      }
      return originalSet(key, value);
    };
  }
  
  // Execute plugin code
  const func = new Function(...keys, `
    'use strict';
    
    // Plugin code
    ${code}
    
    // The plugin should define a global 'RisingBSMPlugin'
    if (typeof RisingBSMPlugin === 'undefined') {
      throw new Error('Plugin must export RisingBSMPlugin');
    }
    
    return RisingBSMPlugin;
  `);
  
  // Execute and return result
  const plugin = func(...values);
  
  // Send success response
  parentPort.postMessage({ 
    type: 'success',
    plugin,
    stats: {
      apiCallCount,
      storageUsed
    }
  });
} catch (error) {
  // Send error response
  parentPort.postMessage({ 
    type: 'error',
    error: error.message,
    stack: error.stack
  });
}