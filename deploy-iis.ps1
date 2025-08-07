<#
.SYNOPSIS
    Deploy File Upload Center to IIS

.DESCRIPTION
    This script builds and deploys the File Upload Center application to IIS.
    It handles both static export and Node.js deployment modes.

.PARAMETER Environment
    Target environment (local, dev, uat, prod). Default: prod

.PARAMETER SiteName
    IIS site name. Default: FileUploadCenter

.PARAMETER SitePath
    Physical path for IIS site. Default: C:\inetpub\wwwroot\file-upload-center

.PARAMETER Port
    IIS site port. Default: 80

.PARAMETER DeploymentMode
    Deployment mode (static, nodejs). Default: static

.PARAMETER AppPoolName
    Application pool name. Default: FileUploadCenterPool

.EXAMPLE
    .\deploy-iis.ps1 -Environment prod -SiteName "FileUploadCenter" -SitePath "C:\inetpub\wwwroot\file-upload-center"

.EXAMPLE
    .\deploy-iis.ps1 -Environment uat -DeploymentMode nodejs -Port 8080
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("local", "dev", "uat", "prod")]
    [string]$Environment = "prod",
    
    [Parameter(Mandatory=$false)]
    [string]$SiteName = "FileUploadCenter",
    
    [Parameter(Mandatory=$false)]
    [string]$SitePath = "C:\inetpub\wwwroot\file-upload-center",
    
    [Parameter(Mandatory=$false)]
    [int]$Port = 80,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("static", "nodejs")]
    [string]$DeploymentMode = "static",
    
    [Parameter(Mandatory=$false)]
    [string]$AppPoolName = "FileUploadCenterPool"
)

# Requires Administrator privileges
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script requires Administrator privileges. Please run as Administrator."
    exit 1
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "File Upload Center IIS Deployment" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Site Name: $SiteName" -ForegroundColor Yellow
Write-Host "Site Path: $SitePath" -ForegroundColor Yellow
Write-Host "Port: $Port" -ForegroundColor Yellow
Write-Host "Deployment Mode: $DeploymentMode" -ForegroundColor Yellow
Write-Host "App Pool: $AppPoolName" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green

# Check if IIS is installed
$iisFeature = Get-WindowsFeature -Name IIS-WebServerRole -ErrorAction SilentlyContinue
if ($iisFeature -eq $null -or $iisFeature.InstallState -ne "Installed") {
    Write-Error "IIS is not installed. Please install IIS before running this script."
    exit 1
}

# Import WebAdministration module
Import-Module WebAdministration -ErrorAction SilentlyContinue
if (-not (Get-Module WebAdministration)) {
    Write-Error "WebAdministration module is not available. Please ensure IIS Management Tools are installed."
    exit 1
}

try {
    # Step 1: Build the application
    Write-Host "Step 1: Building application..." -ForegroundColor Cyan
    
    if ($DeploymentMode -eq "static") {
        Write-Host "Building static export..." -ForegroundColor Yellow
        & cmd /c "build.bat $Environment static"
    } else {
        Write-Host "Building Node.js application..." -ForegroundColor Yellow
        & cmd /c "build.bat $Environment build"
    }
    
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed with exit code $LASTEXITCODE"
    }
    
    # Step 2: Create application pool
    Write-Host "Step 2: Configuring application pool..." -ForegroundColor Cyan
    
    if (Get-IISAppPool -Name $AppPoolName -ErrorAction SilentlyContinue) {
        Write-Host "Stopping existing application pool: $AppPoolName" -ForegroundColor Yellow
        Stop-WebAppPool -Name $AppPoolName -ErrorAction SilentlyContinue
        Remove-WebAppPool -Name $AppPoolName
    }
    
    Write-Host "Creating application pool: $AppPoolName" -ForegroundColor Yellow
    New-WebAppPool -Name $AppPoolName
    
    if ($DeploymentMode -eq "static") {
        Set-ItemProperty -Path "IIS:\AppPools\$AppPoolName" -Name managedRuntimeVersion -Value ""
        Set-ItemProperty -Path "IIS:\AppPools\$AppPoolName" -Name enable32BitAppOnWin64 -Value $false
    } else {
        Set-ItemProperty -Path "IIS:\AppPools\$AppPoolName" -Name managedRuntimeVersion -Value ""
        Set-ItemProperty -Path "IIS:\AppPools\$AppPoolName" -Name enable32BitAppOnWin64 -Value $false
    }
    
    Set-ItemProperty -Path "IIS:\AppPools\$AppPoolName" -Name processModel.identityType -Value ApplicationPoolIdentity
    Set-ItemProperty -Path "IIS:\AppPools\$AppPoolName" -Name recycling.periodicRestart.time -Value "00:00:00"
    
    # Step 3: Create site directory
    Write-Host "Step 3: Preparing site directory..." -ForegroundColor Cyan
    
    if (Test-Path $SitePath) {
        Write-Host "Removing existing site directory: $SitePath" -ForegroundColor Yellow
        Remove-Item -Path $SitePath -Recurse -Force
    }
    
    Write-Host "Creating site directory: $SitePath" -ForegroundColor Yellow
    New-Item -Path $SitePath -ItemType Directory -Force | Out-Null
    
    # Step 4: Copy files
    Write-Host "Step 4: Copying application files..." -ForegroundColor Cyan
    
    if ($DeploymentMode -eq "static") {
        if (-not (Test-Path "out")) {
            throw "Static build output directory 'out' not found. Build may have failed."
        }
        Write-Host "Copying static files from 'out' directory..." -ForegroundColor Yellow
        Copy-Item -Path "out\*" -Destination $SitePath -Recurse -Force
    } else {
        Write-Host "Copying Node.js application files..." -ForegroundColor Yellow
        $excludeItems = @("node_modules", ".next", "out", ".git", ".env*", "*.log")
        Get-ChildItem -Path "." | Where-Object { $_.Name -notin $excludeItems } | Copy-Item -Destination $SitePath -Recurse -Force
        
        # Copy package.json and install production dependencies
        Copy-Item -Path "package.json" -Destination $SitePath -Force
        Set-Location $SitePath
        & npm install --production
        Set-Location $PSScriptRoot
    }
    
    # Copy web.config
    if (Test-Path "web.config") {
        Write-Host "Copying web.config..." -ForegroundColor Yellow
        Copy-Item -Path "web.config" -Destination $SitePath -Force
    }
    
    # Step 5: Set permissions
    Write-Host "Step 5: Setting permissions..." -ForegroundColor Cyan
    
    $acl = Get-Acl $SitePath
    $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("IIS_IUSRS", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
    $acl.SetAccessRule($accessRule)
    $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("IUSR", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow")
    $acl.SetAccessRule($accessRule)
    Set-Acl -Path $SitePath -AclObject $acl
    
    # Step 6: Create/Update IIS site
    Write-Host "Step 6: Configuring IIS site..." -ForegroundColor Cyan
    
    if (Get-Website -Name $SiteName -ErrorAction SilentlyContinue) {
        Write-Host "Removing existing site: $SiteName" -ForegroundColor Yellow
        Remove-Website -Name $SiteName
    }
    
    Write-Host "Creating IIS site: $SiteName" -ForegroundColor Yellow
    New-Website -Name $SiteName -Port $Port -PhysicalPath $SitePath -ApplicationPool $AppPoolName
    
    # Enable Windows Authentication if needed
    Write-Host "Configuring authentication..." -ForegroundColor Yellow
    Set-WebConfigurationProperty -Filter "/system.webServer/security/authentication/windowsAuthentication" -Name enabled -Value $true -PSPath "IIS:\" -Location "$SiteName"
    Set-WebConfigurationProperty -Filter "/system.webServer/security/authentication/anonymousAuthentication" -Name enabled -Value $false -PSPath "IIS:\" -Location "$SiteName"
    
    # Start application pool and site
    Write-Host "Step 7: Starting services..." -ForegroundColor Cyan
    Start-WebAppPool -Name $AppPoolName
    Start-Website -Name $SiteName
    
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Deployment completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Site URL: http://localhost:$Port" -ForegroundColor Yellow
    Write-Host "Physical Path: $SitePath" -ForegroundColor Yellow
    Write-Host "Application Pool: $AppPoolName" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Green
    
} catch {
    Write-Error "Deployment failed: $($_.Exception.Message)"
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Deployment failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    exit 1
}