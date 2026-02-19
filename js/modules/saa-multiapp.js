// SAAMultiApp Module
// Verantwortlich für: Multi-App-Workflow, App-Mapping-Table, App-Konfiguration, Portfolio-Parsing

import { knownApplications } from '../saa-apps-data.js';

export const SAAMultiApp = {
    /**
     * Migration von Single-App zu Multi-App Modus
     */
    migrateToMultiApp() {
        if (this.applications.length === 0 && this._applicationData) {
            const app = ApplicationInstance.fromCurrentState({
                applicationData: this._applicationData,
                selectedComponents: this._selectedComponents,
                componentConfigs: this._componentConfigs,
                systemConfig: this._systemConfig,
                selectedSizing: this._selectedSizing,
                analysisResults: this._analysisResults
            });
            this.applications.push(app);
        }
        this.isMultiAppMode = true;
        this.totalSteps = 4; // Step 0 hinzugefügt
    },

    /**
     * Parst Applikationsnamen (Komma, Semikolon, Tab, Absatz) und erstellt ApplicationInstance[]
     */
    parseApplicationList(inputText) {
        // Flexibles Splitting: Komma, Semikolon, Tab, Zeilenumbruch
        const lines = inputText.split(/[,;\t\n]/).map(l => l.trim()).filter(l => l.length > 0);
        const parsedApps = [];

        lines.forEach(line => {
            const matches = this.appMatcher.matchApplication(line);
            const sizingInfo = this.sizingDetector.detectSizing(line);

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
                this.initComponentConfigsFromSystemRequirements(
                    instance.applicationData,
                    instance.sizing,
                    instance
                );
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
    },

    /**
     * Startet den Multi-App-Modus mit der Eingabe
     */
    startMultiAppMode(inputText) {
        const parsedApps = this.parseApplicationList(inputText);

        if (parsedApps.length === 0) {
            alert('Bitte geben Sie mindestens eine Anwendung ein.');
            return;
        }

        // Apps in den State übernehmen
        this.applications = parsedApps.map(p => p.instance);
        this.migrateToMultiApp();

        // Mapping-Tabelle rendern
        this.renderAppMappingTable(parsedApps);

        // Gehe zu Step 1 (Mapping-Tabelle im Multi-App-Modus)
        this.goToStep(1);
    },

    /**
     * Lädt eine Vorlage von Apps
     */
    loadTemplate(templateName) {
        const templates = {
            erp: `SAP S/4HANA Produktion groß
Microsoft Dynamics 365 mittel
SAP Business One klein`,
            devops: `GitLab Enterprise groß
Jenkins CI/CD
SonarQube
Artifactory
Kubernetes Cluster groß`,
            web: `WordPress Unternehmenswebsite
Nextcloud Filesharing groß
Mattermost Team-Chat mittel
PostgreSQL Datenbank`,
            analytics: `Apache Superset groß
Metabase mittel
InfluxDB
Grafana
Elasticsearch groß
Apache Airflow mittel`,
            collaboration: `Nextcloud groß
Mattermost mittel
Confluence
Jira mittel
GitLab klein`
        };

        const textarea = document.getElementById('multiAppInput');
        if (textarea && templates[templateName]) {
            textarea.value = templates[templateName];
        }
    },

    /**
     * Formatiert VM-Typ-Namen für die Anzeige (z.B. webserver -> Webserver, appTier -> App Tier)
     */
    formatVMTypeName(key) {
        // CamelCase aufteilen: appTier -> App Tier, dbServer -> DB Server
        const formatted = key
            .replace(/([a-z])([A-Z])/g, '$1 $2')  // appTier -> app Tier
            .replace(/^./, str => str.toUpperCase())  // Ersten Buchstaben großschreiben
            .replace(/\b(db|sql|vm|ha|web|app)\b/gi, match => match.toUpperCase());  // DB, SQL, VM, etc. großschreiben

        return formatted;
    },

    /**
     * Maps database keywords to their corresponding component IDs
     * Returns 'database_sql', 'database_nosql' or null if not a database
     */
    getDatabaseComponentId(databaseKeyword) {
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
    },

    /**
     * Extracts node count and type from HA configuration
     * Handles various patterns:
     * - { nodes: 3 }
     * - { nodes: 3, type: 'Replica Set' }
     * - { brokers: 3, zookeeper: 3 }
     * - { servers: 5, clients: 'Unlimited' }
     * - { nodes: '2-3' } (string with range)
     *
     * Returns: { nodeCount: number, haType: string|null, roles: object, hasMultipleRoles: boolean } or null
     */
    extractHAConfig(haConfig) {
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
    },

    /**
     * Helper: Parse Storage Size mit TB/GB/PB Konvertierung
     */
    parseStorageSize(sizeString) {
        if (!sizeString) return 500;
        const match = sizeString.toString().match(/([\d.]+)\s*(TB|GB|PB)?/i);
        if (!match) return parseInt(sizeString) || 500;

        const value = parseFloat(match[1]);
        const unit = match[2] ? match[2].toUpperCase() : 'GB';

        if (unit === 'TB') return Math.round(value * 1024);
        if (unit === 'PB') return Math.round(value * 1024 * 1024);
        return Math.round(value);
    },

    /**
     * Helper: Parse Database Size mit TB/GB Konvertierung und Bereichs-Support
     */
    parseDBSize(sizeString) {
        if (!sizeString) return 100;
        const match = sizeString.toString().match(/([\d.]+)(?:-[\d.]+)?\s*(TB|GB)?/i);
        if (!match) return parseInt(sizeString) || 100;

        let value = parseFloat(match[1]);
        const unit = match[2] ? match[2].toUpperCase() : 'GB';

        // Wenn Bereich (z.B. "1.5-2TB"), nimm die höhere Zahl
        const rangeMatch = sizeString.toString().match(/-([\d.]+)\s*(TB|GB)?/i);
        if (rangeMatch) {
            value = parseFloat(rangeMatch[1]);
        }

        if (unit === 'TB') return Math.round(value * 1024);
        return Math.round(value);
    },

    /**
     * Helper: Parse Storage Configuration
     */
    parseStorageConfig(sysReq, configs, selectedComponents) {
        if (!sysReq.storage) return;

        let storageType = 'ssd';
        if (typeof sysReq.storage.type === 'string') {
            if (sysReq.storage.type.toLowerCase().includes('nvme')) storageType = 'nvme';
            else if (sysReq.storage.type.toLowerCase().includes('hdd')) storageType = 'hdd';
            else if (sysReq.storage.type.toLowerCase().includes('ssd')) storageType = 'ssd';
        }

        const storageSizeGB = this.parseStorageSize(sysReq.storage.size);

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
    },

    /**
     * Helper: Parse Database Configuration (SQL & NoSQL)
     */
    parseDatabaseConfig(sysReq, configs, selectedComponents) {
        if (!sysReq.database) return;

        const dbTypeString = sysReq.database.type || 'PostgreSQL';
        const dbSize = this.parseDBSize(sysReq.database.size);

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

        // Check für SQL-Nodes in Compute (z.B. Citrix CVAD)
        if (!isHA && sysReq.compute && sysReq.compute.sql && sysReq.compute.sql.nodes > 1) {
            isHA = true;
            haNodes = sysReq.compute.sql.nodes;
        }

        // Wenn App-Level HA existiert
        if (!isHA && sysReq.ha) {
            const haConfig = this.extractHAConfig(sysReq.ha);
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
                        const appHA = this.extractHAConfig(sysReq.ha);
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
                        const appHA = this.extractHAConfig(sysReq.ha);
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
    },

    /**
     * System Requirements für eine spezifische App initialisieren
     * Unterstützt beide Modi:
     * - Single-App-Modus: ohne Parameter (verwendet this.systemConfig, this.applicationData, this.selectedSizing)
     * - Multi-App-Modus: mit Parametern (appData, sizing, appInstance)
     */
    initComponentConfigsFromSystemRequirements(appData, sizing, appInstance) {

        // Single-App-Modus: Keine Parameter übergeben
        if (!appData && !sizing && !appInstance) {
            if (!this.systemConfig?.config) {
                return;
            }

            const sysReq = this.systemConfig.config;

            // Compute-Konfiguration übernehmen
            if (sysReq.compute && this.selectedComponents.has('compute')) {
                if (!this.componentConfigs['compute']) {
                    this.initComponentConfig('compute');
                }


                // Prüfe auf Multi-VM-Struktur (verschiedene Patterns)
                // Finde alle VM-Typen (alle Properties die Objekte mit cpu/ram sind)
                // ABER: Filtere Database-Services NUR heraus wenn sie als Managed DB gewählt wurden
                const vmTypes = [];

                for (const [key, value] of Object.entries(sysReq.compute)) {
                    if (value && typeof value === 'object' && (value.cpu || value.ram)) {
                        // Check if this VM is a database
                        const dbComponentId = this.getDatabaseComponentId(key);

                        if (dbComponentId) {
                            // Only skip if the corresponding database component is selected (= Managed DB)
                            if (this.selectedComponents.has(dbComponentId)) {
                                continue;
                            } else {
                            }
                        }

                        vmTypes.push({ key, config: value });
                    }
                }

                if (vmTypes.length > 0) {
                    // Multi-VM-Struktur erkannt - Erstelle separate Instanzen

                    // Erste VM-Typ = compute (Hauptinstanz)
                    const firstVM = vmTypes[0];
                    const firstConfig = firstVM.config;

                    // Determine instances (HA takes precedence if not multi-role)
                    let instances = firstConfig.nodes || firstConfig.count || 1;
                    let haType = null;

                    if (sysReq.ha) {
                        const haConfig = this.extractHAConfig(sysReq.ha);
                        if (haConfig && haConfig.nodeCount > 1 && !haConfig.hasMultipleRoles) {
                            instances = haConfig.nodeCount;
                            haType = haConfig.haType;
                        }
                    }

                    this.componentConfigs['compute'].cpu = firstConfig.cpu || 2;
                    this.componentConfigs['compute'].ram = firstConfig.ram || 4;
                    this.componentConfigs['compute'].instances = instances;
                    this.componentConfigs['compute']._vmTypeName = this.formatVMTypeName(firstVM.key);
                    if (haType) {
                        this.componentConfigs['compute']._haType = haType;
                    }

                    // Weitere VM-Typen = compute-2, compute-3, etc.
                    for (let i = 1; i < vmTypes.length; i++) {
                        const vmType = vmTypes[i];
                        const vmConfig = vmType.config;
                        const instanceId = `compute-${i + 1}`;

                        // Determine instances (HA takes precedence if not multi-role)
                        let instances = vmConfig.nodes || vmConfig.count || 1;
                        let haType = null;

                        if (sysReq.ha) {
                            const haConfig = this.extractHAConfig(sysReq.ha);
                            if (haConfig && haConfig.nodeCount > 1 && !haConfig.hasMultipleRoles) {
                                instances = haConfig.nodeCount;
                                haType = haConfig.haType;
                            }
                        }

                        this.selectedComponents.add(instanceId);
                        this.componentConfigs[instanceId] = {
                            cpu: vmConfig.cpu || 2,
                            ram: vmConfig.ram || 4,
                            instances: instances,
                            _vmTypeName: this.formatVMTypeName(vmType.key)
                        };
                        if (haType) {
                            this.componentConfigs[instanceId]._haType = haType;
                        }

                    }

                } else {
                    // Single-VM (WordPress etc.)
                    let instanceCount = sysReq.compute.nodes || 1;

                    // Wenn kubernetes auch gewählt: compute-Specs = Worker Nodes → node count aus sysReq.nodes
                    if (this.selectedComponents.has('kubernetes') && sysReq.nodes) {
                        const nodeMatch = sysReq.nodes.toString().match(/(\d+)/);
                        if (nodeMatch) instanceCount = parseInt(nodeMatch[1]);
                    }

                    this.componentConfigs['compute'].cpu = sysReq.compute.cpu;
                    this.componentConfigs['compute'].ram = sysReq.compute.ram;
                    this.componentConfigs['compute'].instances = instanceCount;

                    // Apply HA configuration if present (overrides nodes, but not kubernetes worker count)
                    if (sysReq.ha && !this.selectedComponents.has('kubernetes')) {
                        const haConfig = this.extractHAConfig(sysReq.ha);
                        if (haConfig && haConfig.nodeCount > 1) {
                            this.componentConfigs['compute'].instances = haConfig.nodeCount;
                            if (haConfig.haType) {
                                this.componentConfigs['compute']._haType = haConfig.haType;
                            }
                        }
                    }

                }
            }

            // Database-Konfiguration übernehmen (SQL & NoSQL)
            if (sysReq.database) {
                const dbType = sysReq.database.type || '';
                // Database ist HA wenn:
                // 1. DB-Type enthält "HA", "Cluster" oder "Replication" ODER
                // 2. App-Level HA existiert (sysReq.ha mit nodes > 1) ODER
                // 3. compute.sql.nodes > 1 (z.B. Citrix CVAD)
                let isHA = dbType.toLowerCase().includes('ha') || dbType.toLowerCase().includes('cluster') || dbType.toLowerCase().includes('replication');
                let haNodes = 2; // Default HA nodes

                // Check für SQL-Nodes in Compute (z.B. Citrix CVAD)
                if (!isHA && sysReq.compute && sysReq.compute.sql && sysReq.compute.sql.nodes > 1) {
                    isHA = true;
                    haNodes = sysReq.compute.sql.nodes;
                }

                // Wenn App-Level HA existiert, sollte DB auch HA sein
                if (!isHA && sysReq.ha) {
                    const haConfig = this.extractHAConfig(sysReq.ha);
                    if (haConfig && haConfig.nodeCount > 1) {
                        isHA = true;
                        haNodes = haConfig.nodeCount;
                    }
                }

                // SQL Database
                if (this.selectedComponents.has('database_sql')) {
                    if (!this.componentConfigs['database_sql']) {
                        this.initComponentConfig('database_sql');
                    }

                    // DB-Typ setzen
                    if (dbType.toLowerCase().includes('postgresql') || dbType.toLowerCase().includes('postgres')) {
                        this.componentConfigs['database_sql'].dbType = 'PostgreSQL';
                    } else if (dbType.toLowerCase().includes('mysql')) {
                        this.componentConfigs['database_sql'].dbType = 'MySQL';
                    } else if (dbType.toLowerCase().includes('mariadb')) {
                        this.componentConfigs['database_sql'].dbType = 'MariaDB';
                    } else if (dbType.toLowerCase().includes('sql server') || dbType.toLowerCase().includes('mssql')) {
                        this.componentConfigs['database_sql'].dbType = 'SQL Server';
                    } else if (dbType.toLowerCase().includes('oracle')) {
                        this.componentConfigs['database_sql'].dbType = 'Oracle';
                    }

                    // DB-Größe (mit TB/GB Konvertierung)
                    if (sysReq.database.size) {
                        const dbSizeGB = this.parseDBSize(sysReq.database.size);
                        if (dbSizeGB) {
                            this.componentConfigs['database_sql'].dbSize = dbSizeGB;
                        }
                    }

                    // HA-Unterstützung
                    if (isHA) {
                        // Versuche HA-Type aus database.type zu extrahieren
                        const haMatch = dbType.match(/\((.*?)\)/);
                        let haType = haMatch ? haMatch[1] : null;

                        // Wenn kein HA-Type in database.type, aber App-Level HA existiert
                        if (!haType && sysReq.ha) {
                            const appHA = this.extractHAConfig(sysReq.ha);
                            haType = appHA?.haType || 'HA';
                        }

                        this.componentConfigs['database_sql']._haType = haType || 'HA';
                        this.componentConfigs['database_sql']._haNodes = haNodes;

                        // Automatisch zusätzliche Instanzen erstellen
                        for (let i = 2; i <= this.componentConfigs['database_sql']._haNodes; i++) {
                            const instanceId = `database_sql-${i}`;
                            if (!this.selectedComponents.has(instanceId)) {
                                this.selectedComponents.add(instanceId);
                                this.componentConfigs[instanceId] = {
                                    dbType: this.componentConfigs['database_sql'].dbType,
                                    dbSize: this.componentConfigs['database_sql'].dbSize,
                                    _haType: this.componentConfigs['database_sql']._haType,
                                    _haNodes: this.componentConfigs['database_sql']._haNodes,
                                    _isHAReplica: true
                                };
                            }
                        }
                    }
                }

                // NoSQL Database
                if (this.selectedComponents.has('database_nosql')) {
                    if (!this.componentConfigs['database_nosql']) {
                        this.initComponentConfig('database_nosql');
                    }

                    // NoSQL-Typ setzen
                    if (dbType.toLowerCase().includes('mongodb')) {
                        this.componentConfigs['database_nosql'].nosqlType = 'MongoDB';
                    } else if (dbType.toLowerCase().includes('redis')) {
                        this.componentConfigs['database_nosql'].nosqlType = 'Redis';
                    } else if (dbType.toLowerCase().includes('cassandra')) {
                        this.componentConfigs['database_nosql'].nosqlType = 'Cassandra';
                    }

                    // DB-Größe (mit TB/GB Konvertierung)
                    if (sysReq.database.size) {
                        const dbSizeGB = this.parseDBSize(sysReq.database.size);
                        if (dbSizeGB) {
                            this.componentConfigs['database_nosql'].nosqlSize = dbSizeGB;
                        }
                    }

                    // HA-Unterstützung
                    if (isHA) {
                        // Versuche HA-Type aus database.type zu extrahieren
                        const haMatch = dbType.match(/\((.*?)\)/);
                        let haType = haMatch ? haMatch[1] : null;

                        // Wenn kein HA-Type in database.type, aber App-Level HA existiert
                        if (!haType && sysReq.ha) {
                            const appHA = this.extractHAConfig(sysReq.ha);
                            haType = appHA?.haType || 'Replica Set';
                        }

                        this.componentConfigs['database_nosql']._haType = haType || 'Replica Set';
                        this.componentConfigs['database_nosql']._haNodes = 3; // NoSQL meist 3 Nodes

                        // Automatisch zusätzliche Instanzen erstellen
                        for (let i = 2; i <= this.componentConfigs['database_nosql']._haNodes; i++) {
                            const instanceId = `database_nosql-${i}`;
                            if (!this.selectedComponents.has(instanceId)) {
                                this.selectedComponents.add(instanceId);
                                this.componentConfigs[instanceId] = {
                                    nosqlType: this.componentConfigs['database_nosql'].nosqlType,
                                    nosqlSize: this.componentConfigs['database_nosql'].nosqlSize,
                                    _haType: this.componentConfigs['database_nosql']._haType,
                                    _haNodes: this.componentConfigs['database_nosql']._haNodes,
                                    _isHAReplica: true
                                };
                            }
                        }
                    }
                }
            }

            // Storage-Konfiguration übernehmen
            if (sysReq.storage) {
                const storageSizeGB = this.parseStorageSize(sysReq.storage.size);

                // Block Storage
                if (this.selectedComponents.has('storage_block')) {
                    if (!this.componentConfigs['storage_block']) {
                        this.initComponentConfig('storage_block');
                    }
                    if (storageSizeGB) {
                        this.componentConfigs['storage_block'].blockSize = storageSizeGB;
                    }
                    // Storage-Typ
                    if (sysReq.storage.type) {
                        const storageType = sysReq.storage.type.toLowerCase();
                        if (storageType.includes('nvme')) {
                            this.componentConfigs['storage_block'].blockType = 'nvme';
                        } else if (storageType.includes('ssd')) {
                            this.componentConfigs['storage_block'].blockType = 'ssd';
                        } else if (storageType.includes('hdd')) {
                            this.componentConfigs['storage_block'].blockType = 'hdd';
                        }
                    }
                }

                // Object Storage
                if (this.selectedComponents.has('storage_object')) {
                    if (!this.componentConfigs['storage_object']) {
                        this.initComponentConfig('storage_object');
                    }
                    if (storageSizeGB) {
                        this.componentConfigs['storage_object'].objectSize = storageSizeGB;
                    }
                }

                // File Storage
                if (this.selectedComponents.has('storage_file')) {
                    if (!this.componentConfigs['storage_file']) {
                        this.initComponentConfig('storage_file');
                    }
                    if (storageSizeGB) {
                        this.componentConfigs['storage_file'].fileSize = storageSizeGB;
                    }
                }
            }

            // Kubernetes: immer nur Control Plane; Worker Nodes = compute
            if (this.selectedComponents.has('kubernetes')) {
                if (!this.componentConfigs['kubernetes']) {
                    this.initComponentConfig('kubernetes');
                }
                this.componentConfigs['kubernetes'].controlPlaneOnly = this.selectedComponents.has('compute');
            }

            return;
        }

        // Multi-App-Modus: Parameter übergeben
        if (!appData || !appData.systemRequirements || !appData.systemRequirements[sizing]) {
            return;
        }

        const sysReq = appData.systemRequirements[sizing];
        const configs = {};

        // Kubernetes: Wenn controlPlane/workers vorhanden UND kubernetes als Komponente gewählt
        // dann soll Kubernetes extrahiert werden, NICHT Compute VMs
        if (sysReq.compute && sysReq.compute.controlPlane && sysReq.compute.workers &&
            appInstance.selectedComponents.has('kubernetes')) {

            // Extrahiere Kubernetes-Konfiguration aus controlPlane + workers
            const controlPlane = sysReq.compute.controlPlane;
            const workers = sysReq.compute.workers;

            configs.kubernetes = {
                nodes: workers.count || 3,
                cpuPerNode: workers.cpu || 4,
                ramPerNode: workers.ram || 16,
                _controlPlane: {
                    cpu: controlPlane.cpu || 2,
                    ram: controlPlane.ram || 4,
                    nodes: controlPlane.nodes || 1
                }
            };
        }
        // Compute (nur wenn compute auch wirklich als Komponente gewählt ist)
        else if (sysReq.compute && appInstance.selectedComponents.has('compute')) {
            // Prüfen ob verschachtelte Struktur (z.B. Apache Airflow oder controlPlane/workers OHNE kubernetes)
            if (sysReq.compute.webserver || sysReq.compute.scheduler ||
                (sysReq.compute.workers && !appInstance.selectedComponents.has('kubernetes')) ||
                sysReq.compute.controlPlane) {
                const vmGroups = [];

                // Control Plane (nur wenn KEIN kubernetes gewählt)
                if (sysReq.compute.controlPlane && !appInstance.selectedComponents.has('kubernetes')) {
                    const cp = sysReq.compute.controlPlane;
                    const cpNodes = cp.nodes || 1;
                    vmGroups.push({
                        name: 'Control Plane',
                        cpu: cp.cpu || 2,
                        ram: cp.ram || 4,
                        count: cpNodes
                    });
                }

                // Webserver
                if (sysReq.compute.webserver) {
                    const ws = sysReq.compute.webserver;
                    const wsNodes = ws.nodes || 1;
                    vmGroups.push({
                        name: 'Webserver',
                        cpu: ws.cpu || 2,
                        ram: ws.ram || 4,
                        count: wsNodes
                    });
                }

                // Scheduler
                if (sysReq.compute.scheduler) {
                    const sc = sysReq.compute.scheduler;
                    const scNodes = sc.nodes || 1;
                    vmGroups.push({
                        name: 'Scheduler',
                        cpu: sc.cpu || 2,
                        ram: sc.ram || 4,
                        count: scNodes
                    });
                }

                // Workers (nur wenn KEIN kubernetes gewählt)
                if (sysReq.compute.workers && !appInstance.selectedComponents.has('kubernetes')) {
                    const wk = sysReq.compute.workers;
                    const wkCount = typeof wk.count === 'string' ? parseInt(wk.count) || 1 : (wk.count || 1);
                    vmGroups.push({
                        name: 'Workers',
                        cpu: wk.cpu || 4,
                        ram: wk.ram || 8,
                        count: wkCount
                    });
                }

                configs.compute = {
                    vmGroups: vmGroups
                };
            } else {
                // Check if Multi-VM structure (e.g., Graylog with graylog, elasticsearch, mongodb)
                const vmTypes = [];

                for (const [key, value] of Object.entries(sysReq.compute)) {
                    if (value && typeof value === 'object' && (value.cpu || value.ram)) {
                        // Check if this VM is a database
                        const dbComponentId = this.getDatabaseComponentId(key);

                        if (dbComponentId) {
                            // Only skip if the corresponding database component is in the app's original selectedComponents
                            // This means the user wants a Managed Database Service instead of a VM
                            if (appInstance.selectedComponents.has(dbComponentId)) {
                                continue;
                            }
                        }

                        vmTypes.push({ key, config: value });
                    }
                }

                if (vmTypes.length > 1) {
                    // Multi-VM structure
                    const firstVM = vmTypes[0];
                    const firstConfig = firstVM.config;

                    // Determine instances (HA takes precedence if not multi-role)
                    let instances = firstConfig.nodes || firstConfig.count || 1;
                    let haType = null;

                    if (sysReq.ha) {
                        const haConfig = this.extractHAConfig(sysReq.ha);
                        if (haConfig && haConfig.nodeCount > 1 && !haConfig.hasMultipleRoles) {
                            instances = haConfig.nodeCount;
                            haType = haConfig.haType;
                        }
                    }

                    configs.compute = {
                        cpu: firstConfig.cpu || 2,
                        ram: firstConfig.ram || 4,
                        instances: instances,
                        _vmTypeName: this.formatVMTypeName(firstVM.key)
                    };
                    if (haType) {
                        configs.compute._haType = haType;
                    }

                    // Create additional compute instances for remaining VMs
                    for (let i = 1; i < vmTypes.length; i++) {
                        const vmType = vmTypes[i];
                        const vmConfig = vmType.config;
                        const instanceId = `compute-${i + 1}`;

                        // Determine instances (HA takes precedence if not multi-role)
                        let instances = vmConfig.nodes || vmConfig.count || 1;
                        let haType = null;

                        if (sysReq.ha) {
                            const haConfig = this.extractHAConfig(sysReq.ha);
                            if (haConfig && haConfig.nodeCount > 1 && !haConfig.hasMultipleRoles) {
                                instances = haConfig.nodeCount;
                                haType = haConfig.haType;
                            }
                        }

                        configs[instanceId] = {
                            cpu: vmConfig.cpu || 2,
                            ram: vmConfig.ram || 4,
                            instances: instances,
                            _vmTypeName: this.formatVMTypeName(vmType.key)
                        };
                        if (haType) {
                            configs[instanceId]._haType = haType;
                        }
                    }
                } else if (vmTypes.length === 1) {
                    // Single VM type but structured (e.g., { graylog: { cpu: 4, ram: 8 } })
                    const vmType = vmTypes[0];
                    const vmConfig = vmType.config;

                    let instances = vmConfig.nodes || vmConfig.count || 1;
                    let haType = null;

                    if (sysReq.ha) {
                        const haConfig = this.extractHAConfig(sysReq.ha);
                        if (haConfig && haConfig.nodeCount > 1) {
                            instances = haConfig.nodeCount;
                            haType = haConfig.haType;
                        }
                    }

                    configs.compute = {
                        cpu: vmConfig.cpu || 2,
                        ram: vmConfig.ram || 4,
                        instances: instances,
                        _vmTypeName: this.formatVMTypeName(vmType.key)
                    };
                    if (haType) {
                        configs.compute._haType = haType;
                    }
                } else {
                    // Simple structure (cpu/ram directly on compute)
                    let instanceCount = sysReq.compute.nodes || 1;
                    let haType = null;

                    // Wenn kubernetes auch gewählt: compute-Specs = Worker Nodes → node count aus sysReq.nodes
                    if (appInstance.selectedComponents.has('kubernetes') && sysReq.nodes) {
                        const nodeMatch = sysReq.nodes.toString().match(/(\d+)/);
                        if (nodeMatch) instanceCount = parseInt(nodeMatch[1]);
                    }

                    if (sysReq.ha) {
                        const haConfig = this.extractHAConfig(sysReq.ha);
                        if (haConfig && haConfig.nodeCount > 1) {
                            instanceCount = haConfig.nodeCount;
                            haType = haConfig.haType;
                        }
                    }

                    configs.compute = {
                        cpu: sysReq.compute.cpu,
                        ram: sysReq.compute.ram,
                        instances: instanceCount
                    };
                    if (haType) {
                        configs.compute._haType = haType;
                    }
                }
            }
        }

        // Database
        // Prüfe ob explizite Database-Definition vorhanden ist ODER ob Database-VMs im Compute-Block sind
        let dbFromCompute = null;
        if (!sysReq.database && sysReq.compute) {
            // Suche nach Database-VMs im Compute-Block
            for (const [key, value] of Object.entries(sysReq.compute)) {
                if (value && typeof value === 'object' && (value.cpu || value.ram)) {
                    const dbComponentId = this.getDatabaseComponentId(key);
                    if (dbComponentId && appInstance.selectedComponents.has(dbComponentId)) {
                        // Gefunden: MongoDB, PostgreSQL, etc. im Compute-Block
                        dbFromCompute = {
                            key: key,
                            config: value,
                            componentId: dbComponentId
                        };
                        break;
                    }
                }
            }
        }

        if (sysReq.database || dbFromCompute) {
            let dbTypeString, dbSize;

            if (dbFromCompute) {
                // Datenbank-Typ und Größe aus Compute-Config ableiten
                dbTypeString = dbFromCompute.key; // z.B. "mongodb"
                dbSize = 100; // Default
            } else {
                dbTypeString = sysReq.database.type || 'PostgreSQL';
                dbSize = this.parseDBSize(sysReq.database.size);
            }

            let dbType = 'PostgreSQL';

            // DB-Typ bestimmen
            if (dbTypeString.toLowerCase().includes('mysql')) dbType = 'MySQL';
            else if (dbTypeString.toLowerCase().includes('mssql') ||
                     dbTypeString.toLowerCase().includes('sql server')) dbType = 'MS SQL Server';
            else if (dbTypeString.toLowerCase().includes('oracle')) dbType = 'Oracle';
            else if (dbTypeString.toLowerCase().includes('mongodb')) dbType = 'MongoDB';

            // HA-Erkennung (wie im Single-App-Modus)
            let isHA = dbTypeString.toLowerCase().includes('ha') ||
                       dbTypeString.toLowerCase().includes('cluster') ||
                       dbTypeString.toLowerCase().includes('replication');
            let haNodes = 2; // Default HA nodes

            // Check für SQL-Nodes in Compute (z.B. Citrix CVAD)
            if (!isHA && sysReq.compute && sysReq.compute.sql && sysReq.compute.sql.nodes > 1) {
                isHA = true;
                haNodes = sysReq.compute.sql.nodes;
            }

            // Wenn App-Level HA existiert, sollte DB auch HA sein
            if (!isHA && sysReq.ha) {
                const haConfig = this.extractHAConfig(sysReq.ha);
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
                configs.database_nosql = {
                    nosqlType: dbType,
                    nosqlSize: dbSize
                };

                if (isHA) {
                    const haMatch = dbTypeString.match(/\((.*?)\)/);
                    let haType = haMatch ? haMatch[1] : null;
                    if (!haType && sysReq.ha) {
                        const appHA = this.extractHAConfig(sysReq.ha);
                        haType = appHA?.haType || 'Replica Set';
                    }
                    const nosqlHANodes = haNodes > 2 ? haNodes : 3; // NoSQL meist mindestens 3 Nodes
                    configs.database_nosql._haType = haType || 'Replica Set';
                    configs.database_nosql._haNodes = nosqlHANodes;

                    // Zusätzliche Instanzen für HA
                    for (let i = 2; i <= nosqlHANodes; i++) {
                        configs[`database_nosql-${i}`] = {
                            nosqlType: dbType,
                            nosqlSize: dbSize,
                            _haType: configs.database_nosql._haType,
                            _haNodes: nosqlHANodes,
                            _isHAReplica: true
                        };
                    }
                }
            } else {
                configs.database_sql = {
                    dbType: dbType,
                    dbSize: dbSize
                };

                if (isHA) {
                    const haMatch = dbTypeString.match(/\((.*?)\)/);
                    let haType = haMatch ? haMatch[1] : null;
                    if (!haType && sysReq.ha) {
                        const appHA = this.extractHAConfig(sysReq.ha);
                        haType = appHA?.haType || 'HA';
                    }
                    configs.database_sql._haType = haType || 'HA';
                    configs.database_sql._haNodes = haNodes;

                    // Zusätzliche Instanzen für HA
                    for (let i = 2; i <= haNodes; i++) {
                        configs[`database_sql-${i}`] = {
                            dbType: dbType,
                            dbSize: dbSize,
                            _haType: configs.database_sql._haType,
                            _haNodes: haNodes,
                            _isHAReplica: true
                        };
                    }
                }
            }
        }

        // Storage
        if (sysReq.storage) {
            let storageType = 'ssd'; // Default lowercase für blockType
            if (typeof sysReq.storage.type === 'string') {
                if (sysReq.storage.type.toLowerCase().includes('nvme')) storageType = 'nvme';
                else if (sysReq.storage.type.toLowerCase().includes('hdd')) storageType = 'hdd';
                else if (sysReq.storage.type.toLowerCase().includes('ssd')) storageType = 'ssd';
            }

            // Storage-Größe mit TB/GB Konvertierung
            const parseStorageSize = (sizeString) => {
                if (!sizeString) return 500;
                // Match Zahl mit optionaler Einheit (TB, GB, PB)
                const match = sizeString.toString().match(/([\d.]+)\s*(TB|GB|PB)?/i);
                if (!match) return parseInt(sizeString) || 500;

                const value = parseFloat(match[1]);
                const unit = match[2] ? match[2].toUpperCase() : 'GB';

                // Konvertiere alles zu GB
                if (unit === 'TB') return Math.round(value * 1024);
                if (unit === 'PB') return Math.round(value * 1024 * 1024);
                return Math.round(value);
            };

            configs.storage_block = {
                blockType: storageType,  // ✅ Korrekt: blockType statt type
                blockSize: parseStorageSize(sysReq.storage.size)  // ✅ Korrekt: blockSize statt size
            };
        }

        // Fallback: Wenn Database/Storage-Komponenten in selectedComponents sind, aber keine Config erstellt wurde
        // (z.B. bei Kubernetes Microservices ohne explizite DB-Definition in systemRequirements)
        if (appInstance.selectedComponents.has('database_sql') && !configs.database_sql) {
            configs.database_sql = {
                dbType: 'PostgreSQL',
                dbSize: 100
            };
        }
        if (appInstance.selectedComponents.has('database_nosql') && !configs.database_nosql) {
            configs.database_nosql = {
                nosqlType: 'MongoDB',
                nosqlSize: 100
            };
        }
        if (appInstance.selectedComponents.has('storage_block') && !configs.storage_block) {
            configs.storage_block = {
                type: 'SSD',
                size: 500
            };
        }
        if (appInstance.selectedComponents.has('storage_object') && !configs.storage_object) {
            configs.storage_object = {
                size: 1000
            };
        }
        // Kubernetes: Falls kubernetes in selectedComponents, aber noch keine Config gesetzt
        // Design: kubernetes = immer nur Control Plane; Worker Nodes = immer compute
        if (appInstance.selectedComponents.has('kubernetes') && !configs.kubernetes) {
            const computeHandlesWorkers = appInstance.selectedComponents.has('compute');
            configs.kubernetes = {
                controlPlaneOnly: computeHandlesWorkers
            };
        }

        // Aktualisiere selectedComponents und componentConfigs
        // Infrastruktur-Komponenten (compute*, database*, storage*, kubernetes) werden durch configs ersetzt
        // Andere Komponenten (loadbalancer, dns, etc.) werden beibehalten

        // 1. Sammle alle konfigurierten Komponenten aus configs
        const configuredComponentIds = Object.keys(configs).filter(key => {
            // Filtere interne Keys aus (beginnen mit _)
            return !key.startsWith('_');
        });

        // 2. Definiere welche Komponenten als "Infrastruktur" gelten und ersetzt werden sollen
        const infrastructureComponentPrefixes = ['compute', 'database_sql', 'database_nosql', 'storage_block', 'storage_object', 'kubernetes', 'serverless'];

        // 3. Behalte nur Nicht-Infrastruktur-Komponenten aus der ursprünglichen Liste
        const originalNonInfraComponents = Array.from(appInstance.selectedComponents).filter(compId => {
            return !infrastructureComponentPrefixes.some(prefix => compId.startsWith(prefix));
        });

        // 4. Erstelle neue componentConfigs: Alte configs für non-infra, neue configs für infra
        const newComponentConfigs = {};

        // Kopiere configs für Nicht-Infrastruktur-Komponenten aus den alten configs
        for (const compId of originalNonInfraComponents) {
            if (appInstance.componentConfigs[compId]) {
                newComponentConfigs[compId] = appInstance.componentConfigs[compId];
            }
        }

        // Füge neue configs für Infrastruktur-Komponenten hinzu
        Object.assign(newComponentConfigs, configs);

        appInstance.componentConfigs = newComponentConfigs;

        // Konvertiere configs ins neue Array-Format für die Analyseengine
        appInstance.systemConfig = {
            config: this.convertConfigsToAnalysisFormat(configs),
            sizing: this.getSizeLabel(sizing)
        };

        // 5. Kombiniere: Konfigurierte Infrastruktur-Komponenten + ursprüngliche Nicht-Infrastruktur-Komponenten
        appInstance.selectedComponents = new Set([...configuredComponentIds, ...originalNonInfraComponents]);
    },

    /**
     * Konvertiert Legacy-Config-Format ins neue Array-Format für die Analyseengine
     */
    convertConfigsToAnalysisFormat(configs) {
        const converted = {};

        // Compute: Sammle alle compute* Einträge und konvertiere zu vmGroups
        const computeEntries = Object.entries(configs).filter(([key]) =>
            key === 'compute' || key.startsWith('compute-')
        );

        if (computeEntries.length > 0) {
            converted.compute = { vmGroups: [] };

            computeEntries.forEach(([key, config]) => {
                if (config.cpu && config.ram) {
                    const count = config.instances || 1;
                    // Jeder compute-Eintrag repräsentiert eine VM-Gruppe
                    // compute, compute-2, compute-3 etc. sind verschiedene VM-Typen
                    converted.compute.vmGroups.push({
                        cpu: config.cpu,
                        ram: config.ram,
                        count: count
                    });
                }
            });
        }

        // Database SQL: Sammle alle database_sql* Einträge
        const sqlEntries = Object.entries(configs).filter(([key]) =>
            key === 'database_sql' || key.startsWith('database_sql-')
        );

        if (sqlEntries.length > 0) {
            converted.database = { databases: [] };

            // Jeder Eintrag ist eine separate Datenbank (oder HA-Replica)
            sqlEntries.forEach(([key, config]) => {
                // Überspringe HA-Replicas (werden über haNodes des Haupt-Eintrags verwaltet)
                if (config._isHAReplica) return;

                const haNodes = config._haNodes || 1;

                // Füge Haupt-DB hinzu
                converted.database.databases.push({
                    type: config.dbType || 'PostgreSQL',
                    size: config.dbSize || 100
                });

                // Für HA-Setups: Füge Replica-DBs hinzu (falls haNodes > 1)
                for (let i = 2; i <= haNodes; i++) {
                    converted.database.databases.push({
                        type: config.dbType || 'PostgreSQL',
                        size: config.dbSize || 100
                    });
                }
            });
        }

        // Database NoSQL: Sammle alle database_nosql* Einträge
        const nosqlEntries = Object.entries(configs).filter(([key]) =>
            key === 'database_nosql' || key.startsWith('database_nosql-')
        );

        if (nosqlEntries.length > 0) {
            converted.nosql = { instances: [] };

            // Jeder Eintrag ist eine separate NoSQL-Datenbank (oder HA-Replica)
            nosqlEntries.forEach(([key, config]) => {
                // Überspringe HA-Replicas
                if (config._isHAReplica) return;

                const haNodes = config._haNodes || 1;

                // Füge Haupt-DB hinzu
                converted.nosql.instances.push({
                    type: config.nosqlType || 'MongoDB',
                    size: config.nosqlSize || 100
                });

                // Für HA-Setups: Füge Replica-DBs hinzu
                for (let i = 2; i <= haNodes; i++) {
                    converted.nosql.instances.push({
                        type: config.nosqlType || 'MongoDB',
                        size: config.nosqlSize || 100
                    });
                }
            });
        }

        // Storage Block: Sammle alle storage_block* Einträge
        const storageEntries = Object.entries(configs).filter(([key]) =>
            key === 'storage_block' || key.startsWith('storage_block-')
        );

        if (storageEntries.length > 0) {
            converted.storage = { volumes: [] };

            // Jeder storage_block Eintrag ist ein separates Volume
            storageEntries.forEach(([key, config]) => {
                converted.storage.volumes.push({
                    type: config.blockType || 'ssd',
                    size: config.blockSize || 200
                });
            });
        }

        // Storage Object
        if (configs.storage_object) {
            converted.objectStorage = {
                size: configs.storage_object.objectSize || 1000
            };
        }

        // Kubernetes
        if (configs.kubernetes) {
            converted.kubernetes = {
                controlPlaneOnly: configs.kubernetes.controlPlaneOnly || false,
                clusters: [{
                    nodes: configs.kubernetes.nodes ?? 3,
                    cpuPerNode: configs.kubernetes.cpuPerNode || 4,
                    ramPerNode: configs.kubernetes.ramPerNode || 16
                }]
            };
        }

        // Serverless
        if (configs.serverless) {
            converted.serverless = {
                instances: [{
                    functions: configs.serverless.functions || 10,
                    invocationsPerMonth: configs.serverless.invocationsPerMonth || 1000000
                }]
            };
        }

        // Messaging
        if (configs.messaging) {
            converted.messaging = {
                instances: [{
                    type: configs.messaging.type || 'Standard',
                    messagesPerMonth: configs.messaging.messagesPerMonth || 1000000
                }]
            };
        }

        // Cache
        if (configs.cache) {
            converted.cache = configs.cache;
        }

        // Users (für Legacy-Berechnungen)
        if (configs.users) {
            converted.users = configs.users;
        }

        return converted;
    },

    /**
     * Rendert die App-Mapping-Tabelle (Step 1)
     */
    renderAppMappingTable(parsedApps) {
        const tbody = document.getElementById('appMappingTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        parsedApps.forEach((parsed, index) => {
            const row = document.createElement('tr');
            row.dataset.appId = parsed.instance.id;

            // # Spalte
            const numCell = document.createElement('td');
            numCell.textContent = index + 1;
            row.appendChild(numCell);

            // User Input (editierbar)
            const nameCell = document.createElement('td');
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.value = parsed.userInput;
            nameInput.className = 'app-name-input';
            nameInput.dataset.appId = parsed.instance.id;
            nameInput.addEventListener('change', (e) => {
                const appId = e.target.dataset.appId;
                const appToUpdate = this.applications.find(a => a.id === appId);
                if (appToUpdate) {
                    appToUpdate.name = e.target.value;
                }
            });
            nameCell.appendChild(nameInput);
            row.appendChild(nameCell);

            // App-Typ Autocomplete
            const typeCell = document.createElement('td');
            typeCell.style.position = 'relative';

            // Wrapper für Input + Dropdown
            const typeWrapper = document.createElement('div');
            typeWrapper.className = 'app-type-autocomplete-wrapper';
            typeWrapper.style.position = 'relative';

            // Input-Feld
            const typeInput = document.createElement('input');
            typeInput.type = 'text';
            typeInput.className = 'app-type-input';
            typeInput.dataset.appId = parsed.instance.id;
            typeInput.autocomplete = 'off';
            typeInput.placeholder = 'Anwendung auswählen...';

            // Aktuellen Wert setzen
            if (parsed.selected) {
                typeInput.value = parsed.selected.app.name;
                typeInput.dataset.selectedId = parsed.selected.id;
            } else {
                typeInput.value = 'Benutzerdefiniert';
                typeInput.dataset.selectedId = 'custom';
            }

            // Dropdown Container
            const typeDropdown = document.createElement('div');
            typeDropdown.className = 'app-type-dropdown';
            typeDropdown.dataset.appId = parsed.instance.id;

            typeWrapper.appendChild(typeInput);
            typeWrapper.appendChild(typeDropdown);
            typeCell.appendChild(typeWrapper);

            // Event Listeners für Autocomplete
            typeInput.addEventListener('focus', () => {
                this.showAppTypeDropdown(typeInput, typeDropdown, parsed.suggestions);
            });

            typeInput.addEventListener('input', () => {
                this.filterAppTypeDropdown(typeInput, typeDropdown, parsed.suggestions);
            });

            typeInput.addEventListener('keydown', (e) => {
                this.handleAppTypeKeyboard(e, typeInput, typeDropdown);
            });

            // Click außerhalb schließt Dropdown
            document.addEventListener('click', (e) => {
                if (!typeWrapper.contains(e.target)) {
                    typeDropdown.classList.remove('visible');
                }
            }, { once: false });

            row.appendChild(typeCell);

            // Sizing Dropdown
            const sizingCell = document.createElement('td');
            const sizingSelect = document.createElement('select');
            sizingSelect.className = 'app-sizing-select';
            sizingSelect.dataset.appId = parsed.instance.id;

            ['small', 'medium', 'large'].forEach(size => {
                const opt = document.createElement('option');
                opt.value = size;
                opt.textContent = size === 'small' ? 'Klein (1-100 User)' :
                                 size === 'medium' ? 'Mittel (100-500 User)' :
                                 'Groß (500+ User)';
                if (size === parsed.detectedSizing.sizing) opt.selected = true;
                sizingSelect.appendChild(opt);
            });

            sizingSelect.addEventListener('change', (e) => this.onAppSizingChange(e));
            sizingCell.appendChild(sizingSelect);
            row.appendChild(sizingCell);

            // Konfidenz
            const confCell = document.createElement('td');
            if (parsed.selected) {
                const confidence = Math.round(parsed.selected.confidence * 100);
                const confClass = confidence > 80 ? 'high' : confidence > 60 ? 'medium' : 'low';
                confCell.innerHTML = `
                    <div class="confidence-badge ${confClass}">${confidence}%</div>
                    <div class="match-reason">${this.escapeHtml(parsed.selected.reason)}</div>
                `;
            } else {
                confCell.innerHTML = '<div class="confidence-badge low">Manual</div>';
            }
            row.appendChild(confCell);

            // Aktionen
            const actionsCell = document.createElement('td');
            actionsCell.innerHTML = `
                <button class="icon-btn" onclick="app.removeAppFromMapping('${parsed.instance.id}')" title="Entfernen">
                    🗑️
                </button>
            `;
            row.appendChild(actionsCell);

            tbody.appendChild(row);
        });

        this.updateMappingSummary();
    },

    /**
     * Event Handler: App-Typ wurde geändert
     */
    onAppTypeChange(event) {
        const appId = event.target.dataset.appId;
        const newType = event.target.value;
        const appIndex = this.applications.findIndex(a => a.id === appId);

        if (appIndex === -1) return;

        const app = this.applications[appIndex];
        app.type = newType === 'custom' ? null : newType;
        app.isCustom = newType === 'custom';

        if (newType !== 'custom' && knownApplications[newType]) {
            app.applicationData = knownApplications[newType];
            app.selectedComponents = new Set(knownApplications[newType].components || []);
            this.initComponentConfigsFromSystemRequirements(
                app.applicationData,
                app.sizing,
                app
            );
        } else {
            app.applicationData = null;
            app.selectedComponents = new Set();
            app.componentConfigs = {};
        }
    },

    /**
     * Event Handler: Sizing wurde geändert
     */
    onAppSizingChange(event) {
        const appId = event.target.dataset.appId;
        const newSizing = event.target.value;
        const appIndex = this.applications.findIndex(a => a.id === appId);

        if (appIndex === -1) return;

        const app = this.applications[appIndex];
        app.sizing = newSizing;

        if (app.applicationData) {
            this.initComponentConfigsFromSystemRequirements(
                app.applicationData,
                app.sizing,
                app
            );
        }
    },

    /**
     * Zeigt das Autocomplete-Dropdown für App-Typ
     */
    showAppTypeDropdown(input, dropdown, suggestions) {
        this.filterAppTypeDropdown(input, dropdown, suggestions);

        // Positioniere Dropdown relativ zum Input (fixed positioning)
        const rect = input.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom + 2}px`;
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.width = `${rect.width}px`;

        dropdown.classList.add('visible');
    },

    /**
     * Filtert das Autocomplete-Dropdown basierend auf Eingabe
     */
    filterAppTypeDropdown(input, dropdown, suggestions) {
        const filter = input.value.toLowerCase().trim();
        const allApps = Object.entries(knownApplications);

        // Position aktualisieren (für scroll/resize)
        if (dropdown.classList.contains('visible')) {
            const rect = input.getBoundingClientRect();
            dropdown.style.top = `${rect.bottom + 2}px`;
            dropdown.style.left = `${rect.left}px`;
            dropdown.style.width = `${rect.width}px`;
        }

        // Apps filtern mit Fuzzy-Matching
        let filteredApps;
        if (!filter) {
            filteredApps = allApps;
        } else {
            // Exakte und Teilstring-Matches
            const exactMatches = allApps.filter(([id, app]) => {
                const name = app.name.toLowerCase();
                const idLower = id.toLowerCase();
                return name.includes(filter) || idLower.includes(filter);
            });

            // Fuzzy-Matches (für Tippfehler)
            const fuzzyMatches = [];
            if (filter.length >= 3) { // Nur bei mind. 3 Zeichen
                allApps.forEach(([id, app]) => {
                    // Skip wenn schon in exactMatches
                    if (exactMatches.some(([matchId]) => matchId === id)) return;

                    // Prüfe Ähnlichkeit mit einzelnen Wörtern im Namen
                    // Split nach Leerzeichen UND Sonderzeichen wie /, -, ( etc.
                    const nameWords = app.name.toLowerCase().split(/[\s\/\-\(\)]+/);
                    const idWords = id.toLowerCase().split(/[-_]/);
                    const allWords = [...nameWords, ...idWords];

                    let maxSimilarity = 0;

                    // Vergleiche Filter mit jedem Wort
                    allWords.forEach(word => {
                        if (word.length < 2) return; // Skip sehr kurze Wörter wie "s", "a"

                        // Vollständiger Vergleich
                        let similarity = this.calculateSimilarity(filter, word);

                        // Auch Substring-Vergleich (z.B. "superset" in "Apache Superset")
                        // mit Tippfehlertoleranz
                        if (word.length >= filter.length) {
                            // Prüfe alle Substrings der Länge des Filters
                            for (let i = 0; i <= word.length - filter.length; i++) {
                                const substring = word.substring(i, i + filter.length);
                                const substringSimilarity = this.calculateSimilarity(filter, substring);
                                similarity = Math.max(similarity, substringSimilarity);
                            }
                        }

                        maxSimilarity = Math.max(maxSimilarity, similarity);
                    });

                    // Niedrigerer Schwellwert für bessere Tippfehlertoleranz
                    if (maxSimilarity > 0.6) { // 60% Ähnlichkeit
                        fuzzyMatches.push([id, app, maxSimilarity]);
                    }
                });
                fuzzyMatches.sort((a, b) => b[2] - a[2]); // Sortiere nach Ähnlichkeit
            }

            filteredApps = [...exactMatches, ...fuzzyMatches.map(([id, app]) => [id, app])];
        }

        // Nach Relevanz sortieren: Vorschläge zuerst, dann alphabetisch
        filteredApps.sort((a, b) => {
            const aIsSuggestion = suggestions.some(s => s.id === a[0]);
            const bIsSuggestion = suggestions.some(s => s.id === b[0]);

            if (aIsSuggestion && !bIsSuggestion) return -1;
            if (!aIsSuggestion && bIsSuggestion) return 1;
            return a[1].name.localeCompare(b[1].name);
        });

        // HTML generieren
        if (filteredApps.length === 0) {
            dropdown.innerHTML = `
                <div class="app-type-dropdown-item" style="cursor: default; color: var(--text-secondary);">
                    Keine Anwendung gefunden
                </div>
            `;
        } else {
            dropdown.innerHTML = filteredApps.map(([id, app]) => {
                const isSuggestion = suggestions.some(s => s.id === id);
                const checkmark = isSuggestion ? ' ✓' : '';
                return `
                    <div class="app-type-dropdown-item" data-app-id="${id}">
                        <div class="app-type-dropdown-item-name">${app.name}${checkmark}</div>
                    </div>
                `;
            }).join('') + `
                <div class="app-type-dropdown-divider"></div>
                <div class="app-type-dropdown-item" data-app-id="custom">
                    <div class="app-type-dropdown-item-name">Benutzerdefiniert</div>
                </div>
            `;

            // Click-Handler für Items
            dropdown.querySelectorAll('.app-type-dropdown-item[data-app-id]').forEach(item => {
                item.addEventListener('click', () => {
                    const appId = item.dataset.appId;
                    const appData = appId === 'custom' ? null : knownApplications[appId];

                    // Update Input
                    input.value = appData ? appData.name : 'Benutzerdefiniert';
                    input.dataset.selectedId = appId;

                    // Trigger Change Event
                    const event = {
                        target: {
                            dataset: { appId: input.dataset.appId },
                            value: appId
                        }
                    };
                    this.onAppTypeChange(event);

                    dropdown.classList.remove('visible');
                });
            });
        }
    },

    /**
     * Keyboard-Navigation für App-Typ Autocomplete
     */
    handleAppTypeKeyboard(e, input, dropdown) {
        if (!dropdown.classList.contains('visible')) return;

        const items = dropdown.querySelectorAll('.app-type-dropdown-item[data-app-id]');
        if (items.length === 0) return;

        const currentIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            items.forEach((item, i) => item.classList.toggle('selected', i === newIndex));
            items[newIndex].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            items.forEach((item, i) => item.classList.toggle('selected', i === newIndex));
            items[newIndex].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter' && currentIndex >= 0) {
            e.preventDefault();
            items[currentIndex].click();
        } else if (e.key === 'Escape') {
            dropdown.classList.remove('visible');
        }
    },

    /**
     * Berechnet String-Ähnlichkeit (Levenshtein-basiert)
     */
    calculateSimilarity(s1, s2) {
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        const longerLength = longer.length;
        if (longerLength === 0) return 1.0;

        // Levenshtein-Distanz
        const distance = this.levenshteinDistance(longer, shorter);
        return (longerLength - distance) / longerLength;
    },

    /**
     * Berechnet Levenshtein-Distanz zwischen zwei Strings
     */
    levenshteinDistance(s1, s2) {
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
    },

    /**
     * App aus Mapping-Tabelle entfernen
     */
    removeAppFromMapping(appId) {
        const index = this.applications.findIndex(a => a.id === appId);
        if (index !== -1) {
            this.applications.splice(index, 1);
            const row = document.querySelector(`tr[data-app-id="${appId}"]`);
            if (row) row.remove();
            this.updateMappingSummary();
        }
    },

    /**
     * App aus Komponenten-Konfiguration entfernen (Tab)
     */
    removeAppFromConfig(appId) {
        if (this.applications.length <= 1) {
            alert('Sie müssen mindestens eine Anwendung behalten.');
            return;
        }

        const index = this.applications.findIndex(a => a.id === appId);
        if (index === -1) return;

        const appName = this.applications[index].name;
        if (!confirm(`Möchten Sie "${appName}" wirklich entfernen?`)) {
            return;
        }

        // Entferne die App
        this.applications.splice(index, 1);

        // Passe currentAppIndex an
        if (this.currentAppIndex >= this.applications.length) {
            this.currentAppIndex = this.applications.length - 1;
        }

        // Aktualisiere die Ansicht
        this.renderCurrentAppConfig();
    },

    /**
     * Mapping-Zusammenfassung aktualisieren
     */
    updateMappingSummary() {
        const totalCount = this.applications.length;
        const autoMatched = this.applications.filter(a => !a.isCustom).length;
        const customCount = this.applications.filter(a => a.isCustom).length;

        const totalEl = document.getElementById('totalAppsCount');
        const autoEl = document.getElementById('autoMatchedCount');
        const customEl = document.getElementById('customAppsCount');

        if (totalEl) totalEl.textContent = totalCount;
        if (autoEl) autoEl.textContent = autoMatched;
        if (customEl) customEl.textContent = customCount;
    },

    /**
     * Manuell eine neue App zur Mapping-Tabelle hinzufügen
     */
    addManualApp() {
        // Erstelle eine neue leere ApplicationInstance
        const newApp = new ApplicationInstance(
            null,
            'Neue Anwendung',
            null,
            'medium'
        );

        // Füge zur Liste hinzu
        this.applications.push(newApp);

        // Wenn wir in Step 1 (Mapping) sind, aktualisiere die Tabelle
        if (this.currentStep === 1) {
            // Erstelle parsed format für Rendering
            const parsedApps = this.applications.map(app => {
                const matches = this.appMatcher.matchApplication(app.name);
                const sizingInfo = this.sizingDetector.detectSizing(app.name);

                return {
                    userInput: app.name,
                    suggestions: matches,
                    selected: matches.length > 0 ? matches[0] : null,
                    detectedSizing: sizingInfo,
                    instance: app
                };
            });

            this.renderAppMappingTable(parsedApps);

            // Scroll zur neuen Zeile
            const tbody = document.getElementById('appMappingTableBody');
            if (tbody && tbody.lastElementChild) {
                tbody.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
        // Wenn wir in Step 2 (Komponenten) sind, wechsle zur neuen App
        else if (this.currentStep === 2) {
            // Setze Index auf die neue App
            this.currentAppIndex = this.applications.length - 1;

            // Rendere die Konfiguration für die neue App
            this.renderCurrentAppConfig();
        }
    },

    /**
     * Zur nächsten App navigieren
     */
    goToNextApp() {
        if (this.currentAppIndex < this.applications.length - 1) {
            this.currentAppIndex++;
            this.renderCurrentAppConfig();
        }
    },

    /**
     * Zur vorherigen App navigieren
     */
    goToPrevApp() {
        if (this.currentAppIndex > 0) {
            this.currentAppIndex--;
            this.renderCurrentAppConfig();
        }
    },

    /**
     * Rendert die Konfiguration der aktuellen App
     */
    renderCurrentAppConfig() {
        const app = this.applications[this.currentAppIndex];
        if (!app) return;

        // App-Header aktualisieren (editierbar)
        const nameEl = document.getElementById('currentAppName');
        if (nameEl) {
            nameEl.innerHTML = `
                <span class="app-name-text" style="cursor: pointer;" title="Klicken zum Umbenennen">${this.escapeHtml(app.name)}</span>
                <button class="edit-app-name-btn icon-btn" title="App umbenennen">✏️</button>
            `;

            // Event Listener für Edit-Button und Text
            const textEl = nameEl.querySelector('.app-name-text');
            const editBtn = nameEl.querySelector('.edit-app-name-btn');

            const startEdit = () => {
                const currentName = app.name;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentName;
                input.style.cssText = 'font-size: 1.5rem; font-weight: 600; padding: 0.25rem 0.5rem; border: 2px solid var(--btc-primary); border-radius: 4px; width: 300px;';

                // Ersetze Text durch Input
                textEl.replaceWith(input);
                editBtn.style.display = 'none';
                input.focus();
                input.select();

                const saveEdit = () => {
                    const newName = input.value.trim();
                    if (newName && newName !== currentName) {
                        app.name = newName;
                        this.renderCurrentAppConfig();
                        this.updateAppTabs();
                    } else {
                        this.renderCurrentAppConfig();
                    }
                };

                input.addEventListener('blur', saveEdit);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        saveEdit();
                    } else if (e.key === 'Escape') {
                        this.renderCurrentAppConfig();
                    }
                });
            };

            textEl.addEventListener('click', startEdit);
            editBtn.addEventListener('click', startEdit);
        }

        const metaEl = document.querySelector('.app-config-meta');
        if (metaEl) {
            const typeName = app.type && knownApplications[app.type] ?
                           knownApplications[app.type].name : 'Benutzerdefiniert';
            const sizeName = app.sizing === 'small' ? 'Klein' :
                           app.sizing === 'medium' ? 'Mittel' : 'Groß';
            metaEl.innerHTML = `
                <span class="meta-badge">Typ: ${this.escapeHtml(typeName)}</span>
                <span class="meta-badge">Größe: ${sizeName}</span>
            `;
        }

        // System Requirements anzeigen
        if (app.applicationData && app.applicationData.systemRequirements) {
            this.renderSystemRequirements(app.applicationData, app.sizing);
        }

        // Komponenten rendern
        this.renderComponents();

        // Navigation-Buttons aktualisieren
        this.updateAppNavigation();

        // Tabs aktualisieren
        this.updateAppTabs();
    },

    /**
     * App-Navigation-Buttons aktualisieren
     */
    updateAppNavigation() {
        const prevBtn = document.getElementById('prevAppBtn');
        const nextBtn = document.getElementById('nextAppBtn');
        const counter = document.getElementById('appCounter');

        if (prevBtn) {
            prevBtn.disabled = this.currentAppIndex === 0;
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentAppIndex === this.applications.length - 1;
        }

        if (counter) {
            counter.textContent = `${this.currentAppIndex + 1} von ${this.applications.length}`;
        }
    },

    /**
     * App-Tabs aktualisieren
     */
    updateAppTabs() {
        const tabsContainer = document.getElementById('appConfigTabs');
        if (!tabsContainer) return;

        tabsContainer.innerHTML = '';

        // Normale App-Tabs
        this.applications.forEach((app, index) => {
            const tab = document.createElement('div');
            tab.className = 'app-tab' + (index === this.currentAppIndex ? ' active' : '');
            tab.dataset.appId = app.id;
            tab.innerHTML = `
                <span class="tab-name">${this.escapeHtml(app.name)}</span>
                <span class="tab-badge">${app.selectedComponents.size}</span>
                <button class="tab-delete-btn" title="App entfernen">×</button>
            `;

            // Click handler für Tab (nicht für den Delete-Button)
            const tabName = tab.querySelector('.tab-name');
            const tabBadge = tab.querySelector('.tab-badge');
            tabName.addEventListener('click', () => {
                this.currentAppIndex = index;
                this.renderCurrentAppConfig();
            });
            tabBadge.addEventListener('click', () => {
                this.currentAppIndex = index;
                this.renderCurrentAppConfig();
            });

            // Click handler für Delete-Button
            const deleteBtn = tab.querySelector('.tab-delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeAppFromConfig(app.id);
            });

            tabsContainer.appendChild(tab);
        });

        // "+ Neue App" Tab hinzufügen
        const addTab = document.createElement('div');
        addTab.className = 'app-tab add-app-tab';
        addTab.innerHTML = `
            <span class="tab-name">+ Neue App</span>
        `;
        addTab.addEventListener('click', () => {
            this.addManualApp();
        });
        tabsContainer.appendChild(addTab);
    },

    /**
     * Helper: HTML escaping
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Helper: Size Label
     */
    getSizeLabel(sizing) {
        return sizing === 'small' ? 'Klein (1-100 User)' :
               sizing === 'medium' ? 'Mittel (100-500 User)' :
               'Groß (500+ User)';
    }
}

};
