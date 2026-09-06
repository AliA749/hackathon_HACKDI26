<#
.SYNOPSIS
	Stops the backend and frontend started by start-dev.ps1.

.DESCRIPTION
	Matches on what is actually listening on :8080 and :5173 rather than killing
	every java.exe / node.exe on the machine - which would take out unrelated
	work (other IDEs, other projects) along with this app.
#>
$ErrorActionPreference = "SilentlyContinue"

foreach ($port in 8080, 5173) {
	$owners = Get-NetTCPConnection -LocalPort $port -State Listen |
		Select-Object -ExpandProperty OwningProcess -Unique

	if (-not $owners) {
		Write-Host "  nothing listening on :$port" -ForegroundColor DarkGray
		continue
	}

	foreach ($processId in $owners) {
		$process = Get-Process -Id $processId
		if ($process) {
			Write-Host "  stopping $($process.ProcessName) (pid $processId) on :$port" -ForegroundColor Cyan
			# Vite runs under a cmd.exe wrapper, so kill the tree, not just the
			# process that happens to hold the socket.
			taskkill /PID $processId /T /F | Out-Null
		}
	}
}

Write-Host "  stopped" -ForegroundColor Green
