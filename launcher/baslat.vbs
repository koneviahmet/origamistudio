' Origami Studio — masaüstü kısayolunun çalıştırdığı dosya.
' PowerShell başlatıcısını konsol penceresi göstermeden çalıştırır.
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
Set sh = CreateObject("WScript.Shell")
sh.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & dir & "\baslat.ps1""", 0, False
