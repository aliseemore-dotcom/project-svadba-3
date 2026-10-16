/**
 * Приём заявок для сайта на GitHub Pages: Google Apps Script → Google Таблица (+ Telegram по желанию).
 * Инструкция: docs/GITHUB_PAGES.md
 *
 * Свойства скрипта (Project Settings → Script properties):
 *   SHEET_ID           — id таблицы (из ссылки между /d/ и /edit). Обязательно.
 *   TELEGRAM_BOT_TOKEN — необязательно
 *   TELEGRAM_CHAT_ID   — необязательно
 *   PRIVACY_VERSION    — версия текста политики, фиксируется вместе с согласием (например draft-0)
 */

var SHEET_NAME = 'Заявки';
var HEADERS = ['createdAt', 'name', 'contactMethod', 'contact', 'weddingPlan', 'consentPrivacy', 'privacyVersion', 'utm', 'pageUrl', 'requestId', 'telegram'];
var RATE_LIMIT_PER_HOUR = 60; // общий потолок на случай спама (у Apps Script нет IP посетителя)

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(v, max) {
  if (typeof v !== 'string') return '';
  return v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function doGet() {
  return json_({ ok: false, error: 'method_not_allowed' });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return json_({ ok: false, error: 'busy' });
  }
  try {
    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (err) {
      return json_({ ok: false, error: 'bad_request' });
    }

    // Ловушка для ботов
    if (clean_(body.website, 200)) return json_({ ok: true });

    var props = PropertiesService.getScriptProperties();
    var cache = CacheService.getScriptCache();

    // Общий лимит заявок в час
    var hour = Utilities.formatDate(new Date(), 'UTC', 'yyyyMMddHH');
    var count = Number(cache.get('rl_' + hour) || 0);
    if (count >= RATE_LIMIT_PER_HOUR) return json_({ ok: false, error: 'rate_limited' });

    // Проверка полей
    var errors = {};
    var name = clean_(body.name, 101);
    if (!name) errors.name = 'Укажите имя';
    else if (name.length > 100) errors.name = 'Имя слишком длинное';

    var method = body.contactMethod === 'telegram' ? 'telegram' : 'phone';
    var raw = typeof body.contact === 'string' ? body.contact.trim() : '';
    var contact = '';
    if (!raw) {
      errors.contact = 'Укажите контакт для связи';
    } else if (method === 'phone') {
      var digits = raw.replace(/\D/g, '');
      if (!/^[+\d\s().-]+$/.test(raw) || digits.length < 10 || digits.length > 15) errors.contact = 'Проверьте номер телефона';
      else contact = '+' + digits;
    } else {
      var tg = raw.replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '').replace(/^@/, '');
      if (!/^[A-Za-z0-9_]{5,32}$/.test(tg)) errors.contact = 'Проверьте Telegram: @username (латиница, цифры, _; от 5 знаков)';
      else contact = '@' + tg;
    }

    var plan = '';
    if (body.weddingPlan) {
      if (['yes', 'choosing_date', 'other'].indexOf(body.weddingPlan) === -1) errors.weddingPlan = 'Выберите один из вариантов';
      else plan = body.weddingPlan;
    }
    if (body.consentPrivacy !== true) errors.consentPrivacy = 'Без согласия на обработку данных отправить заявку нельзя';

    if (Object.keys(errors).length) return json_({ ok: false, error: 'validation', errors: errors });

    // Идемпотентность: повтор с тем же id не создаёт дубль
    var requestId = clean_(body.clientRequestId, 64);
    if (requestId && cache.get('req_' + requestId)) return json_({ ok: true });

    var sheetId = props.getProperty('SHEET_ID');
    if (!sheetId) return json_({ ok: false, error: 'not_configured' });
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);

    var utm = [];
    var allowed = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    for (var i = 0; i < allowed.length; i++) {
      var v = body.utm && clean_(body.utm[allowed[i]], 200);
      if (v) utm.push(allowed[i] + '=' + v);
    }

    var row = [
      new Date().toISOString(), name, method, "'" + contact, plan, 'да',
      props.getProperty('PRIVACY_VERSION') || 'draft-0',
      utm.join(', '), clean_(body.pageUrl, 300), requestId, ''
    ];
    sheet.appendRow(row);
    var rowIndex = sheet.getLastRow();
    // Строка в таблице уже есть. Дальше сообщаем об успехе, даже если Telegram недоступен.
    if (requestId) cache.put('req_' + requestId, '1', 21600);
    cache.put('rl_' + hour, String(count + 1), 3600);

    var token = props.getProperty('TELEGRAM_BOT_TOKEN');
    var chat = props.getProperty('TELEGRAM_CHAT_ID');
    var tgStatus = 'не настроен';
    if (token && chat) {
      try {
        var text = 'Новая заявка: Проект: Свадьба 3\nИмя: ' + name + '\n' + (method === 'phone' ? 'Телефон' : 'Telegram') + ': ' + contact +
          '\nСвадьба в 2027: ' + (plan || 'не указано');
        var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
          method: 'post', contentType: 'application/json', muteHttpExceptions: true,
          payload: JSON.stringify({ chat_id: chat, text: text })
        });
        tgStatus = res.getResponseCode() === 200 ? 'доставлено' : 'ошибка ' + res.getResponseCode();
      } catch (err) {
        tgStatus = 'ошибка';
      }
    }
    sheet.getRange(rowIndex, HEADERS.length).setValue(tgStatus);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'server_error' });
  } finally {
    lock.releaseLock();
  }
}
