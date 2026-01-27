/**
 * Sovereign Architecture Advisor - Analysis Engine
 * Cloud-Analyse und Empfehlungslogik mit TCO-Berechnung
 *
 * Version 2.0 - Mit echten Cloud-Preisdaten für deutsche Regionen
 */

class CloudAnalyzer {
    constructor(providers, components) {
        this.providers = providers;
        this.components = components;
        this.customScores = this.loadCustomScores();
        // Cloud Pricing Module laden (wenn verfügbar)
        this.cloudPricing = typeof CloudPricing !== 'undefined' ? CloudPricing : null;
    }

    /**
     * Gibt Pricing-Metadaten zurück (Version, Region, etc.)
     */
    getPricingInfo() {
        if (this.cloudPricing) {
            return {
                version: this.cloudPricing.version,
                lastUpdated: this.cloudPricing.lastUpdated,
                currency: this.cloudPricing.currency,
                regions: this.cloudPricing.regions,
                source: 'Cloud Pricing API (Frankfurt Region)'
            };
        }
        return {
            version: '1.0',
            source: 'Fallback-Faktoren',
            currency: 'EUR'
        };
    }

    /**
     * Lädt Custom Scores aus dem LocalStorage
     */
    loadCustomScores() {
        try {
            const stored = localStorage.getItem('saa_custom_provider_scores');
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error('Error loading custom scores:', e);
            return {};
        }
    }

    /**
     * Gibt den effektiven Score zurück (Custom oder Default)
     */
    getEffectiveScore(providerId, scoreType, defaultValue) {
        if (this.customScores[providerId] && this.customScores[providerId][scoreType] !== undefined) {
            return this.customScores[providerId][scoreType];
        }
        return defaultValue;
    }

    /**
     * Gibt den effektiven Price Factor zurück (Custom oder Default)
     */
    getEffectivePriceFactor(providerId) {
        if (this.customScores[providerId] && this.customScores[providerId].priceFactor !== undefined) {
            return this.customScores[providerId].priceFactor;
        }
        // Kein Custom-Wert vorhanden, verwende Default aus getConsumptionEstimate
        return null;
    }

    /**
     * Prüft ob Custom Scores aktiv sind
     */
    hasCustomScores() {
        return Object.keys(this.customScores).length > 0;
    }

    /**
     * Analysiert alle Clouds für die ausgewählten Komponenten
     * @param {Array} selectedComponentIds - Liste der ausgewählten Komponenten-IDs
     * @param {Object|number} weights - Entweder ein Objekt mit {control, performance, availability, cost} oder legacy strategyWeight (number)
     * @param {Object} systemConfig - Optionale System-Konfiguration für realistische Kostenberechnung
     * @param {Object} maturitySettings - Einstellungen für den Reife-Faktor
     * @param {Object} operationsSettings - Einstellungen für Betriebsaufwand
     * @param {Object} projectEffortSettings - Einstellungen für Projektaufwand
     */
    analyzeForComponents(selectedComponentIds, weights = { control: 25, performance: 25, availability: 35, cost: 15 }, systemConfig = null, maturitySettings = null, operationsSettings = null, projectEffortSettings = null) {
        // Legacy-Support: Wenn eine Zahl übergeben wird, in Gewichte umwandeln
        if (typeof weights === 'number') {
            const strategyWeight = weights;
            weights = {
                control: 100 - strategyWeight,
                performance: strategyWeight,
                availability: 0,
                cost: 0
            };
        }

        // Default Maturity Settings
        const maturity = maturitySettings || {
            enabled: true,
            previewPenalty: 2,
            missingPenalty: 3
        };

        // Default Operations Settings
        const operations = operationsSettings || {
            includeInCosts: true
        };

        // Default Project Effort Settings
        const projectEffort = projectEffortSettings || {
            includeInCosts: true
        };

        const requiredServices = this.getRequiredServices(selectedComponentIds);

        // Phase 1: Sammle TCO für alle Provider
        const providerData = this.providers.map(provider => {
            const serviceAnalysis = this.analyzeProviderServices(provider, requiredServices);
            const tcoEstimate = this.calculateTCO(provider, serviceAnalysis, requiredServices, systemConfig, operations, projectEffort);
            return { provider, serviceAnalysis, tcoEstimate };
        });

        // Alle monatlichen Kosten für relative Berechnung
        const allMonthlyCosts = providerData.map(d => d.tcoEstimate.monthlyEstimate || 0);

        // Phase 2: Berechne Scores mit relativen Kosten
        return providerData.map(data => {
            const score = this.calculateProviderScore(
                data.provider,
                data.serviceAnalysis,
                data.tcoEstimate,
                weights,
                allMonthlyCosts,
                maturity,
                operations,
                projectEffort
            );

            return {
                provider: data.provider,
                serviceAnalysis: data.serviceAnalysis,
                score,
                tcoEstimate: data.tcoEstimate,
                recommendation: this.generateRecommendation(data.provider, data.serviceAnalysis, score, data.tcoEstimate)
            };
        }).sort((a, b) => b.score.total - a.score.total);
    }

    /**
     * Ermittelt alle benötigten Services aus den Komponenten
     */
    getRequiredServices(componentIds) {
        const services = new Set();
        componentIds.forEach(compId => {
            const component = this.components.find(c => c.id === compId);
            if (component && component.requiredServices) {
                component.requiredServices.forEach(s => services.add(s));
            }
        });
        return Array.from(services);
    }

    /**
     * Analysiert die Services eines Providers mit detaillierten Ratings
     */
    analyzeProviderServices(provider, requiredServices) {
        const available = [];
        const preview = [];
        const missing = [];
        const planned = [];

        // Berechne Skalierungsfaktoren für Custom Scores vorab
        const providerControlCustom = this.getEffectiveScore(provider.id, 'control', provider.control);
        const providerPerformanceCustom = this.getEffectiveScore(provider.id, 'performance', provider.performance);
        const controlScaleFactor = provider.control > 0 ? providerControlCustom / provider.control : 1;
        const performanceScaleFactor = provider.performance > 0 ? providerPerformanceCustom / provider.performance : 1;

        requiredServices.forEach(serviceId => {
            const service = provider.services[serviceId];
            if (!service || !service.available) {
                const selfBuild = selfBuildOptions[serviceId];
                if (service && service.maturity === 'planned') {
                    planned.push({ id: serviceId, ...service, selfBuildOption: selfBuild });
                } else {
                    missing.push({
                        id: serviceId,
                        name: serviceId,
                        selfBuildOption: selfBuild
                    });
                }
            } else if (service.maturity === 'preview') {
                // Skaliere Service-Scores proportional zum Custom Score
                const scaledService = { ...service, id: serviceId };
                if (service.control !== undefined) {
                    scaledService.control = Math.min(100, Math.max(0, Math.round(service.control * controlScaleFactor)));
                }
                if (service.performance !== undefined) {
                    scaledService.performance = Math.min(100, Math.max(0, Math.round(service.performance * performanceScaleFactor)));
                }
                preview.push(scaledService);
            } else {
                // Skaliere Service-Scores proportional zum Custom Score
                const scaledService = { ...service, id: serviceId };
                if (service.control !== undefined) {
                    scaledService.control = Math.min(100, Math.max(0, Math.round(service.control * controlScaleFactor)));
                }
                if (service.performance !== undefined) {
                    scaledService.performance = Math.min(100, Math.max(0, Math.round(service.performance * performanceScaleFactor)));
                }
                available.push(scaledService);
            }
        });

        const coverage = requiredServices.length > 0
            ? (available.length + preview.length * 0.5) / requiredServices.length * 100
            : 100;

        const allServices = [...available, ...preview];

        // Berechne durchschnittliche Service-Level-Ratings (jetzt bereits skaliert)
        const baseAvgControl = allServices.length > 0
            ? allServices.reduce((sum, s) => sum + (s.control || 50), 0) / allServices.length
            : providerControlCustom;
        const baseAvgPerformance = allServices.length > 0
            ? allServices.reduce((sum, s) => sum + (s.performance || 50), 0) / allServices.length
            : providerPerformanceCustom;

        return {
            available,
            preview,
            missing,
            planned,
            coverage,
            totalRequired: requiredServices.length,
            avgServiceControl: Math.round(baseAvgControl),
            avgServicePerformance: Math.round(baseAvgPerformance)
        };
    }

    /**
     * Berechnet den Gesamt-Score basierend auf 4 Gewichtungsdimensionen
     * costScore wird relativ zu anderen Providern berechnet (günstigster = 100)
     * @param {Object} maturitySettings - Einstellungen für den Reife-Faktor {enabled, previewPenalty, missingPenalty}
     * @param {Object} operationsSettings - Einstellungen für Betriebsaufwand {includeInCosts}
     * @param {Object} projectEffortSettings - Einstellungen für Projektaufwand {includeInCosts}
     */
    calculateProviderScore(provider, serviceAnalysis, tcoEstimate, weights, allProvidersCosts = null, maturitySettings = null, operationsSettings = null, projectEffortSettings = null) {
        // Gewichte normalisieren (falls sie nicht 100 ergeben)
        const totalWeight = weights.control + weights.performance + weights.availability + weights.cost;
        const w = {
            control: (weights.control / totalWeight),
            performance: (weights.performance / totalWeight),
            availability: (weights.availability / totalWeight),
            cost: (weights.cost / totalWeight)
        };

        // Service-Level-basierte Berechnung (gewichteter Durchschnitt der Services)
        const serviceControlScore = serviceAnalysis.avgServiceControl;
        const servicePerformanceScore = serviceAnalysis.avgServicePerformance;

        // Custom Scores verwenden, falls vorhanden
        const providerControl = this.getEffectiveScore(provider.id, 'control', provider.control);
        const providerPerformance = this.getEffectiveScore(provider.id, 'performance', provider.performance);

        // Kombination aus Provider-Level und Service-Level (60% Service, 40% Provider)
        const combinedControl = (serviceControlScore * 0.6) + (providerControl * 0.4);
        const combinedPerformance = (servicePerformanceScore * 0.6) + (providerPerformance * 0.4);

        // Verfügbarkeit = Service-Coverage (0-100)
        const availabilityScore = serviceAnalysis.coverage;

        // Kosteneffizienz = Relativer Score (günstigster = 100, teuerster = 30)
        // Wird in zweiter Phase berechnet wenn allProvidersCosts vorhanden
        let costScore = 70; // Fallback
        const monthlyCost = tcoEstimate.monthlyEstimate || 0;

        if (allProvidersCosts && allProvidersCosts.length > 0) {
            const minCost = Math.min(...allProvidersCosts);
            const maxCost = Math.max(...allProvidersCosts);

            if (maxCost > minCost) {
                // Lineare Interpolation: günstigster = 100, teuerster = 30
                costScore = 100 - ((monthlyCost - minCost) / (maxCost - minCost)) * 70;
            } else {
                costScore = 100; // Alle gleich teuer
            }
        }

        // Gewichteter Gesamt-Score (alle 4 Dimensionen)
        const baseScore =
            (combinedControl * w.control) +
            (combinedPerformance * w.performance) +
            (availabilityScore * w.availability) +
            (costScore * w.cost);

        // Maturity-Faktor (konfigurierbar)
        const maturity = maturitySettings || { enabled: true, previewPenalty: 2, missingPenalty: 3 };
        let maturityFactor = 1.0;
        if (maturity.enabled) {
            const previewPenalty = serviceAnalysis.preview.length * (maturity.previewPenalty / 100);
            const missingPenalty = serviceAnalysis.missing.length * (maturity.missingPenalty / 100);
            maturityFactor = Math.max(0.7, 1 - previewPenalty - missingPenalty);
        }

        // Gesamt-Score
        const total = baseScore * maturityFactor;

        return {
            base: Math.round(baseScore * 10) / 10,
            coverage: serviceAnalysis.coverage,
            maturityFactor: Math.round(maturityFactor * 100) / 100,
            total: Math.round(total * 10) / 10,
            controlScore: Math.round(combinedControl),
            performanceScore: Math.round(combinedPerformance),
            availabilityScore: Math.round(availabilityScore),
            costScore: Math.round(costScore),
            monthlyCost: monthlyCost,
            serviceControlScore,
            servicePerformanceScore,
            weights: weights, // Für Transparenz speichern
            // Detail-Berechnungen für Transparenz
            weightedControl: Math.round(combinedControl * w.control * 10) / 10,
            weightedPerformance: Math.round(combinedPerformance * w.performance * 10) / 10,
            weightedAvailability: Math.round(availabilityScore * w.availability * 10) / 10,
            weightedCost: Math.round(costScore * w.cost * 10) / 10
        };
    }

    /**
     * Berechnet die TCO (Total Cost of Ownership) mit drei Dimensionen
     * @param {Object} systemConfig - Optionale System-Konfiguration für realistische Kostenberechnung
     * @param {Object} operationsSettings - Einstellungen für Betriebsaufwand
     * @param {Object} projectEffortSettings - Einstellungen für Projektaufwand
     */
    calculateTCO(provider, serviceAnalysis, requiredServices, systemConfig = null, operationsSettings = null, projectEffortSettings = null) {
        const allServices = [...serviceAnalysis.available, ...serviceAnalysis.preview];
        const missingServices = serviceAnalysis.missing;

        // Default Operations Settings
        const opSettings = operationsSettings || { includeInCosts: true };

        // Default Project Effort Settings
        const projSettings = projectEffortSettings || { includeInCosts: true };

        // Consumption Costs (Verbrauchskosten) - jetzt mit systemConfig
        const consumptionCosts = this.calculateConsumptionCosts(allServices, requiredServices, systemConfig, provider);

        // Operations Costs (Betriebsaufwand) - mit systemConfig für Skalierung
        const operationsCosts = this.calculateOperationsCosts(allServices, missingServices, systemConfig);
        operationsCosts.includedInCosts = opSettings.includeInCosts;

        // Project Effort (Projektaufwand) - mit systemConfig für Skalierung
        const projectEffortCalc = this.calculateProjectEffort(allServices, missingServices, systemConfig);
        projectEffortCalc.includedInCosts = projSettings.includeInCosts;

        // Self-Build Costs wenn Services fehlen
        const selfBuildEffort = this.calculateSelfBuildEffort(missingServices);

        // Gesamt-TCO-Level berechnen
        const tcoLevel = this.calculateTCOLevel(consumptionCosts, operationsCosts, projectEffortCalc, selfBuildEffort, opSettings.includeInCosts, projSettings.includeInCosts);

        return {
            consumption: consumptionCosts,
            operations: operationsCosts,
            projectEffort: projectEffortCalc,
            selfBuild: selfBuildEffort,
            totalLevel: tcoLevel,
            monthlyEstimate: this.estimateMonthlyTotal(consumptionCosts, operationsCosts, opSettings.includeInCosts),
            projectDaysEstimate: projectEffortCalc.totalDays + selfBuildEffort.totalDays
        };
    }

    /**
     * Berechnet Verbrauchskosten (Consumption) basierend auf systemConfig
     * Inkludiert auch Self-Build Services (VM-basiert, günstiger als PaaS)
     */
    calculateConsumptionCosts(services, requiredServices, systemConfig = null, provider = null) {
        const levelMap = { low: 1, medium: 2, high: 3 };
        let totalLevel = 0;
        let details = [];

        // Generische Service-Namen für bessere Anzeige
        const genericServiceNames = {
            'database_sql': 'SQL Datenbank',
            'database_nosql': 'NoSQL Datenbank',
            'compute': 'Compute',
            'kubernetes': 'Kubernetes',
            'serverless': 'Serverless',
            'storage_object': 'Object Storage',
            'storage_block': 'Block Storage',
            'storage_file': 'File Storage',
            'loadbalancer': 'Load Balancer',
            'cdn': 'CDN',
            'dns': 'DNS',
            'messaging': 'Messaging',
            'cache': 'Cache',
            'container_registry': 'Container Registry',
            'secrets': 'Secrets Management',
            'monitoring': 'Monitoring',
            'logging': 'Logging',
            'ai_ml': 'AI/ML',
            'identity': 'Identity Management'
        };

        services.forEach(service => {
            const level = levelMap[service.consumption] || 2;
            totalLevel += level;

            // Realistische Kostenschätzung basierend auf systemConfig
            const estimate = this.getConsumptionEstimate(service.id, service.consumption, systemConfig, provider);

            // Besserer Anzeigename: Generischer Name wenn verfügbar, sonst Service-Name
            const displayName = genericServiceNames[service.id] || service.name;

            details.push({
                id: service.id || service.name,
                name: displayName,
                level: service.consumption || 'medium',
                estimate: estimate.cost,
                breakdown: estimate.breakdown
            });
        });

        // Self-Build Services hinzufügen (VM-basiert, günstiger als PaaS)
        requiredServices.forEach(serviceId => {
            const isAvailable = services.some(s => s.id === serviceId);
            if (!isAvailable) {
                const selfBuildOption = selfBuildOptions[serviceId];
                if (selfBuildOption) {
                    // Self-Build nutzt VMs - deutlich günstiger als PaaS
                    // Basis: VM-Kosten (ca. 30-50% der PaaS-Kosten)
                    const estimate = this.getSelfBuildConsumptionEstimate(serviceId, systemConfig, provider);
                    const displayName = genericServiceNames[serviceId] || serviceId;

                    totalLevel += 1; // Self-Build zählt als "low" consumption
                    details.push({
                        id: serviceId,
                        name: `${displayName} (Self-Build)`,
                        level: 'low',
                        estimate: estimate.cost,
                        breakdown: estimate.breakdown,
                        isSelfBuild: true
                    });
                }
            }
        });

        const avgLevel = services.length > 0 || details.length > 0
            ? totalLevel / Math.max(services.length + (details.length - services.length), 1)
            : 2;
        const overallLevel = avgLevel <= 1.5 ? 'low' : avgLevel <= 2.5 ? 'medium' : 'high';

        return {
            level: overallLevel,
            avgScore: Math.round(avgLevel * 10) / 10,
            details,
            monthlyEstimate: details.reduce((sum, d) => sum + d.estimate, 0)
        };
    }

    /**
     * Schätzt monatliche Verbrauchskosten pro Service basierend auf systemConfig
     * Verwendet echte Cloud-Preisdaten aus dem CloudPricing Modul (Frankfurt Region)
     * @returns {Object} - { cost: number, breakdown: string, source: string }
     */
    getConsumptionEstimate(serviceId, level, systemConfig = null, provider = null) {
        const providerId = provider ? provider.id : null;

        // Basis-Fallback-Kosten (ohne systemConfig oder CloudPricing)
        const baseCosts = {
            compute: 200, kubernetes: 400, serverless: 80,
            database_sql: 250, database_nosql: 180,
            storage_object: 40, storage_block: 60, storage_file: 100,
            loadbalancer: 40, cdn: 30, dns: 8,
            messaging: 50, cache: 120, container_registry: 25,
            secrets: 15, monitoring: 60, logging: 50,
            ai_ml: 600, identity: 30
        };

        // Custom Price Factor verwenden, falls vorhanden
        const customFactor = this.getEffectivePriceFactor(providerId);
        const levelMultiplier = level === 'low' ? 0.7 : level === 'high' ? 1.5 : 1.0;

        // Versuche echte Preisdaten zu verwenden
        const useRealPricing = this.cloudPricing && providerId;
        const region = useRealPricing ? this.cloudPricing.getRegion(providerId) : null;

        // Wenn keine systemConfig vorhanden, Standard-Berechnung mit echten Preisen wenn möglich
        if (!systemConfig || !systemConfig.config) {
            let baseCost = baseCosts[serviceId] || 50;

            // Versuche echte Basispreise zu verwenden
            if (useRealPricing) {
                baseCost = this.getBaseServicePrice(serviceId, providerId) || baseCost;
            }

            // Custom Factor anwenden falls vorhanden
            const effectiveFactor = customFactor !== null ? customFactor : 1.0;
            return {
                cost: Math.round(baseCost * levelMultiplier * effectiveFactor),
                breakdown: region ? `${region.name} (${region.country})` : null,
                source: useRealPricing ? 'CloudPricing API' : 'Fallback'
            };
        }

        const config = systemConfig.config;
        let cost = 0;
        let breakdown = '';
        let source = 'Konfigurationsbasiert';

        // Realistische Kostenberechnung basierend auf Ressourcen
        switch (serviceId) {
            case 'compute':
                // Verwende CloudPricing wenn verfügbar
                const isSAP = config.database?.type?.toLowerCase().includes('hana') ||
                              config.database?.type?.toLowerCase().includes('sap');

                // Unterstützung für vmGroups (Multi-VM) und Legacy (einzelne VM)
                if (config.compute?.vmGroups && Array.isArray(config.compute.vmGroups)) {
                    let totalCost = 0;
                    let totalCPU = 0;
                    let totalRAM = 0;
                    let totalVMs = 0;
                    const instanceDetails = [];

                    config.compute.vmGroups.forEach(vm => {
                        const vmCPU = Number(vm.cpu) || 4;
                        const vmRAM = Number(vm.ram) || 16;
                        const vmCount = Number(vm.count) || 1;

                        // Echte Preise verwenden wenn verfügbar
                        if (useRealPricing) {
                            const priceResult = this.cloudPricing.calculateComputeCost(providerId, vmCPU, vmRAM, isSAP);
                            totalCost += priceResult.price * vmCount;
                            if (priceResult.instanceType) {
                                instanceDetails.push(`${vmCount}× ${priceResult.instanceType}`);
                            }
                            source = 'CloudPricing API';
                        } else {
                            // Fallback: Alte Berechnung
                            const ramPricePerGB = isSAP ? 18 : 11;
                            let vmCost = vmRAM * ramPricePerGB;
                            const cpuMinCost = vmCPU * 25;
                            vmCost = Math.max(vmCost, cpuMinCost);
                            totalCost += vmCost * vmCount;
                        }

                        totalCPU += vmCPU * vmCount;
                        totalRAM += vmRAM * vmCount;
                        totalVMs += vmCount;
                    });

                    cost = totalCost;
                    breakdown = instanceDetails.length > 0
                        ? `${instanceDetails.join(', ')}`
                        : `${totalCPU} vCPU, ${totalRAM} GB RAM (${totalVMs} VMs)${isSAP ? ' (SAP)' : ''}`;
                    if (region) breakdown += ` [${region.name}]`;
                } else {
                    // Legacy: Einzelne VM
                    const ramGB = config.compute?.ram || 16;
                    const cpuCores = config.compute?.cpu || 4;

                    if (useRealPricing) {
                        const priceResult = this.cloudPricing.calculateComputeCost(providerId, cpuCores, ramGB, isSAP);
                        cost = priceResult.price;
                        breakdown = priceResult.breakdown;
                        if (region) breakdown += ` [${region.name}]`;
                        source = 'CloudPricing API';
                    } else {
                        // Fallback
                        const ramPricePerGB = isSAP ? 18 : 11;
                        cost = ramGB * ramPricePerGB;
                        const cpuMinCost = cpuCores * 25;
                        cost = Math.max(cost, cpuMinCost);
                        breakdown = `${cpuCores} vCPU, ${ramGB} GB RAM${isSAP ? ' (SAP-zertifiziert)' : ''}`;
                    }
                }
                break;

            case 'database_sql':
                // Datenbank-Kosten mit echten Preisen
                if (config.database?.databases && Array.isArray(config.database.databases)) {
                    let totalCost = 0;
                    const breakdownParts = [];
                    const dbCount = config.database.databases.length;

                    config.database.databases.forEach(db => {
                        const dbType = db.type || 'PostgreSQL';
                        const dbSizeGB = db.size || 100;

                        if (useRealPricing) {
                            const priceResult = this.cloudPricing.calculateDatabaseCost(providerId, dbType, dbSizeGB, false);
                            totalCost += priceResult.price;
                            breakdownParts.push(priceResult.breakdown);
                            source = 'CloudPricing API';
                        } else {
                            // Fallback
                            let dbCost = 0;
                            if (dbType.toLowerCase().includes('hana')) {
                                const hanaRam = config.compute?.ram || 512;
                                dbCost = hanaRam * 8;
                            } else if (dbType.toLowerCase().includes('oracle')) {
                                dbCost = 500 + (dbSizeGB * 2);
                            } else {
                                dbCost = 80 + (dbSizeGB * 0.5);
                            }
                            totalCost += dbCost;
                            breakdownParts.push(`${dbType} ${dbSizeGB}GB`);
                        }
                    });

                    cost = totalCost;
                    breakdown = dbCount > 1
                        ? `${dbCount}× DBs: ${breakdownParts.join(', ')}`
                        : breakdownParts[0];
                    if (region) breakdown += ` [${region.name}]`;
                } else {
                    // Legacy: Einzelne DB
                    const dbType = config.database?.type || 'PostgreSQL';
                    const dbSizeStr = config.database?.size || '100 GB';
                    const dbSizeGB = parseInt(dbSizeStr) || 100;

                    if (useRealPricing) {
                        const priceResult = this.cloudPricing.calculateDatabaseCost(providerId, dbType, dbSizeGB, false);
                        cost = priceResult.price;
                        breakdown = priceResult.breakdown;
                        if (region) breakdown += ` [${region.name}]`;
                        source = 'CloudPricing API';
                    } else {
                        if (dbType.toLowerCase().includes('hana')) {
                            const hanaRam = config.compute?.ram || 512;
                            cost = hanaRam * 8;
                            breakdown = `${dbType} (${hanaRam} GB In-Memory)`;
                        } else if (dbType.toLowerCase().includes('oracle')) {
                            cost = 500 + (dbSizeGB * 2);
                            breakdown = `${dbType} (${dbSizeGB} GB)`;
                        } else {
                            cost = 80 + (dbSizeGB * 0.5);
                            breakdown = `${dbType} (${dbSizeGB} GB)`;
                        }
                    }
                }
                break;

            case 'database_nosql':
                // NoSQL Database mit echten Preisen
                if (config.nosql?.instances && Array.isArray(config.nosql.instances)) {
                    let totalCost = 0;
                    const breakdownParts = [];

                    config.nosql.instances.forEach((db, idx) => {
                        const nosqlType = db.type || 'MongoDB';
                        const nosqlSizeGB = db.size || 50;

                        // Echte NoSQL-Preise verwenden
                        let pricePerGB = 1.0;
                        if (useRealPricing && this.cloudPricing.database?.nosql?.[providerId]) {
                            // Preise aus CloudPricing verwenden
                            if (nosqlType.toLowerCase().includes('dynamo') && providerId === 'aws') {
                                pricePerGB = this.cloudPricing.database.nosql.aws.dynamodb.storagePerGB;
                            } else if (nosqlType.toLowerCase().includes('cosmos') && providerId === 'azure') {
                                pricePerGB = this.cloudPricing.database.nosql.azure.cosmosdb.storagePerGB;
                            } else if (nosqlType.toLowerCase().includes('firestore') && providerId === 'gcp') {
                                pricePerGB = this.cloudPricing.database.nosql.gcp.firestore.storagePerGB;
                            }
                            source = 'CloudPricing API';
                        } else {
                            // Fallback Preise
                            if (nosqlType.toLowerCase().includes('redis')) {
                                pricePerGB = 1.5;
                            } else if (nosqlType.toLowerCase().includes('cosmos')) {
                                pricePerGB = 1.8;
                            } else if (nosqlType.toLowerCase().includes('cassandra')) {
                                pricePerGB = 1.1;
                            }
                        }

                        const dbCost = Math.max(50, nosqlSizeGB * pricePerGB);
                        totalCost += dbCost;
                        breakdownParts.push(`${nosqlType} ${nosqlSizeGB}GB`);
                    });

                    cost = totalCost;
                    breakdown = config.nosql.instances.length > 1
                        ? `${config.nosql.instances.length}× DBs: ${breakdownParts.join(', ')}`
                        : breakdownParts[0];
                    if (region) breakdown += ` [${region.name}]`;
                } else {
                    // Fallback
                    cost = baseCosts[serviceId] || 180;
                    breakdown = 'NoSQL Datenbank';
                }
                break;

            case 'storage_object':
                // Object Storage mit echten Preisen
                const storageSizeRaw = config.objectStorage?.size || config.storage?.size || 500;
                let storageSizeGB, totalStorageGB;

                if (typeof storageSizeRaw === 'number') {
                    totalStorageGB = storageSizeRaw;
                } else {
                    storageSizeGB = parseInt(storageSizeRaw.replace(/[^\d]/g, '')) || 500;
                    const storageUnit = storageSizeRaw.toLowerCase().includes('tb') ? 1024 : 1;
                    totalStorageGB = storageSizeGB * storageUnit;
                }

                if (useRealPricing) {
                    const priceResult = this.cloudPricing.calculateStorageCost(providerId, 'object', totalStorageGB, 'standard');
                    cost = priceResult.price;
                    breakdown = priceResult.breakdown;
                    if (region) breakdown += ` [${region.name}]`;
                    source = 'CloudPricing API';
                } else {
                    cost = Math.max(20, totalStorageGB * 0.025);
                    breakdown = `${totalStorageGB} GB Object Storage`;
                }
                break;

            case 'storage_block':
                // Block Storage mit echten Preisen
                if (config.storage?.volumes && Array.isArray(config.storage.volumes)) {
                    let totalCost = 0;
                    const breakdownParts = [];
                    const volCount = config.storage.volumes.length;

                    config.storage.volumes.forEach(vol => {
                        const volSize = vol.size || 200;
                        const volType = vol.type || 'ssd';

                        if (useRealPricing) {
                            const tier = volType === 'nvme' ? 'pdExtreme' :
                                        volType === 'hdd' ? 'pdStandard' : 'pdSSD';
                            const priceResult = this.cloudPricing.calculateStorageCost(providerId, 'block', volSize, tier);
                            totalCost += priceResult.price;
                            source = 'CloudPricing API';
                        } else {
                            const pricePerGB = volType === 'nvme' ? 0.15 : volType === 'hdd' ? 0.05 : 0.10;
                            totalCost += volSize * pricePerGB;
                        }
                        breakdownParts.push(`${volType.toUpperCase()} ${volSize}GB`);
                    });

                    cost = Math.max(30, totalCost);
                    breakdown = volCount > 1
                        ? `${volCount}× Volumes: ${breakdownParts.join(', ')}`
                        : breakdownParts[0];
                    if (region) breakdown += ` [${region.name}]`;
                } else {
                    // Legacy: Einzelnes Volume
                    const blockStorageStr = config.storage?.size || '200 GB';
                    const blockStorageGB = parseInt(blockStorageStr.replace(/[^\d]/g, '')) || 200;

                    if (useRealPricing) {
                        const priceResult = this.cloudPricing.calculateStorageCost(providerId, 'block', blockStorageGB, 'ssd');
                        cost = priceResult.price;
                        breakdown = priceResult.breakdown;
                        if (region) breakdown += ` [${region.name}]`;
                        source = 'CloudPricing API';
                    } else {
                        cost = Math.max(30, blockStorageGB * 0.10);
                        breakdown = `${blockStorageGB} GB Block Storage (SSD)`;
                    }
                }
                break;

            case 'kubernetes':
                // Kubernetes mit echten Preisen
                if (config.kubernetes?.clusters && Array.isArray(config.kubernetes.clusters)) {
                    let totalCost = 0;
                    const breakdownParts = [];

                    config.kubernetes.clusters.forEach((cluster, idx) => {
                        const nodes = cluster.nodes || 3;
                        const cpuPerNode = cluster.cpuPerNode || 4;
                        const ramPerNode = cluster.ramPerNode || 16;

                        if (useRealPricing) {
                            const k8sResult = this.cloudPricing.calculateKubernetesCost(providerId, nodes, cpuPerNode, ramPerNode);
                            totalCost += k8sResult.price;
                            breakdownParts.push(k8sResult.breakdown);
                            source = 'CloudPricing API';
                        } else {
                            const clusterCost = 70 + (nodes * ramPerNode * 8);
                            totalCost += clusterCost;
                            breakdownParts.push(`${nodes} Nodes (${ramPerNode}GB RAM)`);
                        }
                    });

                    cost = totalCost;
                    breakdown = config.kubernetes.clusters.length > 1
                        ? `${config.kubernetes.clusters.length}× Clusters: ${breakdownParts.join(', ')}`
                        : breakdownParts[0];
                    if (region) breakdown += ` [${region.name}]`;
                } else {
                    // Legacy/Fallback
                    const users = parseInt(config.users) || 100;
                    const estimatedNodes = Math.max(3, Math.ceil(users / 50));
                    const nodeRam = config.compute?.ram ? Math.ceil(config.compute.ram / estimatedNodes) : 16;

                    if (useRealPricing) {
                        const k8sResult = this.cloudPricing.calculateKubernetesCost(providerId, estimatedNodes, 4, nodeRam);
                        cost = k8sResult.price;
                        breakdown = k8sResult.breakdown;
                        if (region) breakdown += ` [${region.name}]`;
                        source = 'CloudPricing API';
                    } else {
                        cost = 70 + (estimatedNodes * nodeRam * 8);
                        breakdown = `~${estimatedNodes} Worker-Nodes (je ~${nodeRam} GB RAM)`;
                    }
                }
                break;

            case 'serverless':
                // Serverless mit echten Preisen
                if (config.serverless?.instances && Array.isArray(config.serverless.instances)) {
                    let totalCost = 0;
                    const breakdownParts = [];

                    config.serverless.instances.forEach((instance, idx) => {
                        const functions = instance.functions || 10;
                        const invocations = instance.invocationsPerMonth || 1000000;

                        // Echte Preise verwenden wenn verfügbar
                        let invocationCost, computeCost;
                        if (useRealPricing && this.cloudPricing.serverless?.[providerId]) {
                            const pricing = this.cloudPricing.serverless[providerId];
                            invocationCost = (invocations / 1000000) * (pricing.requestsPerMillion || 0.20);
                            computeCost = (invocations / 1000000) * 15;
                            source = 'CloudPricing API';
                        } else {
                            invocationCost = (invocations / 1000000) * 0.20;
                            computeCost = (invocations / 1000000) * 15;
                        }
                        const functionCost = invocationCost + computeCost;

                        totalCost += functionCost;
                        breakdownParts.push(`${functions} Fns, ${(invocations / 1000000).toFixed(1)}M inv`);
                    });

                    cost = totalCost;
                    breakdown = config.serverless.instances.length > 1
                        ? `${config.serverless.instances.length}× Groups: ${breakdownParts.join(', ')}`
                        : breakdownParts[0];
                    if (region) breakdown += ` [${region.name}]`;
                } else {
                    cost = baseCosts[serviceId] || 80;
                    breakdown = 'Serverless Functions';
                }
                break;

            case 'messaging':
                // Messaging mit echten Preisen
                if (config.messaging?.instances && Array.isArray(config.messaging.instances)) {
                    let totalCost = 0;
                    const breakdownParts = [];

                    config.messaging.instances.forEach((instance, idx) => {
                        const queueType = instance.type || 'Standard';
                        const messages = instance.messagesPerMonth || 1000000;

                        // Echte Preise verwenden
                        let pricePerMillion;
                        if (useRealPricing && this.cloudPricing.messaging?.[providerId]) {
                            const pricing = this.cloudPricing.messaging[providerId];
                            pricePerMillion = queueType === 'FIFO'
                                ? (pricing.sqs?.fifoPerMillion || 0.50)
                                : (pricing.sqs?.standardPerMillion || 0.40);
                            source = 'CloudPricing API';
                        } else {
                            pricePerMillion = queueType === 'FIFO' ? 1.5 : 0.5;
                        }
                        const queueCost = Math.max(5, (messages / 1000000) * pricePerMillion);

                        totalCost += queueCost;
                        breakdownParts.push(`${queueType} ${(messages / 1000000).toFixed(1)}M msg`);
                    });

                    cost = totalCost;
                    breakdown = config.messaging.instances.length > 1
                        ? `${config.messaging.instances.length}× Queues: ${breakdownParts.join(', ')}`
                        : breakdownParts[0];
                    if (region) breakdown += ` [${region.name}]`;
                } else {
                    cost = baseCosts[serviceId] || 50;
                    breakdown = 'Message Queue';
                }
                break;

            default:
                // Fallback auf Basiskosten mit echten Preisen wenn möglich
                let baseCost = baseCosts[serviceId] || 50;
                if (useRealPricing) {
                    baseCost = this.getBaseServicePrice(serviceId, providerId) || baseCost;
                    source = 'CloudPricing API';
                }
                const effectiveFactor = customFactor !== null ? customFactor : 1.0;
                return {
                    cost: Math.round(baseCost * levelMultiplier * effectiveFactor),
                    breakdown: region ? `${region.name}` : null,
                    source
                };
        }

        // Custom Factor anwenden falls vorhanden
        const effectiveFactor = customFactor !== null ? customFactor : 1.0;
        return {
            cost: Math.round(cost * levelMultiplier * effectiveFactor),
            breakdown,
            source
        };
    }

    /**
     * Holt den Basis-Preis für einen Service-Typ vom CloudPricing Modul
     * Verwendet für Fallback-Berechnungen wenn keine detaillierte Config vorhanden ist
     */
    getBaseServicePrice(serviceId, providerId) {
        if (!this.cloudPricing) return null;

        // Sovereign Cloud Handling: Nutze Basis-Provider-Preise + Premium
        const sovereignMapping = {
            'aws-sovereign': { base: 'aws', factor: 1.15 },
            'delos': { base: 'azure', factor: 1.18 },
            'azure-confidential': { base: 'azure', factor: 1.20 }
        };
        const sovereign = sovereignMapping[providerId];
        const sourceId = sovereign ? sovereign.base : providerId;
        const premiumFactor = sovereign ? sovereign.factor : 1.0;

        // Mapping von Service-IDs zu CloudPricing-Daten (verwendet sourceId für Lookup)
        const serviceMapping = {
            'compute': () => {
                const pricing = this.cloudPricing.compute[sourceId];
                if (pricing?.instanceTypes) {
                    // Durchschnittspreis der mittleren Instanzen
                    const instances = Object.values(pricing.instanceTypes);
                    const midRange = instances.filter(i => i.vcpu >= 4 && i.vcpu <= 8);
                    if (midRange.length > 0) {
                        return midRange.reduce((sum, i) => sum + i.price, 0) / midRange.length;
                    }
                }
                return pricing?.minPrice ? pricing.minPrice * 3 : 200;
            },
            'kubernetes': () => {
                const k8s = this.cloudPricing.kubernetes[sourceId];
                const compute = this.cloudPricing.compute[sourceId];
                if (k8s && compute) {
                    // Control Plane + 3 kleine Nodes
                    const controlPlane = k8s.controlPlane || 70;
                    const nodePrice = compute.minPrice || 100;
                    return controlPlane + (nodePrice * 3);
                }
                return 400;
            },
            'serverless': () => {
                return 80; // Serverless ist nutzungsbasiert
            },
            'database_sql': () => {
                const sql = this.cloudPricing.database?.sql?.[sourceId];
                if (sql?.postgresql) {
                    return sql.postgresql.base + (100 * sql.postgresql.storagePerGB);
                }
                return 150;
            },
            'database_nosql': () => {
                return 180;
            },
            'storage_object': () => {
                const storage = this.cloudPricing.storage?.object?.[sourceId];
                if (storage?.standard) {
                    return 500 * storage.standard; // 500 GB Standard
                }
                return 40;
            },
            'storage_block': () => {
                const storage = this.cloudPricing.storage?.block?.[sourceId];
                if (storage) {
                    const ssdPrice = storage.gp3 || storage.pdSSD || storage.premiumSSD || 0.10;
                    return 200 * ssdPrice;
                }
                return 60;
            },
            'storage_file': () => {
                const storage = this.cloudPricing.storage?.file?.[sourceId];
                if (storage?.standard || storage?.basic) {
                    return 100 * (storage.standard || storage.basic);
                }
                return 100;
            },
            'loadbalancer': () => {
                const lb = this.cloudPricing.networking?.loadbalancer?.[sourceId];
                if (lb?.alb || lb?.standard) {
                    return (lb.alb?.perHour || lb.standard?.perHour || 0.025) * 730; // Monatlich
                }
                return 40;
            },
            'cdn': () => {
                return 30; // CDN ist traffikbasiert
            },
            'dns': () => {
                const dns = this.cloudPricing.networking?.dns?.[sourceId];
                return dns?.hostedZonePerMonth || dns?.zonePerMonth || 8;
            },
            'messaging': () => {
                return 50;
            },
            'cache': () => {
                const cache = this.cloudPricing.cache?.[sourceId];
                if (cache?.redis?.pricePerGB) {
                    return cache.redis.pricePerGB * 8; // 8 GB Redis
                }
                return 120;
            },
            'container_registry': () => 25,
            'secrets': () => 15,
            'monitoring': () => 60,
            'logging': () => 50,
            'ai_ml': () => 600,
            'identity': () => 30
        };

        const priceGetter = serviceMapping[serviceId];
        const basePrice = priceGetter ? priceGetter() : null;

        // Premium-Faktor für Sovereign Clouds anwenden
        return basePrice !== null ? Math.round(basePrice * premiumFactor) : null;
    }

    /**
     * Schätzt Verbrauchskosten für Self-Build Services (VM-basiert)
     * Self-Build ist günstiger als PaaS, da nur VM-Kosten anfallen
     */
    getSelfBuildConsumptionEstimate(serviceId, systemConfig = null, provider = null) {
        // Provider-Faktor (wie bei PaaS)
        const providerFactors = {
            'aws': 1.0, 'azure': 1.0, 'gcp': 0.95,
            'aws-sovereign': 1.15, 'delos': 1.18,
            'stackit': 1.12, 'otc': 1.05, 'ionos': 1.10,
            'plusserver': 1.08, 'arvato': 1.12
        };
        const providerFactor = (provider && providerFactors[provider.id]) || 1.0;

        // Basis-VM-Kosten (30-50% der PaaS-Kosten)
        const selfBuildFactors = {
            // High-Resource Services (brauchen größere VMs)
            'database_sql': 120,      // Statt 250€ PaaS → VM mit DB-Software
            'database_nosql': 80,     // Statt 180€ PaaS
            'kubernetes': 150,        // Control Plane selbst → VMs für K8s
            'messaging': 30,          // RabbitMQ/Kafka auf VM
            'cache': 50,              // Redis auf VM
            'ai_ml': 300,             // GPU-VMs für ML

            // Low-Resource Services
            'serverless': 60,         // OpenFaaS/Knative auf K8s-Cluster
            'cdn': 40,                // Nginx/Varnish Cache
            'loadbalancer': 25,       // HAProxy/Nginx
            'monitoring': 35,         // Prometheus/Grafana
            'logging': 30,            // ELK Stack
            'secrets': 10,            // Vault
            'identity': 20,           // Keycloak/LDAP
            'container_registry': 15  // Harbor
        };

        const baseCost = selfBuildFactors[serviceId] || 50;

        return {
            cost: Math.round(baseCost * providerFactor),
            breakdown: `VM-Infrastruktur für Self-Hosted ${serviceId}`
        };
    }

    /**
     * Berechnet Betriebsaufwand (Operations)
     */
    calculateOperationsCosts(services, missingServices, systemConfig = null) {
        const levelMap = { low: 1, medium: 2, high: 3 };
        let totalLevel = 0;
        let details = [];

        services.forEach(service => {
            const level = levelMap[service.operations] || 2;
            totalLevel += level;

            // Anzahl der Instanzen aus systemConfig ermitteln
            const instanceCount = this.getInstanceCount(service.id, systemConfig);
            const baseFTE = this.getOperationsFTE(service.operations);
            const scaledFTE = this.scaleOperationsFTE(baseFTE, instanceCount);

            details.push({
                id: service.id || service.name,
                name: service.name,
                level: service.operations || 'medium',
                fteEstimate: scaledFTE,
                instanceCount: instanceCount
            });
        });

        // Self-build erhöht Betriebsaufwand signifikant
        missingServices.forEach(missing => {
            if (missing.selfBuildOption) {
                const level = levelMap[missing.selfBuildOption.operationsLevel] || 3;
                totalLevel += level;
                details.push({
                    id: missing.id,
                    name: `Self-Build: ${missing.selfBuildOption.name}`,
                    level: missing.selfBuildOption.operationsLevel,
                    fteEstimate: this.getOperationsFTE(missing.selfBuildOption.operationsLevel),
                    isSelfBuild: true
                });
            }
        });

        const avgLevel = details.length > 0 ? totalLevel / details.length : 2;
        const overallLevel = avgLevel <= 1.5 ? 'low' : avgLevel <= 2.5 ? 'medium' : 'high';

        // FTE-Schätzung (Full Time Equivalent)
        const totalFTE = details.reduce((sum, d) => sum + d.fteEstimate, 0);

        return {
            level: overallLevel,
            avgScore: Math.round(avgLevel * 10) / 10,
            details,
            totalFTE: Math.round(totalFTE * 10) / 10,
            monthlyPersonnelCost: Math.round(totalFTE * 8000) // ~8000€/Monat pro FTE
        };
    }

    /**
     * Schätzt FTE-Anteil für Operations
     */
    getOperationsFTE(level) {
        const fteMap = {
            very_low: 0.02,  // Sehr geringe Ops (z.B. S3, Blob Storage)
            low: 0.05,       // Geringe Ops (z.B. RDS, Managed Databases)
            medium: 0.15,    // Mittlere Ops (z.B. Kubernetes)
            high: 0.3        // Hohe Ops (z.B. Self-Build)
        };
        return fteMap[level] || 0.15;
    }

    /**
     * Ermittelt die Anzahl der Instanzen für einen Service aus der systemConfig
     * Berücksichtigt nur die Instanzen, die tatsächlich zum Service-Typ gehören
     * Gibt ein Objekt zurück mit: { count, varietyFactor }
     */
    getInstanceCount(serviceId, systemConfig) {
        if (!systemConfig || !systemConfig.config) return { count: 1, varietyFactor: 1.0 };

        const config = systemConfig.config;

        switch (serviceId) {
            case 'compute':
                if (config.compute?.vmGroups && Array.isArray(config.compute.vmGroups)) {
                    const totalCount = config.compute.vmGroups.reduce((sum, vm) => sum + (vm.count || 1), 0);
                    const varietyCount = config.compute.vmGroups.length; // Anzahl verschiedener VM-Typen
                    // Varietätsfaktor: 1.0 für 1 Typ, +15% pro zusätzlichem Typ
                    const varietyFactor = 1.0 + (varietyCount - 1) * 0.15;
                    return { count: totalCount, varietyFactor };
                }
                return { count: 1, varietyFactor: 1.0 };

            case 'database_sql':
                // Nur SQL-Datenbanken zählen (PostgreSQL, MySQL, Oracle, MS SQL, etc.)
                if (config.database?.databases && Array.isArray(config.database.databases)) {
                    const sqlDatabases = config.database.databases.filter(db => {
                        const type = (db.type || '').toLowerCase();
                        // SQL-Typen identifizieren
                        return !type.includes('mongo') &&
                               !type.includes('redis') &&
                               !type.includes('cassandra') &&
                               !type.includes('couchdb') &&
                               !type.includes('dynamodb');
                    });
                    if (sqlDatabases.length > 0) {
                        // Zähle verschiedene DB-Typen (PostgreSQL, Oracle, MySQL, etc.)
                        const uniqueTypes = new Set(sqlDatabases.map(db =>
                            (db.type || 'PostgreSQL').toLowerCase().split(' ')[0]
                        ));
                        const varietyFactor = 1.0 + (uniqueTypes.size - 1) * 0.20; // +20% pro zusätzlichem Typ
                        return { count: sqlDatabases.length, varietyFactor };
                    }
                }
                return { count: 1, varietyFactor: 1.0 };

            case 'database_nosql':
                // Nur NoSQL-Datenbanken zählen
                if (config.database?.databases && Array.isArray(config.database.databases)) {
                    const nosqlDatabases = config.database.databases.filter(db => {
                        const type = (db.type || '').toLowerCase();
                        // NoSQL-Typen identifizieren
                        return type.includes('mongo') ||
                               type.includes('redis') ||
                               type.includes('cassandra') ||
                               type.includes('couchdb') ||
                               type.includes('dynamodb');
                    });
                    if (nosqlDatabases.length > 0) {
                        const uniqueTypes = new Set(nosqlDatabases.map(db =>
                            (db.type || 'MongoDB').toLowerCase().split(' ')[0]
                        ));
                        const varietyFactor = 1.0 + (uniqueTypes.size - 1) * 0.20;
                        return { count: nosqlDatabases.length, varietyFactor };
                    }
                }
                // Auch nosql.instances Array checken
                if (config.nosql?.instances && Array.isArray(config.nosql.instances)) {
                    const uniqueTypes = new Set(config.nosql.instances.map(db =>
                        (db.type || 'MongoDB').toLowerCase()
                    ));
                    const varietyFactor = 1.0 + (uniqueTypes.size - 1) * 0.20;
                    return { count: config.nosql.instances.length, varietyFactor };
                }
                return { count: 1, varietyFactor: 1.0 };

            case 'storage_block':
                if (config.storage?.volumes && Array.isArray(config.storage.volumes)) {
                    // Verschiedene Storage-Typen (SSD, NVMe, HDD)
                    const uniqueTypes = new Set(config.storage.volumes.map(vol =>
                        (vol.type || 'ssd').toLowerCase()
                    ));
                    const varietyFactor = 1.0 + (uniqueTypes.size - 1) * 0.10; // +10% pro Typ
                    return { count: config.storage.volumes.length, varietyFactor };
                }
                return { count: 1, varietyFactor: 1.0 };

            case 'kubernetes':
                if (config.kubernetes?.clusters && Array.isArray(config.kubernetes.clusters)) {
                    // Mehrere Cluster erhöhen Komplexität
                    const varietyFactor = 1.0 + (config.kubernetes.clusters.length - 1) * 0.25;
                    return { count: config.kubernetes.clusters.length, varietyFactor };
                }
                return { count: 1, varietyFactor: 1.0 };

            case 'serverless':
                if (config.serverless?.instances && Array.isArray(config.serverless.instances)) {
                    return { count: config.serverless.instances.length, varietyFactor: 1.0 };
                }
                return { count: 1, varietyFactor: 1.0 };

            case 'messaging':
                if (config.messaging?.instances && Array.isArray(config.messaging.instances)) {
                    // Verschiedene Queue-Typen (Standard, FIFO)
                    const uniqueTypes = new Set(config.messaging.instances.map(q =>
                        (q.type || 'Standard').toLowerCase()
                    ));
                    const varietyFactor = 1.0 + (uniqueTypes.size - 1) * 0.15;
                    return { count: config.messaging.instances.length, varietyFactor };
                }
                return { count: 1, varietyFactor: 1.0 };

            default:
                return { count: 1, varietyFactor: 1.0 };
        }
    }

    /**
     * Skaliert den Betriebsaufwand basierend auf Anzahl der Instanzen und Varietät
     * Verwendet Sub-lineare Skalierung (Skaleneffekte) mit Komplexitätsfaktor
     */
    scaleOperationsFTE(baseFTE, instanceData) {
        // Unterstütze Legacy-Format (nur Zahl) und neues Format (Objekt)
        const count = typeof instanceData === 'object' ? instanceData.count : instanceData;
        const varietyFactor = typeof instanceData === 'object' ? instanceData.varietyFactor : 1.0;

        if (count <= 1) return baseFTE * varietyFactor;

        // Sub-lineare Skalierung: Logarithmisch mit Basis 1.5
        // 1 Instanz = 1.0x, 2 Instanzen = 1.5x, 4 Instanzen = 2.25x, 8 Instanzen = 3.38x
        const scaleFactor = 1 + (Math.log(count) / Math.log(1.5));

        // Varietätsfaktor multipliziert das Ergebnis (mehr verschiedene Typen = mehr Aufwand)
        return baseFTE * scaleFactor * varietyFactor;
    }

    /**
     * Berechnet Projektaufwand
     */
    calculateProjectEffort(services, missingServices, systemConfig = null) {
        const levelMap = { low: 1, medium: 2, high: 3 };
        let totalLevel = 0;
        let totalDays = 0;
        let details = [];

        services.forEach(service => {
            const level = levelMap[service.projectEffort] || 2;

            // Anzahl der Instanzen aus systemConfig ermitteln
            const instanceCount = this.getInstanceCount(service.id, systemConfig);
            const baseDays = this.getProjectDays(service.id, service.projectEffort);
            const scaledDays = this.scaleProjectDays(baseDays, instanceCount);

            totalLevel += level;
            totalDays += scaledDays;
            details.push({
                id: service.id || service.name,
                name: service.name,
                level: service.projectEffort || 'medium',
                days: scaledDays,
                instanceCount: instanceCount
            });
        });

        const avgLevel = services.length > 0 ? totalLevel / services.length : 2;
        const overallLevel = avgLevel <= 1.5 ? 'low' : avgLevel <= 2.5 ? 'medium' : 'high';

        return {
            level: overallLevel,
            avgScore: Math.round(avgLevel * 10) / 10,
            details,
            totalDays: Math.round(totalDays)
        };
    }

    /**
     * Schätzt Projekttage pro Service
     */
    getProjectDays(serviceId, level) {
        const baseDays = {
            compute: 3, kubernetes: 10, serverless: 5,
            database_sql: 5, database_nosql: 4,
            storage_object: 2, storage_block: 2, storage_file: 3,
            loadbalancer: 2, cdn: 3, dns: 1,
            messaging: 4, cache: 3, container_registry: 2,
            secrets: 2, monitoring: 5, logging: 4,
            ai_ml: 15, identity: 5
        };
        const base = baseDays[serviceId] || 3;
        const multiplier = level === 'low' ? 0.7 : level === 'high' ? 1.5 : 1.0;
        return Math.round(base * multiplier);
    }

    /**
     * Skaliert den Projektaufwand basierend auf Anzahl der Instanzen und Varietät
     * Verwendet moderate Sub-lineare Skalierung (weniger Skaleneffekte als bei Operations)
     */
    scaleProjectDays(baseDays, instanceData) {
        // Unterstütze Legacy-Format (nur Zahl) und neues Format (Objekt)
        const count = typeof instanceData === 'object' ? instanceData.count : instanceData;
        const varietyFactor = typeof instanceData === 'object' ? instanceData.varietyFactor : 1.0;

        if (count <= 1) return Math.round(baseDays * varietyFactor);

        // Moderate Sub-lineare Skalierung: Quadratwurzel-basiert
        // 1 Instanz = 1.0x, 2 Instanzen = 1.7x, 4 Instanzen = 2.4x, 8 Instanzen = 3.2x
        // Weniger Skaleneffekt als bei Operations, da Projekt-Setup oft wiederholt werden muss
        const scaleFactor = 1 + (Math.sqrt(count) - 1) * 0.7;

        // Varietätsfaktor multipliziert das Ergebnis
        return Math.round(baseDays * scaleFactor * varietyFactor);
    }

    /**
     * Berechnet Self-Build-Aufwand für fehlende Services
     */
    calculateSelfBuildEffort(missingServices) {
        let totalDays = 0;
        let details = [];

        missingServices.forEach(missing => {
            if (missing.selfBuildOption) {
                const option = missing.selfBuildOption;
                totalDays += option.projectDays;
                details.push({
                    serviceId: missing.id,
                    solution: option.name,
                    effort: option.effort,
                    days: option.projectDays,
                    operationsLevel: option.operationsLevel
                });
            }
        });

        return {
            required: missingServices.length > 0,
            servicesCount: missingServices.length,
            details,
            totalDays
        };
    }

    /**
     * Berechnet das Gesamt-TCO-Level
     */
    calculateTCOLevel(consumption, operations, projectEffort, selfBuild, includeOperations = true, includeProjectEffort = true) {
        const levelScores = { low: 1, medium: 2, high: 3 };

        let totalScore = 0;

        // Dynamische Gewichtung basierend auf einbezogenen Faktoren
        if (includeOperations && includeProjectEffort) {
            // Alle Faktoren einbezogen
            totalScore += levelScores[consumption.level] * 0.4;  // Consumption 40%
            totalScore += levelScores[operations.level] * 0.35; // Operations 35%
            totalScore += levelScores[projectEffort.level] * 0.25; // Project 25%
        } else if (includeOperations && !includeProjectEffort) {
            // Nur Operations, kein Project
            totalScore += levelScores[consumption.level] * 0.55;  // Consumption 55%
            totalScore += levelScores[operations.level] * 0.45; // Operations 45%
        } else if (!includeOperations && includeProjectEffort) {
            // Nur Project, kein Operations
            totalScore += levelScores[consumption.level] * 0.6;  // Consumption 60%
            totalScore += levelScores[projectEffort.level] * 0.4; // Project 40%
        } else {
            // Nur Consumption
            totalScore += levelScores[consumption.level] * 1.0;  // Consumption 100%
        }

        // Self-Build erhöht TCO signifikant
        if (selfBuild.required) {
            totalScore += selfBuild.servicesCount * 0.3;
        }

        if (totalScore <= 1.5) return 'low';
        if (totalScore <= 2.5) return 'medium';
        return 'high';
    }

    /**
     * Schätzt monatliche Gesamtkosten
     */
    estimateMonthlyTotal(consumption, operations, includeOperations = true) {
        if (includeOperations) {
            return consumption.monthlyEstimate + operations.monthlyPersonnelCost;
        } else {
            return consumption.monthlyEstimate;
        }
    }

    /**
     * Generiert eine Empfehlung für einen Provider
     */
    generateRecommendation(provider, serviceAnalysis, score, tcoEstimate) {
        const strengths = [];
        const weaknesses = [];
        let suitability = 'geeignet';

        // Stärken analysieren
        if (score.controlScore >= 75) {
            strengths.push('Hohe Datensouveränität');
        }
        if (score.performanceScore >= 80) {
            strengths.push('Starke Leistungsfähigkeit');
        }
        if (serviceAnalysis.coverage >= 90) {
            strengths.push('Vollständige Service-Abdeckung');
        }
        if (tcoEstimate.consumption.level === 'low') {
            strengths.push('Günstige Verbrauchskosten');
        }
        if (tcoEstimate.operations.level === 'low') {
            strengths.push('Geringer Betriebsaufwand');
        }
        if (provider.category === 'eu') {
            strengths.push('DSGVO-konform, EU-Rechtsraum');
        }
        if (provider.category === 'sovereign') {
            strengths.push('Souveräne Cloud-Lösung');
        }

        // Schwächen analysieren
        if (serviceAnalysis.missing.length > 0) {
            const selfBuildCount = serviceAnalysis.missing.filter(m => m.selfBuildOption).length;
            if (selfBuildCount > 0) {
                weaknesses.push(`${selfBuildCount} Service(s) erfordern Self-Build`);
            } else {
                weaknesses.push(`${serviceAnalysis.missing.length} Service(s) nicht verfügbar`);
            }
        }
        if (serviceAnalysis.preview.length > 0) {
            weaknesses.push(`${serviceAnalysis.preview.length} Service(s) nur in Preview`);
        }
        if (score.controlScore < 50) {
            weaknesses.push('Eingeschränkte Datenkontrolle');
        }
        if (tcoEstimate.operations.level === 'high') {
            weaknesses.push('Hoher Betriebsaufwand');
        }
        if (tcoEstimate.totalLevel === 'high') {
            weaknesses.push('Hohe Gesamtkosten (TCO)');
        }

        // Eignung bestimmen
        if (serviceAnalysis.coverage < 50) {
            suitability = 'nicht empfohlen';
        } else if (serviceAnalysis.coverage < 80 || serviceAnalysis.missing.length > 2) {
            suitability = 'bedingt geeignet';
        } else if (serviceAnalysis.coverage >= 95 && score.total >= 65) {
            suitability = 'sehr gut geeignet';
        }

        return {
            strengths,
            weaknesses,
            suitability,
            summary: this.generateSummaryText(provider, serviceAnalysis, score, tcoEstimate, suitability)
        };
    }

    /**
     * Generiert einen Zusammenfassungstext basierend auf der Provider-Beschreibung
     */
    generateSummaryText(provider, serviceAnalysis, score, tcoEstimate, suitability) {
        // Provider-Beschreibung als Basis verwenden
        const baseDescription = provider.description || '';

        if (suitability === 'nicht empfohlen') {
            return `${baseDescription} Nur ${Math.round(serviceAnalysis.coverage)}% Service-Abdeckung. ` +
                `${serviceAnalysis.missing.length} Service(s) müssten selbst gebaut werden.`;
        }

        if (suitability === 'bedingt geeignet') {
            const missingCount = serviceAnalysis.missing.length;
            return `${baseDescription} ${missingCount} Service(s) fehlen und erfordern Self-Build.`;
        }

        // "geeignet" oder "sehr gut geeignet"
        return baseDescription;
    }

    /**
     * Generiert die finale Empfehlung mit allen TCO-Dimensionen
     */
    generateFinalRecommendation(results, selectedComponentIds, strategyWeight) {
        const topPick = results[0];
        const controlFocused = results.filter(r => r.score.controlScore >= 70).sort((a, b) => b.score.total - a.score.total)[0];
        const performanceFocused = results.filter(r => r.score.performanceScore >= 75).sort((a, b) => b.score.total - a.score.total)[0];
        const costEfficient = results.filter(r => r.serviceAnalysis.coverage >= 80).sort((a, b) =>
            a.tcoEstimate.monthlyEstimate - b.tcoEstimate.monthlyEstimate)[0];

        const componentCount = selectedComponentIds.length;
        const isControlFocused = strategyWeight < 40;
        const isPerformanceFocused = strategyWeight > 60;

        let recommendation = '';

        // Hauptempfehlung basierend auf Strategie
        if (isControlFocused && controlFocused) {
            recommendation = `**Empfehlung für Kontrolle:** ${controlFocused.provider.name}\n`;
            recommendation += `Mit einem Kontroll-Score von ${controlFocused.score.controlScore} und `;
            recommendation += `${Math.round(controlFocused.serviceAnalysis.coverage)}% Service-Abdeckung `;
            recommendation += `bietet dieser Anbieter die beste Balance für Ihre Souveränitäts-Anforderungen.\n\n`;
        } else if (isPerformanceFocused && performanceFocused) {
            recommendation = `**Empfehlung für Leistung:** ${performanceFocused.provider.name}\n`;
            recommendation += `Mit einem Performance-Score von ${performanceFocused.score.performanceScore} `;
            recommendation += `erhalten Sie maximale Funktionalität und ein umfassendes Service-Portfolio.\n\n`;
        } else {
            recommendation = `**Ausgewogene Empfehlung:** ${topPick.provider.name}\n`;
            recommendation += `Dieser Anbieter bietet die beste Gesamtlösung mit ${Math.round(topPick.serviceAnalysis.coverage)}% Service-Abdeckung `;
            recommendation += `bei einem ausgewogenen Verhältnis von Kontrolle (${topPick.score.controlScore}) `;
            recommendation += `und Leistung (${topPick.score.performanceScore}).\n\n`;
        }

        // TCO-Zusammenfassung
        recommendation += `**TCO-Analyse für ${componentCount} Komponenten:**\n`;
        recommendation += `• Verbrauchskosten: ~${topPick.tcoEstimate.consumption.monthlyEstimate}€/Monat\n`;
        recommendation += `• Betriebsaufwand: ~${topPick.tcoEstimate.operations.totalFTE} FTE (~${topPick.tcoEstimate.operations.monthlyPersonnelCost}€/Monat)\n`;
        recommendation += `• Projektaufwand: ~${topPick.tcoEstimate.projectDaysEstimate} Personentage\n`;

        // Self-Build-Warnung
        if (topPick.tcoEstimate.selfBuild.required) {
            recommendation += `\n⚠️ **Self-Build erforderlich:** ${topPick.tcoEstimate.selfBuild.servicesCount} Service(s) `;
            recommendation += `müssen eigenständig implementiert werden (+${topPick.tcoEstimate.selfBuild.totalDays} Projekttage).\n`;
        }

        // Alternative Empfehlung
        if (costEfficient && costEfficient.provider.id !== topPick.provider.id) {
            recommendation += `\n**Kosteneffiziente Alternative:** ${costEfficient.provider.name} `;
            recommendation += `(~${costEfficient.tcoEstimate.monthlyEstimate}€/Monat gesamt).`;
        }

        return {
            primary: topPick,
            controlFocused,
            performanceFocused,
            costEfficient,
            text: recommendation
        };
    }
}

/**
 * Anwendungs-Recherche Simulation
 * In Produktion würde hier ein LLM-API-Aufruf erfolgen
 */
class ApplicationResearcher {
    constructor(knownApps) {
        this.knownApps = knownApps;
    }

    /**
     * Recherchiert eine Anwendung (simuliert LLM-Recherche)
     */
    async research(appName) {
        // Simulierte Verzögerung für realistisches Gefühl
        await this.delay(1500);

        const normalizedName = appName.toLowerCase().trim();

        // Bekannte Anwendung suchen
        for (const [key, app] of Object.entries(this.knownApps)) {
            if (normalizedName.includes(key) || app.name.toLowerCase().includes(normalizedName)) {
                return {
                    success: true,
                    application: app,
                    source: 'Interne Wissensbasis',
                    confidence: 'hoch'
                };
            }
        }

        // Generische Analyse basierend auf Keywords
        const analysis = this.analyzeByKeywords(normalizedName);
        if (analysis) {
            return {
                success: true,
                application: analysis,
                source: 'Keyword-Analyse',
                confidence: 'mittel'
            };
        }

        // Keine Ergebnisse
        return {
            success: false,
            message: `Keine spezifischen Informationen für "${appName}" gefunden. Bitte definieren Sie die Komponenten manuell.`,
            suggestion: 'Sie können die benötigten Komponenten im nächsten Schritt manuell auswählen.'
        };
    }

    /**
     * Analysiert basierend auf Keywords
     */
    analyzeByKeywords(name) {
        const keywords = {
            'web': ['compute', 'database_sql', 'loadbalancer', 'cdn', 'storage_object'],
            'api': ['compute', 'loadbalancer', 'database_sql', 'cache', 'monitoring'],
            'shop': ['compute', 'database_sql', 'storage_object', 'cdn', 'cache', 'loadbalancer', 'messaging'],
            'app': ['compute', 'database_sql', 'storage_object', 'loadbalancer'],
            'microservice': ['kubernetes', 'database_sql', 'messaging', 'cache', 'monitoring', 'logging'],
            'container': ['kubernetes', 'storage_object', 'loadbalancer', 'monitoring'],
            'data': ['compute', 'database_sql', 'database_nosql', 'storage_object', 'ai_ml'],
            'analytics': ['compute', 'database_sql', 'storage_object', 'ai_ml', 'monitoring'],
            'ai': ['compute', 'ai_ml', 'storage_object', 'database_nosql'],
            'ml': ['compute', 'ai_ml', 'storage_object', 'database_nosql'],
            'crm': ['compute', 'database_sql', 'storage_object', 'loadbalancer', 'identity'],
            'erp': ['compute', 'database_sql', 'storage_block', 'loadbalancer', 'identity', 'monitoring']
        };

        for (const [keyword, components] of Object.entries(keywords)) {
            if (name.includes(keyword)) {
                return {
                    name: `${name.charAt(0).toUpperCase() + name.slice(1)} Anwendung`,
                    description: `Typische ${keyword}-basierte Anwendung`,
                    components: components,
                    requirements: {
                        highAvailability: ['shop', 'erp', 'crm'].includes(keyword),
                        minCompute: ['erp', 'analytics', 'ai'].includes(keyword) ? 'large' : 'medium'
                    }
                };
            }
        }

        return null;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI-APPLICATION ANALYZER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MultiAppAnalyzer - Analysiert mehrere Anwendungen gleichzeitig und aggregiert Ergebnisse
 */
class MultiAppAnalyzer {
    constructor(cloudProviders, architectureComponents) {
        this.providers = cloudProviders;
        this.components = architectureComponents;
        this.analyzer = new CloudAnalyzer(cloudProviders, architectureComponents);
    }

    /**
     * Analysiert ein Portfolio von Anwendungen
     */
    analyzePortfolio(applications, weights, maturitySettings, operationsSettings, projectEffortSettings) {
        // Step 1: Jede App individuell analysieren
        const appResults = applications.map(app => {
            const componentIds = Array.from(app.selectedComponents);
            const results = this.analyzer.analyzeForComponents(
                componentIds,
                weights,
                app.systemConfig,
                maturitySettings,
                operationsSettings,
                projectEffortSettings
            );

            return {
                app: app,
                results: results
            };
        });

        // Step 2: Provider-Scores aggregieren
        const aggregatedProviders = this.aggregateProviderScores(appResults);

        // Step 3: TCO aggregieren
        const aggregatedTCO = this.aggregateTCO(appResults);

        // Step 4: Portfolio-Metriken
        const portfolioMetrics = this.calculatePortfolioMetrics(appResults);

        return {
            perAppResults: appResults,
            aggregatedProviders: aggregatedProviders,
            aggregatedTCO: aggregatedTCO,
            portfolioMetrics: portfolioMetrics
        };
    }

    /**
     * Aggregiert Provider-Scores über alle Apps
     * Verwendet gewichteten Durchschnitt basierend auf Komponentenanzahl
     */
    aggregateProviderScores(appResults) {
        const providerMap = new Map();

        // Provider initialisieren
        this.providers.forEach(provider => {
            providerMap.set(provider.id, {
                provider: provider,
                totalScore: 0,
                weightedScore: 0,
                totalWeight: 0,
                appScores: [],
                serviceAnalysis: {
                    availableSet: new Set(),
                    previewSet: new Set(),
                    missingSet: new Set(),
                    totalRequired: 0,
                    perAppCoverage: []  // Coverage pro App für gewichteten Durchschnitt
                },
                tcoEstimate: {
                    consumption: { monthlyEstimate: 0, details: [] },
                    operations: { totalFTE: 0, monthlyPersonnelCost: 0 },
                    projectDaysEstimate: 0,
                    selfBuild: { required: false, servicesCount: 0, totalDays: 0 }
                }
            });
        });

        // Scores und Daten aggregieren
        appResults.forEach(({ app, results }) => {
            const appWeight = app.selectedComponents.size; // Mehr Komponenten = höheres Gewicht

            results.forEach(providerResult => {
                const entry = providerMap.get(providerResult.provider.id);
                if (!entry) return;

                // Gewichtete Score-Akkumulation
                entry.totalScore += providerResult.score.total;
                entry.weightedScore += providerResult.score.total * appWeight;
                entry.totalWeight += appWeight;

                // Per-App Score tracken
                entry.appScores.push({
                    appId: app.id,
                    appName: app.name,
                    score: providerResult.score.total,
                    weight: appWeight
                });

                // Service-Abdeckung aggregieren
                providerResult.serviceAnalysis.available.forEach(s =>
                    entry.serviceAnalysis.availableSet.add(s.id));
                providerResult.serviceAnalysis.preview.forEach(s =>
                    entry.serviceAnalysis.previewSet.add(s.id));
                providerResult.serviceAnalysis.missing.forEach(s =>
                    entry.serviceAnalysis.missingSet.add(s.id));
                entry.serviceAnalysis.totalRequired += providerResult.serviceAnalysis.totalRequired || 0;

                // Coverage pro App speichern für gewichteten Durchschnitt
                entry.serviceAnalysis.perAppCoverage.push({
                    appId: app.id,
                    appName: app.name,
                    coverage: providerResult.serviceAnalysis.coverage || 0,
                    weight: appWeight
                });

                // TCO aggregieren
                if (providerResult.tcoEstimate) {
                    entry.tcoEstimate.consumption.monthlyEstimate +=
                        providerResult.tcoEstimate.consumption?.monthlyEstimate || 0;
                    entry.tcoEstimate.operations.totalFTE +=
                        providerResult.tcoEstimate.operations?.totalFTE || 0;
                    entry.tcoEstimate.operations.monthlyPersonnelCost +=
                        providerResult.tcoEstimate.operations?.monthlyPersonnelCost || 0;
                    entry.tcoEstimate.projectDaysEstimate +=
                        providerResult.tcoEstimate.projectDaysEstimate || 0;

                    if (providerResult.tcoEstimate.selfBuild?.required) {
                        entry.tcoEstimate.selfBuild.required = true;
                        entry.tcoEstimate.selfBuild.servicesCount +=
                            providerResult.tcoEstimate.selfBuild.servicesCount || 0;
                        entry.tcoEstimate.selfBuild.totalDays +=
                            providerResult.tcoEstimate.selfBuild.totalDays || 0;
                    }

                    // Cost details mit App-Namen
                    if (providerResult.tcoEstimate.consumption?.details) {
                        entry.tcoEstimate.consumption.details.push(
                            ...providerResult.tcoEstimate.consumption.details.map(d => ({
                                ...d,
                                appName: app.name
                            }))
                        );
                    }
                }
            });
        });

        // Finale Berechnung und Sortierung
        const aggregated = Array.from(providerMap.values()).map(entry => {
            const avgScore = entry.totalWeight > 0
                ? entry.weightedScore / entry.totalWeight
                : 0;

            // Coverage als gewichteten Durchschnitt der Per-App-Coverage berechnen
            const coverage = entry.serviceAnalysis.perAppCoverage.length > 0
                ? entry.serviceAnalysis.perAppCoverage.reduce((sum, app) =>
                    sum + app.coverage * app.weight, 0) / entry.totalWeight
                : 100;

            return {
                provider: entry.provider,
                aggregatedScore: avgScore,
                totalScore: entry.totalScore,
                appScores: entry.appScores,
                serviceAnalysis: {
                    available: Array.from(entry.serviceAnalysis.availableSet),
                    preview: Array.from(entry.serviceAnalysis.previewSet),
                    missing: Array.from(entry.serviceAnalysis.missingSet),
                    totalRequired: entry.serviceAnalysis.totalRequired,
                    coverage: coverage,
                    perAppCoverage: entry.serviceAnalysis.perAppCoverage
                },
                tcoEstimate: entry.tcoEstimate
            };
        });

        // Nach aggregiertem Score sortieren
        return aggregated.sort((a, b) => b.aggregatedScore - a.aggregatedScore);
    }

    /**
     * Aggregiert TCO über alle Apps für jeden Provider
     */
    aggregateTCO(appResults) {
        const tcoByProvider = {};
        let operationsIncludedInCosts = true; // Default
        let projectEffortIncludedInCosts = true; // Default

        this.providers.forEach(provider => {
            tcoByProvider[provider.id] = {
                monthlyInfrastructure: 0,
                monthlyOperations: 0,
                projectEffortDays: 0,
                totalFTE: 0,
                totalMonthly: 0,
                includedInCosts: true, // Operations included
                projectEffortIncluded: true // Project Effort included
            };
        });

        appResults.forEach(({ results }) => {
            results.forEach(providerResult => {
                const tco = tcoByProvider[providerResult.provider.id];
                if (providerResult.tcoEstimate) {
                    tco.monthlyInfrastructure += providerResult.tcoEstimate.consumption?.monthlyEstimate || 0;
                    tco.monthlyOperations += providerResult.tcoEstimate.operations?.monthlyPersonnelCost || 0;
                    tco.projectEffortDays += providerResult.tcoEstimate.projectDaysEstimate || 0;
                    tco.totalFTE += providerResult.tcoEstimate.operations?.totalFTE || 0;
                    // Speichere die includedInCosts Flags vom ersten Ergebnis
                    if (providerResult.tcoEstimate.operations?.includedInCosts !== undefined) {
                        operationsIncludedInCosts = providerResult.tcoEstimate.operations.includedInCosts;
                    }
                    if (providerResult.tcoEstimate.projectEffort?.includedInCosts !== undefined) {
                        projectEffortIncludedInCosts = providerResult.tcoEstimate.projectEffort.includedInCosts;
                    }
                }
            });
        });

        // Total Monthly berechnen
        Object.values(tcoByProvider).forEach(tco => {
            tco.includedInCosts = operationsIncludedInCosts;
            tco.projectEffortIncluded = projectEffortIncludedInCosts;
            if (operationsIncludedInCosts) {
                tco.totalMonthly = tco.monthlyInfrastructure + tco.monthlyOperations;
            } else {
                tco.totalMonthly = tco.monthlyInfrastructure;
            }
        });

        return tcoByProvider;
    }

    /**
     * Berechnet Portfolio-weite Metriken
     */
    calculatePortfolioMetrics(appResults) {
        const totalApps = appResults.length;
        let totalComponents = 0;
        const componentFrequency = {};

        appResults.forEach(({ app }) => {
            totalComponents += app.selectedComponents.size;
            app.selectedComponents.forEach(compId => {
                componentFrequency[compId] = (componentFrequency[compId] || 0) + 1;
            });
        });

        // Häufigste Komponenten
        const sortedComponents = Object.entries(componentFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([id, count]) => {
                const comp = this.components.find(c => c.id === id);
                return {
                    id,
                    name: comp ? comp.name : id,
                    count,
                    percentage: (count / totalApps * 100).toFixed(0)
                };
            });

        return {
            totalApps,
            totalComponents,
            avgComponentsPerApp: (totalComponents / totalApps).toFixed(1),
            mostCommonComponents: sortedComponents
        };
    }
}

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CloudAnalyzer, ApplicationResearcher, MultiAppAnalyzer };
}
