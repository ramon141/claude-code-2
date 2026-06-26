import path from 'path';
import fs from 'fs';
import {HttpErrors} from '@loopback/rest';

const ALLOWED_CLAUDE_MODELS = new Set([
  'claude-opus-4-8',
  'claude-sonnet-4-6',
  'claude-haiku-4-5-20251001',
  'claude-fable-5',
]);

const SESSION_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

export function validateClaudeModel(model: string | null | undefined): void {
  if (!model) return;
  if (!ALLOWED_CLAUDE_MODELS.has(model)) {
    throw new HttpErrors.UnprocessableEntity(`Modelo inválido: "${model}"`);
  }
}

export function validateSessionId(sessionId: string | null | undefined): void {
  if (!sessionId) return;
  if (!SESSION_ID_REGEX.test(sessionId)) {
    throw new HttpErrors.UnprocessableEntity('sessionId inválido');
  }
}

export function validateWorkingDirectory(workingDirectory: string): void {
  if (!workingDirectory || workingDirectory.includes('\0')) {
    throw new HttpErrors.UnprocessableEntity('workingDirectory inválido');
  }
  if (!path.isAbsolute(workingDirectory)) {
    throw new HttpErrors.UnprocessableEntity('workingDirectory deve ser um caminho absoluto');
  }
  const segments = workingDirectory.replace(/\\/g, '/').split('/');
  if (segments.some(s => s === '..')) {
    throw new HttpErrors.UnprocessableEntity('Path traversal não permitido em workingDirectory');
  }
}

export function validateFilePath(filePath: string, workingDirectory: string): void {
  if (filePath.includes('\0')) {
    throw new HttpErrors.UnprocessableEntity(`Caminho inválido: null byte em "${filePath}"`);
  }
  const segments = filePath.replace(/\\/g, '/').split('/');
  if (segments.some(s => s === '..')) {
    throw new HttpErrors.UnprocessableEntity(`Path traversal não permitido: "${filePath}"`);
  }
  const resolved = path.resolve(workingDirectory, filePath);
  const normalizedWorkDir = path.resolve(workingDirectory);
  if (!resolved.startsWith(normalizedWorkDir + path.sep) && resolved !== normalizedWorkDir) {
    throw new HttpErrors.UnprocessableEntity(`Arquivo fora do diretório do projeto não permitido: "${filePath}"`);
  }
  if (!fs.existsSync(resolved)) {
    throw new HttpErrors.UnprocessableEntity(`Arquivo não encontrado: "${resolved}"`);
  }
}
