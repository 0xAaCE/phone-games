#!/bin/bash

# Quick script to create a party, join it, and start a match
# Uses the Twilio webhook interface for easy testing

BASE_URL="http://localhost:4000"
PHONE_NUMBER="whatsapp:+5491158485048"
PARTY_NAME="QuickTestParty"

echo "🎮 Creating party..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/twilio" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "Body=/create_party impostor $PARTY_NAME" \
  --data-urlencode "From=$PHONE_NUMBER" \
  --data-urlencode "WaId=5491158485048" \
  --data-urlencode "MessageSid=SM$(date +%s)_create" \
  --data-urlencode "AccountSid=AC123456789abcdef")

echo "$RESPONSE"
echo ""

# Extract party code from response (assuming it's in the response)
# You may need to adjust this based on actual response format
PARTY_CODE=$(echo "$RESPONSE" | grep -o 'Code: [A-Z0-9]*' | cut -d' ' -f2)

if [ -z "$PARTY_CODE" ]; then
  echo "⚠️  Could not extract party code from response"
  echo "Please check the response above for the party code"
  echo ""
  read -p "Enter party code manually: " PARTY_CODE
fi

echo "📋 Party code: $PARTY_CODE"
echo ""

# Join with additional players
echo "👥 Player 2 joining..."
curl -s -X POST "$BASE_URL/api/twilio" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "Body=/join_party $PARTY_CODE" \
  --data-urlencode "From=whatsapp:+541158485049" \
  --data-urlencode "WaId=541158485049" \
  --data-urlencode "MessageSid=SM$(date +%s)_join2" \
  --data-urlencode "AccountSid=AC123456789abcdef"
echo ""

echo "👥 Player 3 joining..."
curl -s -X POST "$BASE_URL/api/twilio" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "Body=/join_party $PARTY_CODE" \
  --data-urlencode "From=whatsapp:+541158485050" \
  --data-urlencode "WaId=541158485050" \
  --data-urlencode "MessageSid=SM$(date +%s)_join3" \
  --data-urlencode "AccountSid=AC123456789abcdef"
echo ""

# echo "👥 Player 4 joining..."
# curl -s -X POST "$BASE_URL/api/twilio" \
#   -H "Content-Type: application/x-www-form-urlencoded" \
#   --data-urlencode "Body=/join_party $PARTY_CODE" \
#   --data-urlencode "From=whatsapp:+541158485051" \
#   --data-urlencode "WaId=541158485051" \
#   --data-urlencode "MessageSid=SM$(date +%s)_join4" \
#   --data-urlencode "AccountSid=AC123456789abcdef"
# echo ""

# Start match (from original creator)
echo "🚀 Starting match..."
curl -s -X POST "$BASE_URL/api/twilio" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "Body=/start_match" \
  --data-urlencode "From=$PHONE_NUMBER" \
  --data-urlencode "WaId=541158485048" \
  --data-urlencode "MessageSid=SM$(date +%s)_start" \
  --data-urlencode "AccountSid=AC123456789abcdef"
echo ""

echo "✨ Done! Party created, players joined, and match started!"
