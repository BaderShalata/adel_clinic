#!/usr/bin/env node

/**
 * This script sets Cloud Run Cloud Function to allow public/unauthenticated access
 * Usage: node setup-cloud-run-permissions.js
 */

const https = require('https');
const fs = require('fs');

const PROJECT_ID = 'adelclinic-35393';
const FUNCTION_NAME = 'api';
const REGION = 'us-central1';

async function getAccessToken() {
  try {
    // Try to get token from gcloud
    const { execSync } = require('child_process');
    const token = execSync('gcloud auth application-default print-access-token', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    return token;
  } catch (error) {
    console.log('ℹ gcloud not available in PATH');
    return null;
  }
}

async function setServicePublicAccess() {
  const token = await getAccessToken();
  
  if (!token) {
    console.log(`
⚠️  Could not get authentication token automatically.

To set Cloud Run public access manually:
1. Go to: https://console.cloud.google.com/run/detail/${REGION}/${FUNCTION_NAME}?project=${PROJECT_ID}
2. Click the "Permissions" tab
3. Click "Grant Access"
4. Add principal: allUsers
5. Role: Cloud Run Invoker
6. Save

OR use gcloud:
  gcloud run services add-iam-policy-binding ${FUNCTION_NAME} \\
    --region=${REGION} \\
    --member=allUsers \\
    --role=roles/run.invoker \\
    --project=${PROJECT_ID}
    `);
    return;
  }

  const policy = {
    bindings: [
      {
        role: 'roles/run.invoker',
        members: ['allUsers']
      }
    ]
  };

  const body = JSON.stringify(policy);
  const options = {
    hostname: 'iam.googleapis.com',
    path: `/v1/projects/${PROJECT_ID}/locations/${REGION}/services/${FUNCTION_NAME}:setIamPolicy`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': body.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✓ Successfully set Cloud Run service to public access!');
          resolve(true);
        } else {
          console.error(`✗ Error: ${res.statusCode}`);
          console.error(data);
          reject(new Error(data));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

setServicePublicAccess().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
