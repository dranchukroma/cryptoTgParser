import dotenv from 'dotenv';
dotenv.config();

import {
    SIGNAL_HEAD_RE, ENTRY_RE, TAKE_RE, STOP_RE, LEV_RE,
    UPDATE_STOP_RE, UPDATE_MARGIN_RE, UPDATE_CLOSE_RE,
    DAILY_RE, REVIEW_HEAD_RE, TICKER_INLINE_RE
} from '../config/regexTemplates.js';

const MY_LINK = process.env.MY_LINK || ''; //Link than will be replaced

export function replaceLinks(text = '') {
    if (!text) return text;
    if (!MY_LINK) return text.replace(/\bhttps?:\/\/\S+/gi, ''); // безпека: прибрати, якщо MY_LINK не задано
    return text.replace(/\bhttps?:\/\/\S+/gi, MY_LINK);
}

function toUnixSeconds(d) {
    if (d == null) return null;
    if (typeof d === 'number') {
        // якщо мілісекунди — приведемо до секунд
        return d > 1e12 ? Math.floor(d / 1000) : d;
    }
    const dt = (typeof d === 'string') ? new Date(d) : (d.getTime ? d : new Date(d));
    return Number.isNaN(dt.getTime()) ? null : Math.floor(dt.getTime() / 1000);
}

function collectPhotos(msg) {
    const photos = [];
    if (msg.hasMedia && msg.mediaType === 'photo') {
        photos.push({ albumId: msg.albumId || null, mediaType: 'photo' });
    }
    return photos;
}

function wrapResult(type, text, msg, data = {}) {
    const dateISO = (typeof msg.date === 'string')
        ? msg.date
        : (msg.date && msg.date.toISOString ? msg.date.toISOString() : null);

    return {
        type,
        text,
        media: { photos: collectPhotos(msg) },
        meta: {
            id: msg.id,
            dateUnix: toUnixSeconds(msg.date),
            dateISO
        },
        data
    };
}

function parseSignal(text) {
    const head = text.match(SIGNAL_HEAD_RE);
    if (!head) return null;

    const ticker = head[1].toUpperCase();
    const side = head[2].toUpperCase();

    const entryM = text.match(ENTRY_RE);
    const stopM = text.match(STOP_RE);
    const levM = text.match(LEV_RE);

    // Збір усіх тейків
    const takeVals = [];
    let m;
    while ((m = TAKE_RE.exec(text)) !== null) {
        const raw = m[1];
        raw.split(',').forEach(v => {
            const num = parseFloat(v.trim());
            if (!Number.isNaN(num)) takeVals.push(num);
        });
    }

    const entry = entryM
        ? (entryM[2] ? { from: parseFloat(entryM[1]), to: parseFloat(entryM[2]) }
            : { price: parseFloat(entryM[1]) })
        : null;

    const stop = stopM ? parseFloat(stopM[1]) : null;
    const leverage = levM ? parseInt(levM[1], 10) : null;

    return {
        type: 'signal',
        ticker, side, entry, take: takeVals, stop, leverage
    };
}

function parseSignalUpdate(text) {
    const has = (re) => re.test(text);
    if (has(UPDATE_STOP_RE) || has(UPDATE_MARGIN_RE) || has(UPDATE_CLOSE_RE)) {
        return {
            type: 'signal_update',
            update: {
                moveStop: UPDATE_STOP_RE.test(text) || undefined,
                addMargin: UPDATE_MARGIN_RE.test(text) || undefined,
                closeOrFix: UPDATE_CLOSE_RE.test(text) || undefined
            }
        };
    }
    return null;
}

function parseDaily(text) {
    if (DAILY_RE.test(text)) return { type: 'daily' };
    return null;
}

function parseReview(text) {
    let m = text.match(REVIEW_HEAD_RE);
    let primary = null, timeframe = null;
    if (m) {
        primary = m[2].toUpperCase();
        timeframe = m[3]?.toLowerCase() || null;
    } else {
        const t = text.match(TICKER_INLINE_RE);
        if (!t) return null;
        primary = t[1].toUpperCase();
    }
    return { type: 'review', primary, timeframe };
}

export function classifyAndExtract(msg) {
    const rawText = (msg.text || '').trim();
    const text = replaceLinks(rawText);

    const upd = parseSignalUpdate(rawText);
    if (upd) {
        return wrapResult('signal_update', text, msg, {
            moveStop: !!upd.update.moveStop,
            addMargin: !!upd.update.addMargin,
            closeOrFix: !!upd.update.closeOrFix
        });
    }

    const sig = parseSignal(rawText);
    if (sig) {
        return wrapResult('signal', text, msg, {
            ticker: sig.ticker,
            side: sig.side,
            entry: sig.entry,
            take: sig.take,
            stop: sig.stop,
            leverage: sig.leverage
        });
    }

    const daily = parseDaily(rawText);
    if (daily) {
        return wrapResult('daily', text, msg, {});
    }

    const review = parseReview(rawText);
    if (review) {
        return wrapResult('review', text, msg, {
            primary: review.primary,
            timeframe: review.timeframe
        });
    }

    return null;
}