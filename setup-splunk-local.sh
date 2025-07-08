#!/bin/bash

echo "Setting up local Splunk Enterprise for Banking Demo..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create Splunk container
echo "Starting Splunk Enterprise container..."
docker run -d \
    --name splunk-banking-demo \
    -p 8000:8000 \
    -p 8088:8088 \
    -e SPLUNK_START_ARGS='--accept-license' \
    -e SPLUNK_PASSWORD='admin123' \
    -e SPLUNK_HEC_TOKEN='banking-demo-token-12345' \
    splunk/splunk:latest

echo "Waiting for Splunk to start (this may take 2-3 minutes)..."
sleep 30

# Wait for Splunk to be ready
echo "Checking Splunk status..."
for i in {1..20}; do
    if curl -s -k https://localhost:8000/en-US/account/login > /dev/null; then
        echo "Splunk is ready!"
        break
    fi
    echo "Still waiting for Splunk... ($i/20)"
    sleep 15
done

echo ""
echo "🎉 Splunk Enterprise is now running!"
echo ""
echo "Access Details:"
echo "  Web Interface: https://localhost:8000"
echo "  Username: admin"
echo "  Password: admin123"
echo "  HEC Endpoint: https://localhost:8088/services/collector"
echo "  HEC Token: banking-demo-token-12345"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env"
echo "2. Update .env with the HEC endpoint and token above"
echo "3. Run 'npm start' to start the banking demo"
echo ""
