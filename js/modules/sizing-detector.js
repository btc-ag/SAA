/**
 * SizingDetector — Erkennt Sizing (small/medium/large) aus Keywords im Anwendungsnamen.
 *
 * @module modules/sizing-detector
 */

/**
 * SizingDetector - Erkennt Sizing aus Keywords im Namen
 */
class SizingDetector {
    detectSizing(userInput) {
        const normalized = userInput.toLowerCase();

        const sizePatterns = {
            small: ['klein', 'small', 'dev', 'test', 'entwicklung', 'poc', 'pilot', 'staging'],
            medium: ['mittel', 'medium', 'standard', 'prod', 'produktion', 'production'],
            large: ['groß', 'gross', 'large', 'enterprise', 'konzern', 'xl', 'xxl', 'huge']
        };

        for (const [size, patterns] of Object.entries(sizePatterns)) {
            for (const pattern of patterns) {
                if (normalized.includes(pattern)) {
                    return { sizing: size, confidence: 0.8, keyword: pattern };
                }
            }
        }

        // Default
        return { sizing: 'medium', confidence: 0.3, keyword: 'standard' };
    }
}

export { SizingDetector };
