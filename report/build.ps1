$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
xelatex -interaction=nonstopmode -halt-on-error BaoCao_BrewLite.tex
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
xelatex -interaction=nonstopmode -halt-on-error BaoCao_BrewLite.tex
exit $LASTEXITCODE
