/**
 * detectDeploymentPattern — Erkennt das passende Deployment-Pattern
 * (z.B. Web-App, Enterprise-App, KI-Workload) basierend auf gewählten
 * Komponenten und optional einer App-ID.
 *
 * @module modules/deployment-pattern
 */

import { deploymentPatterns } from '../saa-data.js';

/**
 * Ermittelt das passende Deployment Pattern für gegebene Komponenten
 * @param {Array} components - Liste der Komponenten-IDs
 * @param {string} appId - Optional: App-ID für spezifische Erkennung
 * @returns {Object|null} Das erkannte Pattern oder null
 */
function detectDeploymentPattern(components, appId = null) {
    // Reihenfolge ist wichtig: Spezifischere Patterns zuerst
    const patternOrder = ['static_website', 'api_service', 'container_workload', 'enterprise_legacy', 'web_application', 'database_centric'];

    for (const patternId of patternOrder) {
        const pattern = deploymentPatterns[patternId];
        if (pattern.detection(components, appId)) {
            return { id: patternId, ...pattern };
        }
    }
    return null;
}

export { detectDeploymentPattern };
