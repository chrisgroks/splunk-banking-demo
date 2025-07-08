# Splunk Cloud Setup for Banking Demo

## Quick Setup Steps

### 1. Get Your Splunk Cloud Instance

1. **Sign up at:** https://www.splunk.com/en_us/download/splunk-cloud.html
2. **Complete the trial registration** (no credit card needed)
3. **Check your email** for Splunk Cloud instance details
4. **Note your instance URL:** `https://your-instance.splunkcloud.com`

### 2. Configure HTTP Event Collector (HEC)

1. **Login to your Splunk Cloud instance**

2. **Navigate to:** Settings > Data Inputs > HTTP Event Collector

3. **Click "New Token"**

4. **Configure the token:**
   - **Name:** `banking-demo-token`
   - **Source name or description:** `banking-demo`
   - **Default Index:** `main`
   - **Default Source Type:** `_json`
   - **Enable indexer acknowledgment:** No (for simplicity)

5. **Click "Review" then "Submit"**

6. **Copy the generated token** - you'll need this for your .env file

### 3. Enable HEC (if not already enabled)

1. **Go to:** Settings > Data Inputs > HTTP Event Collector > Global Settings

2. **Ensure these settings:**
   - **All Tokens:** Enabled
   - **Enable SSL:** Yes (recommended)
   - **HTTP Port Number:** 8088
   - **HTTPS Port Number:** 8088

3. **Click "Save"**

### 4. Configure Your Banking Demo

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit .env with your Splunk Cloud details:**
   ```bash
   # Replace with your actual Splunk Cloud instance URL and token
   SPLUNK_HEC_ENDPOINT=https://your-instance.splunkcloud.com:8088/services/collector
   SPLUNK_HEC_TOKEN=your-actual-hec-token-here
   
   # OpenTelemetry settings (for future use)
   OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces
   OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://localhost:4318/v1/metrics
   OTEL_SERVICE_NAME=banking-demo
   OTEL_SERVICE_VERSION=1.0.0
   ```

### 5. Test the Connection

1. **Start the banking demo:**
   ```bash
   npm install
   npm start
   ```

2. **Generate test data:**
   - Open http://localhost:3000
   - Login with: `john_doe` / `password123`
   - Check balance, make a transfer, logout

3. **Verify in Splunk Cloud:**
   - Go to Search & Reporting
   - Search: `index=main source="banking-demo"`
   - You should see events appearing

### 6. Import the Dashboard

1. **In Splunk Cloud, go to:** Settings > User Interface > Views

2. **Click "New View"**

3. **Set these details:**
   - **View Name:** `banking_demo_dashboard`
   - **View Type:** Dashboard
   - **Permission:** Private (or App if you want to share)

4. **Copy the XML from `splunk-dashboard.xml`** and paste it into the Source XML

5. **Save the dashboard**

6. **Access your dashboard:** Apps > Search & Reporting > Dashboards > Banking Demo Dashboard

## Testing Your Setup

### Quick Connection Test

You can test your HEC connection directly:

```bash
# Replace with your actual endpoint and token
curl -k "https://your-instance.splunkcloud.com:8088/services/collector" \
  -H "Authorization: Splunk your-actual-hec-token" \
  -d '{"event": "test connection", "source": "banking-demo-test"}'
```

If successful, you'll get a response like: `{"text":"Success","code":0}`

### Banking Demo Test

1. **Start the app:** `npm start`
2. **Use the banking interface** - login, check balance, transfer money
3. **Check console output** - should see `[CUSTOM-SPLUNK]` messages
4. **Search in Splunk:** `index=main source="banking-demo"`

## Troubleshooting

### No Data Appearing?

1. **Check your .env file:**
   - Ensure no trailing slashes in SPLUNK_HEC_ENDPOINT
   - Verify token is correct (no extra spaces)

2. **Check HEC status:**
   - In Splunk Cloud: Settings > Data Inputs > HTTP Event Collector
   - Ensure "All Tokens" is Enabled

3. **Check console output:**
   - Look for `[CUSTOM-SPLUNK]` messages
   - Any error messages about HEC requests?

### Connection Errors?

1. **Verify your Splunk Cloud URL** - should be https://your-instance.splunkcloud.com
2. **Check firewall/network** - ensure port 8088 is accessible
3. **Try the curl test** above to isolate the issue

### Dashboard Issues?

1. **Check time range** - set to "Last 15 minutes" or "Last hour"
2. **Verify index permissions** - ensure you can search `index=main`
3. **Test individual searches** in Search & Reporting first

## What You'll See

### Event Types:
- `BANKING_LOGIN_INITIATED` - User logins
- `BANKING_LOGOUT_INITIATED` - User logouts  
- `BANKING_TRANSFER_INITIATED` - Money transfers
- `BANKING_BALANCE_CHECK` - Balance inquiries

### Multiple Log Formats (The "Messy" Part):
- Winston logger entries
- Bunyan JSON logs
- Custom Splunk HEC events
- Console audit logs

This demonstrates the problem we'll solve with OpenTelemetry - too many competing logging approaches creating noise and maintenance overhead.

## Next Steps

Once you have data flowing to Splunk Cloud:

1. **Explore the dashboard** - see the banking operations in real-time
2. **Notice the logging mess** - multiple formats for same events
3. **Identify improvement opportunities** - excessive noise, poor correlation
4. **Prepare for OpenTelemetry migration** - clean, standardized approach

Your local banking app will send all telemetry directly to Splunk Cloud, giving you a production-like monitoring experience without any local infrastructure.
