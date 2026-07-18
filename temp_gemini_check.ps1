$geminiKey = (((Get-Content "c:\Users\jvsgp\Hack_2_Skill_Prompt_Wars_Main_Challenge_V_S_Sasi_Kumar_Jonnadula\backend\.env") | Where-Object { $_ -match "GEMINI_API_KEY" }) -replace ".*=","").Trim()
Write-Host "Key: $($geminiKey.Substring(0,10))..."

$resp = Invoke-RestMethod -Uri "https://generativelanguage.googleapis.com/v1beta/models?key=$geminiKey" -TimeoutSec 15 -UseBasicParsing
$resp.models | Select-Object name, displayName | Sort-Object name | ForEach-Object { Write-Host "$($_.name) — $($_.displayName)" }
