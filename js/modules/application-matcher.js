/**
 * ApplicationMatcher — Fuzzy-Match zwischen User-Input und bekannten
 * Anwendungen aus saa-apps-data.js. Verwendet einen Search-Index aus
 * Keywords + Levenshtein-Ähnlichkeit.
 *
 * @module modules/application-matcher
 */

/**
 * ApplicationMatcher - Fuzzy-Matching für Applikationsnamen
 */
class ApplicationMatcher {
    constructor(knownApps) {
        this.knownApps = knownApps;
        this.buildSearchIndex();
    }

    buildSearchIndex() {
        this.index = {
            exact: {},
            keywords: {},
            tokens: {}
        };

        Object.entries(this.knownApps).forEach(([id, app]) => {
            // Exact match
            const normalized = this.normalize(app.name);
            this.index.exact[normalized] = id;

            // Keyword extraction
            const keywords = this.extractKeywords(app.name, app.description);
            keywords.forEach(kw => {
                if (!this.index.keywords[kw]) this.index.keywords[kw] = [];
                this.index.keywords[kw].push({ id, score: 1.0 });
            });

            // Token-based
            const tokens = normalized.split(/\s+/);
            tokens.forEach(token => {
                if (token.length > 2) { // Ignore sehr kurze Tokens
                    if (!this.index.tokens[token]) this.index.tokens[token] = [];
                    this.index.tokens[token].push({ id, score: 0.5 });
                }
            });
        });
    }

    matchApplication(userInput) {
        // Entferne Größenangaben für besseres Matching
        const cleanedInput = userInput
            .replace(/\b(klein|small|mittel|medium|groß|gro|large|enterprise)\b/gi, '')
            .trim();

        const normalized = this.normalize(cleanedInput);
        const results = [];

        // 1. Exact match
        if (this.index.exact[normalized]) {
            return [{
                id: this.index.exact[normalized],
                app: this.knownApps[this.index.exact[normalized]],
                confidence: 1.0,
                reason: 'Exakte Übereinstimmung'
            }];
        }

        // 2. Keyword-based matching
        const keywords = this.extractKeywords(userInput);
        const keywordMatches = new Map();
        keywords.forEach(kw => {
            if (this.index.keywords[kw]) {
                this.index.keywords[kw].forEach(match => {
                    const existing = keywordMatches.get(match.id) || { count: 0, keywords: [] };
                    existing.count++;
                    existing.keywords.push(kw);
                    keywordMatches.set(match.id, existing);
                });
            }
        });

        keywordMatches.forEach((data, id) => {
            const app = this.knownApps[id];

            // Bonus für Keywords die im App-Namen vorkommen (nicht nur in Description)
            const appNameNormalized = this.normalize(app.name);
            const nameMatchCount = data.keywords.filter(kw => appNameNormalized.includes(kw)).length;
            const nameBonus = nameMatchCount * 0.15; // 15% Bonus pro Name-Match

            results.push({
                id,
                app,
                confidence: Math.min(0.98, 0.7 + data.count * 0.1 + nameBonus),
                reason: `Keywords: ${data.keywords.join(', ')}${nameMatchCount > 0 ? ' (in Name)' : ''}`
            });
        });

        // 3. Fuzzy string similarity (wortweise)
        Object.entries(this.knownApps).forEach(([id, app]) => {
            if (results.find(r => r.id === id)) return; // Skip if already matched

            // Prüfe Ähnlichkeit mit einzelnen Wörtern
            // Split nach Leerzeichen UND Sonderzeichen wie /, -, ( etc.
            const nameWords = this.normalize(app.name).split(/[\s\/\-\(\)]+/);
            const idWords = id.split(/[-_]/);
            const allWords = [...nameWords, ...idWords];

            let maxSimilarity = 0;

            allWords.forEach(word => {
                if (word.length < 2) return;

                // Vollständiger Vergleich
                let similarity = this.stringSimilarity(normalized, word);

                // Substring-Vergleich mit Tippfehlertoleranz
                if (word.length >= normalized.length) {
                    for (let i = 0; i <= word.length - normalized.length; i++) {
                        const substring = word.substring(i, i + normalized.length);
                        const substringSimilarity = this.stringSimilarity(normalized, substring);
                        similarity = Math.max(similarity, substringSimilarity);
                    }
                }

                maxSimilarity = Math.max(maxSimilarity, similarity);
            });

            if (maxSimilarity > 0.6) {
                results.push({
                    id,
                    app,
                    confidence: maxSimilarity * 0.9, // Leicht reduziert für Fuzzy
                    reason: `Ähnlichkeit: ${Math.round(maxSimilarity * 100)}%`
                });
            }
        });

        // Deduplicate und sortieren
        const seen = new Set();
        return results
            .filter(r => {
                if (seen.has(r.id)) return false;
                seen.add(r.id);
                return true;
            })
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 3);
    }

    normalize(str) {
        return str.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    extractKeywords(name, description = '') {
        const text = `${name} ${description}`;
        const normalized = this.normalize(text);

        const brands = ['sap', 's4hana', 'business one', 'dynamics', 'microsoft', 'oracle', 'gitlab', 'wordpress', 'nextcloud',
                       'kubernetes', 'cluster', 'docker', 'jenkins', 'jira', 'confluence', 'mattermost',
                       'postgres', 'postgresql', 'mysql', 'mariadb', 'mongodb', 'redis', 'elastic', 'elasticsearch', 'grafana',
                       'sharepoint', 'exchange', 'teams', 'minio', 'ceph', 'nginx',
                       'artifactory', 'jfrog', 'sonarqube', 'nexus', 'harbor', 'superset',
                       'metabase', 'tableau', 'powerbi', 'keycloak', 'vault', 'airflow',
                       'influxdb', 'prometheus', 'opensearch', 'argocd', 'tekton'];

        const found = [];
        brands.forEach(brand => {
            if (normalized.includes(brand)) found.push(brand);
        });

        return found;
    }

    stringSimilarity(s1, s2) {
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        const longerLength = longer.length;
        if (longerLength === 0) return 1.0;
        const distance = this.levenshtein(longer, shorter);
        return (longerLength - distance) / longerLength;
    }

    levenshtein(s1, s2) {
        const costs = [];
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i === 0) {
                    costs[j] = j;
                } else if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
            if (i > 0) costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    }
}

export { ApplicationMatcher };
