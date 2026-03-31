param(
    [string]$ResourceGroup = "rg-azure-openai-eastus",
    [string]$AccountName = "leodyveraoai031126",
    [string]$DeploymentName = "gpt-5-mini",
    [string]$ApiVersion = "2024-10-21"
)

$ErrorActionPreference = "Stop"

function Get-AzureCliValue {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command
    )

    $value = Invoke-Expression $Command
    if (-not $value) {
        throw "Command returned an empty value: $Command"
    }

    return $value.Trim()
}

$null = az account show --output none

$deploymentExists = az cognitiveservices account deployment show `
    --resource-group $ResourceGroup `
    --name $AccountName `
    --deployment-name $DeploymentName `
    --query name `
    --output tsv

if (-not $deploymentExists) {
    throw "Deployment '$DeploymentName' was not found in account '$AccountName'."
}

$env:AZURE_OPENAI_ENDPOINT = Get-AzureCliValue "az cognitiveservices account show --resource-group $ResourceGroup --name $AccountName --query properties.endpoint --output tsv"
$env:AZURE_OPENAI_API_KEY = Get-AzureCliValue "az cognitiveservices account keys list --resource-group $ResourceGroup --name $AccountName --query key1 --output tsv"
$env:AZURE_OPENAI_API_VERSION = $ApiVersion
$env:AZURE_OPENAI_DEPLOYMENT = $DeploymentName

Write-Host "Using Azure OpenAI account: $AccountName" -ForegroundColor Cyan
Write-Host "Resource group: $ResourceGroup" -ForegroundColor Cyan
Write-Host "Deployment: $DeploymentName" -ForegroundColor Cyan
Write-Host "Endpoint: $($env:AZURE_OPENAI_ENDPOINT)" -ForegroundColor Cyan
Write-Host "API version: $ApiVersion" -ForegroundColor Cyan

npm run dev:all
