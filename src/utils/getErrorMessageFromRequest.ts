export const getErrorMessageFromRequest = (
  data: any,
  defaultMessage: string = 'O sistema apresentou um erro ao realizar a ação'
): string => {
  console.error(data);
  return data.response?.data?.error?.message || defaultMessage;
};
