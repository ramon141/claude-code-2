// Efeito de import: aplica o app-config.json ao process.env ANTES de qualquer
// módulo que dependa das variáveis (datasource, services). Deve ser o primeiro
// import com efeito colateral no index.ts.
import {applyConfigToEnv, readConfig} from './app-config';

applyConfigToEnv(readConfig());
