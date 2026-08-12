# 🖥️ Guia Operacional — OS Manager no Windows (Local-First & .exe)

Este guia apresenta o passo a passo definitivo para rodar, testar e gerar o instalador nativo (`.exe`) do **OS Manager** diretamente no seu computador com Windows.

---

## 🛠️ Pré-requisitos na sua máquina Windows

1. **Node.js** (versão 20 ou superior instalada).
2. **pnpm** (gerenciador de pacotes rápido). Caso não tenha, instale com:
   ```bash
   npm install -g pnpm
   ```

---

## 1️⃣ Como Rodar em Modo de Desenvolvimento (Local)

Abra o terminal (PowerShell ou CMD) na pasta do projeto clonado (`os-manager-v2`) e execute:

1. **Instalar dependências**:
   ```bash
   pnpm install
   ```

2. **Iniciar o servidor de desenvolvimento** (backend tRPC + frontend Vite):
   ```bash
   pnpm dev
   ```
   *O servidor será iniciado em `http://localhost:3000` com autenticação local pronta (`admin` / `admin`).*

3. **Abrir a janela do aplicativo Desktop (Electron)**:
   Em outra aba do terminal na mesma pasta, execute:
   ```bash
   pnpm desktop
   ```
   *O Electron irá carregar a aplicação desktop integrada com o servidor local.*

---

## 2️⃣ Como Gerar o Instalador Nativo (`.exe`) para Windows

Para compilar o código em um executável standalone ou instalador `.exe` (`.nsis`), execute:

1. **Gerar o build de produção (Vite + esbuild)**:
   ```bash
   pnpm build
   ```

2. **Empacotar com o Electron Builder**:
   ```bash
   pnpm pack:win
   ```

3. **Resultado**:
   O instalador e os arquivos compilados serão gerados na pasta `/release` dentro do diretório do projeto (ex: `OS Manager Setup 1.0.0.exe`).

---

## 🔐 Credenciais de Acesso Local
- **Usuário**: `admin`
- **Senha**: `admin`
- Funciona 100% offline, sem depender de internet ou servidores externos.
