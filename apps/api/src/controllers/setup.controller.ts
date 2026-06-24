import {HttpErrors, SchemaObject, get, post, requestBody, response} from '@loopback/rest';
import {ensureWebhookSecret, readConfig, writeConfig} from '../config/app-config';
import {runMigrations, testDatabaseConnection} from '../config/database-setup';
import {getNgrokUrl} from '../config/ngrok';
import {registerEvolutionWebhook} from '../config/evolution-webhook';
import {
  AppConfigView,
  ClaudeSetupBody,
  DatabaseSetupBody,
  EvolutionSetupBody,
  NgrokToggleBody,
  NgrokWebhookBody,
  NgrokWebhookResult,
  SetupStatus,
  WebsocketSetupBody,
  appConfigViewSchema,
  claudeSetupSchema,
  completeResultSchema,
  databaseResultSchema,
  databaseSetupSchema,
  evolutionSetupSchema,
  ngrokToggleSchema,
  ngrokWebhookResultSchema,
  ngrokWebhookSchema,
  setupStatusSchema,
  successResultSchema,
  websocketSetupSchema,
} from './setup.schemas';

const CONTENT_JSON = 'application/json';
const OK = 200;
const WEBHOOK_PATH = '/webhook/evolution';

function okSpec(description: string, schema: SchemaObject) {
  return {description, content: {[CONTENT_JSON]: {schema}}};
}

function jsonBody(schema: SchemaObject) {
  return {content: {[CONTENT_JSON]: {schema}}};
}

export class SetupController {
  @get('/setup/status')
  @response(OK, okSpec('Estado do setup', setupStatusSchema))
  status(): SetupStatus {
    const cfg = readConfig();
    return {
      databaseConfigured: cfg.databaseUrl.length > 0,
      claudeConfigured: cfg.claudeCommand.length > 0,
      evolutionConfigured: cfg.evolution.url.length > 0,
      completed: cfg.setupCompleted,
    };
  }

  @get('/setup/config')
  @response(OK, okSpec('Configuração atual', appConfigViewSchema))
  config(): AppConfigView {
    const cfg = readConfig();
    return {
      databaseUrl: cfg.databaseUrl,
      claudeCommand: cfg.claudeCommand,
      timeout: cfg.timeout,
      evolutionUrl: cfg.evolution.url,
      evolutionToken: cfg.evolution.token,
      evolutionInstanceName: cfg.evolution.instanceName,
      websocketAllowedOrigins: cfg.websocketAllowedOrigins,
      ngrokEnabled: cfg.ngrokEnabled,
    };
  }

  @post('/setup/database')
  @response(OK, okSpec('Banco configurado', databaseResultSchema))
  async configureDatabase(
    @requestBody(jsonBody(databaseSetupSchema)) body: DatabaseSetupBody,
  ): Promise<{success: boolean; migrated: boolean}> {
    const url = body.databaseUrl.trim();
    if (url.length === 0) throw new HttpErrors.BadRequest('Database URL obrigatória');

    const test = await testDatabaseConnection(url);
    if (!test.ok) {
      throw new HttpErrors.BadRequest(`Conexão falhou: ${test.error ?? 'credenciais inválidas'}`);
    }

    const migrate = await runMigrations(url);
    if (!migrate.ok) {
      throw new HttpErrors.BadRequest(`Migrations falharam: ${migrate.error ?? 'erro desconhecido'}`);
    }

    writeConfig({databaseUrl: url});
    return {success: true, migrated: true};
  }

  @post('/setup/claude')
  @response(OK, okSpec('Claude configurado', successResultSchema))
  configureClaude(
    @requestBody(jsonBody(claudeSetupSchema)) body: ClaudeSetupBody,
  ): {success: boolean} {
    const command = body.claudeCommand.trim();
    if (command.length === 0) throw new HttpErrors.BadRequest('CLAUDE_COMMAND obrigatório');
    if (body.timeout <= 0) throw new HttpErrors.BadRequest('TIMEOUT deve ser maior que zero');
    writeConfig({claudeCommand: command, timeout: body.timeout});
    return {success: true};
  }

  @post('/setup/evolution')
  @response(OK, okSpec('Evolution configurado', successResultSchema))
  configureEvolution(
    @requestBody(jsonBody(evolutionSetupSchema)) body: EvolutionSetupBody,
  ): {success: boolean} {
    writeConfig({
      evolution: {url: body.url, token: body.token, instanceName: body.instanceName},
    });
    return {success: true};
  }

  @post('/setup/websocket')
  @response(OK, okSpec('Origens WebSocket salvas', successResultSchema))
  configureWebsocket(
    @requestBody(jsonBody(websocketSetupSchema)) body: WebsocketSetupBody,
  ): {success: boolean} {
    const origins = body.origins.map(o => o.trim()).filter(o => o.length > 0);
    if (origins.length === 0) {
      throw new HttpErrors.BadRequest('Informe ao menos uma origem permitida');
    }
    writeConfig({websocketAllowedOrigins: origins});
    return {success: true};
  }

  @post('/setup/ngrok')
  @response(OK, okSpec('Túnel ngrok atualizado', successResultSchema))
  toggleNgrok(
    @requestBody(jsonBody(ngrokToggleSchema)) body: NgrokToggleBody,
  ): {success: boolean} {
    writeConfig({ngrokEnabled: body.enabled});
    return {success: true};
  }

  @post('/setup/restart')
  @response(OK, okSpec('Reinício agendado', successResultSchema))
  restart(): {success: boolean} {
    scheduleRestart();
    return {success: true};
  }

  @post('/setup/webhook/ngrok')
  @response(OK, okSpec('Webhook ngrok gerado e registrado', ngrokWebhookResultSchema))
  async generateNgrokWebhook(
    @requestBody(jsonBody(ngrokWebhookSchema)) body: NgrokWebhookBody,
  ): Promise<NgrokWebhookResult> {
    const publicUrl = await this.resolveNgrokUrl();
    const secret = ensureWebhookSecret();
    const webhookUrl = `${publicUrl}${WEBHOOK_PATH}?token=${encodeURIComponent(secret)}`;

    const result = await registerEvolutionWebhook({
      baseUrl: body.url,
      token: body.token,
      instanceName: body.instanceName,
      webhookUrl,
    });
    if (!result.ok) {
      throw new HttpErrors.BadRequest(`Falha ao registrar webhook: ${result.error ?? 'erro desconhecido'}`);
    }
    return {webhookUrl};
  }

  private async resolveNgrokUrl(): Promise<string> {
    const url = await getNgrokUrl().catch(() => null);
    if (!url) {
      throw new HttpErrors.BadRequest('ngrok não está ativo. Verifique se o túnel subiu (authtoken configurado).');
    }
    return url;
  }

  @post('/setup/complete')
  @response(OK, okSpec('Setup finalizado', completeResultSchema))
  complete(): {completed: boolean} {
    const cfg = readConfig();
    if (cfg.databaseUrl.length === 0) {
      throw new HttpErrors.BadRequest('Configure o banco de dados antes de finalizar');
    }
    writeConfig({setupCompleted: true});
    scheduleRestart();
    return {completed: true};
  }
}

const RESTART_DELAY_MS = 500;

function scheduleRestart(): void {
  setTimeout(() => process.exit(0), RESTART_DELAY_MS);
}
