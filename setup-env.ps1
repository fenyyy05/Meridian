$ErrorActionPreference = "Stop"

Write-Host "Adding AUTH_TRUST_HOST..."
"true" | npx vercel env add AUTH_TRUST_HOST production

Write-Host "Adding NEXTAUTH_URL..."
"https://meridian-azure-phi.vercel.app" | npx vercel env add NEXTAUTH_URL production

Write-Host "Adding AUTH_URL..."
"https://meridian-azure-phi.vercel.app" | npx vercel env add AUTH_URL production

Write-Host "Adding NEXT_PUBLIC_APP_URL..."
"https://meridian-azure-phi.vercel.app" | npx vercel env add NEXT_PUBLIC_APP_URL production

Write-Host "Environment variables added successfully!"
