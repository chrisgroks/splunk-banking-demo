const https = require('https');
const http = require('http');

class CustomSplunkLogger {
  constructor(options = {}) {
    this.endpoint = options.endpoint || process.env.SPLUNK_HEC_ENDPOINT;
    this.token = options.token || process.env.SPLUNK_HEC_TOKEN;
    this.source = options.source || 'banking-demo';
    this.sourcetype = options.sourcetype || 'nodejs';
    this.index = options.index || 'default';
    
    if (!this.endpoint || !this.token) {
      console.warn('[CUSTOM-SPLUNK] Missing endpoint or token, logging to console only');
    }
  }

  log(event, user = {}, data = {}) {
    // Format according to Splunk HEC JSON format
    // https://docs.splunk.com/Documentation/Splunk/latest/Data/FormateventsforHTTPEventCollector
    const logEntry = {
      // Required HEC parameters
      time: Date.now() / 1000,
      host: require('os').hostname(),
      source: this.source,
      sourcetype: this.sourcetype,
      // The actual event data
      event: {
        event_type: event,
        user_id: user.id || user.username || 'unknown',
        user_name: user.name || 'unknown',
        data: data,
        app: 'banking-demo',
        environment: 'demo',
        correlation_id: data.correlationId || `${Date.now()}-${Math.random()}`
      }
    };

    // Always log to console for demo purposes
    console.log(`[CUSTOM-SPLUNK] ${new Date().toISOString()} EVENT=${event} USER=${JSON.stringify(user)} DATA=${JSON.stringify(data)}`);
    
    // Send to Splunk HEC if configured
    if (this.endpoint && this.token) {
      this.sendToSplunk(logEntry);
    }
  }

  debug(message) {
    // Format according to Splunk HEC JSON format
    const logEntry = {
      // Required HEC parameters
      time: Date.now() / 1000,
      host: require('os').hostname(),
      source: this.source,
      sourcetype: this.sourcetype,
      // The actual event data
      event: {
        level: 'DEBUG',
        message: message,
        app: 'banking-demo',
        environment: 'demo'
      }
    };

    console.log(`[CUSTOM-DEBUG] ${Date.now()} ${message}`);
    
    if (this.endpoint && this.token) {
      this.sendToSplunk(logEntry);
    }
  }

  sendToSplunk(logEntry) {
    const postData = JSON.stringify(logEntry);
    const url = new URL(this.endpoint);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Splunk ${this.token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      // Handle Splunk Cloud SSL certificates
      rejectUnauthorized: false
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`[CUSTOM-SPLUNK] HEC request successful (${res.statusCode})`);
        } else {
          console.error(`[CUSTOM-SPLUNK] HEC request failed with status ${res.statusCode}`);
          console.error(`[CUSTOM-SPLUNK] Response body: ${responseBody}`);
        }
      });
    });

    req.on('error', (error) => {
      console.error('[CUSTOM-SPLUNK] HEC request error:', error.message);
    });

    req.write(postData);
    req.end();
  }
}

module.exports = CustomSplunkLogger;