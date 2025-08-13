export const SIGNAL_HEAD_RE = /\b([A-Z]{2,10})\s+(LONG|SHORT)\b(?:\s*\(LIMIT\))?/i;
export const ENTRY_RE = /Entry\s*:\s*([0-9]+(?:\.[0-9]+)?)(?:\s*[-–]\s*([0-9]+(?:\.[0-9]+)?))?/i;
export const TAKE_RE = /(?:Take|TP)\s*:\s*([0-9]+(?:\.[0-9]+)?(?:\s*,\s*[0-9]+(?:\.[0-9]+)?)?)/ig; // збираємо всі входження
export const STOP_RE = /(?:Stop|SL)\s*:\s*([0-9]+(?:\.[0-9]+)?)/i;
export const LEV_RE = /\bX\s?([0-9]{1,3})\b/i;

export const UPDATE_STOP_RE = /перен(ос|іс).*стоп|стоп.*в бу|переставил.*стоп|stop.*(move|to)/i;
export const UPDATE_MARGIN_RE = /добав(ил|ляю).*марж|усил(ил|ение)|margin/i;
export const UPDATE_CLOSE_RE = /фикс(ирую|ируем)|частичн|закрыл|закрыли|close|tp hit/i;

export const DAILY_RE = /добро(е|го)\s+утро|добр(ый|ого)\s+день|анализирую\s+рынок|итоги\s+дня|сегодня\s|оновлення|апдейт/i;

export const REVIEW_HEAD_RE = /\b(обзор|анализ)\b.*\b([A-Z]{2,10})\b(?:.*\b(1m|5m|15m|1h|4h|1d)\b)?/i;
export const TICKER_INLINE_RE = /\b(BTC|ETH|SOL|XRP|DOT|BNB|ADA|OP|ARB|WIF|PEPE|XLM|TON|DOGE|LINK)\b/i;
