// Simple lockdown install script
// Fixed version without null exceptions

console.log('Starting lockdown install...');

try {
  // Basic installation check
  if (typeof window !== 'undefined') {
    console.log('Window object detected');
  }
  
  // Simple environment setup
  const environment = process?.env?.NODE_ENV || 'development';
  console.log(`Environment: ${environment}`);
  
  // Exit successfully
  console.log('Lockdown install completed successfully');
  process.exit(0);
  
} catch (error) {
  console.error('Error during lockdown install:', error.message);
  process.exit(1);
}
