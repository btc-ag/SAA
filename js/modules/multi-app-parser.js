/**
 * multi-app-parser — Pure Parser-Funktionen für den Multi-App-Modus.
 *
 * Wandelt Text-Input und HA/Storage/DB-Configs in strukturierte Daten um.
 * Keine DOM-Zugriffe, kein State. Externe Abhängigkeiten (knownApplications,
 * appMatcher, sizingDetector, init-Callback) werden als Parameter übergeben.
 *
 * Aus js/modules/saa-multiapp.js extrahiert (v4.1.1-Refactor, Tier 1).
 *
 * @module modules/multi-app-parser
 */

import { ApplicationInstance } from './application-instance.js';

/**
 * Berechnet Levenshtein-Distanz zwischen zwei Strings.
 * @param {string} s1
 * @param {string} s2
 * @returns {number}
 */
export function levenshteinDistance(s1, s2) {
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

/**
 * Berechnet String-Ähnlichkeit (Levenshtein-basiert), Bereich [0..1].
 * @param {string} s1
 * @param {string} s2
 * @returns {number}
 */
export function calculateSimilarity(s1, s2) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    const longerLength = longer.length;
    if (longerLength === 0) return 1.0;

    const distance = levenshteinDistance(longer, shorter);
    return (longerLength - distance) / longerLength;
}

/**
 * Formatiert VM-Typ-Namen für die Anzeige (z. B. webserver -> Webserver, appTier -> App Tier).
 * @param {string} key
 * @returns {string}
 */
export function formatVMTypeName(key) {
    // CamelCase aufteilen: appTier -> app Tier, dbServer -> db Server
    const formatted = key
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/^./, str => str.toUpperCase())
        .replace(/\b(db|sql|vm|ha|web|app)\b/gi, match => match.toUpperCase());

    return formatted;
}

/**
 * Maps database keywords to their corresponding component IDs.
 * Returns 'database_sql', 'database_nosql' or null if not a database.
 * @param {string} databaseKeyword
 * @returns {string|null}
 */
export function getDatabaseComponentId(databaseKeyword) {
    // Elasticsearch ist NICHT enthalten - wird meist als Search Engine genutzt, nicht als primäre DB
    const nosqlDatabases = ['mongodb', 'redis', 'cassandra', 'neo4j', 'couchdb'];
    const sqlDatabases = ['postgresql', 'postgres', 'mysql', 'mariadb', 'sqlserver', 'mssql', 'oracle', 'hana'];

    const keyword = databaseKeyword.toLowerCase();

    if (nosqlDatabases.some(db => keyword.includes(db))) {
        return 'database_nosql';
    }
    if (sqlDatabases.some(db => keyword.includes(db))) {
        return 'database_sql';
    }
    return null;
}

/**
 * Extracts node count and type from HA configuration.
 * Handles various patterns:
 * - { nodes: 3 }
 * - { nodes: 3, type: 'Replica Set' }
 * - { brokers: 3, zookeeper: 3 }
 * - { servers: 5, clients: 'Unlimited' }
 * - { nodes: '2-3' } (string with range)
 *
 * @param {object|null|undefined} haConfig
 * @returns {{nodeCount:number, haType:string|null, roles:object, hasMultipleRoles:boolean}|null}
 */
export function extractHAConfig(haConfig) {
    if (!haConfig || typeof haConfig !== 'object') {
        return null;
    }

    const result = {
        nodeCount: 1,
        haType: haConfig.type || null,
        roles: {},
        hasMultipleRoles: false
    };

    // Pattern 1: Simple nodes count
    if (haConfig.nodes) {
        if (typeof haConfig.nodes === 'string') {
            // Handle ranges like '2-3' - take the higher number
            const match = haConfig.nodes.match(/(\d+)-(\d+)/);
            if (match) {
                result.nodeCount = parseInt(match[2]);
            } else {
                result.nodeCount = parseInt(haConfig.nodes) || 1;
            }
        } else {
            result.nodeCount = haConfig.nodes;
        }
    }

    // Pattern 2: Multiple role-based counts (brokers, zookeeper, servers, etc.)
    const roleKeys = ['brokers', 'servers', 'zookeeper', 'dataNodes', 'masters', 'replicas', 'workers'];
    let totalRoleNodes = 0;

    for (const roleKey of roleKeys) {
        if (haConfig[roleKey] && typeof haConfig[roleKey] === 'number') {
            result.roles[roleKey] = haConfig[roleKey];
            totalRoleNodes += haConfig[roleKey];
            result.hasMultipleRoles = true;
        }
    }

    // If we have role-based nodes, use the total
    if (totalRoleNodes > 0) {
        result.nodeCount = totalRoleNodes;
    }

    return result;
}

/**
 * Helper: Parse Storage Size mit TB/GB/PB Konvertierung.
 * @param {string|number|null|undefined} sizeString
 * @returns {number} Größe in GB
 */
export function parseStorageSize(sizeString) {
    if (!sizeString) return 500;
    const match = sizeString.toString().match(/([\d.]+)\s*(TB|GB|PB)?/i);
    if (!match) return parseInt(sizeString) || 500;

    const value = parseFloat(match[1]);
    const unit = match[2] ? match[2].toUpperCase() : 'GB';

    if (unit === 'TB') return Math.round(value * 1024);
    if (unit === 'PB') return Math.round(value * 1024 * 1024);
    return Math.round(value);
}

/**
 * Helper: Parse Database Size mit TB/GB Konvertierung und Bereichs-Support.
 * @param {string|number|null|undefined} sizeString
 * @returns {number} Größe in GB
 */
export function parseDBSize(sizeString) {
    if (!sizeString) return 100;
    const match = sizeString.toString().match(/([\d.]+)(?:-[\d.]+)?\s*(TB|GB)?/i);
    if (!match) return parseInt(sizeString) || 100;

    let value = parseFloat(match[1]);
    const unit = match[2] ? match[2].toUpperCase() : 'GB';

    // Wenn Bereich (z. B. "1.5-2TB"), nimm die höhere Zahl
    const rangeMatch = sizeString.toString().match(/-([\d.]+)\s*(TB|GB)?/i);
    if (rangeMatch) {
        value = parseFloat(rangeMatch[1]);
    }

    if (unit === 'TB') return Math.round(value * 1024);
    return Math.round(value);
}

/**
 * Helper: Liefert ein menschenlesbares Größen-Label zur Sizing-Stufe.
 * @param {'small'|'medium'|'large'|string} sizing
 * @returns {string}
 */
export function getSizeLabel(sizing) {
    return sizing === 'small' ? 'Klein (1-100 User)' :
           sizing === 'medium' ? 'Mittel (100-500 User)' :
           'Groß (500+ User)';
}

/**
 * Schreibt Storage-Konfiguration für die ausgewählten Storage-Komponenten in `configs`.
 *
 * `configs` wird in-place mutiert (Output-Parameter). `selectedComponents` wird nur gelesen.
 *
 * @param {object} sysReq System-Requirements der App-Sizing-Stufe
 * @param {object} configs Output-Container (component-id → config)
 * @param {Set<string>} selectedComponents Aktive Komponenten der App
 */
export function parseStorageConfig(sysReq, configs, selectedComponents) {
    if (!sysReq.storage) return;

    let storageType = 'ssd';
    if (typeof sysReq.storage.type === 'string') {
        if (sysReq.storage.type.toLowerCase().includes('nvme')) storageType = 'nvme';
        else if (sysReq.storage.type.toLowerCase().includes('hdd')) storageType = 'hdd';
        else if (sysReq.storage.type.toLowerCase().includes('ssd')) storageType = 'ssd';
    }

    const storageSizeGB = parseStorageSize(sysReq.storage.size);

    // Block Storage
    if (selectedComponents.has('storage_block')) {
        configs['storage_block'] = {
            blockType: storageType,
            blockSize: storageSizeGB
        };
    }

    // Object Storage
    if (selectedComponents.has('storage_object')) {
        configs['storage_object'] = {
            objectSize: storageSizeGB
        };
    }

    // File Storage
    if (selectedComponents.has('storage_file')) {
        configs['storage_file'] = {
            fileSize: storageSizeGB
        };
    }
}

/**
 * Schreibt Datenbank-Konfiguration (SQL & NoSQL inkl. HA-Replicas) in `configs`.
 *
 * `configs` wird in-place mutiert (Output-Parameter). `selectedComponents` wird nur gelesen.
 *
 * @param {object} sysReq System-Requirements der App-Sizing-Stufe
 * @param {object} configs Output-Container (component-id → config)
 * @param {Set<string>} selectedComponents Aktive Komponenten der App
 */
export function parseDatabaseConfig(sysReq, configs, selectedComponents) {
    if (!sysReq.database) return;

    const dbTypeString = sysReq.database.type || 'PostgreSQL';
    const dbSize = parseDBSize(sysReq.database.size);

    // DB-Typ bestimmen
    let dbType = 'PostgreSQL';
    if (dbTypeString.toLowerCase().includes('mysql')) dbType = 'MySQL';
    else if (dbTypeString.toLowerCase().includes('mssql') || dbTypeString.toLowerCase().includes('sql server')) dbType = 'SQL Server';
    else if (dbTypeString.toLowerCase().includes('oracle')) dbType = 'Oracle';
    else if (dbTypeString.toLowerCase().includes('mongodb')) dbType = 'MongoDB';
    else if (dbTypeString.toLowerCase().includes('postgresql') || dbTypeString.toLowerCase().includes('postgres')) dbType = 'PostgreSQL';
    else if (dbTypeString.toLowerCase().includes('mariadb')) dbType = 'MariaDB';

    // HA-Erkennung
    let isHA = dbTypeString.toLowerCase().includes('ha') ||
               dbTypeString.toLowerCase().includes('cluster') ||
               dbTypeString.toLowerCase().includes('replication');
    let haNodes = 2;

    // Check für SQL-Nodes in Compute (z. B. Citrix CVAD)
    if (!isHA && sysReq.compute && sysReq.compute.sql && sysReq.compute.sql.nodes > 1) {
        isHA = true;
        haNodes = sysReq.compute.sql.nodes;
    }

    // Wenn App-Level HA existiert
    if (!isHA && sysReq.ha) {
        const haConfig = extractHAConfig(sysReq.ha);
        if (haConfig && haConfig.nodeCount > 1) {
            isHA = true;
            haNodes = haConfig.nodeCount;
        }
    }

    // SQL oder NoSQL?
    const isNoSQL = dbTypeString.toLowerCase().includes('mongodb') ||
                   dbTypeString.toLowerCase().includes('redis') ||
                   dbTypeString.toLowerCase().includes('cassandra');

    if (isNoSQL) {
        // NoSQL Database
        if (selectedComponents.has('database_nosql')) {
            configs['database_nosql'] = {
                nosqlType: dbType,
                nosqlSize: dbSize
            };

            if (isHA) {
                const haMatch = dbTypeString.match(/\((.*?)\)/);
                let haType = haMatch ? haMatch[1] : null;
                if (!haType && sysReq.ha) {
                    const appHA = extractHAConfig(sysReq.ha);
                    haType = appHA?.haType || 'Replica Set';
                }
                const nosqlHANodes = haNodes > 2 ? haNodes : 3;
                configs['database_nosql']._haType = haType || 'Replica Set';
                configs['database_nosql']._haNodes = nosqlHANodes;

                // Zusätzliche Instanzen
                for (let i = 2; i <= nosqlHANodes; i++) {
                    configs[`database_nosql-${i}`] = {
                        nosqlType: dbType,
                        nosqlSize: dbSize,
                        _haType: configs['database_nosql']._haType,
                        _haNodes: nosqlHANodes,
                        _isHAReplica: true
                    };
                }
            }
        }
    } else {
        // SQL Database
        if (selectedComponents.has('database_sql')) {
            configs['database_sql'] = {
                dbType: dbType,
                dbSize: dbSize
            };

            if (isHA) {
                const haMatch = dbTypeString.match(/\((.*?)\)/);
                let haType = haMatch ? haMatch[1] : null;
                if (!haType && sysReq.ha) {
                    const appHA = extractHAConfig(sysReq.ha);
                    haType = appHA?.haType || 'HA';
                }
                configs['database_sql']._haType = haType || 'HA';
                configs['database_sql']._haNodes = haNodes;

                // Zusätzliche Instanzen
                for (let i = 2; i <= haNodes; i++) {
                    configs[`database_sql-${i}`] = {
                        dbType: dbType,
                        dbSize: dbSize,
                        _haType: configs['database_sql']._haType,
                        _haNodes: haNodes,
                        _isHAReplica: true
                    };
                }
            }
        }
    }
}

/**
 * Parst Applikationsnamen (Komma, Semikolon, Tab, Absatz) und erstellt
 * ApplicationInstance[] mit Match-Vorschlägen und Sizing.
 *
 * @param {string} inputText Roh-Text mit Applikationsnamen, getrennt durch , ; \t \n
 * @param {object} deps Abhängigkeiten
 * @param {{matchApplication:Function}} deps.appMatcher
 * @param {{detectSizing:Function}} deps.sizingDetector
 * @param {object} deps.knownApplications Map app-id → application-data
 * @param {Function} deps.initComponentConfigsFromSystemRequirements
 *        Callback (appData, sizing, instance) → void; initialisiert die
 *        komponenten-spezifischen Configs auf der Instance.
 * @returns {Array<{instance:ApplicationInstance, userInput:string, suggestions:Array, detectedSizing:object, selected:object|null}>}
 */
export function parseApplicationList(inputText, deps) {
    const { appMatcher, sizingDetector, knownApplications, initComponentConfigsFromSystemRequirements } = deps;

    // Flexibles Splitting: Komma, Semikolon, Tab, Zeilenumbruch
    const lines = inputText.split(/[,;\t\n]/).map(l => l.trim()).filter(l => l.length > 0);
    const parsedApps = [];

    lines.forEach(line => {
        const matches = appMatcher.matchApplication(line);
        const sizingInfo = sizingDetector.detectSizing(line);

        const bestMatch = matches.length > 0 ? matches[0] : null;
        const appType = bestMatch && bestMatch.confidence > 0.6 ? bestMatch.id : null;

        const instance = new ApplicationInstance(
            null,
            line,
            appType,
            sizingInfo.sizing
        );

        // Falls bekannte App, System Requirements laden
        if (appType && knownApplications[appType]) {
            instance.applicationData = knownApplications[appType];
            instance.selectedComponents = new Set(knownApplications[appType].components || []);
            initComponentConfigsFromSystemRequirements(
                instance.applicationData,
                instance.sizing,
                instance
            );
            // Snapshot für Architektur-Transformation (analog zu Single-App)
            instance._archOriginal = {
                selectedComponents: new Set(instance.selectedComponents),
                componentConfigs: JSON.parse(JSON.stringify(instance.componentConfigs))
            };
            instance._archDelta = { added: new Set(), removed: new Set(), configs: {} };
            instance.architectureMode = knownApplications[appType].recommendedArchitecture || 'classic';
        }

        parsedApps.push({
            instance,
            userInput: line,
            suggestions: matches,
            detectedSizing: sizingInfo,
            selected: bestMatch
        });
    });

    return parsedApps;
}
