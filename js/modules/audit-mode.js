/**
 * Audit-Mode-State (BSI C3A): 'c1' (EU-Bezug) oder 'c2' (DE-Bezug)
 *
 * Wirkt auf alle C3A-Aggregationen. Persistiert in localStorage.
 *
 * @module audit-mode
 */

const STORAGE_KEY = 'saa-audit-mode';
let _mode = 'c1';

try {
    const stored = window.localStorage?.getItem(STORAGE_KEY);
    if (stored === 'c2' || stored === 'c1') _mode = stored;
} catch (e) { /* localStorage nicht verfügbar */ }

/**
 * Liefert den aktuellen Audit-Mode
 * @returns {'c1'|'c2'}
 */
export function getAuditMode() {
    return _mode;
}

/**
 * Setzt den Audit-Mode persistent
 * @param {'c1'|'c2'} mode
 * @returns {boolean} true, wenn der Mode tatsächlich gewechselt wurde
 */
export function setAuditMode(mode) {
    const m = (mode === 'c2') ? 'c2' : 'c1';
    if (m === _mode) return false;
    _mode = m;
    try { window.localStorage?.setItem(STORAGE_KEY, m); } catch (e) { /* ignore */ }
    return true;
}
