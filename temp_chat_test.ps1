$anonKey = ((Get-Content "c:\Users\jvsgp\Hack_2_Skill_Prompt_Wars_Main_Challenge_V_S_Sasi_Kumar_Jonnadula\frontend\.env") | Where-Object { $_ -match "ANON_KEY" }) -replace ".*=",""
$loginBody = '{"email":"demo@habitheal.app","password":"HabitHeal2025!"}'
$loginResp = Invoke-RestMethod -Uri "https://llhaehwdxxtdnvfnmhqq.supabase.co/auth/v1/token?grant_type=password" -Method POST -Body $loginBody -ContentType "application/json" -Headers @{ apikey=$anonKey } -TimeoutSec 15
$token = $loginResp.access_token
Write-Host "Token acquired for: $($loginResp.user.email)"

$chatBody = '{"message":"I need help staying off my phone today. My streak is 3 days."}'
$chatResp = Invoke-WebRequest -Uri "http://localhost:8000/chat/" -Method POST -Body $chatBody -ContentType "application/json" -Headers @{ Authorization="Bearer $token" } -TimeoutSec 30 -UseBasicParsing
Write-Host "Chat status: $($chatResp.StatusCode)"
Write-Host "Response body (first 500 chars):"
Write-Host $chatResp.Content.Substring(0, [Math]::Min(500, $chatResp.Content.Length))
Write-Host ""
Write-Host "=== GEMINI AI CHAT WORKING ==="
