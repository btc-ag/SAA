// SAA Utils Module
// Shared utilities used across all SAA modules

export const IconMapper = {
    // Komponenten-Icons
    component: {
        '🖥️': 'fa-solid fa-server',
        '💻': 'fa-solid fa-microchip',
        '☸️': 'fa-solid fa-dharmachakra',
        '⚡': 'fa-solid fa-bolt',
        '🗄️': 'fa-solid fa-database',
        '📊': 'fa-solid fa-chart-simple',
        '📦': 'fa-solid fa-box',
        '💾': 'fa-solid fa-hard-drive',
        '📁': 'fa-solid fa-folder',
        '⚖️': 'fa-solid fa-scale-balanced',
        '🌐': 'fa-solid fa-globe',
        '🔗': 'fa-solid fa-link',
        '📬': 'fa-solid fa-envelope',
        '📨': 'fa-solid fa-envelope',
        '🚀': 'fa-solid fa-rocket',
        '📈': 'fa-solid fa-chart-line',
        '📋': 'fa-solid fa-clipboard-list',
        '🔐': 'fa-solid fa-lock',
        '👤': 'fa-solid fa-user',
        '🤖': 'fa-solid fa-robot',
        '🔍': 'fa-solid fa-magnifying-glass',
        '🐘': 'fa-brands fa-php',
        '🏗️': 'fa-solid fa-building',
        '☁️': 'fa-solid fa-cloud'
    },
    // Cloud Provider Kategorien
    provider: {
        '🌐': 'fa-solid fa-globe',
        '🏛️': 'fa-solid fa-landmark',
        '🇪🇺': 'fa-solid fa-flag',
        '🔒': 'fa-solid fa-lock',
        '🔄': 'fa-solid fa-rotate',
        '☁️': 'fa-solid fa-cloud'
    },
    // Utility Icons (TCO, Warnings, etc.)
    utility: {
        '💰': 'fa-solid fa-coins',
        '👥': 'fa-solid fa-users',
        '📅': 'fa-solid fa-calendar-days',
        '⚠️': 'fa-solid fa-triangle-exclamation',
        '✓': 'fa-solid fa-check',
        '⚡': 'fa-solid fa-bolt',
        '📦': 'fa-solid fa-box',
        '📊': 'fa-solid fa-chart-simple',
        '🔒': 'fa-solid fa-lock',
        'ℹ️': 'fa-solid fa-circle-info'
    },
    // Konvertiert Emoji zu Font Awesome Icon
    toFontAwesome(emoji, category = 'component') {
        const mapping = this[category];
        const iconClass = mapping[emoji] || 'fa-solid fa-cloud';
        return `<i class="${iconClass}"></i>`;
    }
};
