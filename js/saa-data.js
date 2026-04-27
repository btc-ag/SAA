/**
 * Sovereign Architecture Advisor - Data Module
 * Cloud Provider Data mit Service-Level Bewertungen
 * Kontrolle, Leistung, Kosten + Begründungen
 *
 * Ab v4.0.0 zusätzlich: BSI C3A v1.0 + SOV-7 Compliance-Bewertungen je Provider,
 * importiert aus dem SCC-Schwesterprojekt via provider-c3a-data.js.
 */

// Helper: Service erstellen mit allen Bewertungen
const svc = (name, available, maturity, opts = {}) => ({
    name,
    available,
    maturity, // 'production' | 'preview' | 'planned' | 'none'
    // Kosten-Dimensionen
    consumption: opts.consumption || 'medium',      // Verbrauchskosten: low/medium/high
    operations: opts.operations || 'medium',        // Betriebsaufwand: low/medium/high
    projectEffort: opts.projectEffort || 'medium',  // Projektaufwand: low/medium/high
    // Bewertungen 0-100
    control: opts.control || 50,
    performance: opts.performance || 50,
    // Begründungen für Tooltips
    controlReason: opts.controlReason || '',
    performanceReason: opts.performanceReason || '',
    // Self-Build Alternative wenn nicht verfügbar
    selfBuildOption: opts.selfBuildOption || null
});

// Self-Build Optionen für nicht verfügbare Services
const selfBuildOptions = {
    serverless: {
        name: 'OpenFaaS / Knative',
        effort: 'high',
        description: 'Serverless selbst auf Kubernetes aufbauen',
        projectDays: 15,
        operationsLevel: 'high'
    },
    cdn: {
        name: 'Nginx + Varnish',
        effort: 'high',
        description: 'Eigenes CDN mit Caching-Proxies',
        projectDays: 20,
        operationsLevel: 'high'
    },
    messaging: {
        name: 'RabbitMQ / Kafka selbst betrieben',
        effort: 'medium',
        description: 'Message Broker auf VMs oder Kubernetes',
        projectDays: 8,
        operationsLevel: 'medium'
    },
    cache: {
        name: 'Redis selbst betrieben',
        effort: 'medium',
        description: 'Redis Cluster auf VMs oder Kubernetes',
        projectDays: 5,
        operationsLevel: 'medium'
    },
    secrets: {
        name: 'HashiCorp Vault',
        effort: 'medium',
        description: 'Vault auf VMs oder Kubernetes',
        projectDays: 10,
        operationsLevel: 'medium'
    },
    identity: {
        name: 'Keycloak',
        effort: 'medium',
        description: 'Keycloak als IdP selbst betrieben',
        projectDays: 12,
        operationsLevel: 'medium'
    },
    ai_ml: {
        name: 'Kubeflow / MLflow',
        effort: 'very_high',
        description: 'ML-Plattform selbst aufbauen',
        projectDays: 40,
        operationsLevel: 'very_high'
    },
    database_nosql: {
        name: 'MongoDB / Cassandra selbst betrieben',
        effort: 'high',
        description: 'NoSQL-Cluster auf VMs',
        projectDays: 15,
        operationsLevel: 'high'
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ARCHITEKTUR-MODI: Cloud-native vs. Klassisch
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Architektur-Modi definieren die grundsätzliche Deployment-Strategie
 * - 'cloud_native': Nutzt PaaS/Serverless wo möglich, minimaler Betriebsaufwand
 * - 'classic': Traditionelle VM-basierte Architektur, volle Kontrolle
 */
const architectureModes = {
    cloud_native: {
        id: 'cloud_native',
        name: 'Cloud-native / Modern',
        description: 'Nutzt Platform-as-a-Service (PaaS) und Serverless-Dienste wo möglich. Minimaler Betriebsaufwand, optimierte Kosten.',
        icon: '☁️',
        benefits: ['Geringerer Betriebsaufwand', 'Automatische Skalierung', 'Managed Security Updates', 'Pay-per-Use Preismodell'],
        tradeoffs: ['Höherer Vendor Lock-in', 'Weniger Kontrolle über Infrastruktur', 'Abhängigkeit von Provider-Features']
    },
    classic: {
        id: 'classic',
        name: 'Klassisch / VM-basiert',
        description: 'Traditionelle Architektur mit virtuellen Maschinen. Volle Kontrolle, aber höherer Betriebsaufwand.',
        icon: '🖥️',
        benefits: ['Volle Kontrolle', 'Portabilität', 'Keine PaaS-Einschränkungen', 'Flexible Konfiguration'],
        tradeoffs: ['Höherer Betriebsaufwand', 'Manuelle Skalierung', 'Eigene Wartung & Updates']
    }
};

/**
 * Deployment Patterns: Optimale Service-Kombinationen basierend auf Workload-Typ
 * Jedes Pattern definiert Cloud-native und Klassische Alternativen
 */
const deploymentPatterns = {
    // Statische Websites (HTML/CSS/JS ohne Backend)
    static_website: {
        name: 'Statische Website',
        description: 'Reine HTML/CSS/JS Websites ohne Server-seitige Logik',
        // Erkennung: Nur Object Storage + CDN, kein Compute/DB
        detection: (components) => {
            const hasObjectStorage = components.includes('storage_object');
            const hasCDN = components.includes('cdn');
            const hasCompute = components.includes('compute') || components.includes('kubernetes');
            const hasDB = components.includes('database_sql') || components.includes('database_nosql');
            return (hasObjectStorage || hasCDN) && !hasCompute && !hasDB;
        },
        cloudNative: {
            replaceServices: { storage_object: 'static_hosting' },
            addServices: ['cdn', 'dns'],
            removeServices: [],
            operationsFactor: 0.1, // 90% weniger Betriebsaufwand
            description: 'Static Website Hosting (S3/Blob) mit CDN'
        },
        classic: {
            replaceServices: { storage_object: 'compute' },
            addServices: ['loadbalancer', 'dns'],
            removeServices: [],
            operationsFactor: 1.0,
            description: 'VM mit Nginx/Apache Webserver'
        }
    },

    // Web-Applikationen (mit Backend-Logik)
    web_application: {
        name: 'Web-Applikation',
        description: 'Dynamische Webanwendungen mit Backend-Logik',
        detection: (components) => {
            const hasCompute = components.includes('compute');
            const hasDB = components.includes('database_sql') || components.includes('database_nosql');
            const hasLB = components.includes('loadbalancer');
            // Nicht Kubernetes-basiert für dieses Pattern
            const hasK8s = components.includes('kubernetes');
            return hasCompute && hasDB && !hasK8s;
        },
        cloudNative: {
            replaceServices: { compute: 'app_service' },
            addServices: [],
            removeServices: [],
            operationsFactor: 0.3, // 70% weniger Betriebsaufwand
            description: 'Managed App Service (Lightsail, App Service, Cloud Run)'
        },
        classic: {
            replaceServices: {},
            addServices: [],
            removeServices: [],
            operationsFactor: 1.0,
            description: 'VMs mit Load Balancer'
        }
    },

    // API / Microservices
    api_service: {
        name: 'API / Microservices',
        description: 'REST/GraphQL APIs und Microservice-Architekturen',
        detection: (components) => {
            const hasServerless = components.includes('serverless');
            const hasMessaging = components.includes('messaging');
            const hasCompute = components.includes('compute');
            // Serverless oder kleine Compute + Messaging
            return hasServerless || (hasCompute && hasMessaging);
        },
        cloudNative: {
            replaceServices: { compute: 'serverless', serverless: 'serverless' },
            addServices: ['api_gateway'],
            removeServices: ['loadbalancer'],
            operationsFactor: 0.15, // 85% weniger Betriebsaufwand
            description: 'Serverless Functions mit API Gateway'
        },
        classic: {
            replaceServices: { serverless: 'compute' },
            addServices: ['loadbalancer'],
            removeServices: [],
            operationsFactor: 1.0,
            description: 'VMs hinter Load Balancer'
        }
    },

    // Container / Kubernetes Workloads
    container_workload: {
        name: 'Container-Workload',
        description: 'Containerisierte Anwendungen auf Kubernetes',
        detection: (components) => {
            return components.includes('kubernetes');
        },
        cloudNative: {
            replaceServices: {},
            addServices: [],
            removeServices: [],
            operationsFactor: 0.5, // 50% weniger durch Managed K8s
            description: 'Managed Kubernetes (EKS, AKS, GKE)'
        },
        classic: {
            replaceServices: { kubernetes: 'compute' },
            addServices: ['loadbalancer'],
            removeServices: ['container_registry'],
            operationsFactor: 1.2, // Mehr Aufwand für Self-managed
            description: 'Self-managed K8s oder VMs'
        }
    },

    // Datenbank-zentrische Anwendungen
    database_centric: {
        name: 'Datenbank-Anwendung',
        description: 'Anwendungen mit Fokus auf Datenbankoperationen',
        detection: (components) => {
            const hasDB = components.includes('database_sql') || components.includes('database_nosql');
            const hasCompute = components.includes('compute');
            const hasK8s = components.includes('kubernetes');
            return hasDB && !hasCompute && !hasK8s;
        },
        cloudNative: {
            replaceServices: {},
            addServices: [],
            removeServices: [],
            operationsFactor: 0.4, // 60% weniger durch Managed DB
            description: 'Managed Database Services (RDS, Cloud SQL)'
        },
        classic: {
            replaceServices: {},
            addServices: ['compute'], // DB auf eigener VM
            removeServices: [],
            operationsFactor: 1.3, // Mehr Aufwand für DB-Betrieb
            description: 'Datenbank auf eigener VM'
        }
    },

    // Enterprise / Legacy Anwendungen (SAP, Oracle, etc.)
    enterprise_legacy: {
        name: 'Enterprise / Legacy',
        description: 'Klassische Enterprise-Anwendungen wie SAP, Oracle EBS',
        detection: (components, appId) => {
            // Erkennung über App-ID oder spezifische Komponenten-Kombinationen
            const enterpriseApps = ['sap-s4hana', 'sap-business-one', 'oracle-ebs', 'microsoft-dynamics-365'];
            if (appId && enterpriseApps.includes(appId)) return true;
            // Oder: Viel RAM + Block Storage + File Storage
            const hasBlockStorage = components.includes('storage_block');
            const hasFileStorage = components.includes('storage_file');
            const hasCompute = components.includes('compute');
            return hasCompute && hasBlockStorage && hasFileStorage;
        },
        cloudNative: {
            replaceServices: {},
            addServices: [],
            removeServices: [],
            operationsFactor: 0.7, // Nur 30% weniger, da oft VM-basiert
            description: 'Optimierte Cloud-VMs mit managed Services wo möglich'
        },
        classic: {
            replaceServices: {},
            addServices: [],
            removeServices: [],
            operationsFactor: 1.0,
            description: 'Klassische VM-Architektur'
        }
    }
};

// detectDeploymentPattern → siehe js/modules/deployment-pattern.js

// Cloud Provider mit detaillierten Service-Bewertungen
const cloudProviders = [
    {
        id: 'aws',
        name: 'AWS',
        fullName: 'Amazon Web Services',
        control: 44,
        performance: 97,
        category: 'hyperscaler',
        color: '#ef4444',
        description: 'Umfangreichstes Portfolio mit exzellenter Developer Experience.',
        services: {
            compute: svc('EC2', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 35, performance: 98,
                controlReason: 'US-Unternehmen, CLOUD Act anwendbar. Daten können von US-Behörden angefordert werden. Keine EU-Datenresidenz-Garantie.',
                performanceReason: 'Größte Instanzvielfalt weltweit, Graviton-Prozessoren, Spot-Instances, exzellente Netzwerk-Performance bis 100 Gbit/s.'
            }),
            kubernetes: svc('EKS', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 35, performance: 95,
                controlReason: 'Managed Control Plane bei AWS. Eingeschränkte Einsicht in Cluster-Management. AWS hat Zugriff auf Metadata.',
                performanceReason: 'Vollständig verwaltetes Kubernetes, nahtlose AWS-Integration, Fargate für Serverless-Container, Karpenter Autoscaling.'
            }),
            serverless: svc('Lambda', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 30, performance: 98,
                controlReason: 'Code läuft in AWS-verwalteter Blackbox. Keine Kontrolle über Ausführungsumgebung. Starker Vendor Lock-in.',
                performanceReason: 'Marktführer bei Serverless. Beste Cold-Start-Zeiten, 10GB Memory, Container-Images, umfangreichste Event-Trigger.'
            }),
            database_sql: svc('RDS', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 35, performance: 95,
                controlReason: 'Managed Service - AWS hat Zugriff auf Infrastruktur. Encryption Keys über KMS verwaltbar, aber AWS-Infrastruktur.',
                performanceReason: 'Multi-AZ HA, Read Replicas, automatische Backups, Performance Insights, Aurora mit 5x MySQL Performance.'
            }),
            database_nosql: svc('DynamoDB', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'medium',
                control: 25, performance: 98,
                controlReason: 'Vollständig proprietär. Kein Standard-API, keine Portabilität. Extremer Vendor Lock-in. Nur bei AWS nutzbar.',
                performanceReason: 'Single-digit Millisekunden Latenz garantiert. Unbegrenzte Skalierung, Global Tables, DAX In-Memory Cache.'
            }),
            storage_object: svc('S3', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 38, performance: 99,
                controlReason: 'S3-API ist Industriestandard (portabel). Aber US-Jurisdiktion, CLOUD Act. Verschlüsselung mit eigenen Keys möglich.',
                performanceReason: 'De-facto Standard. 11 Neunen Durability, intelligentes Tiering, S3 Express One Zone für Millisekunden-Zugriff.'
            }),
            storage_block: svc('EBS', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 40, performance: 95,
                controlReason: 'Verschlüsselung mit eigenen KMS-Keys möglich. Snapshots bleiben in AWS-Region.',
                performanceReason: 'io2 Block Express mit 256k IOPS, 4000 MB/s Throughput, Multi-Attach für Cluster.'
            }),
            storage_file: svc('EFS', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 35, performance: 88,
                controlReason: 'NFS-Standard (portabel), aber AWS-managed mit eingeschränkten Konfigurationsmöglichkeiten.',
                performanceReason: 'Petabyte-Skalierung, automatisches Tiering, Multi-AZ. Aber höhere Latenz als lokales NFS.'
            }),
            loadbalancer: svc('ALB/NLB', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 40, performance: 98,
                controlReason: 'Vollständig managed, keine Einsicht in LB-Infrastruktur. Aber Standard-Protokolle.',
                performanceReason: 'Millionen Requests/Sekunde, WebSocket, gRPC, HTTP/2, WAF-Integration, Global Accelerator.'
            }),
            cdn: svc('CloudFront', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 30, performance: 99,
                controlReason: 'Globales AWS-Netzwerk. Edge-Locations weltweit, keine Kontrolle über Routing. Lambda@Edge Code bei AWS.',
                performanceReason: '450+ Edge Locations weltweit, Lambda@Edge, Shield DDoS-Schutz, Origin Shield.'
            }),
            dns: svc('Route 53', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 38, performance: 98,
                controlReason: 'DNS-Daten bei AWS. Traffic-Flow-Policies einsehbar. Standard DNS-Protokoll (portabel).',
                performanceReason: '100% SLA, Health Checks, Geolocation/Latency Routing, DNSSEC, Private Hosted Zones.'
            }),
            messaging: svc('SQS/SNS', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'medium',
                control: 28, performance: 95,
                controlReason: 'Proprietäre APIs, kein AMQP/Kafka-Standard. Starker Lock-in. Keine Portabilität.',
                performanceReason: 'Unbegrenzte Skalierung, FIFO mit Exactly-Once, Fan-out mit SNS, bis 300k msg/sec.'
            }),
            cache: svc('ElastiCache', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 42, performance: 95,
                controlReason: 'Redis/Memcached-kompatibel (portabel). AWS-managed Cluster. Eigene Keys für Encryption.',
                performanceReason: 'Redis 7, Cluster-Mode, Global Datastore, automatisches Failover, bis 340 TB.'
            }),
            container_registry: svc('ECR', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 42, performance: 92,
                controlReason: 'OCI-kompatibel (portabel). Images auf AWS-Infrastruktur. Cross-Region Replication möglich.',
                performanceReason: 'Image Scanning, Lifecycle Policies, Pull-Through Cache, Cross-Account Sharing.'
            }),
            secrets: svc('Secrets Manager', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 45, performance: 92,
                controlReason: 'Secrets auf AWS. Eigene KMS-Keys möglich. Automatische Rotation. Audit via CloudTrail.',
                performanceReason: 'Automatische Rotation für RDS, Redshift, DocumentDB. Cross-Account, Versioning.'
            }),
            monitoring: svc('CloudWatch', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 35, performance: 90,
                controlReason: 'Alle Metriken und Logs auf AWS gespeichert. Export zu S3 möglich. Keine Echtzeit-API.',
                performanceReason: 'Umfassende Metriken, Logs Insights, Anomaly Detection, Synthetics, RUM.'
            }),
            logging: svc('CloudWatch Logs', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 35, performance: 88,
                controlReason: 'Logs auf AWS-Infrastruktur. Verschlüsselung möglich. Export zu S3/OpenSearch.',
                performanceReason: 'Log Insights Query-Sprache, Metric Filters, Subscriptions, Cross-Account.'
            }),
            ai_ml: svc('SageMaker/Bedrock', true, 'production', {
                consumption: 'high', operations: 'medium', projectEffort: 'medium',
                control: 25, performance: 98,
                controlReason: 'Trainingsdaten auf AWS. Bedrock-Modelle von Anthropic/Meta - keine Kontrolle über Modelle. Starker Lock-in.',
                performanceReason: 'Vollständige ML-Pipeline, Bedrock mit Claude/Titan/Llama, Ground Truth, Feature Store.'
            }),
            identity: svc('IAM/Cognito', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'medium',
                control: 40, performance: 95,
                controlReason: 'Identity-Daten bei AWS. Feingranulare Policies, aber AWS-proprietäres Format. Cognito-Lock-in.',
                performanceReason: 'Feingranulares IAM, MFA, SAML/OIDC Federation, Cognito User Pools mit Social Login.'
            }),
            // ═══ PaaS / Cloud-native Services ═══
            static_hosting: svc('S3 Static Hosting', true, 'production', {
                consumption: 'very_low', operations: 'very_low', projectEffort: 'very_low',
                control: 38, performance: 98,
                controlReason: 'Einfaches Website-Hosting über S3. US-Jurisdiktion, aber kein Server-Management nötig.',
                performanceReason: 'Hochverfügbar, global über CloudFront skalierbar, extrem kostengünstig für statische Inhalte.'
            }),
            app_service: svc('Lightsail / App Runner', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'very_low',
                control: 30, performance: 90,
                controlReason: 'Vollständig managed PaaS. Wenig Konfigurationsmöglichkeiten. Starker AWS-Lock-in.',
                performanceReason: 'Einfaches Deployment, automatische Skalierung, integriertes SSL, Container-Support mit App Runner.'
            }),
            api_gateway: svc('API Gateway', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 28, performance: 97,
                controlReason: 'Proprietäre API-Definition. Request/Response-Transformation AWS-spezifisch. Hoher Lock-in.',
                performanceReason: 'WebSocket-Support, Request Throttling, Caching, REST & HTTP APIs, nahtlose Lambda-Integration.'
            })
        }
    },
    {
        id: 'azure',
        name: 'Microsoft Azure',
        fullName: 'Microsoft Azure',
        control: 42,
        performance: 95,
        category: 'hyperscaler',
        color: '#ef4444',
        description: 'Größte Partner-Landschaft und Enterprise-Integration.',
        services: {
            compute: svc('Virtual Machines', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 35, performance: 95,
                controlReason: 'US-Unternehmen, CLOUD Act. EU Data Boundary verfügbar, aber kein vollständiger Schutz.',
                performanceReason: 'Breite Instanzauswahl, Spot VMs, Confidential Computing mit AMD SEV-SNP.'
            }),
            kubernetes: svc('AKS', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 38, performance: 95,
                controlReason: 'Control Plane kostenlos von Microsoft verwaltet. Azure AD Integration. RBAC über Azure.',
                performanceReason: 'Automatische Upgrades, Azure Policy Integration, Virtual Nodes, KEDA Autoscaling.'
            }),
            serverless: svc('Azure Functions', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 32, performance: 92,
                controlReason: 'Code in Microsoft-Umgebung. Durable Functions proprietär. Flex Consumption noch Preview.',
                performanceReason: 'Consumption und Premium Plan, VNet-Integration, Durable Functions für Workflows.'
            }),
            database_sql: svc('Azure SQL', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 38, performance: 95,
                controlReason: 'SQL Server-kompatibel (bedingt portabel). Microsoft-Infrastruktur. TDE mit eigenen Keys.',
                performanceReason: 'Hyperscale bis 100TB, Serverless Auto-Pause, automatisches Tuning, Ledger für Integrität.'
            }),
            database_nosql: svc('Cosmos DB', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'medium',
                control: 28, performance: 95,
                controlReason: 'Proprietäre Multi-Model DB mit starkem Lock-in. APIs kompatibel (MongoDB, Cassandra) aber nicht 100%.',
                performanceReason: 'Global Distribution in 60+ Regionen, 99.999% SLA, <10ms Latenz garantiert.'
            }),
            storage_object: svc('Blob Storage', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 38, performance: 95,
                controlReason: 'Eigene API, S3-kompatibel über Minio Gateway. Immutable Storage für Compliance.',
                performanceReason: 'Hot/Cool/Cold/Archive Tiers, Data Lake Gen2 Integration, Versioning.'
            }),
            storage_block: svc('Managed Disks', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 40, performance: 93,
                controlReason: 'Verschlüsselung mit eigenen Keys (CMK). Azure-Infrastruktur.',
                performanceReason: 'Ultra Disks bis 160k IOPS, Shared Disks für Cluster, Zone-redundant.'
            }),
            storage_file: svc('Azure Files', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 40, performance: 90,
                controlReason: 'SMB 3.0 und NFS 4.1 Standard-Protokolle. Portabel. Premium Tier verfügbar.',
                performanceReason: 'SMB Multi-Channel, Azure File Sync für Hybrid, Premium bis 100k IOPS.'
            }),
            loadbalancer: svc('Azure LB', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 42, performance: 95,
                controlReason: 'Standard-Load-Balancing. Konfiguration transparent. Application Gateway für L7.',
                performanceReason: 'Standard LB kostenlos, Cross-Region LB, Health Probes, HA Ports.'
            }),
            cdn: svc('Azure CDN', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 35, performance: 90,
                controlReason: 'Wahl zwischen Microsoft/Verizon/Akamai Backend. Unterschiedliche Kontrollgrade.',
                performanceReason: 'Rules Engine, Real-time Analytics, Dynamic Site Acceleration, HTTPS.'
            }),
            dns: svc('Azure DNS', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 40, performance: 92,
                controlReason: 'DNS-Zonen auf Azure. Standard DNS-Protokoll (portabel). Private DNS Zones.',
                performanceReason: 'Anycast, DNSSEC, Private DNS, Alias Records, Traffic Manager Integration.'
            }),
            messaging: svc('Service Bus', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'medium',
                control: 38, performance: 93,
                controlReason: 'AMQP 1.0 Standard (bedingt portabel). Premium-Features proprietär.',
                performanceReason: 'Topics, Sessions, Dead-lettering, Geo-DR, bis 100MB Messages.'
            }),
            cache: svc('Azure Cache', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 42, performance: 93,
                controlReason: 'Redis-kompatibel (portabel). Open-Source-Basis. Microsoft-managed.',
                performanceReason: 'Redis 6, Enterprise Tier, Active Geo-Replication, Redis Modules.'
            }),
            container_registry: svc('ACR', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 42, performance: 90,
                controlReason: 'OCI-konform (portabel). Images auf Azure. Geo-Replication möglich.',
                performanceReason: 'Geo-Replication, ACR Tasks für Build, Content Trust, Quarantine.'
            }),
            secrets: svc('Key Vault', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 48, performance: 95,
                controlReason: 'HSM-backed Option (FIPS 140-2 Level 3). BYOK möglich. Strenge RBAC.',
                performanceReason: 'HSM Managed Keys, Certificate Management, RBAC, Soft Delete.'
            }),
            monitoring: svc('Azure Monitor', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 38, performance: 92,
                controlReason: 'Metriken auf Azure. Export zu Event Hub/Storage möglich. Prometheus-Export.',
                performanceReason: 'Application Insights, Log Analytics, Workbooks, Autoscale, Alerts.'
            }),
            logging: svc('Log Analytics', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 38, performance: 90,
                controlReason: 'KQL-Abfragen. Daten auf Azure, aber Export zu Storage möglich.',
                performanceReason: 'Kusto Query Language, Workspaces, Data Export, Cross-Workspace Queries.'
            }),
            ai_ml: svc('Azure AI/OpenAI', true, 'production', {
                consumption: 'high', operations: 'medium', projectEffort: 'medium',
                control: 28, performance: 98,
                controlReason: 'OpenAI-Partnerschaft. GPT-Modelle von OpenAI - keine Kontrolle. Content Filtering by Microsoft.',
                performanceReason: 'Azure OpenAI mit GPT-4/4o, Cognitive Services, ML Studio, Prompt Flow.'
            }),
            identity: svc('Entra ID', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'medium',
                control: 45, performance: 98,
                controlReason: 'Enterprise-Grade IAM. Microsoft-Ökosystem, aber SAML/OIDC Standards.',
                performanceReason: 'Conditional Access, PIM, B2B/B2C, Passwordless, Verified ID.'
            }),
            // ═══ PaaS / Cloud-native Services ═══
            static_hosting: svc('Azure Static Web Apps', true, 'production', {
                consumption: 'very_low', operations: 'very_low', projectEffort: 'very_low',
                control: 40, performance: 95,
                controlReason: 'Vollständig managed Static Hosting. GitHub/Azure DevOps Integration. Microsoft-Ökosystem.',
                performanceReason: 'Globale Verteilung, integrierte API (Functions), automatische SSL-Zertifikate.'
            }),
            app_service: svc('App Service', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'very_low',
                control: 35, performance: 93,
                controlReason: 'Managed PaaS von Microsoft. Eingeschränkte OS-Konfiguration. Azure-Lock-in.',
                performanceReason: 'Einfaches Deployment, Auto-Scaling, Deployment Slots, integriertes CI/CD.'
            }),
            api_gateway: svc('API Management', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 38, performance: 92,
                controlReason: 'Enterprise-Grade APIM. Policies Azure-spezifisch. Self-hosted Gateway Option.',
                performanceReason: 'Developer Portal, Rate Limiting, Analytics, OAuth2/JWT, GraphQL Support.'
            })
        }
    },
    {
        id: 'gcp',
        name: 'Google Cloud',
        fullName: 'Google Cloud Platform',
        control: 42,
        performance: 95,
        category: 'hyperscaler',
        color: '#ef4444',
        description: 'Führend bei Kubernetes, Analytics und KI.',
        services: {
            compute: svc('Compute Engine', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 35, performance: 95,
                controlReason: 'US-Unternehmen, CLOUD Act. Assured Workloads für Compliance, aber US-Kontrolle.',
                performanceReason: 'Custom Machine Types, Preemptible/Spot VMs, Live Migration ohne Downtime.'
            }),
            kubernetes: svc('GKE', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 38, performance: 98,
                controlReason: 'Google als Kubernetes-Erfinder hat tiefste Integration. Control Plane Google-managed.',
                performanceReason: 'Autopilot (Serverless K8s), Multi-Cluster mit Anthos, Release Channels, Image Streaming.'
            }),
            serverless: svc('Cloud Functions', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 32, performance: 90,
                controlReason: 'Code in Google-Umgebung. 2nd Gen basiert auf Cloud Run.',
                performanceReason: 'Event-driven, Cloud Run Integration, Pub/Sub Trigger, Eventarc.'
            }),
            database_sql: svc('Cloud SQL', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 38, performance: 92,
                controlReason: 'MySQL/PostgreSQL kompatibel (portabel). Google-managed. CMEK möglich.',
                performanceReason: 'HA mit Regional, Automated Backups, Query Insights, 96 vCPUs/624GB RAM.'
            }),
            database_nosql: svc('Firestore', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'medium',
                control: 25, performance: 90,
                controlReason: 'Proprietäre Document DB mit Firebase-Lock-in. Keine Standard-API.',
                performanceReason: 'Real-time Updates, Offline Support, Security Rules, Multi-Region.'
            }),
            storage_object: svc('Cloud Storage', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 38, performance: 95,
                controlReason: 'S3-kompatible API. Google-Infrastruktur. Object Lifecycle, CMEK.',
                performanceReason: 'Multi-Regional, Nearline/Coldline/Archive, Object Versioning, Turbo Replication.'
            }),
            storage_block: svc('Persistent Disk', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 40, performance: 93,
                controlReason: 'Standard Block Storage. Google-managed. Snapshots, CMEK.',
                performanceReason: 'Regional PDs, Hyperdisk mit 350k IOPS, Snapshots, Machine Images.'
            }),
            storage_file: svc('Filestore', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 38, performance: 88,
                controlReason: 'NFS-Standard (portabel). Google-managed.',
                performanceReason: 'Basic/High Scale/Enterprise Tiers, bis 100TB, Snapshots.'
            }),
            loadbalancer: svc('Cloud LB', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 40, performance: 98,
                controlReason: 'Global LB mit Google Premium Netzwerk. Anycast IPs.',
                performanceReason: 'Globaler HTTP(S) LB, Cloud Armor WAF/DDoS, CDN-Integration.'
            }),
            cdn: svc('Cloud CDN', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 32, performance: 95,
                controlReason: 'Google Edge Network. Proprietäre Infrastruktur.',
                performanceReason: 'Anycast, Cache Invalidation, Signed URLs/Cookies, Media CDN.'
            }),
            dns: svc('Cloud DNS', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 40, performance: 95,
                controlReason: 'Standard DNS. Google-Infrastruktur. Private Zones.',
                performanceReason: '100% SLA, DNSSEC, Private Zones, DNS Peering.'
            }),
            messaging: svc('Pub/Sub', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'medium',
                control: 30, performance: 95,
                controlReason: 'Proprietärer Service, kein Standard-Protokoll (AMQP). Lock-in.',
                performanceReason: 'Global, At-least-once/Exactly-once, Ordering, BigQuery Subscriptions.'
            }),
            cache: svc('Memorystore', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 42, performance: 90,
                controlReason: 'Redis/Memcached-kompatibel (portabel). Google-managed.',
                performanceReason: 'Redis Cluster, RDB/AOF Persistence, VPC, Maintenance Windows.'
            }),
            container_registry: svc('Artifact Registry', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 42, performance: 92,
                controlReason: 'OCI-konform. Multi-Format (Docker, Maven, npm, Python).',
                performanceReason: 'Vulnerability Scanning, Remote Repositories, Cleanup Policies.'
            }),
            secrets: svc('Secret Manager', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 45, performance: 90,
                controlReason: 'Secrets auf Google-Infra. CMEK möglich. Audit Logging.',
                performanceReason: 'Automatic Rotation, IAM Integration, Versioning, Replication.'
            }),
            monitoring: svc('Cloud Monitoring', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 38, performance: 92,
                controlReason: 'Metriken auf Google. Prometheus-kompatibel (Export möglich).',
                performanceReason: 'Uptime Checks, Dashboards, Alerting, SLO Monitoring, MQL.'
            }),
            logging: svc('Cloud Logging', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 38, performance: 92,
                controlReason: 'Logs auf Google. BigQuery-Export für Analyse. Log Router.',
                performanceReason: 'Log Router, Sinks, Log-based Metrics, Log Analytics.'
            }),
            ai_ml: svc('Vertex AI', true, 'production', {
                consumption: 'high', operations: 'medium', projectEffort: 'medium',
                control: 28, performance: 98,
                controlReason: 'Google AI-Modelle (Gemini). Trainingsdaten auf Google. Model Garden mit Drittanbietern.',
                performanceReason: 'Gemini Pro/Ultra, AutoML, Feature Store, Pipelines, Model Garden.'
            }),
            identity: svc('IAM', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'medium',
                control: 40, performance: 90,
                controlReason: 'Google-IAM mit eigener Policy-Sprache. Workload Identity für externe IdPs.',
                performanceReason: 'Fine-grained Roles, Workload Identity, Org Policies, IAM Conditions.'
            }),
            // ═══ PaaS / Cloud-native Services ═══
            static_hosting: svc('Cloud Storage Hosting', true, 'production', {
                consumption: 'very_low', operations: 'very_low', projectEffort: 'very_low',
                control: 38, performance: 96,
                controlReason: 'GCS Static Hosting. US-Jurisdiktion, aber Standard-Protokolle. Firebase Hosting Alternative.',
                performanceReason: 'Globale Verfügbarkeit, Cloud CDN Integration, Firebase Hosting für SPAs.'
            }),
            app_service: svc('Cloud Run / App Engine', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'very_low',
                control: 32, performance: 95,
                controlReason: 'Managed Container Platform. Knative-basiert (teilweise portabel). Google-Lock-in bei App Engine.',
                performanceReason: 'Container-to-URL in Sekunden, automatische Skalierung auf 0, Knative-kompatibel.'
            }),
            api_gateway: svc('API Gateway / Apigee', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 35, performance: 93,
                controlReason: 'Google API Gateway oder Enterprise Apigee. OpenAPI-basiert. Apigee mit mehr Kontrolle.',
                performanceReason: 'Serverless API Gateway, Apigee für Enterprise mit Analytics, Developer Portal.'
            })
        }
    },
    {
        id: 'stackit',
        name: 'STACKIT',
        fullName: 'STACKIT (Schwarz IT)',
        control: 90,
        performance: 75,
        category: 'eu',
        color: '#10b981',
        description: 'Deutsche Cloud der Schwarz Gruppe für den Mittelstand.',
        services: {
            compute: svc('Compute Engine', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 92, performance: 78,
                controlReason: 'Deutsches Unternehmen (Schwarz Gruppe). RZ in DE. Volle DSGVO-Konformität. Kein CLOUD Act.',
                performanceReason: 'Solide VM-Optionen, gute Performance. Kleineres Portfolio als Hyperscaler.'
            }),
            kubernetes: svc('SKE', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 90, performance: 80,
                controlReason: 'Kubernetes unter deutscher Kontrolle. Eigene Control Plane. CNCF-konform.',
                performanceReason: 'CNCF-konformes Kubernetes, gute Integration, aktive Entwicklung, Gardener-basiert.'
            }),
            serverless: svc('Serverless', false, 'planned', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 0, performance: 0,
                controlReason: 'Noch nicht verfügbar.',
                performanceReason: 'Nicht verfügbar.',
                selfBuildOption: selfBuildOptions.serverless
            }),
            database_sql: svc('PostgreSQL', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 92, performance: 80,
                controlReason: 'Open-Source PostgreSQL. Deutsche Datenhaltung. Kein Lock-in, voll portabel.',
                performanceReason: 'Managed PostgreSQL, gute Performance, HA verfügbar, Backups.'
            }),
            database_nosql: svc('MongoDB', true, 'preview', {
                consumption: 'medium', operations: 'medium', projectEffort: 'low',
                control: 88, performance: 70,
                controlReason: 'MongoDB-kompatibel (portabel). Deutsche Datenhaltung. Preview-Status.',
                performanceReason: 'Preview-Status, Basis-Features, noch nicht für kritische Workloads.'
            }),
            storage_object: svc('Object Storage', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 92, performance: 82,
                controlReason: 'S3-kompatible API (voll portabel). Deutsche Kontrolle. Kein US-Zugriff möglich.',
                performanceReason: 'S3-kompatibel, gute Performance, Lifecycle Policies, Versioning.'
            }),
            storage_block: svc('Block Storage', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 92, performance: 78,
                controlReason: 'Block Storage unter deutscher Kontrolle. Snapshots in DE.',
                performanceReason: 'SSD-basiert, Snapshots, gute IOPS für Standard-Workloads.'
            }),
            storage_file: svc('NFS Storage', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 92, performance: 75,
                controlReason: 'NFS-Standard (voll portabel). Deutsche Infrastruktur.',
                performanceReason: 'NFS v4, Multi-Attach, solide Performance.'
            }),
            loadbalancer: svc('Load Balancer', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 90, performance: 78,
                controlReason: 'Standard-Load-Balancing. Transparente Konfiguration.',
                performanceReason: 'L4/L7 Load Balancing, Health Checks, SSL Termination.'
            }),
            cdn: svc('Partner-CDN', false, 'none', {
                consumption: 'low', operations: 'low', projectEffort: 'medium',
                control: 0, performance: 0,
                controlReason: 'Kein eigenes CDN - nur über Partner (z.B. Cloudflare, Fastly) verfügbar.',
                performanceReason: 'Nicht nativ verfügbar. Partner-Integration erforderlich.',
                selfBuildOption: {
                    ...selfBuildOptions.cdn,
                    name: 'Partner-CDN (Cloudflare/Fastly)',
                    description: 'Über Partner wie Cloudflare oder Fastly möglich. Erfordert separate Verträge.'
                }
            }),
            dns: svc('DNS', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 90, performance: 80,
                controlReason: 'DNS unter deutscher Kontrolle. Standard-Protokoll.',
                performanceReason: 'Standard DNS Features, API-Zugang, Zone Management.'
            }),
            messaging: svc('RabbitMQ', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 92, performance: 78,
                controlReason: 'Open-Source RabbitMQ. AMQP-Standard (voll portabel). Kein Lock-in.',
                performanceReason: 'Managed RabbitMQ, AMQP 0.9.1, Clustering, Mirrored Queues.'
            }),
            cache: svc('Redis', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 92, performance: 80,
                controlReason: 'Open-Source Redis (portabel). Kein Lock-in. Deutsche Kontrolle.',
                performanceReason: 'Managed Redis, Cluster-Mode, Persistence, gute Latenz.'
            }),
            container_registry: svc('Harbor', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 94, performance: 78,
                controlReason: 'Open-Source Harbor (CNCF). OCI-konform, voll portabel. Volle Kontrolle.',
                performanceReason: 'Harbor-Features, Vulnerability Scanning, Replication, Quotas.'
            }),
            secrets: svc('Secrets Manager', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 90, performance: 75,
                controlReason: 'Secrets unter deutscher Kontrolle. Basis-Features.',
                performanceReason: 'Basis Secrets Management, API-Zugang, Integration mit SKE.'
            }),
            monitoring: svc('Observability Stack', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 92, performance: 78,
                controlReason: 'Open-Source basiert (Prometheus/Grafana). Volle Einsicht, portabel.',
                performanceReason: 'Prometheus/Grafana, Standard-Metriken, Alerting, Dashboards.'
            }),
            logging: svc('Logging', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 92, performance: 75,
                controlReason: 'Logs unter deutscher Kontrolle. Export möglich.',
                performanceReason: 'Zentrales Logging, Query-Interface, Basis-Features.'
            }),
            ai_ml: svc('-', false, 'planned', {
                consumption: 'high', operations: 'high', projectEffort: 'high',
                control: 0, performance: 0,
                controlReason: 'Noch nicht verfügbar.',
                performanceReason: 'Nicht verfügbar.',
                selfBuildOption: selfBuildOptions.ai_ml
            }),
            identity: svc('Keycloak', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'medium',
                control: 94, performance: 75,
                controlReason: 'Open-Source Keycloak (CNCF). OIDC/SAML Standard. Volle Kontrolle, kein Lock-in.',
                performanceReason: 'Keycloak-Features, Federation, MFA, Social Login, User Management.'
            }),
            // ═══ PaaS / Cloud-native Services ═══
            static_hosting: svc('Object Storage Hosting', false, 'planned', {
                consumption: 'very_low', operations: 'very_low', projectEffort: 'very_low',
                control: 92, performance: 70,
                controlReason: 'Geplant für STACKIT. Würde volle Datensouveränität bieten.',
                performanceReason: 'In Planung - Details noch nicht verfügbar.'
            }),
            app_service: svc('App Plattform', false, 'planned', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 90, performance: 70,
                controlReason: 'Geplant - würde Container-Deployment mit deutscher Souveränität ermöglichen.',
                performanceReason: 'In Planung - Kubernetes-basierte PaaS erwartet.'
            }),
            api_gateway: svc('API Gateway', false, 'planned', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 92, performance: 70,
                controlReason: 'Geplant - würde souveränes API-Management ermöglichen.',
                performanceReason: 'In Planung.'
            })
        }
    },
    {
        id: 'aws-sovereign',
        name: 'AWS European Sovereign Cloud',
        fullName: 'AWS European Sovereign Cloud',
        control: 82,
        performance: 92,
        category: 'sovereign',
        color: '#3b82f6',
        description: 'Seit Januar 2026 in GA: Europäische Souveränität mit AWS-Technologie, physisch isoliert. BSI C5, SOC 2 Type 1 und 7 ISO-Zertifizierungen bereits erreicht.',
        services: {
            // Gleiche Service-Levels wie Standard AWS - Preisaufschlag durch Provider-Faktor 1.15
            compute: svc('EC2', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 78, performance: 92,
                controlReason: 'EU-Betrieb, EU-Personal. Physisch isoliert von US-Regionen. Kein CLOUD Act Zugriff.',
                performanceReason: 'Bewährte EC2-Technologie, aber initial kleineres Instanzportfolio als Global AWS.'
            }),
            kubernetes: svc('EKS', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 75, performance: 88,
                controlReason: 'EU-verwaltetes Control Plane. EU-Datenhaltung garantiert. EU-Admins.',
                performanceReason: 'EKS-Features verfügbar, möglicherweise verzögerte neue Features.'
            }),
            serverless: svc('Lambda', true, 'preview', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 72, performance: 82,
                controlReason: 'Code bleibt in EU-Sovereign. EU-Personal. Aber Lambda-Blackbox.',
                performanceReason: 'Lambda-Funktionalität, Preview-Status, weniger Trigger als Global.'
            }),
            database_sql: svc('RDS', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 78, performance: 90,
                controlReason: 'Datenbank vollständig in EU. EU-Verschlüsselungs-Keys. Kein US-Zugriff.',
                performanceReason: 'RDS-Features, Multi-AZ innerhalb souveräner Region. Aurora unklar.'
            }),
            database_nosql: svc('DynamoDB', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'medium',
                control: 70, performance: 88,
                controlReason: 'Daten in EU-Sovereign. Aber proprietäres Lock-in bleibt. Kein Standard.',
                performanceReason: 'DynamoDB-Performance, Global Tables möglicherweise eingeschränkt.'
            }),
            storage_object: svc('S3', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 78, performance: 92,
                controlReason: 'S3 vollständig in EU-Sovereign. Keine US-Replikation möglich. EU-Keys.',
                performanceReason: 'S3-Features und Durability, dedizierte EU-Infrastruktur.'
            }),
            storage_block: svc('EBS', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 80, performance: 90,
                controlReason: 'Block Storage in EU. Snapshots bleiben in EU-Sovereign.',
                performanceReason: 'EBS-Performance, möglicherweise initial weniger Volume-Typen.'
            }),
            storage_file: svc('EFS', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 78, performance: 85,
                controlReason: 'File System vollständig EU-basiert. NFS-Standard.',
                performanceReason: 'EFS-Funktionen, möglicherweise nur Single-AZ initial.'
            }),
            loadbalancer: svc('ALB/NLB', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 75, performance: 90,
                controlReason: 'Load Balancer in EU-Sovereign. EU-Netzwerk.',
                performanceReason: 'Standard ALB/NLB Features, EU-only Routing.'
            }),
            cdn: svc('Partner-CDN', false, 'none', {
                consumption: 'low', operations: 'medium', projectEffort: 'high',
                control: 0, performance: 0,
                controlReason: 'Kein eigenes CDN in der Sovereign Cloud - CloudFront ist nicht verfügbar. Nur über Partner (Cloudflare, Fastly) oder Self-Build.',
                performanceReason: 'Nicht nativ verfügbar. Partner-Integration oder eigene Lösung erforderlich.',
                selfBuildOption: selfBuildOptions.cdn
            }),
            dns: svc('Route 53', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 72, performance: 90,
                controlReason: 'DNS in EU-Sovereign. Aber globale DNS-Auflösung nötig für Internet.',
                performanceReason: 'Route 53 Features, dedizierte EU-Zonen.'
            }),
            messaging: svc('SQS/SNS', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'medium',
                control: 75, performance: 88,
                controlReason: 'Messaging in EU-Sovereign. Keine US-Verarbeitung. Aber proprietär.',
                performanceReason: 'Standard SQS/SNS, möglicherweise ohne alle Features.'
            }),
            cache: svc('ElastiCache', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 78, performance: 85,
                controlReason: 'Cache vollständig in EU-Sovereign. Redis-kompatibel.',
                performanceReason: 'Redis/Memcached, initial kleinere Node-Auswahl.'
            }),
            container_registry: svc('ECR', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 75, performance: 88,
                controlReason: 'Container Images in EU. Keine US-Replikation.',
                performanceReason: 'ECR-Features, Scanning in EU.'
            }),
            secrets: svc('Secrets Manager', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 80, performance: 88,
                controlReason: 'Secrets in EU. EU-KMS. Kein US-Zugriff auf Keys.',
                performanceReason: 'Secrets Manager Features, EU-only.'
            }),
            monitoring: svc('CloudWatch', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 75, performance: 85,
                controlReason: 'Metriken/Logs bleiben in EU-Sovereign. Kein Export nach US.',
                performanceReason: 'CloudWatch-Basis, möglicherweise eingeschränkte Insights.'
            }),
            logging: svc('CloudWatch Logs', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 75, performance: 85,
                controlReason: 'Alle Logs in EU-Sovereign gespeichert. EU-Verschlüsselung.',
                performanceReason: 'Log-Funktionen, EU-Datenhaltung.'
            }),
            ai_ml: svc('Bedrock', true, 'production', {
                consumption: 'high', operations: 'medium', projectEffort: 'medium',
                control: 70, performance: 85,
                controlReason: 'Bedrock in EU-Sovereign verfügbar. Modelle bleiben in EU. Aber proprietäre API und Lock-in.',
                performanceReason: 'Bedrock mit ausgewählten Foundation Models. EU-Inferenz, möglicherweise kleineres Modell-Portfolio als Global AWS.'
            }),
            identity: svc('IAM', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'medium',
                control: 78, performance: 90,
                controlReason: 'Separates IAM in EU-Sovereign Partition. Kein zentrales Identity über Partitionen hinweg. Zusätzliche Accounts/Rollen nötig.',
                performanceReason: 'Vollständiges IAM, EU-basiert.'
            }),
            // ═══ PaaS / Cloud-native Services ═══
            static_hosting: svc('S3 Static Hosting', true, 'production', {
                consumption: 'very_low', operations: 'very_low', projectEffort: 'very_low',
                control: 75, performance: 92,
                controlReason: 'S3 in EU-Sovereign Partition. EU-Datenresidenz, aber AWS-Technologie und -Betrieb.',
                performanceReason: 'Wie Standard AWS S3, aber nur EU-Locations.'
            }),
            app_service: svc('Lightsail / App Runner', true, 'preview', {
                consumption: 'low', operations: 'very_low', projectEffort: 'very_low',
                control: 70, performance: 85,
                controlReason: 'PaaS in EU-Sovereign - EU-Datenresidenz. Feature-Set möglicherweise eingeschränkt.',
                performanceReason: 'Wie AWS Standard, aber EU-only Deployment.'
            }),
            api_gateway: svc('API Gateway', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 72, performance: 90,
                controlReason: 'API Gateway in EU-Sovereign. Gleiche Funktionalität, EU-Datenverarbeitung.',
                performanceReason: 'Vollständiges API Gateway in EU.'
            })
        }
    },
    {
        id: 'delos',
        name: 'Microsoft DELOS Cloud',
        fullName: 'Microsoft DELOS Cloud (T-Systems)',
        control: 85,
        performance: 62,
        category: 'sovereign',
        color: '#3b82f6',
        description: 'Deutsche Treuhänder-Cloud für Verwaltung und Kritische Infrastruktur. Seit Frühjahr 2026 georedundant (zwei Ops-Center DE). Separate Umgebung mit eigenem Support.',
        services: {
            compute: svc('Virtual Machines', true, 'production', {
                consumption: 'high', operations: 'low', projectEffort: 'low',
                control: 85, performance: 70,
                controlReason: 'Betrieb durch DELOS (SAP/Arvato). Kein Microsoft-Direktzugriff. Deutsche Treuhänder.',
                performanceReason: 'Azure-Technologie, aber eingeschränktes Instanzportfolio. Weniger SKUs.'
            }),
            // Azure: operations: low → DELOS: medium
            kubernetes: svc('AKS', true, 'preview', {
                consumption: 'high', operations: 'medium', projectEffort: 'medium',
                control: 82, performance: 60,
                controlReason: 'Treuhänder-Modell. Kein US-Zugriff auf Control Plane. Preview-Status.',
                performanceReason: 'AKS-Basis, Preview, eingeschränkte Features. Noch nicht produktionsreif.'
            }),
            // Azure: operations: very_low → DELOS: low (nicht verfügbar)
            serverless: svc('Azure Functions', false, 'planned', {
                consumption: 'medium', operations: 'low', projectEffort: 'high',
                control: 0, performance: 0,
                controlReason: 'Serverless noch nicht verfügbar in DELOS.',
                performanceReason: 'Nicht verfügbar.',
                selfBuildOption: selfBuildOptions.serverless
            }),
            // Azure: operations: low → DELOS: medium
            database_sql: svc('Azure SQL', true, 'production', {
                consumption: 'high', operations: 'medium', projectEffort: 'low',
                control: 85, performance: 72,
                controlReason: 'Datenbank unter deutscher Treuhänder-Kontrolle. Kein US-Zugriff.',
                performanceReason: 'SQL-Basis, aber weniger SKUs. Kein Hyperscale.'
            }),
            // Azure: operations: low → DELOS: medium (nicht verfügbar)
            database_nosql: svc('Cosmos DB', false, 'planned', {
                consumption: 'high', operations: 'medium', projectEffort: 'high',
                control: 0, performance: 0,
                controlReason: 'Cosmos DB noch nicht in DELOS verfügbar.',
                performanceReason: 'Nicht verfügbar.',
                selfBuildOption: selfBuildOptions.database_nosql
            }),
            // Azure: operations: very_low → DELOS: low
            storage_object: svc('Blob Storage', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 85, performance: 75,
                controlReason: 'Objektspeicher unter Treuhänder-Kontrolle. Deutsche Datenhaltung.',
                performanceReason: 'Blob-Funktionen, aber eingeschränkter Feature-Set. Kein Cool/Archive initial.'
            }),
            // Azure: operations: low → DELOS: medium
            storage_block: svc('Managed Disks', true, 'production', {
                consumption: 'high', operations: 'medium', projectEffort: 'low',
                control: 85, performance: 70,
                controlReason: 'Block Storage unter deutscher Datenhoheit.',
                performanceReason: 'Standard Managed Disks. Weniger Disk-Typen als Azure Global.'
            }),
            // Azure: operations: low → DELOS: medium
            storage_file: svc('Azure Files', true, 'production', {
                consumption: 'high', operations: 'medium', projectEffort: 'low',
                control: 85, performance: 68,
                controlReason: 'File Storage unter Treuhänder-Kontrolle. SMB/NFS Standard.',
                performanceReason: 'SMB-Support, eingeschränkte Premium-Optionen.'
            }),
            // Azure: operations: very_low → DELOS: low
            loadbalancer: svc('Azure LB', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 82, performance: 75,
                controlReason: 'Load Balancer unter deutscher Kontrolle.',
                performanceReason: 'Standard LB Features. Kein Application Gateway initial.'
            }),
            // Azure: operations: very_low → DELOS: low (nicht verfügbar)
            cdn: svc('Azure CDN', false, 'planned', {
                consumption: 'medium', operations: 'low', projectEffort: 'high',
                control: 0, performance: 0,
                controlReason: 'CDN nicht verfügbar. Edge-Locations müssten DELOS-konform sein.',
                performanceReason: 'Nicht verfügbar.',
                selfBuildOption: selfBuildOptions.cdn
            }),
            // Azure: operations: very_low → DELOS: low
            dns: svc('Azure DNS', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 80, performance: 80,
                controlReason: 'DNS unter deutscher Verwaltung. Standard-Protokoll.',
                performanceReason: 'DNS-Basis-Features. Private Zones verfügbar.'
            }),
            // Azure: operations: low → DELOS: medium
            messaging: svc('Service Bus', true, 'preview', {
                consumption: 'medium', operations: 'medium', projectEffort: 'medium',
                control: 82, performance: 65,
                controlReason: 'Messaging unter Treuhänder-Kontrolle. AMQP-Standard.',
                performanceReason: 'Service Bus Basis, Preview-Status. Eingeschränkte Features.'
            }),
            // Azure: operations: low → DELOS: medium (nicht verfügbar)
            cache: svc('Azure Cache', false, 'planned', {
                consumption: 'medium', operations: 'medium', projectEffort: 'medium',
                control: 0, performance: 0,
                controlReason: 'Cache noch nicht verfügbar.',
                performanceReason: 'Nicht verfügbar.',
                selfBuildOption: selfBuildOptions.cache
            }),
            // Azure: operations: very_low → DELOS: low
            container_registry: svc('ACR', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 82, performance: 72,
                controlReason: 'Container Registry unter deutscher Kontrolle.',
                performanceReason: 'ACR-Basis-Features. Geo-Replication eingeschränkt.'
            }),
            // Azure: operations: very_low → DELOS: low
            secrets: svc('Key Vault', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 88, performance: 80,
                controlReason: 'HSM in Deutschland. Treuhänder hat keinen Schlüsselzugriff. BYOK.',
                performanceReason: 'Key Vault Features, HSM-backed. Managed HSM möglich.'
            }),
            // Azure: operations: low → DELOS: medium
            monitoring: svc('Azure Monitor', true, 'production', {
                consumption: 'medium', operations: 'medium', projectEffort: 'low',
                control: 82, performance: 68,
                controlReason: 'Metriken unter deutscher Kontrolle gespeichert.',
                performanceReason: 'Monitor-Basis. Eingeschränkte Application Insights.'
            }),
            // Azure: operations: low → DELOS: medium
            logging: svc('Log Analytics', true, 'preview', {
                consumption: 'medium', operations: 'medium', projectEffort: 'low',
                control: 82, performance: 62,
                controlReason: 'Logs unter Treuhänder-Kontrolle. Keine US-Replikation.',
                performanceReason: 'Preview. Eingeschränkte KQL-Features und Retention.'
            }),
            // Azure: operations: medium → DELOS: high (nicht verfügbar)
            ai_ml: svc('Azure AI', false, 'planned', {
                consumption: 'high', operations: 'high', projectEffort: 'high',
                control: 0, performance: 0,
                controlReason: 'AI/ML noch nicht verfügbar in DELOS.',
                performanceReason: 'Nicht verfügbar.',
                selfBuildOption: selfBuildOptions.ai_ml
            }),
            // Azure: operations: low → DELOS: medium, projectEffort höher wegen separatem Tenant
            identity: svc('Entra ID', true, 'production', {
                consumption: 'medium', operations: 'medium', projectEffort: 'medium',
                control: 85, performance: 75,
                controlReason: 'Separates Entra ID in DELOS. Kein Federation mit globalem Azure AD. Zusätzliche Konfiguration nötig.',
                performanceReason: 'Entra-Basis. Eingeschränkte Premium-Features (PIM, CA).'
            }),
            // ═══ PaaS / Cloud-native Services ═══
            static_hosting: svc('Blob Static Web', true, 'production', {
                consumption: 'very_low', operations: 'low', projectEffort: 'low',
                control: 85, performance: 70,
                controlReason: 'Azure Static Hosting in DELOS-Umgebung. Deutsche Treuhänderschaft, volle Souveränität.',
                performanceReason: 'Standard Azure Static Hosting, aber nur DELOS-Regionen.'
            }),
            app_service: svc('App Service', false, 'planned', {
                consumption: 'medium', operations: 'medium', projectEffort: 'medium',
                control: 82, performance: 60,
                controlReason: 'App Service für DELOS geplant. Würde souveränes PaaS ermöglichen.',
                performanceReason: 'In Planung - eingeschränktes Feature-Set erwartet.'
            }),
            api_gateway: svc('API Management', false, 'planned', {
                consumption: 'medium', operations: 'medium', projectEffort: 'medium',
                control: 82, performance: 60,
                controlReason: 'APIM für DELOS geplant. Würde souveränes API-Management ermöglichen.',
                performanceReason: 'In Planung.'
            })
        }
    },
    {
        id: 'ionos',
        name: 'IONOS Cloud',
        fullName: 'IONOS Cloud (United Internet)',
        control: 65,
        performance: 65,
        category: 'eu',
        color: '#10b981',
        description: 'Größter deutscher Cloud-Anbieter mit gutem Preis-Leistungs-Verhältnis.',
        services: {
            compute: svc('Compute Engine', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 68, performance: 70,
                controlReason: 'Deutsches Unternehmen (United Internet). EU-RZ. DSGVO-konform.',
                performanceReason: 'Solide VM-Optionen. Gutes Preis-Leistungs-Verhältnis. Weniger Instanztypen.'
            }),
            kubernetes: svc('Managed K8s', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 65, performance: 68,
                controlReason: 'Kubernetes unter deutscher Kontrolle. Standard CNCF.',
                performanceReason: 'Standard Kubernetes. Basis-Features. Gute Integration.'
            }),
            serverless: svc('-', false, 'none', {
                control: 0, performance: 0,
                controlReason: 'Serverless nicht im Angebot.',
                performanceReason: 'Nicht verfügbar.',
                selfBuildOption: selfBuildOptions.serverless
            }),
            database_sql: svc('DBaaS PostgreSQL', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 68, performance: 70,
                controlReason: 'PostgreSQL (Open-Source, portabel). Deutsche Datenhaltung.',
                performanceReason: 'Managed PostgreSQL. Standard-Features. HA verfügbar.'
            }),
            database_nosql: svc('DBaaS MongoDB', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 65, performance: 68,
                controlReason: 'MongoDB-kompatibel. Deutsche Datenhaltung.',
                performanceReason: 'Managed MongoDB. Basis-Features.'
            }),
            storage_object: svc('S3 Object Storage', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 70, performance: 72,
                controlReason: 'S3-kompatibel (voll portabel). Deutsche RZ. DSGVO.',
                performanceReason: 'S3-API. Gute Performance für den Preis. Standard-Features.'
            }),
            storage_block: svc('Block Storage', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 68, performance: 70,
                controlReason: 'Block Storage unter deutscher Kontrolle.',
                performanceReason: 'SSD/HDD Optionen. Snapshots. Solide Performance.'
            }),
            storage_file: svc('NFS', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 68, performance: 65,
                controlReason: 'NFS-Standard (portabel). Deutsche Infrastruktur.',
                performanceReason: 'NFS-Basis-Features. Ausreichend für Standard-Workloads.'
            }),
            loadbalancer: svc('Load Balancer', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 65, performance: 70,
                controlReason: 'Standard Load Balancing. Transparente Konfiguration.',
                performanceReason: 'L4 Load Balancing. Health Checks. Basis-Features.'
            }),
            cdn: svc('CDN', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 60, performance: 65,
                controlReason: 'CDN mit EU-Fokus. Weniger Kontrolle über Edge-Routing.',
                performanceReason: 'Basis-CDN. Weniger Edge-Locations als Hyperscaler.'
            }),
            dns: svc('DNS', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 68, performance: 72,
                controlReason: 'DNS unter deutscher Kontrolle. Standard-Protokoll.',
                performanceReason: 'Standard DNS. Anycast. Gute Zuverlässigkeit.'
            }),
            messaging: svc('-', false, 'none', {
                control: 0, performance: 0,
                controlReason: 'Messaging nicht im Angebot.',
                performanceReason: 'Nicht verfügbar.',
                selfBuildOption: selfBuildOptions.messaging
            }),
            cache: svc('In-Memory DB', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 65, performance: 68,
                controlReason: 'Redis-basiert (portabel). Deutsche Infrastruktur.',
                performanceReason: 'Redis-kompatibel. Basis-Features. Ausreichend für Caching.'
            }),
            container_registry: svc('Container Registry', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 68, performance: 68,
                controlReason: 'OCI-konform (portabel). Deutsche Speicherung.',
                performanceReason: 'Docker Registry. Basis-Features.'
            }),
            secrets: svc('-', false, 'none', {
                control: 0, performance: 0,
                controlReason: 'Secrets Management nicht als managed Service.',
                performanceReason: 'Nicht verfügbar.',
                selfBuildOption: selfBuildOptions.secrets
            }),
            monitoring: svc('Monitoring', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 65, performance: 65,
                controlReason: 'Metriken unter deutscher Kontrolle.',
                performanceReason: 'Basis-Monitoring. Alerting. Dashboard.'
            }),
            logging: svc('Logging', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 65, performance: 62,
                controlReason: 'Logs auf deutscher Infrastruktur.',
                performanceReason: 'Basis-Logging. Ausreichend für Standard-Anforderungen.'
            }),
            ai_ml: svc('AI Model Hub', true, 'preview', {
                consumption: 'medium', operations: 'medium', projectEffort: 'medium',
                control: 55, performance: 60,
                controlReason: 'AI-Modelle verfügbar. Herkunft der Modelle zu prüfen.',
                performanceReason: 'Preview. Limitierte Modellauswahl. Basis-Features.'
            }),
            identity: svc('-', false, 'none', {
                control: 0, performance: 0,
                controlReason: 'Kein managed IAM Service.',
                performanceReason: 'Nicht verfügbar.',
                selfBuildOption: selfBuildOptions.identity
            }),
            // ═══ PaaS / Cloud-native Services ═══
            static_hosting: svc('S3 Static Website', true, 'production', {
                consumption: 'very_low', operations: 'very_low', projectEffort: 'very_low',
                control: 68, performance: 70,
                controlReason: 'S3-kompatibles Static Hosting. Deutsche Infrastruktur. DSGVO-konform.',
                performanceReason: 'Einfaches Static Hosting über Object Storage.'
            }),
            app_service: svc('-', false, 'none', {
                control: 0, performance: 0,
                controlReason: 'Kein managed App Service verfügbar.',
                performanceReason: 'Nicht verfügbar. Alternative: Container auf K8s.'
            }),
            api_gateway: svc('-', false, 'none', {
                control: 0, performance: 0,
                controlReason: 'Kein managed API Gateway verfügbar.',
                performanceReason: 'Nicht verfügbar. Alternative: Kong/Traefik Self-Build.'
            })
        }
    },
    {
        id: 'otc',
        name: 'T Cloud Public',
        fullName: 'T Cloud Public (Deutsche Telekom)',
        control: 55,
        performance: 55,
        category: 'eu',
        color: '#10b981',
        description: 'Enterprise-Cloud der Telekom auf Huawei-Basis. Industrial AI Cloud seit Feb 2026 live (NVIDIA Blackwell, größte souveräne AI-Infrastruktur Europas), 80% Hyperscaler-Feature-Parity.',
        services: {
            compute: svc('ECS', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 58, performance: 60,
                controlReason: 'Telekom-Betrieb in DE. Aber Huawei-Technologie im Backend. China-Bedenken.',
                performanceReason: 'OpenStack/Huawei-basiert. Solide, aber nicht cutting-edge.'
            }),
            kubernetes: svc('CCE', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 55, performance: 58,
                controlReason: 'Kubernetes auf Huawei/OpenStack Basis. China-Tech-Stack.',
                performanceReason: 'Managed Kubernetes. Standard-Features. Funktional.'
            }),
            serverless: svc('FunctionGraph', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'medium',
                control: 50, performance: 55,
                controlReason: 'Serverless auf Huawei-Technologie. Proprietäre Basis.',
                performanceReason: 'Basis Serverless. Weniger Trigger als AWS/Azure.'
            }),
            database_sql: svc('RDS', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 58, performance: 60,
                controlReason: 'Managed DB unter Telekom-Betrieb. MySQL/PostgreSQL.',
                performanceReason: 'MySQL/PostgreSQL/SQL Server. Standard-Features. HA.'
            }),
            database_nosql: svc('DDS', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 55, performance: 58,
                controlReason: 'Document DB Service auf Huawei-Technologie.',
                performanceReason: 'MongoDB-kompatibel. Basis-Features.'
            }),
            storage_object: svc('OBS', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 58, performance: 62,
                controlReason: 'S3-kompatibel. Telekom-Betrieb, DE-RZ. Huawei-Backend.',
                performanceReason: 'S3-API. Gute Basis-Features. Lifecycle Policies.'
            }),
            storage_block: svc('EVS', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 58, performance: 58,
                controlReason: 'Block Storage unter Telekom-Kontrolle.',
                performanceReason: 'SSD/HDD. Snapshots. Standard-Performance.'
            }),
            storage_file: svc('SFS', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 55, performance: 55,
                controlReason: 'File Storage. Telekom-managed. Standard-Protokolle.',
                performanceReason: 'NFS-basiert. Basis-Features. Ausreichend.'
            }),
            loadbalancer: svc('ELB', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 55, performance: 60,
                controlReason: 'Load Balancer unter Telekom-Betrieb.',
                performanceReason: 'L4/L7. Health Checks. Solide Basis.'
            }),
            cdn: svc('CDN', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 52, performance: 55,
                controlReason: 'CDN mit Huawei-Technologie. Weniger PoPs in EU.',
                performanceReason: 'Basis-CDN. Weniger Edge-Locations. Funktional.'
            }),
            dns: svc('DNS', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 55, performance: 58,
                controlReason: 'DNS unter Telekom-Verwaltung. Standard-Protokoll.',
                performanceReason: 'Standard DNS Features. Private Zones. Funktional.'
            }),
            messaging: svc('DMS', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'medium',
                control: 52, performance: 55,
                controlReason: 'Messaging Service auf Huawei-Basis. Kafka/RabbitMQ API.',
                performanceReason: 'Kafka/RabbitMQ kompatibel. Basis-Features.'
            }),
            cache: svc('DCS', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 55, performance: 58,
                controlReason: 'Cache Service unter Telekom-Betrieb. Redis-kompatibel.',
                performanceReason: 'Redis/Memcached. Cluster-Mode. Standard-Features.'
            }),
            container_registry: svc('SWR', true, 'production', {
                consumption: 'low', operations: 'very_low', projectEffort: 'low',
                control: 55, performance: 55,
                controlReason: 'Container Registry. Telekom-managed. OCI-konform.',
                performanceReason: 'Docker Registry. Basis-Features. Funktional.'
            }),
            secrets: svc('KMS', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 58, performance: 55,
                controlReason: 'Key Management unter Telekom-Kontrolle.',
                performanceReason: 'Basis KMS Features. Encryption Keys. Funktional.'
            }),
            monitoring: svc('Cloud Eye', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 55, performance: 55,
                controlReason: 'Monitoring unter Telekom-Betrieb. Metriken in DE.',
                performanceReason: 'Basis-Monitoring. Alerting. Dashboard. Ausreichend.'
            }),
            logging: svc('LTS', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 55, performance: 52,
                controlReason: 'Logging Service. Telekom-managed. Daten in DE.',
                performanceReason: 'Basis Log Management. Eingeschränkte Analyse.'
            }),
            ai_ml: svc('ModelArts', true, 'production', {
                consumption: 'high', operations: 'medium', projectEffort: 'medium',
                control: 45, performance: 65,
                controlReason: 'AI/ML auf Huawei-Technologie. China-Modelle möglich. Prüfung nötig.',
                performanceReason: 'ML-Pipeline. AutoML. Aber Huawei-abhängig.'
            }),
            identity: svc('IAM', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 55, performance: 58,
                controlReason: 'IAM unter Telekom-Verwaltung. Basis-Policies.',
                performanceReason: 'Basis IAM Features. Rollen, Gruppen. Funktional.'
            }),
            // ═══ PaaS / Cloud-native Services ═══
            static_hosting: svc('OBS Static Hosting', true, 'production', {
                consumption: 'very_low', operations: 'very_low', projectEffort: 'very_low',
                control: 55, performance: 58,
                controlReason: 'Object Storage Static Hosting unter Telekom-Betrieb. Deutsche RZ.',
                performanceReason: 'Einfaches Static Hosting. CDN-Integration möglich.'
            }),
            app_service: svc('-', false, 'none', {
                control: 0, performance: 0,
                controlReason: 'Kein managed App Service. Alternative: CCE (Container).',
                performanceReason: 'Nicht verfügbar.'
            }),
            api_gateway: svc('APIG', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 52, performance: 60,
                controlReason: 'API Gateway auf Huawei-Basis. Unter Telekom-Betrieb.',
                performanceReason: 'Basis-API-Management. Request Routing, Rate Limiting.'
            })
        }
    },
    {
        id: 'openstack',
        name: 'OpenStack Private Cloud',
        fullName: 'OpenStack Private Cloud (Self-Managed)',
        control: 100,
        performance: 35,
        category: 'private',
        color: '#8b5cf6',
        description: 'Maximale Kontrolle durch Open-Source Private Cloud.',
        services: {
            compute: svc('Nova', true, 'production', {
                consumption: 'low', operations: 'medium', projectEffort: 'high',
                control: 100, performance: 40,
                controlReason: 'Volle Kontrolle. Eigene Hardware. Open-Source. Keine externe Abhängigkeit.',
                performanceReason: 'Bewährt aber Eigenbetrieb. Weniger automatisiert als Public Cloud.'
            }),
            kubernetes: svc('Magnum', true, 'production', {
                consumption: 'low', operations: 'high', projectEffort: 'high',
                control: 100, performance: 45,
                controlReason: 'Kubernetes auf eigener Infrastruktur. Volle Kontrolle über Control Plane.',
                performanceReason: 'Container Orchestration. Eigenbetrieb des Control Plane nötig.'
            }),
            serverless: svc('Qinling', true, 'preview', {
                consumption: 'low', operations: 'very_high', projectEffort: 'very_high',
                control: 98, performance: 30,
                controlReason: 'Open-Source Serverless. Volle Kontrolle. Aber wenig Adoption.',
                performanceReason: 'Experimentell. Wenig Produktionsreife. Kaum Features.'
            }),
            database_sql: svc('Trove', true, 'production', {
                consumption: 'low', operations: 'high', projectEffort: 'high',
                control: 100, performance: 40,
                controlReason: 'DBaaS auf eigener Infra. Alle Daten unter eigener Kontrolle.',
                performanceReason: 'Basis DB-Management. Viel manueller Aufwand für HA/Backups.'
            }),
            database_nosql: svc('Trove', true, 'production', {
                consumption: 'low', operations: 'high', projectEffort: 'high',
                control: 100, performance: 38,
                controlReason: 'NoSQL auf eigener Infrastruktur. Volle Datenkontrolle.',
                performanceReason: 'MongoDB/Cassandra. Manuelles Cluster-Management.'
            }),
            storage_object: svc('Swift', true, 'production', {
                consumption: 'low', operations: 'high', projectEffort: 'high',
                control: 100, performance: 42,
                controlReason: 'Object Storage auf eigener Hardware. Volle Einsicht. S3-kompatibel.',
                performanceReason: 'S3-kompatibel. Eigenbetrieb. Weniger Features als S3.'
            }),
            storage_block: svc('Cinder', true, 'production', {
                consumption: 'low', operations: 'high', projectEffort: 'high',
                control: 100, performance: 45,
                controlReason: 'Block Storage vollständig unter eigener Kontrolle.',
                performanceReason: 'Solide Basis. Verschiedene Backend-Optionen (Ceph, LVM).'
            }),
            storage_file: svc('Manila', true, 'production', {
                consumption: 'low', operations: 'high', projectEffort: 'high',
                control: 100, performance: 40,
                controlReason: 'File Shares unter eigener Kontrolle. NFS/CIFS.',
                performanceReason: 'NFS/CIFS. Manuellere Verwaltung. Ceph-Backend möglich.'
            }),
            loadbalancer: svc('Octavia', true, 'production', {
                consumption: 'low', operations: 'medium', projectEffort: 'medium',
                control: 100, performance: 50,
                controlReason: 'Load Balancing auf eigener Infrastruktur. HAProxy-basiert.',
                performanceReason: 'HAProxy-basiert. Solide Basis-Features. L4/L7.'
            }),
            cdn: svc('-', false, 'none', {
                control: 0, performance: 0,
                controlReason: 'Kein CDN in OpenStack. Müsste extern sein.',
                performanceReason: 'Nicht verfügbar.',
                selfBuildOption: selfBuildOptions.cdn
            }),
            dns: svc('Designate', true, 'production', {
                consumption: 'low', operations: 'medium', projectEffort: 'medium',
                control: 100, performance: 45,
                controlReason: 'DNS vollständig unter eigener Kontrolle.',
                performanceReason: 'Standard DNS. Integration mit Nova. Bind/PowerDNS Backend.'
            }),
            messaging: svc('Zaqar', true, 'production', {
                consumption: 'low', operations: 'high', projectEffort: 'high',
                control: 100, performance: 35,
                controlReason: 'Messaging unter eigener Kontrolle.',
                performanceReason: 'Basis Messaging. Wenig Features. Wenig Adoption.'
            }),
            cache: svc('External (Redis)', true, 'production', {
                consumption: 'low', operations: 'medium', projectEffort: 'medium',
                control: 100, performance: 45,
                controlReason: 'Redis selbst betrieben. Volle Kontrolle.',
                performanceReason: 'Standard Redis. Eigenbetrieb für Cluster.'
            }),
            container_registry: svc('External (Harbor)', true, 'production', {
                consumption: 'low', operations: 'medium', projectEffort: 'medium',
                control: 100, performance: 45,
                controlReason: 'Harbor selbst betrieben. Volle Kontrolle. CNCF.',
                performanceReason: 'Harbor-Features. Scanning. Eigenbetrieb.'
            }),
            secrets: svc('Barbican', true, 'production', {
                consumption: 'low', operations: 'medium', projectEffort: 'medium',
                control: 100, performance: 42,
                controlReason: 'Secrets/Keys vollständig unter eigener Kontrolle. HSM-Integration möglich.',
                performanceReason: 'HSM-Integration möglich. Basis-Features. Solide.'
            }),
            monitoring: svc('Monasca', true, 'production', {
                consumption: 'low', operations: 'high', projectEffort: 'high',
                control: 100, performance: 38,
                controlReason: 'Monitoring auf eigener Infrastruktur. Volle Einsicht.',
                performanceReason: 'Metriken/Alerting. Komplexer Betrieb. Kafka-basiert.'
            }),
            logging: svc('Monasca', true, 'production', {
                consumption: 'low', operations: 'high', projectEffort: 'high',
                control: 100, performance: 35,
                controlReason: 'Logging vollständig unter eigener Kontrolle.',
                performanceReason: 'Log-Aggregation. Manueller Aufwand. Elasticsearch möglich.'
            }),
            ai_ml: svc('-', false, 'none', {
                control: 0, performance: 0,
                controlReason: 'Kein natives AI/ML in OpenStack.',
                performanceReason: 'Nicht verfügbar.',
                selfBuildOption: selfBuildOptions.ai_ml
            }),
            identity: svc('Keystone', true, 'production', {
                consumption: 'low', operations: 'medium', projectEffort: 'medium',
                control: 100, performance: 45,
                controlReason: 'Identity vollständig unter eigener Kontrolle. LDAP-Integration.',
                performanceReason: 'Basis IAM. Federation möglich. LDAP/AD-Backend.'
            }),
            // ═══ PaaS / Cloud-native Services ═══
            static_hosting: svc('Swift Static Hosting', true, 'production', {
                consumption: 'very_low', operations: 'medium', projectEffort: 'medium',
                control: 100, performance: 40,
                controlReason: 'Static Hosting über Swift. Vollständige Kontrolle. Eigenbetrieb.',
                performanceReason: 'S3-kompatibel. Kein integriertes CDN. Eigenbetrieb.'
            }),
            app_service: svc('-', false, 'none', {
                control: 0, performance: 0,
                controlReason: 'Kein PaaS in Standard-OpenStack. Alternative: Kubernetes (Magnum).',
                performanceReason: 'Nicht verfügbar.'
            }),
            api_gateway: svc('-', false, 'none', {
                control: 0, performance: 0,
                controlReason: 'Kein API Gateway in Standard-OpenStack. Self-Build: Kong/Traefik.',
                performanceReason: 'Nicht verfügbar.'
            })
        }
    },

    // ============== SAP Cloud Infrastructure (BTP/IaaS) ==============
    // Neu in v4.0.0: deutscher Enterprise-IaaS-Anbieter auf OpenStack-Basis
    // RZs in Walldorf/St. Leon-Rot mit ISO 27001 auf IT-Grundschutz (April 2026),
    // KRITIS-fähig, 3 unabhängige Verfügbarkeitszonen.
    {
        id: 'sap-ci',
        name: 'SAP Cloud Infrastructure',
        fullName: 'SAP Cloud Infrastructure (BTP/IaaS)',
        control: 82,
        performance: 60,
        category: 'eu',
        color: '#0070f2',
        description: 'IaaS-Cloud der SAP SE auf OpenStack-Basis für hochsensible Workloads in deutschen Rechenzentren. ISO 27001 auf IT-Grundschutz (BSI-zertifiziert April 2026), C5 Type II, KRITIS-fähig, VS-NfD-Hardware.',
        services: {
            compute: svc('SAP CI Compute', true, 'production', {
                consumption: 'medium', operations: 'medium', projectEffort: 'low',
                control: 90, performance: 75,
                controlReason: 'SAP-eigene RZ Walldorf/St. Leon-Rot, OpenStack-basiert, ISO 27001 auf IT-Grundschutz.',
                performanceReason: 'Solide Standard-VMs, weniger Skalierung als Hyperscaler.'
            }),
            kubernetes: svc('SAP Kubernetes Service (Gardener)', true, 'production', {
                consumption: 'medium', operations: 'medium', projectEffort: 'medium',
                control: 90, performance: 75,
                controlReason: 'Gardener ist Open Source, von SAP entwickelt, unter Apache-Lizenz.',
                performanceReason: 'Reife K8s-Plattform mit Multi-Cloud-Fähigkeiten.'
            }),
            serverless: svc('-', false, 'none', {
                control: 0, performance: 0,
                controlReason: 'Kein nativer Serverless-Service auf SAP CI dokumentiert. Alternative: Knative auf Gardener.',
                performanceReason: 'Nicht verfügbar.',
                selfBuildOption: 'serverless'
            }),
            database_sql: svc('SAP HANA Cloud / PostgreSQL', true, 'production', {
                consumption: 'high', operations: 'low', projectEffort: 'low',
                control: 85, performance: 80,
                controlReason: 'Managed in SAP-eigenen RZs, KRITIS-fähig.',
                performanceReason: 'HANA Cloud sehr leistungsstark; Standard-PostgreSQL solide.'
            }),
            database_nosql: svc('Begrenzt', true, 'preview', {
                consumption: 'medium', operations: 'medium', projectEffort: 'medium',
                control: 80, performance: 60,
                controlReason: 'NoSQL-Optionen weniger ausgereift als bei Hyperscalern.',
                performanceReason: 'Teilweise als Self-Build über Compute.'
            }),
            storage_object: svc('SAP Object Store', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 90, performance: 75,
                controlReason: 'S3-kompatibel, in SAP-RZs Deutschland.',
                performanceReason: 'Solide Performance, regionale Verfügbarkeit.'
            }),
            storage_block: svc('SAP Block Storage', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 90, performance: 75,
                controlReason: 'OpenStack Cinder, deutsche RZs.',
                performanceReason: 'Standard SSD/HDD-Optionen.'
            }),
            storage_file: svc('SAP File Storage', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 90, performance: 70,
                controlReason: 'NFS auf SAP-Infrastruktur, deutsche RZs.',
                performanceReason: 'Solide Performance.'
            }),
            loadbalancer: svc('SAP Load Balancer', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 90, performance: 75,
                controlReason: 'OpenStack Octavia, in SAP-RZs.',
                performanceReason: 'Standard-Load-Balancing.'
            }),
            cdn: svc('-', false, 'none', {
                control: 0, performance: 0,
                controlReason: 'Kein nativer CDN-Service auf SAP CI. Alternative: externe CDN-Anbieter.',
                performanceReason: 'Nicht verfügbar.',
                selfBuildOption: 'cdn'
            }),
            dns: svc('SAP DNS Service', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 90, performance: 75,
                controlReason: 'OpenStack Designate, deutsche RZs.',
                performanceReason: 'Solide DNS-Auflösung in EU.'
            }),
            messaging: svc('SAP Messaging (Limited)', true, 'preview', {
                consumption: 'medium', operations: 'medium', projectEffort: 'medium',
                control: 85, performance: 60,
                controlReason: 'Begrenzte Messaging-Optionen, primär Self-Build mit Kafka/RabbitMQ.',
                performanceReason: 'Über Compute self-managed.'
            }),
            cache: svc('SAP Cache (Limited)', true, 'preview', {
                consumption: 'medium', operations: 'medium', projectEffort: 'medium',
                control: 85, performance: 60,
                controlReason: 'Self-Build mit Redis/Memcached über Compute.',
                performanceReason: 'Solide bei Eigenbetrieb.'
            }),
            container_registry: svc('SAP Container Registry', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 90, performance: 75,
                controlReason: 'Harbor/Docker Registry in SAP-RZs.',
                performanceReason: 'Standard-Registry-Performance.'
            }),
            secrets: svc('SAP Vault', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 90, performance: 75,
                controlReason: 'HashiCorp Vault auf SAP-Infrastruktur.',
                performanceReason: 'Solide Secrets-Verwaltung.'
            }),
            monitoring: svc('SAP Monitoring', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 90, performance: 75,
                controlReason: 'Prometheus/Grafana Stack in SAP-RZs.',
                performanceReason: 'Reife Open-Source-Tools.'
            }),
            logging: svc('SAP Logging', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 90, performance: 75,
                controlReason: 'ELK/Loki Stack in SAP-RZs.',
                performanceReason: 'Solide zentrale Logging-Lösung.'
            }),
            ai_ml: svc('-', false, 'none', {
                control: 0, performance: 0,
                controlReason: 'Kein nativer AI/ML-Service auf SAP CI. SAP AI Core ist separater BTP-Service.',
                performanceReason: 'Nicht verfügbar als IaaS-Service.',
                selfBuildOption: 'ai_ml'
            }),
            identity: svc('SAP IAS / Keycloak', true, 'production', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 90, performance: 80,
                controlReason: 'SAP Identity Authentication Service oder Keycloak; SAML/OIDC.',
                performanceReason: 'Bewährte Enterprise-IAM.'
            }),
            static_hosting: svc('SAP Static Hosting (Limited)', true, 'preview', {
                consumption: 'low', operations: 'low', projectEffort: 'low',
                control: 85, performance: 60,
                controlReason: 'Begrenzte Optionen, primär über Object Store + CDN-Kombination.',
                performanceReason: 'Standard.'
            }),
            app_service: svc('-', false, 'none', {
                control: 0, performance: 0,
                controlReason: 'Kein nativer PaaS-App-Service auf SAP CI. Alternative: Cloud Foundry über BTP.',
                performanceReason: 'Nicht verfügbar.'
            }),
            api_gateway: svc('SAP API Management', true, 'production', {
                consumption: 'medium', operations: 'low', projectEffort: 'low',
                control: 90, performance: 80,
                controlReason: 'SAP API Management auf SAP-Infrastruktur.',
                performanceReason: 'Reife Enterprise-API-Plattform.'
            })
        }
    }
];

// Architektur-Komponenten mit Konfigurations-Optionen
const architectureComponents = [
    {
        id: 'compute', name: 'Virtual Machine / Compute', category: 'compute', icon: '🖥️',
        description: 'Virtuelle Maschinen für Anwendungen', requiredServices: ['compute'],
        configurable: true,
        multiInstance: true,
        configFields: [
            { id: 'cpu', label: 'vCPU', type: 'number', default: 4, min: 1, max: 256 },
            { id: 'ram', label: 'RAM (GB)', type: 'number', default: 16, min: 1, max: 4096 },
            { id: 'instances', label: 'Anzahl', type: 'number', default: 1, min: 1, max: 100 }
        ],
        configSummary: (c) => {
            // Helper to format HA info
            const haInfo = c._haType ? ` - ${c._haType}` : '';
            const instanceInfo = c.instances > 1 ? ` (${c.instances} Nodes${haInfo})` : '';

            // Multi-VM mit VM-Typ-Name (z.B. Airflow Webserver/Scheduler/Workers)
            if (c._vmTypeName) {
                return `${c._vmTypeName}: ${c.cpu || 4} vCPU, ${c.ram || 16} GB${instanceInfo}`;
            }
            // Multi-VM-Struktur alt (deprecated)
            if (c.vmGroups && c.vmGroups.length > 0) {
                const details = c.vmGroups.map(vm =>
                    `${vm.name}: ${vm.count}× ${vm.cpu}vCPU/${vm.ram}GB`
                ).join(' • ');
                return `${c.cpu || 0} vCPU, ${c.ram || 0} GB total • ${details}`;
            }
            // Standard Single-VM
            return `${c.cpu || 4} vCPU, ${c.ram || 16} GB RAM${instanceInfo}`;
        }
    },
    {
        id: 'kubernetes', name: 'Kubernetes Cluster', category: 'compute', icon: '☸️',
        description: 'Container-Orchestrierung', requiredServices: ['kubernetes', 'container_registry'],
        configurable: true,
        configFields: [
            { id: 'nodes', label: 'Worker Nodes', type: 'number', default: 3, min: 1, max: 100, unit: '' },
            { id: 'nodeRam', label: 'RAM/Node', type: 'number', default: 16, min: 4, max: 256, unit: 'GB' }
        ],
        configSummary: (c) => c.controlPlaneOnly ? 'Managed Control Plane' : `${c.nodes} Nodes, ${c.nodeRam} GB/Node`
    },
    {
        id: 'serverless', name: 'PaaS / Serverless', category: 'compute', icon: '⚡',
        description: 'Managed Plattform: App Service, Cloud Run, Lambda/Serverless Functions', requiredServices: ['serverless'],
        configurable: true,
        configFields: [
            { id: 'invocations', label: 'Aufrufe/Monat', type: 'select', default: 'medium', options: [
                { value: 'low', label: '<100K' }, { value: 'medium', label: '100K-1M' }, { value: 'high', label: '>1M' }
            ]}
        ],
        configSummary: (c) => c.invocations === 'low' ? '<100K/Mon.' : c.invocations === 'high' ? '>1M/Mon.' : '100K-1M/Mon.'
    },
    {
        id: 'database_sql', name: 'SQL Datenbank', category: 'data', icon: '🗄️',
        description: 'Relationale Datenbank', requiredServices: ['database_sql'],
        configurable: true,
        multiInstance: true,
        configFields: [
            { id: 'dbType', label: 'Typ', type: 'select', default: 'PostgreSQL', options: [
                { value: 'PostgreSQL', label: 'PostgreSQL' }, { value: 'MySQL', label: 'MySQL' },
                { value: 'MariaDB', label: 'MariaDB' }, { value: 'SQL Server', label: 'SQL Server' },
                { value: 'Oracle', label: 'Oracle' }, { value: 'SAP HANA', label: 'SAP HANA' }
            ]},
            { id: 'dbSize', label: 'Größe (GB)', type: 'number', default: 100, min: 10, max: 100000 }
        ],
        configSummary: (c) => {
            const haInfo = c._haType ? ` (${c._haType})` : (c._haNodes > 1 ? ` (${c._haNodes} Nodes)` : '');
            return `${c.dbType || 'PostgreSQL'}, ${c.dbSize || 100} GB${haInfo}`;
        }
    },
    {
        id: 'database_nosql', name: 'NoSQL Datenbank', category: 'data', icon: '📊',
        description: 'Dokumenten-/Key-Value DB', requiredServices: ['database_nosql'],
        configurable: true,
        configFields: [
            { id: 'nosqlType', label: 'Typ', type: 'select', default: 'MongoDB', options: [
                { value: 'MongoDB', label: 'MongoDB' }, { value: 'Redis', label: 'Redis' },
                { value: 'Cassandra', label: 'Cassandra' }, { value: 'CosmosDB', label: 'CosmosDB' }
            ]},
            { id: 'nosqlSize', label: 'Größe (GB)', type: 'number', default: 50, min: 1, max: 100000 }
        ],
        configSummary: (c) => {
            const haInfo = c._haType ? ` (${c._haType})` : (c._haNodes > 1 ? ` (${c._haNodes} Nodes)` : '');
            return `${c.nosqlType}, ${c.nosqlSize} GB${haInfo}`;
        }
    },
    {
        id: 'storage_object', name: 'Object Storage', category: 'storage', icon: '📦',
        description: 'Speicher für Dateien/Medien', requiredServices: ['storage_object'],
        configurable: true,
        configFields: [
            { id: 'objectSize', label: 'Kapazität (GB)', type: 'number', default: 500, min: 1, max: 1000000 }
        ],
        configSummary: (c) => `${c.objectSize} GB`
    },
    {
        id: 'storage_block', name: 'Block Storage', category: 'storage', icon: '💾',
        description: 'Persistente Volumes', requiredServices: ['storage_block'],
        configurable: true,
        multiInstance: true,
        configFields: [
            { id: 'blockType', label: 'Typ', type: 'select', default: 'ssd', options: [
                { value: 'ssd', label: 'SSD' }, { value: 'nvme', label: 'NVMe' }, { value: 'hdd', label: 'HDD' }
            ]},
            { id: 'blockSize', label: 'Größe (GB)', type: 'number', default: 200, min: 10, max: 100000 }
        ],
        configSummary: (c) => `${c.blockSize || 200} GB ${(c.blockType || 'ssd').toUpperCase()}`
    },
    {
        id: 'storage_file', name: 'File Storage (NFS)', category: 'storage', icon: '📁',
        description: 'Gemeinsamer Dateispeicher', requiredServices: ['storage_file'],
        configurable: true,
        configFields: [
            { id: 'fileSize', label: 'Kapazität (GB)', type: 'number', default: 100, min: 10, max: 100000 }
        ],
        configSummary: (c) => `${c.fileSize} GB`
    },
    { id: 'loadbalancer', name: 'Load Balancer', category: 'network', icon: '⚖️', description: 'Traffic-Verteilung', requiredServices: ['loadbalancer'] },
    { id: 'cdn', name: 'CDN', category: 'network', icon: '🌐', description: 'Content Delivery Network', requiredServices: ['cdn'] },
    { id: 'dns', name: 'DNS', category: 'network', icon: '🔗', description: 'Domain Name Service', requiredServices: ['dns'] },
    {
        id: 'messaging', name: 'Message Queue', category: 'integration', icon: '📬',
        description: 'Asynchrone Nachrichtenverarbeitung', requiredServices: ['messaging'],
        configurable: true,
        configFields: [
            { id: 'msgVolume', label: 'Nachrichtenvolumen', type: 'select', default: 'medium', options: [
                { value: 'low', label: 'Niedrig (<10K/Tag)' }, { value: 'medium', label: 'Mittel (10K-100K/Tag)' }, { value: 'high', label: 'Hoch (>100K/Tag)' }
            ]}
        ],
        configSummary: (c) => c.msgVolume === 'low' ? '<10K/Tag' : c.msgVolume === 'high' ? '>100K/Tag' : '10K-100K/Tag'
    },
    {
        id: 'cache', name: 'Cache (Redis)', category: 'data', icon: '🚀',
        description: 'In-Memory Caching', requiredServices: ['cache'],
        configurable: true,
        configFields: [
            { id: 'cacheSize', label: 'RAM', type: 'number', default: 4, min: 1, max: 256, unit: 'GB' }
        ],
        configSummary: (c) => `${c.cacheSize} GB RAM`
    },
    { id: 'monitoring', name: 'Monitoring', category: 'operations', icon: '📈', description: 'Überwachung & Alerting', requiredServices: ['monitoring'] },
    { id: 'logging', name: 'Zentrales Logging', category: 'operations', icon: '📋', description: 'Log-Aggregation', requiredServices: ['logging'] },
    { id: 'secrets', name: 'Secrets Management', category: 'security', icon: '🔐', description: 'Credential-Verwaltung', requiredServices: ['secrets'] },
    {
        id: 'identity', name: 'Identity Management', category: 'security', icon: '👤',
        description: 'Auth & Autorisierung', requiredServices: ['identity'],
        configurable: true,
        configFields: [
            { id: 'users', label: 'Nutzer', type: 'number', default: 100, min: 1, max: 100000, unit: '' }
        ],
        configSummary: (c) => `${c.users} Nutzer`
    },
    {
        id: 'ai_ml', name: 'KI / Machine Learning', category: 'advanced', icon: '🤖',
        description: 'KI-Modelle & ML-Pipelines', requiredServices: ['ai_ml'],
        configurable: true,
        configFields: [
            { id: 'gpuRequired', label: 'GPU', type: 'select', default: 'no', options: [
                { value: 'no', label: 'Nicht benötigt' }, { value: 'yes', label: 'GPU erforderlich' }
            ]}
        ],
        configSummary: (c) => c.gpuRequired === 'yes' ? 'Mit GPU' : 'Ohne GPU'
    }
];


// knownApplications → siehe saa-apps-data.js
// ApplicationInstance → siehe js/modules/application-instance.js

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI-APPLICATION SUPPORT CLASSES
// ═══════════════════════════════════════════════════════════════════════════════

// ApplicationMatcher → siehe js/modules/application-matcher.js

// SizingDetector → siehe js/modules/sizing-detector.js

export { selfBuildOptions, architectureModes, deploymentPatterns, cloudProviders, architectureComponents };
