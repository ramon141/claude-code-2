/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_BASE_API_URL: string
    // adicione mais variáveis de ambiente conforme necessário
}

interface ImportMeta {
    readonly env: ImportMetaEnv
} 