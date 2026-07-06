# Instalação macOS

## Download

1. Baixe a versão mais recente em: https://github.com/ramon141/claude-code-2/releases
2. Procure por `Claude.Code.Desktop_aarch64.app.tar.gz`

## Instalação

```bash
# Extrair
tar -xzf Claude.Code.Desktop_aarch64.app.tar.gz

# Copiar para Applications
cp -r "Claude Code Desktop.app" /Applications/

# Remover quarantine (macOS vai bloquear senão)
xattr -d com.apple.quarantine /Applications/"Claude Code Desktop.app"

# Abrir
open /Applications/"Claude Code Desktop.app"
```

## Se aparecer erro "danificado"

Execute:

```bash
codesign --remove-signature /Applications/"Claude Code Desktop.app" 2>/dev/null || true
codesign -s - /Applications/"Claude Code Desktop.app" -f
open /Applications/"Claude Code Desktop.app"
```

---

**Nota:** O CI/CD tenta assinar automaticamente, mas macOS bloqueia assinaturas ad-hoc. A solução manual acima sempre funciona.
