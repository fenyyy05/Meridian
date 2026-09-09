$ErrorActionPreference = "Stop"
Write-Host "Adding TZ (Timezone) for Vercel Serverless Functions..."
"Asia/Kolkata" | npx vercel env add TZ production
Write-Host "Timezone added successfully!"
