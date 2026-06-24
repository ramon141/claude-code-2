import {repository} from '@loopback/repository';
import {HttpErrors, get, response} from '@loopback/rest';
import {decryptValue} from '../authentication/auth.utils';
import {ClaudeCodeApiKeyRepository} from '../repositories';

type ClaudeTokenResponse = {claudeOAuthToken: string};

export class AuthController {
  constructor(
    @repository(ClaudeCodeApiKeyRepository)
    private claudeCodeApiKeyRepository: ClaudeCodeApiKeyRepository,
  ) {}

  @get('/auth/claude-token')
  @response(200, {
    description: 'Retorna o Claude OAuth token ativo',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {claudeOAuthToken: {type: 'string'}},
        },
      },
    },
  })
  async getClaudeToken(): Promise<ClaudeTokenResponse> {
    const apiKey = await this.claudeCodeApiKeyRepository.findOne({
      where: {isActive: true},
      order: ['createdAt DESC'],
    });

    if (!apiKey) {
      throw new HttpErrors.UnprocessableEntity('Nenhuma Claude Code API key ativa configurada');
    }

    return {claudeOAuthToken: decryptValue(apiKey.keyValue)};
  }
}
