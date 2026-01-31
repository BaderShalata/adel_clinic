#!/bin/bash

# Test the /auth/register endpoint via the Functions emulator
# This is a simple curl test - the user will need a valid Firebase ID token

# Use a dummy token for testing (will fail auth, but shows route is found)
curl -X POST \
  http://127.0.0.1:5001/adelclinic-35393/us-central1/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dummy_token" \
  -d '{
    "email": "test@example.com",
    "displayName": "Test User",
    "phoneNumber": "0123456789",
    "role": "patient"
  }' \
  -v
