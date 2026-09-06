<#
.SYNOPSIS
	Starts the whole Ummah Local NJ stack and opens it in a browser.

.DESCRIPTION
	One command, no prerequisites beyond Java 21 and Node. No Docker daemon, no
	Postgres server, no environment variables - the backend defaults to a
	file-backed H2 database under muslim-local-nj/data.

	Speed comes from running a prebuilt jar rather than `mvnw spring-boot:run`,
	which pays for Maven's full resolve/compile lifecycle on every launch. The
	jar is rebuilt automatically whenever a source file is newer than it, so
	"prebuilt" never means "stale".

.PARAMETER Db
	H2 database file to use, without extension. Defaults to the shared
	./data/muslim-local-nj. Point teammates at their own to avoid clobbering
	each other, e.g. -Db ./data/vertwo

.PARAMETER Rebuild
	Force a clean rebuild of the backend jar even if it looks current.

.PARAMETER NoBrowser
	Start both servers but don't open a browser tab.

.EXAMPLE
	.\start-dev.ps1
	.\start-dev.ps1 -Db ./data/vertwo
	.\start-dev.ps1 -Rebuild -NoBrowser
#>
param(
	[string]$Db = "./data/muslim-local-nj",
	[switch]$Rebuild,
	[switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$backendDir = Join-Path $root "muslim-local-nj"
$frontendDir = Join-Path $root "frontend"
$jar = Join-Path $backendDir "target\muslim-local-nj-0.0.1-SNAPSHOT.jar"
# Spring Boot's `jarmode=tools extract` layout: the same application, but with
# dependencies as real jars on a flat classpath instead of nested inside the fat
# jar. Measured on this project at ~6.6 s to first response vs ~7.7 s for the
# fat jar, consistently over 5 runs each.
#
# CDS (-XX:ArchiveClassesAtExit) was measured too and rejected: it saved a
# further 0.65 s but cost a 21 s training run on every rebuild and a 93 MB
# archive that silently invalidates when the classpath or JDK changes.
$runJar = Join-Path $backendDir "target\extracted\muslim-local-nj-0.0.1-SNAPSHOT.jar"
$logDir = Join-Path $root ".dev-logs"
$started = [Diagnostics.Stopwatch]::StartNew()

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Write-Step($message) {
	Write-Host "  $message" -ForegroundColor Cyan
}

# Fail early with an actionable message rather than a stack trace 40 seconds in.
foreach ($tool in @("java", "npm")) {
	if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
		throw "$tool is not on PATH. Java 21+ and Node 18+ are both required."
	}
}

# --- Backend jar ------------------------------------------------------------
# Rebuild only when something actually changed. A no-op launch should not pay
# for a Maven run at all.
$needsBuild = $Rebuild -or -not (Test-Path $jar) -or -not (Test-Path $runJar)
if (-not $needsBuild) {
	$jarTime = (Get-Item $jar).LastWriteTimeUtc
	# src/main only, not src/test: the jar is packaged with -DskipTests, so a
	# test-only edit cannot change it and must not force a rebuild.
	$newestSource = Get-ChildItem -Path (Join-Path $backendDir "src\main"), (Join-Path $backendDir "pom.xml") -Recurse -File |
		Sort-Object LastWriteTimeUtc -Descending |
		Select-Object -First 1
	if ($newestSource -and $newestSource.LastWriteTimeUtc -gt $jarTime) {
		Write-Step "Sources changed since last build ($($newestSource.Name))"
		$needsBuild = $true
	}
}

if ($needsBuild) {
	Write-Step "Building backend jar..."
	Push-Location $backendDir
	try {
		# -o (offline) skips remote repository metadata checks, which are pure
		# latency once the local ~/.m2 cache is warm.
		.\mvnw.cmd -o -q package -DskipTests
		if ($LASTEXITCODE -ne 0) { throw "Backend build failed. Re-run without -q for details." }

		# Re-extract from scratch. --force overwrites in place, but a stale lib/
		# from an older build would otherwise linger on the classpath.
		Remove-Item (Join-Path $backendDir "target\extracted") -Recurse -Force -ErrorAction SilentlyContinue
		java -Djarmode=tools -jar $jar extract --destination target/extracted | Out-Null
		if (-not (Test-Path $runJar)) { throw "Extracting the runnable layout failed." }
	}
	finally { Pop-Location }
}
else {
	Write-Step "Backend jar is current, skipping build"
}

# --- Frontend deps ----------------------------------------------------------
if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
	Write-Step "Installing frontend dependencies..."
	Push-Location $frontendDir
	try {
		npm install --no-audit --no-fund
		if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
	}
	finally { Pop-Location }
}

# --- Launch -----------------------------------------------------------------
Write-Step "Starting backend on :8080 (H2 at $Db)"
$backend = Start-Process -FilePath "java" -PassThru -WindowStyle Hidden `
	-WorkingDirectory $backendDir `
	-ArgumentList @(
		# Tiered compilation stops at C1: slower peak throughput, noticeably
		# faster startup. Correct tradeoff for a process restarted all day.
		"-XX:TieredStopAtLevel=1",
		"-Dspring.datasource.url=jdbc:h2:file:$Db;AUTO_SERVER=TRUE",
		"-jar", $runJar
	) `
	-RedirectStandardOutput (Join-Path $logDir "backend.log") `
	-RedirectStandardError (Join-Path $logDir "backend.err.log")

Write-Step "Starting frontend on :5173"
$frontend = Start-Process -FilePath "cmd.exe" -PassThru -WindowStyle Hidden `
	-WorkingDirectory $frontendDir `
	-ArgumentList "/c", "npm run dev" `
	-RedirectStandardOutput (Join-Path $logDir "frontend.log") `
	-RedirectStandardError (Join-Path $logDir "frontend.err.log")

function Wait-For($url, $name, $timeoutSeconds = 90) {
	$deadline = (Get-Date).AddSeconds($timeoutSeconds)
	while ((Get-Date) -lt $deadline) {
		try {
			Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2 | Out-Null
			return $true
		}
		catch { Start-Sleep -Milliseconds 250 }
	}
	Write-Host "  $name did not respond within $timeoutSeconds s - see $logDir" -ForegroundColor Red
	return $false
}

$backendUp = Wait-For "http://localhost:8080/api/listings" "Backend"
$frontendUp = Wait-For "http://localhost:5173/" "Frontend"

$started.Stop()
$seconds = [math]::Round($started.Elapsed.TotalSeconds, 1)

if ($backendUp -and $frontendUp) {
	Write-Host ""
	Write-Host "  Ready in $seconds s  ->  http://localhost:5173/" -ForegroundColor Green
	Write-Host "  backend pid $($backend.Id) | frontend pid $($frontend.Id)" -ForegroundColor DarkGray
	Write-Host "  stop with: .\stop-dev.ps1" -ForegroundColor DarkGray
	Write-Host ""
	if (-not $NoBrowser) {
		Start-Process "http://localhost:5173/"
	}
}
else {
	Write-Host "  Startup failed after $seconds s. Logs: $logDir" -ForegroundColor Red
	exit 1
}
