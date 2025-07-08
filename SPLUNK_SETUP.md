# Splunk Setup Guide for Banking Demo

This guide will help you set up Splunk to monitor telemetry from the banking demo application.

## Quick Setup (Recommended)

### Option 1: Local Splunk with Docker

1. **Run the setup script:**
   ```bash
   ./setup-splunk-local.sh
   ```

2. **Configure the banking demo:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with these values:
   ```bash
   SPLUNK_HEC_ENDPOINT=https://localhost:8088/services/collector
   SPLUNK_HEC_TOKEN=banking-demo-token-12345
   ```

3. **Access Splunk:**
   - URL: https://localhost:8000
   - Username: `admin`
   - Password: `admin123`

### Option 2: Splunk Cloud (Production-like)

1. **Sign up for Splunk Cloud:**
   - Go to https://www.splunk.com/en_us/download/splunk-cloud.html
   - Create free trial account
   - Note your instance URL (e.g., `https://your-instance.splunkcloud.com`)

2. **Create HEC Token:**
   - In Splunk Web: Settings > Data Inputs > HTTP Event Collector
   - Click "New Token"
   - Name: `banking-demo-token`
   - Source type: `_json`
   - Index: `main`
   - Copy the generated token

3. **Configure the banking demo:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Splunk Cloud details:
   ```bash
   SPLUNK_HEC_ENDPOINT=https://your-instance.splunkcloud.com:8088/services/collector
   SPLUNK_HEC_TOKEN=your-actual-hec-token
   ```

## Setting Up the Dashboard

### Import the Banking Demo Dashboard

1. **In Splunk Web, go to:** Settings > User Interface > Views

2. **Click "New View"**

3. **Copy the contents of `splunk-dashboard.xml`** and paste into the dashboard XML

4. **Save as:** `banking_demo_dashboard`

### Alternative: Manual Dashboard Creation

1. **Go to:** Search & Reporting > Dashboards > Create New Dashboard

2. **Add these searches as panels:**

   **Total Events Panel:**
   ```spl
   index=main source="banking-demo" 
   | stats count as total_events
   ```

   **User Activity Panel:**
   ```spl
   index=main source="banking-demo" user_id!="unknown"
   | stats count by user_id, event_type
   | xyseries user_id event_type count
   ```

   **Operations Timeline:**
   ```spl
   index=main source="banking-demo"
   | eval operation=case(
       match(event_type, "LOGIN"), "Login",
       match(event_type, "LOGOUT"), "Logout", 
       match(event_type, "TRANSFER"), "Transfer",
       match(event_type, "BALANCE"), "Balance Check",
       1=1, "Other"
   )
   | timechart span=1m count by operation
   ```

## Testing the Setup

1. **Start the banking demo:**
   ```bash
   npm start
   ```

2. **Generate some test data:**
   - Open http://localhost:3000
   - Login with: `john_doe` / `password123`
   - Check balance, make transfers, logout
   - Repeat a few times

3. **Check Splunk:**
   - Go to Search & Reporting
   - Search: `index=main source="banking-demo"`
   - You should see events flowing in

4. **View the dashboard:**
   - Go to your created dashboard
   - Should show real-time banking activity

## Understanding the Data

### Event Types You'll See:
- `BANKING_LOGIN_INITIATED` - User login attempts
- `BANKING_LOGOUT_INITIATED` - User logout
- `BANKING_TRANSFER_INITIATED` - Money transfers
- `BANKING_BALANCE_CHECK` - Balance inquiries

### Log Sources (Messy Implementation):
- `[WINSTON]` - Winston logger output
- `[CUSTOM-SPLUNK]` - Custom HEC logger
- `[AUDIT]` - Audit trail logs
- `bunyan` - Bunyan JSON logs

### Key Fields:
- `event_type` - Type of banking operation
- `user_id` - User performing the action
- `data` - Additional context (amounts, accounts, etc.)
- `correlation_id` - Tracking ID for related events

## Troubleshooting

### No Data in Splunk?

1. **Check HEC configuration:**
   ```bash
   curl -k https://localhost:8088/services/collector \
     -H "Authorization: Splunk banking-demo-token-12345" \
     -d '{"event": "test"}'
   ```

2. **Check banking demo logs:**
   - Look for `[CUSTOM-SPLUNK]` messages in console
   - Should see HEC requests being made

3. **Verify .env file:**
   - Ensure SPLUNK_HEC_ENDPOINT and SPLUNK_HEC_TOKEN are set
   - No trailing slashes in endpoint URL

### Docker Issues?

```bash
# Check if Splunk container is running
docker ps | grep splunk

# View Splunk logs
docker logs splunk-banking-demo

# Restart if needed
docker restart splunk-banking-demo
```

### Dashboard Not Working?

1. **Check index permissions:** Ensure your user can access the `main` index
2. **Verify time range:** Set dashboard time picker to "Last 15 minutes"
3. **Check search syntax:** Run individual searches in Search & Reporting first

## Next Steps

Once you have data flowing:

1. **Explore the messy logging** - Notice multiple formats for same events
2. **Identify noise patterns** - See excessive logging creating clutter
3. **Plan the cleanup** - Ready for OpenTelemetry migration
4. **Compare implementations** - Before/after observability approaches

The dashboard will help visualize both the messy current state and the clean future state after OpenTelemetry migration.
