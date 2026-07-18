$serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsaGFlaHdkeHh0ZG52Zm5taHFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDM1MjQwMiwiZXhwIjoyMDk5OTI4NDAyfQ.vOb7SFwjaaGVDwUm0X-FPnRyY7gJlTF6l6YA5S0RXKk"
$supabaseUrl = "https://llhaehwdxxtdnvfnmhqq.supabase.co"
$anonKeyLine = (Get-Content "c:\Users\jvsgp\Hack_2_Skill_Prompt_Wars_Main_Challenge_V_S_Sasi_Kumar_Jonnadula\frontend\.env") | Where-Object { $_ -match "ANON_KEY" }
$anonKey = $anonKeyLine -replace ".*=",""
Write-Host "AnonKey: $($anonKey.Substring(0,20))..."

# Step 1: Create demo user
$createBody = '{"email":"demo@habitheal.app","password":"HabitHeal2025!","email_confirm":true}'
$createResp = $null
try {
    $createResp = Invoke-RestMethod -Uri "$supabaseUrl/auth/v1/admin/users" -Method POST -Body $createBody -ContentType "application/json" -Headers @{ apikey=$serviceKey; Authorization="Bearer $serviceKey" } -TimeoutSec 15
    Write-Host "Demo user created: $($createResp.id)"
} catch {
    Write-Host "Note: $($_.Exception.Message.Split([char]10)[0])"
}

# Step 2: Sign in
$loginBody = '{"email":"demo@habitheal.app","password":"HabitHeal2025!"}'
$token = $null
try {
    $loginResp = Invoke-RestMethod -Uri "$supabaseUrl/auth/v1/token?grant_type=password" -Method POST -Body $loginBody -ContentType "application/json" -Headers @{ apikey=$anonKey } -TimeoutSec 15
    $token = $loginResp.access_token
    Write-Host "Login OK - user_id=$($loginResp.user.id)"
} catch {
    Write-Host "Login failed: $($_.Exception.Message.Split([char]10)[0])"
    exit 1
}

# Step 3: Test /auth/me
try {
    $meResp = Invoke-RestMethod -Uri "http://localhost:8000/auth/me" -Method GET -Headers @{ Authorization="Bearer $token" } -TimeoutSec 10
    Write-Host "/auth/me OK: user_id=$($meResp.user_id)"
} catch {
    Write-Host "/auth/me FAILED: $($_.Exception.Message.Split([char]10)[0])"
}

# Step 4: GET /habits/
try {
    $habitsResp = Invoke-RestMethod -Uri "http://localhost:8000/habits/" -Method GET -Headers @{ Authorization="Bearer $token" } -TimeoutSec 10
    Write-Host "/habits/ OK: $($habitsResp.Count) habits"
} catch {
    Write-Host "/habits/ FAILED: $($_.Exception.Message.Split([char]10)[0])"
}

# Step 5: POST /habits/
try {
    $habitBody = '{"name":"Test: Reduce Screen Time","category":"screen_time","daily_goal":30,"goal_unit":"minutes"}'
    $newHabit = Invoke-RestMethod -Uri "http://localhost:8000/habits/" -Method POST -Body $habitBody -ContentType "application/json" -Headers @{ Authorization="Bearer $token" } -TimeoutSec 10
    Write-Host "/habits/ POST OK: id=$($newHabit.id)"
    $habitId = $newHabit.id
} catch {
    Write-Host "/habits/ POST FAILED: $($_.Exception.Message.Split([char]10)[0])"
}

# Step 6: POST /chat/ (Gemini)
try {
    $chatBody = '{"message":"I need help staying off my phone today."}'
    $chatRaw = Invoke-WebRequest -Uri "http://localhost:8000/chat/" -Method POST -Body $chatBody -ContentType "application/json" -Headers @{ Authorization="Bearer $token" } -TimeoutSec 30
    Write-Host "/chat/ OK: status=$($chatRaw.StatusCode), body_len=$($chatRaw.Content.Length) chars"
    Write-Host "First 200 chars: $($chatRaw.Content.Substring(0, [Math]::Min(200, $chatRaw.Content.Length)))"
} catch {
    Write-Host "/chat/ FAILED: $($_.Exception.Message.Split([char]10)[0])"
}

Write-Host ""
Write-Host "=== END-TO-END LOCAL TEST COMPLETE ==="
