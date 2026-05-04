/**
 * results-compute — Pure Functions für die Render-Schicht.
 * Keine DOM-Zugriffe. Eingabe: Result-Daten. Ausgabe: berechnete Werte
 * oder reine String-/Markdown-Transformationen.
 *
 * @module modules/results-compute
 */

/**
 * Generische Service-Namen für bessere Lesbarkeit der Empfehlungstexte.
 * Wird von formatPortfolioRecommendationText verwendet.
 */
export const GENERIC_SERVICE_NAMES = {
    'database_sql': 'SQL Datenbank', 'database_nosql': 'NoSQL Datenbank',
    'compute': 'Compute', 'kubernetes': 'Kubernetes', 'serverless': 'Serverless',
    'storage_object': 'Object Storage', 'storage_block': 'Block Storage', 'storage_file': 'File Storage',
    'loadbalancer': 'Load Balancer', 'cdn': 'CDN', 'dns': 'DNS',
    'messaging': 'Messaging', 'cache': 'Cache', 'container_registry': 'Container Registry',
    'secrets': 'Secrets Management', 'monitoring': 'Monitoring', 'logging': 'Logging',
    'ai_ml': 'AI/ML', 'identity': 'Identity Management'
};

/**
 * Provider-Kategorie-Namen — zentrale Quelle für die Render-Schicht.
 */
export const PROVIDER_CATEGORY_NAMES = {
    hyperscaler: 'Hyperscaler',
    sovereign: 'Souveräne Cloud',
    eu: 'EU-Anbieter',
    private: 'Private Cloud',
    hybrid: 'Hybrid-Lösung'
};

/**
 * Berechnet die Verbrauchskosten-Aufschlüsselung aus tco.consumption.details.
 * Liefert Items für das TCO-Overview-Breakdown plus Summe.
 *
 * @param {Object} tco - tcoEstimate-Objekt mit { consumption: { details: [...] } }
 * @returns {{ items: Array<{text: string, cost: number}>, sum: number }}
 */
export function computeTcoConsumptionBreakdown(tco) {
    const details = tco?.consumption?.details || [];
    const items = details.map(d => {
        const text = d.breakdown ? `${d.name}: ${d.breakdown}` : `${d.name}`;
        return { text, cost: d.estimate };
    });
    const sum = items.reduce((acc, d) => acc + d.cost, 0);
    return { items, sum };
}

/**
 * Berechnet die monatlichen TCO-Summen für eine Application-Instance
 * (basierend auf dem Top-Result).
 *
 * @param {Object} app - Application-Instance mit analysisResults
 * @returns {{ monthlyInfra: number, monthlyOps: number, totalMonthlyTCO: number }}
 */
export function computeAppMonthlyTCO(app) {
    const topResult = app?.analysisResults?.[0];
    const monthlyInfra = topResult?.tcoEstimate?.consumption?.monthlyEstimate || 0;
    const monthlyOps = topResult?.tcoEstimate?.operations?.monthlyPersonnelCost || 0;
    return {
        monthlyInfra,
        monthlyOps,
        totalMonthlyTCO: monthlyInfra + monthlyOps
    };
}

/**
 * Berechnet die Farb-Tokens für die Rating-Mini-Bars (Control / Performance)
 * gemäß Schwellenwerten (≥70 success, ≥40 warning, sonst danger).
 *
 * @param {Object} service - Service-Objekt mit { control, performance }
 * @returns {{ controlColor: string, perfColor: string }}
 */
export function computeRatingColors(service) {
    const c = service?.control ?? 0;
    const p = service?.performance ?? 0;
    return {
        controlColor: c >= 70 ? 'var(--btc-success)' : c >= 40 ? 'var(--btc-warning)' : 'var(--btc-danger)',
        perfColor: p >= 70 ? 'var(--btc-success)' : p >= 40 ? 'var(--btc-warning)' : 'var(--btc-danger)'
    };
}

/**
 * Pure Markdown→HTML-Formatter für Empfehlungstexte.
 *
 * Wandelt **fett**, Zeilenumbrüche und Bullet-Marker (• ) in das
 * Summary-HTML der Recommendation-Section um.
 *
 * @param {string} text
 * @returns {string} HTML-String
 */
export function formatRecommendationText(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<span class="summary-highlight">$1</span>')
        .replace(/\n/g, '<br>')
        .replace(/• /g, '<span class="bullet">•</span> ');
}

/**
 * Generiert den Portfolio-Empfehlungstext (Multi-App) und formatiert ihn als HTML.
 *
 * Konzeptionell verschieden zu formatRecommendationText:
 * Diese Funktion *erzeugt* den Empfehlungs-Inhalt aus Aggregat-Daten
 * (Provider, Coverage, fehlende Services, Preview-Hinweise) und
 * delegiert die Markdown→HTML-Konvertierung am Ende an
 * formatRecommendationText.
 *
 * Pure Function — keine DOM-Zugriffe. formatCurrency wird als Callback
 * injiziert (kommt aus SAAPdf-Mixin und ist selbst pure).
 *
 * @param {Object} topProvider - Top-Aggregated-Provider mit { provider, aggregatedScore, serviceAnalysis }
 * @param {Object} metrics - portfolioMetrics mit { totalApps, totalComponents }
 * @param {Object} aggregatedTCO - Map providerId → { totalMonthly, ... }
 * @param {Function} formatCurrency - (value:number) → string
 * @returns {string} HTML-String
 */
export function formatPortfolioRecommendationText(topProvider, metrics, aggregatedTCO, formatCurrency) {
    const provider = topProvider.provider;
    const score = topProvider.aggregatedScore;
    const tco = aggregatedTCO[provider.id];
    const categoryNames = PROVIDER_CATEGORY_NAMES;

    let text = `Für Ihr **Portfolio von ${metrics.totalApps} Anwendungen** empfehlen wir **${provider.name}** als primären Cloud-Provider.\n\n`;

    text += `**${provider.name}** (${categoryNames[provider.category]}) erreicht einen gewichteten Portfolio-Score von **${score.toFixed(1)} Punkten** `;
    text += `über alle ${metrics.totalComponents} Komponenten hinweg. `;
    text += `Die geschätzten Gesamtkosten liegen bei **~${formatCurrency(tco.totalMonthly)}€ pro Monat**.\n\n`;

    const genericServiceNames = GENERIC_SERVICE_NAMES;

    // Gründe für die Empfehlung
    text += `**Gründe für diese Empfehlung:**\n`;

    // Abdeckung mit Details zu fehlenden Services
    const coveragePercent = Math.round(topProvider.serviceAnalysis.coverage);
    if (topProvider.serviceAnalysis.missing.length > 0 || topProvider.serviceAnalysis.preview.length > 0) {
        const missingCount = topProvider.serviceAnalysis.missing.length;
        const previewCount = topProvider.serviceAnalysis.preview.length;

        let coverageDetails = '';
        if (missingCount > 0) {
            const missingList = topProvider.serviceAnalysis.missing
                .map(id => genericServiceNames[id] || id)
                .slice(0, 3)
                .join(', ');
            const moreCount = missingCount > 3 ? ` (+${missingCount - 3} weitere)` : '';
            coverageDetails += `${missingCount} fehlend (${missingList}${moreCount})`;
        }
        if (previewCount > 0) {
            const previewList = topProvider.serviceAnalysis.preview
                .map(id => genericServiceNames[id] || id)
                .slice(0, 3)
                .join(', ');
            const moreCount = previewCount > 3 ? ` (+${previewCount - 3} weitere)` : '';
            if (coverageDetails) coverageDetails += ', ';
            coverageDetails += `${previewCount} in Preview (${previewList}${moreCount})`;
        }

        text += `• **Abdeckung**: ${coveragePercent}% verfügbar (${coverageDetails})\n`;
    } else {
        text += `• **Vollständige Abdeckung**: ${coveragePercent}% der benötigten Services sind verfügbar\n`;
    }

    text += `• **Einheitliche Plattform**: Vereinfachtes Management über alle ${metrics.totalApps} Anwendungen\n`;
    text += `• **Optimales Preis-Leistungs-Verhältnis**: Bestes Gesamtergebnis unter Berücksichtigung Ihrer Gewichtung\n`;

    // Detaillierte Hinweise zu fehlenden Services
    if (topProvider.serviceAnalysis.missing.length > 0) {
        const missingList = topProvider.serviceAnalysis.missing
            .map(id => genericServiceNames[id] || id)
            .slice(0, 5)
            .join(', ');
        const moreCount = topProvider.serviceAnalysis.missing.length > 5
            ? ` (+${topProvider.serviceAnalysis.missing.length - 5} weitere)`
            : '';

        text += `\n**Hinweis zu fehlenden Services**: ${missingList}${moreCount} sind nicht nativ verfügbar. `;
        text += `Empfehlung: Self-Build auf VMs oder Partner-Lösungen einsetzen.`;
    }

    if (topProvider.serviceAnalysis.preview.length > 0) {
        const previewList = topProvider.serviceAnalysis.preview
            .map(id => genericServiceNames[id] || id)
            .slice(0, 5)
            .join(', ');
        const moreCount = topProvider.serviceAnalysis.preview.length > 5
            ? ` (+${topProvider.serviceAnalysis.preview.length - 5} weitere)`
            : '';

        text += `\n\n**Hinweis zu Preview-Services**: ${previewList}${moreCount} sind noch in der Preview-Phase und sollten für produktive Workloads mit Vorsicht eingesetzt werden.`;
    }

    return formatRecommendationText(text);
}
