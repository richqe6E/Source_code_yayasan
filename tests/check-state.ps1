$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua3hyYm1uZ212ZW94aXBvaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTQ5NTMsImV4cCI6MjEwNDQ5MDk1M30.S10JzbSvvEStbEJl4DFVBYniyoQkG6q7_PGg3cJI9Yo"
$headers = @{
    "apikey" = $apiKey
    "Authorization" = "Bearer $apiKey"
}

Write-Host "=== SUPABASE STATE CHECK ===" -ForegroundColor Cyan

$teachers = Invoke-RestMethod -Uri "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/teachers?select=*" -Headers $headers -Method Get
Write-Host "Teachers count: $($teachers.Count)"
$teachers | Format-Table id, full_name, nip, status

$classes = Invoke-RestMethod -Uri "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/classes?select=*" -Headers $headers -Method Get
Write-Host "Classes count: $($classes.Count)"
$classes | Format-Table id, name, level, teacher_name

$students = Invoke-RestMethod -Uri "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/students?select=*" -Headers $headers -Method Get
Write-Host "Students count: $($students.Count)"
$students | Format-Table id, nis, full_name, class_name, status

$users = Invoke-RestMethod -Uri "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/users?role=eq.siswa_aktif&select=*" -Headers $headers -Method Get
Write-Host "Siswa Aktif users count: $($users.Count)"
$users | Format-Table id, nis, full_name, role, status

$invoices = Invoke-RestMethod -Uri "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/invoices?select=*" -Headers $headers -Method Get
Write-Host "Invoices count: $($invoices.Count)"
$invoices | Format-Table id, invoice_number, student_name, month, amount, status

$ppdb = Invoke-RestMethod -Uri "https://hnkxrbmngmveoxipohtk.supabase.co/rest/v1/ppdb_registrations?select=id,registration_number,full_name,status,level" -Headers $headers -Method Get
Write-Host "PPDB Registrations count: $($ppdb.Count)"
$ppdb | Format-Table id, registration_number, full_name, status, level

