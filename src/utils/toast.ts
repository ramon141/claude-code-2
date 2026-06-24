// Arquivo temporário para manter compatibilidade
// TODO: Migrar outros módulos para usar LoadingContext

export const toastPromisse = (
    promise: Promise<any>,
    _options: {
        pending?: string;
        success?: string | ((data: any) => string);
        error?: string | ((error: any) => string);
    }
) => {
    console.warn('toastPromisse está deprecated. Use LoadingContext em vez disso.');
    return promise;
}; 