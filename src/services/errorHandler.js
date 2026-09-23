export const ErrorHandler = {
  classifyError(error) {
    if (!error) return 'unknown';
    const status = error.response?.status;
    if (status === 401) return 'unauthorized';
    if (status === 403) return 'forbidden';
    if (status >= 400 && status < 500) return 'client_error';
    if (status >= 500) return 'server_error';
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network')) return 'network_error';
    return 'unknown';
  },

  getUserFriendlyMessage(error, defaultMessage = 'Произошла ошибка') {
    const type = this.classifyError(error);
    switch (type) {
      case 'network_error': return 'Нет соединения с сервером. Проверьте интернет.';
      case 'unauthorized': return 'Сессия истекла. Войдите заново.';
      case 'forbidden': return 'Недостаточно прав.';
      case 'server_error': return 'Ошибка сервера. Попробуйте позже.';
      case 'client_error': return error.response?.data?.error || error.response?.data?.message || defaultMessage;
      default: return defaultMessage;
    }
  },

  logError(error, context = {}) {
    console.error('Error:', {
      timestamp: new Date().toISOString(),
      type: this.classifyError(error),
      message: error.message,
      status: error.response?.status,
      context
    });
  },

  shouldRetry(error) {
    const type = this.classifyError(error);
    return type === 'network_error' || type === 'server_error';
  }
};