#!/usr/bin/env node

/**
 * Test script to verify Splunk HEC connection
 * Run this after setting up your .env file
 */

require('dotenv').config();
const https = require('https');
const http = require('http');

const endpoint = process.env.SPLUNK_HEC_ENDPOINT;
const token = process.env.SPLUNK_HEC_TOKEN;

if (!endpoint || !token) {
  console.error('❌ Missing SPLUNK_HEC_ENDPOINT or SPLUNK_HEC_TOKEN in .env file');
  console.log('\n📝 Please:');
  console.log('1. Copy .env.example to .env');
  console.log('2. Add your Splunk Cloud endpoint and token');
  process.exit(1);
}

console.log('🧪 Testing Splunk HEC connection...');
console.log(`📡 Endpoint: ${endpoint}`);
console.log(`🔑 Token: ${token.substring(0, 8)}...`);

const testEvent = {
  timestamp: Date.now() / 1000,
  event: {
    message: 'Banking Demo Connection Test',
    test_type: 'connection_verification',
    timestamp: new Date().toISOString(),
    app: 'banking-demo'
  },
  source: 'banking-demo-test',
  sourcetype: '_json',
  index: 'main'
};

const postData = JSON.stringify(testEvent);
const url = new URL(endpoint);

const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Authorization': `Splunk ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  },
  // Handle Splunk Cloud SSL certificates
  rejectUnauthorized: false
};

const client = url.protocol === 'https:' ? https : http;

console.log('\n🚀 Sending test event...');

const req = client.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log(`\n📊 Response Status: ${res.statusCode}`);
    console.log(`📋 Response: ${responseData}`);
    
    if (res.statusCode === 200) {
      console.log('\n✅ SUCCESS! Your Splunk HEC connection is working!');
      console.log('\n🎯 Next steps:');
      console.log('1. Run: npm start');
      console.log('2. Open: http://localhost:3000');
      console.log('3. Use the banking app (login, transfer, etc.)');
      console.log('4. Check Splunk: index=main source="banking-demo"');
    } else {
      console.log('\n❌ Connection failed. Check your endpoint and token.');
      console.log('\n🔧 Troubleshooting:');
      console.log('- Verify your Splunk Cloud URL is correct');
      console.log('- Check that HEC is enabled in Splunk');
      console.log('- Ensure your token has the right permissions');
    }
  });
});

req.on('error', (error) => {
  console.log('\n❌ Connection Error:', error.message);
  console.log('\n🔧 Common issues:');
  console.log('- Check your internet connection');
  console.log('- Verify the Splunk Cloud URL is accessible');
  console.log('- Ensure port 8088 is not blocked');
});

req.write(postData);
req.end();
