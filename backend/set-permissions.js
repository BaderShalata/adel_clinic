const { execSync } = require('child_process');

const projectId = 'adelclinic-35393';
const functionName = 'api';
const region = 'us-central1';

console.log('Setting up Cloud Run permissions for public access...');

try {
  // Use gcloud via npx if available
  const command = `npx @google-cloud/functions@latest grant-public-access --project=${projectId} --function=${functionName} --region=${region}`;
  
  console.log(`Running: ${command}`);
  const output = execSync(command, { encoding: 'utf-8', stdio: 'inherit' });
  console.log(output);
  console.log('✓ Permissions updated successfully');
} catch (error) {
  console.error('Error setting permissions:', error.message);
  console.log('\nAlternatively, you can set permissions in Google Cloud Console:');
  console.log(`1. Go to https://console.cloud.google.com/functions/details/${region}/${functionName}?project=${projectId}`);
  console.log('2. Click on "Permissions" tab');
  console.log('3. Click "Add Principal"');
  console.log('4. Add "allUsers" with role "Cloud Run Invoker"');
}
