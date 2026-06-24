export function toFloat(value: any): number {
  if (isFinite(value) && !isNaN(value) && typeof value === 'number') return value;

  if (!value || !value?.replace) return 0;

  //Remove letras ou caracteres especiais, exceto ponto e virgula
  value = value.replace(/[^0-9,-.]/g, '');

  // Se possui pontos e vírgula, considera o formato brasileiro (ex: 12.345.679,12)
  if (value.includes('.') && value.includes(',')) {
    // Remove todos os pontos e substitui a vírgula por ponto
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
  }

  return parseFloat(value.replace(',', '.'));
}

export function fromFloat(value: number | null | undefined, withPrefix: boolean = false): string {
  if (!value) return withPrefix ? 'R$ 0,00' : '0,00';
  if (typeof value !== 'number') return withPrefix ? 'R$ 0,00' : '0,00';

  const formattedValue = value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return withPrefix ? `R$ ${formattedValue}` : formattedValue;
}
