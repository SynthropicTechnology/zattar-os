# =============================================================================
# Script PowerShell para Build e Push Docker
# =============================================================================

Write-Host "🐳 Docker Build e Push" -ForegroundColor Cyan
Write-Host "=" * 50

# Carregar variáveis do .env.build
$envFile = "$PSScriptRoot\.env.build"

if (!(Test-Path $envFile)) {
    Write-Host "❌ Arquivo .env.build não encontrado em $envFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "Crie o arquivo scripts\.env.build com:" -ForegroundColor Yellow
    Write-Host "NEXT_PUBLIC_SUPABASE_URL=https://..."
    Write-Host "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=..."
    exit 1
}

Write-Host "✓ Carregando variáveis de $envFile" -ForegroundColor Green

# Carregar variáveis
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
}

# Verificar variáveis obrigatórias
$required = @(
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY'
)

$missing = @()
foreach ($var in $required) {
    if ([string]::IsNullOrEmpty([Environment]::GetEnvironmentVariable($var))) {
        $missing += $var
    }
}

if ($missing.Count -gt 0) {
    Write-Host "❌ Variáveis obrigatórias faltando:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "  - $_" }
    exit 1
}

Write-Host "✓ Variáveis obrigatórias configuradas" -ForegroundColor Green
Write-Host ""

# Configurações
$IMAGE_NAME = "synthropictec/zattar-os"
$PLATFORM = "linux/amd64"
$TAG_LATEST = "${IMAGE_NAME}:latest"

# Construir argumentos de build
$buildArgs = @(
    "--build-arg", "NEXT_PUBLIC_SUPABASE_URL=$env:NEXT_PUBLIC_SUPABASE_URL",
    "--build-arg", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY"
)

Write-Host ""
Write-Host "🔨 Iniciando build..." -ForegroundColor Cyan
Write-Host "   Imagem: $TAG_LATEST" -ForegroundColor Gray
Write-Host "   Plataforma: $PLATFORM" -ForegroundColor Gray
Write-Host ""

# Executar build
docker buildx build `
    --platform $PLATFORM `
    --no-cache `
    -t $TAG_LATEST `
    @buildArgs `
    .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green
Write-Host ""

# Perguntar se deseja fazer push
$response = Read-Host "Deseja fazer push para Docker Hub? (y/n)"

if ($response -match '^[Yy]') {
    Write-Host ""
    Write-Host "📤 Fazendo push para Docker Hub..." -ForegroundColor Cyan
    
    docker push $TAG_LATEST
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Push concluído com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Próximos passos:" -ForegroundColor Cyan
        Write-Host "1. Acesse o CapRover"
        Write-Host "2. Configure as variáveis runtime (SUPABASE_SECRET_KEY, etc.)"
        Write-Host "3. Faça deploy da imagem $TAG_LATEST"
    } else {
        Write-Host "❌ Erro ao fazer push" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "ℹ️  Build concluído. Push cancelado pelo usuário." -ForegroundColor Yellow
}
