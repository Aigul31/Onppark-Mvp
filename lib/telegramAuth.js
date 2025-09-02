const crypto = require('crypto');

/**
 * Верификация Telegram Web App initData
 * Проверяет подлинность данных от Telegram Mini App
 */
function verifyTelegramInitData(initData, botToken) {
  if (!initData || !botToken) {
    return { success: false, error: 'Missing initData or bot token' };
  }

  try {
    // Парсим URL-encoded данные
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    
    if (!hash) {
      return { success: false, error: 'Missing hash in initData' };
    }

    // Удаляем hash из параметров для создания data-check-string
    params.delete('hash');
    
    // Сортируем параметры и создаем data-check-string
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Создаем secret key из bot token
    const secretKey = crypto
      .createHash('sha256')
      .update(botToken)
      .digest();

    // Создаем HMAC от data-check-string
    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Проверяем соответствие hash'ей
    if (computedHash !== hash) {
      return { success: false, error: 'Invalid hash - data may be tampered' };
    }

    // Парсим user данные
    const userJson = params.get('user');
    if (!userJson) {
      return { success: false, error: 'Missing user data' };
    }

    const user = JSON.parse(userJson);
    
    // Проверяем время действия (опционально)
    const authDate = parseInt(params.get('auth_date'));
    if (authDate) {
      const currentTime = Math.floor(Date.now() / 1000);
      const timeDiff = currentTime - authDate;
      
      // Данные действительны 24 часа
      if (timeDiff > 86400) {
        return { success: false, error: 'initData expired' };
      }
    }

    return { 
      success: true, 
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        photo_url: user.photo_url,
        language_code: user.language_code
      },
      auth_date: authDate
    };

  } catch (error) {
    return { success: false, error: `Verification failed: ${error.message}` };
  }
}

/**
 * Создает user_key для пользователя Telegram
 */
function createTelegramUserKey(telegramUserId) {
  return `tg:${telegramUserId}`;
}

/**
 * Извлекает Telegram ID из user_key
 */
function extractTelegramId(userKey) {
  if (!userKey || !userKey.startsWith('tg:')) {
    return null;
  }
  return userKey.substring(3);
}

module.exports = {
  verifyTelegramInitData,
  createTelegramUserKey,
  extractTelegramId
};