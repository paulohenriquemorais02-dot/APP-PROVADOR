<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Provador Virtual – Execução e Deploy

Este repositório contém tudo o que você precisa para executar o app localmente e prepará-lo para GitHub e Vercel.

## Requisitos

- Node.js 18+ (recomendado o LTS mais recente)
- NPM (instalado junto com o Node.js)

## Rodar localmente

1. Instale as dependências  
   `npm install`
2. Crie o arquivo [.env.local](.env.local) e defina `GEMINI_API_KEY=...`
3. Execute em modo desenvolvimento  
   `npm run dev`
4. Gere o build de produção (opcional)  
   `npm run build && npm run preview`

## Preparar para GitHub

1. Inicialize o repositório  
   `git init`
2. Configure o usuário local (se necessário)  
   `git config user.name "Seu Nome"`  
   `git config user.email "seu@email.com"`
3. Faça o primeiro commit  
   `git add .`  
   `git commit -m "chore: inicializa projeto"`
4. Crie um repositório vazio no GitHub e adicione o remoto  
   `git remote add origin https://github.com/<usuario>/<repo>.git`
5. Envie o código  
   `git push -u origin main`

## Deploy na Vercel

1. Crie uma conta em [vercel.com](https://vercel.com) (gratuita)
2. Clique em “Add New Project” e importe o repositório do GitHub
3. Nas configurações do projeto:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Variáveis de ambiente: adicione `GEMINI_API_KEY`
4. Conclua a importação e aguarde o primeiro deploy automático
5. Para novas versões, basta `git push` na branch principal; a Vercel criará um novo deploy automaticamente

## Links úteis

- Vite Docs: https://vitejs.dev/guide/
- Vercel Docs (Vite): https://vercel.com/docs/frameworks/vite
