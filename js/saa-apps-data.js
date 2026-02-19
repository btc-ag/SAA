// Bekannte Anwendungen - Umfassende Datenbank mit 80+ Enterprise-Applikationen
// Inkl. Herstellerinformationen und empfohlenes Standard-Sizing
const knownApplications = {
    // ═══════════════════════════════════════════════════════════════════════════════
    // ERP & BUSINESS APPLICATIONS
    // ═══════════════════════════════════════════════════════════════════════════════
    'sap-s4hana': {
        name: 'SAP S/4HANA',
        description: 'Enterprise-ERP-Suite der nächsten Generation von SAP, basierend auf der SAP HANA In-Memory-Datenbank mit Echtzeit-Datenverarbeitung. HANA läuft als VM, keine Managed DB erforderlich.',
        components: ['compute', 'storage_block', 'storage_file', 'loadbalancer', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity', 'ai_ml'],
        systemRequirements: {
            small: { users: '1-100 (Dev/Test)', compute: { cpu: 8, ram: 128 }, database: { type: 'SAP HANA 2.0 SPS05+', size: '256GB+' }, storage: { type: 'NVMe SSD', size: '500GB' }, os: ['SUSE Linux Enterprise Server 15', 'RHEL 8.x'] },
            medium: { users: '100-500', compute: { cpu: 32, ram: 256 }, database: { type: 'SAP HANA 2.0 SPS05+', size: '1TB' }, storage: { type: 'NVMe SSD', size: '2TB' }, os: ['SUSE Linux Enterprise Server 15', 'RHEL 8.x'] },
            large: { users: '500+', compute: { cpu: 64, ram: 512 }, database: { type: 'SAP HANA Scale-out', size: '2TB+' }, storage: { type: 'Enterprise NVMe', size: '4TB+' }, os: ['SUSE Linux Enterprise Server 15', 'RHEL 8.x'] }
        },
        sizing: { formula: 'DB-Größe / 2 + 20% Buffer + 50GB für Code/Stack', source: 'https://www.sap.com/about/benchmark/sizing.html' }
    },
    'sap-business-one': {
        name: 'SAP Business One',
        description: 'Integrierte ERP-Lösung für kleine und mittelständische Unternehmen mit MS SQL Server oder SAP HANA.',
        components: ['compute', 'database_sql', 'storage_block', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: '1-15', compute: { cpu: 4, ram: 16 }, database: { type: 'MS SQL Server 2019/2022 oder SAP HANA', size: '100GB' }, storage: { type: 'SSD', size: '100GB' }, os: ['Windows Server 2019', 'Windows Server 2022'] },
            medium: { users: '15-50', compute: { cpu: 8, ram: 32 }, database: { type: 'MS SQL Server 2019/2022 oder SAP HANA', size: '250GB' }, storage: { type: 'SSD', size: '250GB' }, os: ['Windows Server 2019', 'Windows Server 2022'] },
            large: { users: '50+', compute: { cpu: 8, ram: 64 }, database: { type: 'MS SQL Server / SAP HANA', size: '500GB+' }, storage: { type: 'Enterprise SSD', size: '500GB+' }, os: ['Windows Server 2019', 'Windows Server 2022'], appServers: '4+ (1 pro 15 User)' }
        },
        sizing: { formula: '1.5-2 GB RAM pro concurrent User + 8 GB Basis', source: 'https://help.sap.com/doc/bfa9770d12284cce8509956dcd4c5fcb/9.3/en-US/B1_Hardware_Requirements_Guide.pdf' }
    },
    'microsoft-dynamics-365': {
        name: 'Microsoft Dynamics 365',
        description: 'Cloud-basierte Business-Applikations-Suite von Microsoft, die CRM und ERP kombiniert.',
        components: ['compute', 'kubernetes', 'serverless', 'database_sql', 'database_nosql', 'storage_object', 'storage_block', 'loadbalancer', 'cdn', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity', 'ai_ml'],
        systemRequirements: {
            note: 'Primär Cloud-basiert (Azure). On-Premise via Business Central verfügbar.',
            small: { users: '1-25', compute: { cpu: 4, ram: 16 }, database: { type: 'Azure SQL / SQL Server 2019+', size: '50GB' }, storage: { type: 'SSD', size: '100GB' } },
            medium: { users: '25-100', compute: { cpu: 8, ram: 32 }, database: { type: 'Azure SQL / SQL Server 2019+', size: '100GB' }, storage: { type: 'SSD', size: '250GB' } },
            large: { users: '100+', compute: { cpu: 16, ram: 64 }, database: { type: 'Azure SQL / SQL Server Enterprise', size: '500GB+' }, storage: { type: 'Enterprise SSD', size: '500GB+' } }
        }
    },
    'suitecrm': {
        name: 'SuiteCRM',
        description: 'Open-Source-CRM-Alternative zu Salesforce basierend auf LAMP-Stack mit Vertriebs-, Marketing- und Service-Automatisierung.',
        components: ['compute', 'database_sql', 'storage_block', 'storage_file', 'loadbalancer', 'dns', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: '1-25', compute: { cpu: 2, ram: 4 }, database: { type: 'MariaDB 10.6+ / MySQL 8.0+', size: '10GB' }, storage: { type: 'SSD', size: '50GB' }, php: '8.1-8.4', webServer: 'Apache 2.4 / Nginx' },
            medium: { users: '25-100', compute: { cpu: 4, ram: 8 }, database: { type: 'MariaDB 10.11+ / MySQL 8.0+', size: '50GB' }, storage: { type: 'SSD', size: '100GB' }, php: '8.1-8.4', webServer: 'Apache 2.4 / Nginx' },
            large: { users: '100+', compute: { cpu: 8, ram: 16 }, database: { type: 'MariaDB / MySQL / SQL Server 2019+', size: '100GB+' }, storage: { type: 'SSD/NVMe', size: '200GB+' }, php: '8.2+', phpMemory: '512MB+' }
        },
        sizing: { source: 'https://docs.suitecrm.com/admin/compatibility-matrix/' }
    },
    'oracle-ebs': {
        name: 'Oracle E-Business Suite',
        description: 'Umfassende integrierte Business-Applikations-Suite von Oracle mit Drei-Schichten-Architektur.',
        components: ['compute', 'database_sql', 'storage_block', 'storage_file', 'loadbalancer', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: '1-150 Self-Service', compute: { cpu: 16, ram: 24 }, appTier: { cpu: 8, ram: 8 }, dbTier: { cpu: 8, ram: 16 }, database: { type: 'Oracle Database 19c+', size: '100GB' }, storage: { type: 'SSD', size: '250GB' }, os: ['Oracle Linux 7/8', 'RHEL 7/8'] },
            medium: { users: '150-500', compute: { cpu: 32, ram: 96 }, appTier: { cpu: 16, ram: 32 }, dbTier: { cpu: 16, ram: 64 }, database: { type: 'Oracle Database 19c', size: '500GB' }, storage: { type: 'SSD', size: '1100GB' }, os: ['Oracle Linux 8', 'RHEL 8'] },
            large: { users: '500+', compute: { cpu: 64, ram: 192 }, appTier: { cpu: 32, ram: 64, nodes: 'Multiple' }, dbTier: { cpu: 32, ram: 128, rac: true }, database: { type: 'Oracle Database 19c/21c/23ai (RAC)', size: '2TB+' }, storage: { type: 'Enterprise Flash/NVMe', size: '4TB+' } }
        },
        sizing: { formula: 'Pro 150-180 Self-Service User: 2GB JVM Heap + 2 CPU', source: 'https://docs.oracle.com/cd/E26401_01/doc.122/e48788/T572842T572942.htm' }
    },
    'odoo': {
        name: 'Odoo',
        description: 'Modulares Open-Source-ERP und CRM mit über 30 Haupt-Apps, PostgreSQL und Python/JavaScript-Stack.',
        components: ['compute', 'database_sql', 'storage_block', 'storage_file', 'loadbalancer', 'dns', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: '1-20 concurrent', compute: { cpu: 2, ram: 4, workers: 3 }, database: { type: 'PostgreSQL 12+', size: '20GB' }, storage: { type: 'SSD', size: '50GB' }, os: ['Ubuntu 22.04 LTS', 'Debian 11/12', 'RHEL 8+'] },
            medium: { users: '20-100 concurrent', compute: { cpu: 8, ram: 16, workers: '9-17' }, database: { type: 'PostgreSQL 14+', size: '100GB' }, storage: { type: 'SSD/NVMe', size: '200GB' }, architecture: 'Separate DB & App Server' },
            large: { users: '100+ concurrent', compute: { cpu: 16, ram: 32, workers: '17+', servers: 'Multiple' }, database: { type: 'PostgreSQL 14+ (Replication)', size: '200GB+' }, storage: { type: 'NVMe SSD', size: '500GB+' }, architecture: 'Load Balancer + Multiple App Server + DB Cluster', ha: { nodes: 3, type: 'Load Balanced Multi-App + DB Replication' } }
        },
        sizing: { formula: 'Workers = (CPU Cores * 2) + 1; 1 Worker ~ 6 concurrent Users', source: 'https://www.odoo.com/documentation/19.0/administration/on_premise/deploy.html' }
    },
    'mautic': {
        name: 'Mautic',
        description: 'Open-Source-Marketing-Automatisierungsplattform als self-hosted Alternative zu HubSpot.',
        components: ['compute', 'database_sql', 'storage_block', 'storage_file', 'loadbalancer', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { contacts: 'bis 10.000', compute: { cpu: 2, ram: 2 }, database: { type: 'MySQL 5.7+ / MariaDB 10.3+', size: '5GB' }, storage: { type: 'SSD', size: '20GB' }, php: '7.4-8.1' },
            medium: { contacts: '10.000-100.000', compute: { cpu: 4, ram: 4 }, database: { type: 'MySQL 8.0+ / MariaDB 10.6+', size: '20GB' }, storage: { type: 'SSD', size: '50GB' }, php: '8.0-8.1', cache: 'Redis empfohlen', queue: 'RabbitMQ empfohlen' },
            large: { contacts: '100.000+', compute: { cpu: 8, ram: 8 }, database: { type: 'MySQL 8.0+ / MariaDB 10.6+', size: '100GB+' }, storage: { type: 'SSD', size: '200GB+' }, php: '8.1', cache: 'Redis erforderlich', queue: 'RabbitMQ erforderlich', architecture: 'Separate Worker-Prozesse' }
        },
        sizing: { source: 'https://docs.mautic.org/en/5.x/getting_started/how_to_install_mautic.html' }
    },
    'sugarcrm': {
        name: 'SugarCRM',
        description: 'Flexible CRM-Plattform mit On-Premise- und Cloud-Optionen, PHP-Applikation mit Elasticsearch.',
        components: ['compute', 'database_sql', 'database_nosql', 'storage_block', 'storage_file', 'loadbalancer', 'dns', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: '1-25', compute: { cpu: 2, ram: 4 }, database: { type: 'MySQL 8.0 / MariaDB 10.4+', size: '10GB' }, storage: { type: 'SSD', size: '20GB' }, php: '8.0-8.1', search: 'Elasticsearch 7.17' },
            medium: { users: '25-100', compute: { cpu: 4, ram: 8 }, database: { type: 'MySQL 8.0 / MariaDB 10.6+', size: '50GB' }, storage: { type: 'SSD', size: '50GB' }, php: '8.1', search: 'Elasticsearch 7.17', cache: 'Redis 6+' },
            large: { users: '100+', compute: { cpu: 8, ram: 16 }, database: { type: 'MySQL 8.0 / SQL Server 2019+', size: '100GB+' }, storage: { type: 'SSD', size: '200GB+' }, php: '8.1', search: 'Elasticsearch Cluster', cache: 'Redis Cluster', architecture: 'HA mit Load Balancing', ha: { nodes: 2, type: 'Load Balanced + Elasticsearch Cluster + Redis Cluster' } }
        },
        sizing: { source: 'https://support.sugarcrm.com/Resources/Supported_Platforms/' }
    },
    'infor-cloudsuite': {
        name: 'Infor CloudSuite',
        description: 'Branchenspezifische ERP-Cloud-Lösung auf AWS-Infrastruktur mit .NET/Mongoose-Plattform.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_object', 'storage_block', 'storage_file', 'loadbalancer', 'cdn', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity', 'ai_ml'],
        systemRequirements: {
            note: 'Primär Cloud-basiert (AWS). On-Premise via Infor LN/M3 verfügbar.',
            small: { users: '1-50', compute: { cpu: 8, ram: 32 }, database: { type: 'SQL Server 2019+ / Oracle 19c', size: '100GB' }, storage: { type: 'SSD', size: '200GB' } },
            medium: { users: '50-250', compute: { cpu: 16, ram: 64 }, database: { type: 'SQL Server Enterprise / Oracle 19c', size: '500GB' }, storage: { type: 'SSD', size: '500GB' } },
            large: { users: '250+', compute: { cpu: 32, ram: 128 }, database: { type: 'SQL Server Enterprise / Oracle RAC', size: '1TB+' }, storage: { type: 'Enterprise NVMe', size: '2TB+' }, architecture: 'HA-Cluster', ha: { nodes: 2, type: 'Active-Active with Oracle RAC' } }
        }
    },
    'sage-x3': {
        name: 'Sage X3',
        description: 'Mittelstands-ERP mit offener Multi-Tier-Architektur, Node.js-Webserver und MongoDB für Administration.',
        components: ['compute', 'database_sql', 'database_nosql', 'storage_block', 'storage_file', 'loadbalancer', 'dns', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: '1-25', compute: { cpu: 8, ram: 32 }, appServer: { cpu: 4, ram: 16 }, dbServer: { cpu: 4, ram: 16 }, database: { type: 'SQL Server 2019 / Oracle 19c', size: '50GB' }, storage: { type: 'SSD', size: '100GB' }, os: ['Windows Server 2019/2022'] },
            medium: { users: '25-100', compute: { cpu: 16, ram: 64 }, appServer: { cpu: 8, ram: 32 }, dbServer: { cpu: 8, ram: 32 }, database: { type: 'SQL Server 2019/2022 / Oracle 19c', size: '200GB' }, storage: { type: 'SSD', size: '300GB' }, os: ['Windows Server 2019/2022'] },
            large: { users: '100+', compute: { cpu: 32, ram: 128 }, appServer: { cpu: 16, ram: 64, nodes: 'Multiple' }, dbServer: { cpu: 16, ram: 64 }, database: { type: 'SQL Server Enterprise / Oracle 19c', size: '500GB+' }, storage: { type: 'Enterprise SSD', size: '1TB+' }, architecture: 'Multi-Tier mit separatem Syracuse Web Server' }
        },
        sizing: { source: 'https://online-help.sageerpx3.com/' }
    },
    'netsuite': {
        name: 'Oracle NetSuite',
        description: 'Cloud-native ERP/CRM-Suite mit Multi-Tenant SuiteCloud-Plattform und Oracle-Datenbank.',
        components: ['compute', 'kubernetes', 'serverless', 'database_sql', 'storage_object', 'storage_block', 'loadbalancer', 'cdn', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity', 'ai_ml'],
        systemRequirements: {
            note: 'Cloud-only SaaS - kein On-Premise verfügbar. Integrations-Server-Anforderungen:',
            small: { compute: { cpu: 2, ram: 4 }, storage: { type: 'SSD', size: '50GB' } },
            medium: { compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '100GB' } },
            large: { compute: { cpu: 8, ram: 16 }, storage: { type: 'SSD', size: '200GB' } },
            integrationServer: {
                small: { compute: { cpu: 2, ram: 4 }, storage: { type: 'SSD', size: '50GB' } },
                medium: { compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '100GB' } },
                large: { compute: { cpu: 8, ram: 16 }, storage: { type: 'SSD', size: '200GB' } }
            },
            browser: { supported: ['Chrome (aktuell)', 'Firefox (aktuell)', 'Safari (aktuell)', 'Edge (aktuell)'], screenResolution: '1366x768 minimum' }
        }
    },
    'workday': {
        name: 'Workday HCM',
        description: 'Cloud-native HCM-Plattform mit In-Memory-Datenbank-Architektur für HR und Finanzen.',
        components: ['compute', 'kubernetes', 'database_sql', 'database_nosql', 'storage_object', 'storage_block', 'loadbalancer', 'cdn', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity', 'ai_ml'],
        systemRequirements: {
            note: 'Cloud-only SaaS - kein On-Premise verfügbar. Integrations-Server-Anforderungen:',
            small: { compute: { cpu: 2, ram: 8 }, storage: { type: 'SSD', size: '100GB' } },
            medium: { compute: { cpu: 4, ram: 16 }, storage: { type: 'SSD', size: '200GB' } },
            large: { compute: { cpu: 8, ram: 32 }, storage: { type: 'SSD', size: '500GB' } },
            integrationServer: {
                small: { compute: { cpu: 2, ram: 8 }, storage: { type: 'SSD', size: '100GB' } },
                medium: { compute: { cpu: 4, ram: 16 }, storage: { type: 'SSD', size: '200GB' } },
                large: { compute: { cpu: 8, ram: 32 }, storage: { type: 'SSD', size: '500GB' } }
            },
            browser: { supported: ['Chrome (aktuell)', 'Firefox (aktuell)', 'Safari (aktuell)', 'Edge (aktuell)'], screenResolution: '1280x720 minimum' }
        }
    },
    'servicenow': {
        name: 'ServiceNow',
        description: 'IT-Service-Management-Plattform mit Multi-Instance-Architektur für ITSM, ITOM und mehr.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_object', 'storage_block', 'loadbalancer', 'cdn', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity', 'ai_ml'],
        systemRequirements: {
            note: 'Cloud-only SaaS - kein On-Premise verfügbar. MID Server-Anforderungen für Integration:',
            small: { compute: { cpu: 2, ram: 4 }, storage: { type: 'SSD', size: '50GB' } },
            medium: { compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '100GB' } },
            large: { compute: { cpu: 8, ram: 16 }, storage: { type: 'SSD', size: '200GB' } },
            midServer: {
                small: { compute: { cpu: 2, ram: 4 }, storage: { type: 'SSD', size: '50GB' } },
                medium: { compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '100GB' } },
                large: { compute: { cpu: 8, ram: 16 }, storage: { type: 'SSD', size: '200GB' } }
            },
            os: ['Windows Server 2019/2022', 'RHEL 8/9', 'Ubuntu 20.04/22.04'],
            java: 'JRE 11/17',
            browser: { supported: ['Chrome (aktuell)', 'Firefox (aktuell)', 'Safari (aktuell)', 'Edge (aktuell)'] }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // DEVOPS & CI/CD PLATFORMS
    // ═══════════════════════════════════════════════════════════════════════════════
    'gitlab': {
        name: 'GitLab',
        description: 'Vollständige DevOps-Plattform für Source Code Management, CI/CD, Container Registry und Issue Tracking.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_object', 'storage_block', 'loadbalancer', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: 'bis 1.000', compute: { cpu: 8, ram: 16 }, database: { type: 'PostgreSQL 14+', size: '50GB' }, storage: { type: 'SSD', size: '100GB' }, cache: 'Redis 6+', os: ['Ubuntu 22.04', 'Debian 12', 'RHEL 8/9'] },
            medium: { users: 'bis 2.000', nodes: 3, compute: { cpu: 11, ram: 18 }, database: { type: 'PostgreSQL 14+ (HA)', size: '100GB' }, storage: { type: 'SSD', size: '500GB' }, cache: 'Redis 6+ (HA)', architecture: 'Multi-Node (3 Worker Nodes)' },
            large: { users: 'bis 10.000', nodes: 5, compute: { cpu: 20, ram: 40 }, database: { type: 'PostgreSQL 14+ (HA Cluster)', size: '500GB+' }, storage: { type: 'NVMe SSD', size: '2TB+' }, cache: 'Redis Cluster', architecture: 'Full HA with Gitaly Cluster (5 Worker Nodes)', ha: { nodes: 3, type: 'Gitaly Cluster + PostgreSQL Streaming Replication + Redis Cluster' } }
        },
        sizing: { source: 'https://docs.gitlab.com/administration/reference_architectures/' }
    },
    'github-enterprise': {
        name: 'GitHub Enterprise Server',
        description: 'Self-hosted Version von GitHub mit Git-Repository-Verwaltung, Pull Requests und Actions CI/CD.',
        components: ['compute', 'storage_block', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: '10-3.000', compute: { cpu: 8, ram: 48 }, storage: { type: 'High-IOPS SSD', size: '500GB' }, os: 'Appliance (x86-64 VM)', notes: 'Root + Data Disk getrennt' },
            medium: { users: '3.000-5.000', compute: { cpu: 12, ram: 64 }, storage: { type: 'High-IOPS SSD', size: '700GB' }, os: 'Appliance (x86-64 VM)', notes: 'HA Replica empfohlen' },
            large: { users: '5.000-10.000+', compute: { cpu: 20, ram: 160 }, storage: { type: 'High-IOPS SSD', size: '1.2TB' }, os: 'Appliance (x86-64 VM)', notes: 'HA Replica erforderlich', ha: { nodes: 2, type: 'Primary + HA Replica with shared storage' } }
        },
        sizing: { source: 'https://docs.github.com/en/enterprise-server/admin/installing-your-enterprise-server' }
    },
    'jenkins': {
        name: 'Jenkins',
        description: 'Erweiterbarer Open-Source Automation Server für CI/CD mit Controller-Agent-Architektur.',
        components: ['compute', 'kubernetes', 'storage_block', 'storage_file', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Small Team', compute: { cpu: 10, ram: 16 }, controller: { cpu: 4, ram: 4 }, agents: { cpu: 2, ram: 4, count: '2-5' }, storage: { type: 'SSD', size: '50GB' }, java: 'JDK 11/17/21' },
            medium: { workload: 'Medium Team', compute: { cpu: 48, ram: 88 }, controller: { cpu: 8, ram: 8 }, agents: { cpu: 4, ram: 8, count: '5-20' }, storage: { type: 'SSD', size: '100GB' }, java: 'JDK 17/21' },
            large: { workload: 'Enterprise', compute: { cpu: 96, ram: 176 }, controller: { cpu: 16, ram: 16 }, agents: { cpu: 4, ram: 8, count: '20+', dynamic: true }, storage: { type: 'SSD', size: '200GB' }, java: 'JDK 17/21', architecture: 'Kubernetes dynamic agents' }
        },
        sizing: { source: 'https://www.jenkins.io/doc/book/scaling/hardware-recommendations/' }
    },
    'argocd': {
        name: 'ArgoCD',
        description: 'Deklaratives GitOps Continuous Delivery Tool für Kubernetes mit Git als Single Source of Truth.',
        components: ['kubernetes', 'cache', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { apps: 'bis 50', compute: { cpu: 1, ram: 2 }, storage: { type: 'SSD', size: '10GB' }, kubernetesVersion: '1.25+' },
            medium: { apps: '50-500', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '50GB' }, kubernetesVersion: '1.27+', redis: 'empfohlen für HA' },
            large: { apps: '500+', compute: { cpu: 8, ram: 16 }, storage: { type: 'SSD', size: '100GB' }, kubernetesVersion: '1.28+', redis: 'erforderlich', architecture: 'HA mit 3+ Replicas', ha: { nodes: 3, replicas: 3 } }
        },
        sizing: { source: 'https://argo-cd.readthedocs.io/en/stable/operator-manual/high_availability/' }
    },
    'tekton': {
        name: 'Tekton Pipelines',
        description: 'Kubernetes-natives Open-Source Framework für CI/CD-Systeme mit Custom Resources.',
        components: ['kubernetes', 'storage_block', 'dns', 'monitoring', 'logging', 'secrets'],
        systemRequirements: {
            small: { pipelines: 'Dev/Test', compute: { cpu: 0.5, ram: 0.5 }, storage: { type: 'SSD', size: '10GB' }, kubernetesVersion: '1.25+' },
            medium: { pipelines: 'Production', compute: { cpu: 1, ram: 1 }, storage: { type: 'SSD', size: '50GB' }, kubernetesVersion: '1.27+' },
            large: { pipelines: 'High-Volume', compute: { cpu: 2, ram: 2 }, storage: { type: 'SSD', size: '100GB+' }, kubernetesVersion: '1.28+', note: 'Skaliert automatisch via Kubernetes' }
        },
        sizing: { source: 'https://tekton.dev/docs/installation/system-requirements/' }
    },
    'harbor': {
        name: 'Harbor',
        description: 'CNCF Enterprise Container Registry mit Vulnerability Scanning, Content Trust und RBAC.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_object', 'storage_file', 'loadbalancer', 'dns', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { images: 'bis 1.000', compute: { cpu: 2, ram: 4 }, database: { type: 'PostgreSQL 12+', size: '10GB' }, storage: { type: 'SSD', size: '100GB' }, redis: '6+' },
            medium: { images: '1.000-10.000', compute: { cpu: 4, ram: 8 }, database: { type: 'PostgreSQL 14+', size: '50GB' }, storage: { type: 'SSD / S3', size: '500GB' }, redis: '6+' },
            large: { images: '10.000+', compute: { cpu: 8, ram: 16 }, database: { type: 'PostgreSQL 15+ (HA)', size: '100GB+' }, storage: { type: 'S3/Object Storage', size: '2TB+' }, redis: 'Cluster', architecture: 'HA mit mehreren Core-Nodes', ha: { nodes: 3, type: 'Multi-Core-Nodes with PostgreSQL HA' } }
        },
        sizing: { source: 'https://goharbor.io/docs/latest/install-config/installation-prereqs/' }
    },
    'sonarqube': {
        name: 'SonarQube',
        description: 'Plattform für kontinuierliche Code-Qualitätsprüfung mit Analyse auf Bugs und Vulnerabilities.',
        components: ['compute', 'database_sql', 'storage_block', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { loc: 'bis 1M Lines of Code', compute: { cpu: 2, ram: 4 }, database: { type: 'PostgreSQL 13-16', size: '20GB' }, storage: { type: 'SSD', size: '50GB' }, java: 'JRE 17' },
            medium: { loc: '1M-10M Lines of Code', compute: { cpu: 4, ram: 8 }, database: { type: 'PostgreSQL 15/16', size: '50GB' }, storage: { type: 'SSD', size: '100GB' }, java: 'JRE 17' },
            large: { loc: '10M+ Lines of Code', compute: { cpu: 8, ram: 16 }, database: { type: 'PostgreSQL 16 (Tuned)', size: '200GB+' }, storage: { type: 'NVMe SSD', size: '500GB+' }, java: 'JRE 17', search: 'Elasticsearch eingebettet oder Cluster' }
        },
        sizing: { note: 'RAM skaliert mit Projektgröße und Anzahl gleichzeitiger Analysen', source: 'https://docs.sonarsource.com/sonarqube/latest/requirements/prerequisites-and-overview/' }
    },
    'nexus': {
        name: 'Nexus Repository Manager',
        description: 'Universal Repository Manager für Binaries und Build-Artefakte (Maven, npm, Docker, etc.).',
        components: ['compute', 'database_sql', 'storage_object', 'storage_block', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Small Team', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '100GB' }, java: 'JRE 8/11' },
            medium: { workload: 'Production', compute: { cpu: 8, ram: 16 }, storage: { type: 'SSD', size: '500GB' }, java: 'JRE 11', jvmHeap: '8GB' },
            large: { workload: 'Enterprise', compute: { cpu: 16, ram: 64 }, storage: { type: 'NVMe SSD / S3', size: '2TB+' }, java: 'JRE 11', jvmHeap: '48GB', note: 'Pro Edition für HA-Clustering erforderlich', ha: { nodes: 2, type: 'Pro Edition Clustering with shared storage' } }
        },
        sizing: { source: 'https://help.sonatype.com/repomanager3/planning-your-implementation/system-requirements' }
    },
    'artifactory': {
        name: 'JFrog Artifactory',
        description: 'Universal Artifact Repository Manager für alle Package-Typen mit Binary Management.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_object', 'storage_file', 'storage_block', 'loadbalancer', 'cdn', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Small Team', compute: { cpu: 4, ram: 8 }, database: { type: 'PostgreSQL 13+ / MySQL 8.0+', size: '50GB' }, storage: { type: 'SSD', size: '200GB' }, java: 'JRE 11/17' },
            medium: { workload: 'Production', compute: { cpu: 8, ram: 16 }, database: { type: 'PostgreSQL 15+ / MySQL 8.0+', size: '100GB' }, storage: { type: 'SSD / S3', size: '1TB' }, java: 'JRE 17' },
            large: { workload: 'Enterprise HA', compute: { cpu: 16, ram: 64 }, database: { type: 'PostgreSQL 15+ / Oracle 19c', size: '500GB+' }, storage: { type: 'S3 / GCS / Azure Blob', size: '10TB+' }, java: 'JRE 17', architecture: 'HA-Cluster mit 3+ Nodes', ha: { nodes: 3, type: 'Active-Active Cluster with shared storage' } }
        },
        sizing: { source: 'https://jfrog.com/help/r/jfrog-installation-setup-documentation/system-requirements' }
    },
    'terraform-enterprise': {
        name: 'Terraform Enterprise',
        description: 'Self-hosted Version von Terraform Cloud für Infrastructure-as-Code mit Policy Enforcement.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_object', 'storage_block', 'loadbalancer', 'dns', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workspaces: 'bis 100', compute: { cpu: 4, ram: 8 }, database: { type: 'PostgreSQL 14+', size: '50GB' }, storage: { type: 'SSD / S3', size: '100GB' } },
            medium: { workspaces: '100-1.000', compute: { cpu: 8, ram: 16 }, database: { type: 'PostgreSQL 14+', size: '100GB' }, storage: { type: 'SSD / S3', size: '500GB' }, redis: '6+' },
            large: { workspaces: '1.000+', compute: { cpu: 16, ram: 32 }, database: { type: 'PostgreSQL 15+ (HA)', size: '500GB+' }, storage: { type: 'S3 / GCS / Azure Blob', size: '2TB+' }, redis: 'Cluster', architecture: 'Active-Active Deployment', ha: { nodes: 2, type: 'Active-Active with PostgreSQL HA' } }
        },
        sizing: { source: 'https://developer.hashicorp.com/terraform/enterprise/deploy/requirements' }
    },
    'ansible-tower': {
        name: 'Ansible Tower / AWX',
        description: 'Web-basierte UI und REST API für Ansible Automation mit Role-Based Access Control.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_block', 'loadbalancer', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { hosts: 'bis 100', compute: { cpu: 4, ram: 16 }, database: { type: 'PostgreSQL 13+', size: '20GB' }, storage: { type: 'SSD', size: '40GB' } },
            medium: { hosts: '100-2.000', compute: { cpu: 8, ram: 32 }, database: { type: 'PostgreSQL 13+ (external)', size: '100GB' }, storage: { type: 'SSD', size: '100GB' } },
            large: { hosts: '2.000+', compute: { cpu: 16, ram: 64 }, database: { type: 'PostgreSQL 15+ (HA)', size: '500GB+' }, storage: { type: 'SSD', size: '200GB+' }, architecture: 'Clustered mit 3+ Nodes + HAProxy', ha: { nodes: 3, type: 'Clustered with HAProxy Load Balancer + PostgreSQL HA' } }
        },
        sizing: { source: 'https://docs.ansible.com/automation-controller/latest/html/userguide/requirements.html' }
    },
    'vault': {
        name: 'HashiCorp Vault',
        description: 'Secrets Management und Data Protection Plattform für Credentials, Keys und Zertifikate.',
        components: ['compute', 'kubernetes', 'storage_block', 'loadbalancer', 'dns', 'monitoring', 'logging', 'identity'],
        systemRequirements: {
            small: { secrets: 'Dev/Test', compute: { cpu: 2, ram: 4 }, storage: { type: 'SSD', backend: 'Integrated Raft', size: '20GB' } },
            medium: { secrets: 'Production', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', backend: 'Integrated Raft / Consul', size: '50GB' }, ha: { nodes: 3 } },
            large: { secrets: 'Enterprise', compute: { cpu: 8, ram: 16 }, storage: { type: 'NVMe SSD', backend: 'Integrated Raft / Consul', size: '100GB+' }, ha: { nodes: 5 }, hsm: 'Empfohlen für Auto-Unseal' }
        },
        sizing: { source: 'https://developer.hashicorp.com/vault/docs/internals/integrated-storage#raft-storage-requirements' }
    },
    'consul': {
        name: 'HashiCorp Consul',
        description: 'Service Mesh und Service Discovery Lösung mit Registry, Health Checking und Key-Value Store.',
        components: ['compute', 'kubernetes', 'storage_block', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { services: 'Dev/Test', compute: { cpu: 2, ram: 2 }, storage: { type: 'SSD', size: '10GB' } },
            medium: { services: 'Production', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '50GB' }, ha: { servers: 3, clients: 'Unlimited' } },
            large: { services: 'Enterprise', compute: { cpu: 8, ram: 16 }, storage: { type: 'NVMe SSD', size: '100GB+' }, ha: { servers: 5, clients: 'Unlimited' }, network: '10Gbps empfohlen' }
        },
        sizing: { note: 'Servers: 3-5 für Quorum; Clients: 1 pro Service-Node', source: 'https://developer.hashicorp.com/consul/docs/architecture/consensus' }
    },
    'backstage': {
        name: 'Backstage',
        description: 'Open-Source Developer Portal Framework von Spotify mit Software Catalog und TechDocs.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_object', 'loadbalancer', 'dns', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { services: 'bis 100 Catalog Entities', compute: { cpu: 2, ram: 2 }, database: { type: 'PostgreSQL 13+', size: '10GB' }, storage: { type: 'SSD', size: '20GB' }, nodejs: '18+' },
            medium: { services: '100-1.000 Catalog Entities', compute: { cpu: 4, ram: 4 }, database: { type: 'PostgreSQL 14+', size: '50GB' }, storage: { type: 'SSD', size: '50GB' }, nodejs: '20+' },
            large: { services: '1.000+ Catalog Entities', compute: { cpu: 8, ram: 8 }, database: { type: 'PostgreSQL 15+', size: '100GB+' }, storage: { type: 'SSD', size: '200GB+' }, nodejs: '20+', cache: 'Redis empfohlen' }
        },
        sizing: { source: 'https://backstage.io/docs/deployment/scaling' }
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // CMS & COLLABORATION
    // ═══════════════════════════════════════════════════════════════════════════════
    'wordpress': {
        name: 'WordPress',
        description: 'Das weltweit meistgenutzte Open-Source-CMS für Blogs und Websites mit umfangreichem Plugin-Ökosystem.',
        components: ['compute', 'database_sql', 'storage_block', 'storage_file', 'loadbalancer', 'cdn', 'dns', 'cache', 'monitoring', 'logging', 'secrets'],
        systemRequirements: {
            small: { workload: 'Blog/Small Site', compute: { cpu: 1, ram: 2 }, database: { type: 'MySQL 8.0+ / MariaDB 10.6+', size: '5GB' }, storage: { type: 'SSD', size: '20GB' }, php: '8.1+', webServer: 'Apache 2.4 / Nginx' },
            medium: { workload: 'Business Site/WooCommerce', compute: { cpu: 2, ram: 4 }, database: { type: 'MySQL 8.0+ / MariaDB 10.6+', size: '20GB' }, storage: { type: 'SSD', size: '50GB' }, php: '8.1+', cache: 'Redis empfohlen' },
            large: { workload: 'High-Traffic/Large WooCommerce', compute: { cpu: 4, ram: 8 }, database: { type: 'MySQL 8.0+ (Replica)', size: '50GB+' }, storage: { type: 'SSD', size: '100GB+' }, php: '8.2+', cache: 'Redis + Varnish', cdn: 'empfohlen' }
        },
        sizing: { source: 'https://woocommerce.com/document/server-requirements/' }
    },
    'drupal': {
        name: 'Drupal',
        description: 'Enterprise-CMS mit Symfony-Framework für komplexe, inhaltsreiche Websites.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_block', 'storage_file', 'loadbalancer', 'cdn', 'dns', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Small Site', compute: { cpu: 1, ram: 1 }, database: { type: 'MySQL 5.7.8+ / PostgreSQL 12+ / MariaDB 10.3.7+', size: '5GB' }, storage: { type: 'SSD', size: '10GB' }, php: '8.2+' },
            medium: { workload: 'Medium Site', compute: { cpu: 2, ram: 2 }, database: { type: 'MySQL 8.0+ / PostgreSQL 14+', size: '20GB' }, storage: { type: 'SSD', size: '30GB' }, php: '8.2+' },
            large: { workload: 'Enterprise', compute: { cpu: 4, ram: 4 }, database: { type: 'MySQL 8.0+ / PostgreSQL 15+', size: '50GB+' }, storage: { type: 'SSD', size: '100GB+' }, php: '8.3+', cache: 'Redis/Memcached' }
        },
        sizing: { source: 'https://www.drupal.org/docs/getting-started/system-requirements' }
    },
    'joomla': {
        name: 'Joomla',
        description: 'Flexibles Open-Source-CMS für Websites und Online-Anwendungen.',
        components: ['compute', 'database_sql', 'storage_block', 'loadbalancer', 'cdn', 'dns', 'cache', 'monitoring', 'logging', 'secrets'],
        systemRequirements: {
            small: { compute: { cpu: 1, ram: 1 }, database: { type: 'MySQL 5.6+ / PostgreSQL 11+ / MariaDB 10.1+', size: '5GB' }, storage: { type: 'SSD', size: '10GB' }, php: '8.1+' },
            medium: { compute: { cpu: 2, ram: 2 }, database: { type: 'MySQL 8.0+ / MariaDB 10.6+', size: '20GB' }, storage: { type: 'SSD', size: '30GB' }, php: '8.1+' },
            large: { compute: { cpu: 4, ram: 4 }, database: { type: 'MySQL 8.0+ / MariaDB 10.6+', size: '50GB+' }, storage: { type: 'SSD', size: '100GB+' }, php: '8.2+' }
        }
    },
    'nextcloud': {
        name: 'Nextcloud',
        description: 'Self-hosted Collaboration-Plattform für Dateisynchronisation, Kalender, Kontakte und Office.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_object', 'storage_block', 'storage_file', 'loadbalancer', 'dns', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: 'bis 100', compute: { cpu: 2, ram: 8 }, database: { type: 'MySQL 8.0+ / MariaDB 10.6+ / PostgreSQL 13+', size: '10GB' }, storage: { type: 'SSD', dataSize: '500GB' }, php: '8.1+', redis: 'empfohlen' },
            medium: { users: '100-500', compute: { cpu: 4, ram: 16 }, database: { type: 'MySQL 8.0+ / PostgreSQL 14+', size: '50GB' }, storage: { type: 'SSD', dataSize: '2TB' }, php: '8.2+', redis: 'erforderlich' },
            large: { users: '500+', compute: { cpu: 8, ram: 32 }, database: { type: 'PostgreSQL 15+ (HA)', size: '100GB+' }, storage: { type: 'NVMe/Object Storage', dataSize: '10TB+' }, php: '8.2+', redis: 'Cluster', architecture: 'Multi-Server + Object Storage', ha: { nodes: 2, type: 'Multi-Server with shared object storage and Redis Cluster' } }
        },
        sizing: { source: 'https://docs.nextcloud.com/server/stable/admin_manual/installation/system_requirements.html' }
    },
    'confluence': {
        name: 'Confluence',
        description: 'Enterprise-Wiki und Collaboration-Tool von Atlassian für Team-Dokumentation.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_block', 'storage_file', 'loadbalancer', 'cdn', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: 'bis 25', compute: { cpu: 2, ram: 8 }, database: { type: 'PostgreSQL 13+ / MySQL 8+', size: '50GB' }, storage: { type: 'SSD', size: '100GB' }, java: 'JRE 11' },
            medium: { users: '25-500', compute: { cpu: 4, ram: 16 }, database: { type: 'PostgreSQL 14+ / MySQL 8+', size: '100GB' }, storage: { type: 'SSD', size: '500GB' }, java: 'JRE 11' },
            large: { users: '500+', compute: { cpu: 8, ram: 32 }, database: { type: 'PostgreSQL 15+ (Tuned)', size: '500GB+' }, storage: { type: 'NVMe SSD + NFS', size: '2TB+' }, java: 'JRE 11', architecture: 'Data Center (clustered)', ha: { nodes: 2, type: 'Data Center Cluster with NFS shared storage' } }
        },
        sizing: { source: 'https://confluence.atlassian.com/doc/supported-platforms-207488198.html' }
    },
    'sharepoint': {
        name: 'SharePoint',
        description: 'Microsoft Enterprise-Plattform für Dokumentenmanagement und Intranet-Portale.',
        components: ['compute', 'database_sql', 'storage_block', 'storage_file', 'loadbalancer', 'cdn', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: 'bis 1.000', compute: { cpu: 12, ram: 48 }, webFrontEnd: { cpu: 4, ram: 16 }, appServer: { cpu: 4, ram: 16 }, dbServer: { cpu: 4, ram: 16 }, database: { type: 'SQL Server 2019/2022', size: '100GB' }, storage: { type: 'SSD', size: '500GB' }, os: 'Windows Server 2019/2022' },
            medium: { users: '1.000-10.000', compute: { cpu: 32, ram: 160 }, webFrontEnd: { cpu: 8, ram: 32, nodes: 2 }, appServer: { cpu: 8, ram: 32 }, dbServer: { cpu: 8, ram: 64 }, database: { type: 'SQL Server 2019/2022 Enterprise', size: '500GB' }, storage: { type: 'SSD', size: '2TB' } },
            large: { users: '10.000+', compute: { cpu: 112, ram: 448 }, webFrontEnd: { cpu: 16, ram: 64, nodes: '4+' }, appServer: { cpu: 16, ram: 64, nodes: '2+' }, dbServer: { cpu: 16, ram: 128 }, database: { type: 'SQL Server 2022 Enterprise (AlwaysOn)', size: '2TB+' }, storage: { type: 'Enterprise SSD', size: '10TB+' }, architecture: 'Multi-Farm mit Search Cluster' }
        },
        sizing: { source: 'https://learn.microsoft.com/en-us/sharepoint/install/hardware-software-requirements-2019' }
    },
    'mattermost': {
        name: 'Mattermost',
        description: 'Self-hosted Messaging-Plattform für sichere Team-Kommunikation (Slack-Alternative).',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_object', 'storage_block', 'loadbalancer', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: 'bis 100', compute: { cpu: 1, ram: 2 }, database: { type: 'PostgreSQL 11+ / MySQL 8+', size: '10GB' }, storage: { type: 'SSD', size: '50GB' } },
            medium: { users: '100-2.000', compute: { cpu: 2, ram: 4 }, database: { type: 'PostgreSQL 13+', size: '50GB' }, storage: { type: 'SSD', size: '200GB' } },
            large: { users: '2.000+', compute: { cpu: 4, ram: 8, nodes: 'Multiple' }, database: { type: 'PostgreSQL 15+ (HA)', size: '200GB+' }, storage: { type: 'S3/Object Storage', size: '1TB+' }, architecture: 'HA mit Load Balancer', ha: { nodes: 2, type: 'Load Balanced with PostgreSQL HA' } }
        },
        sizing: { source: 'https://docs.mattermost.com/install/software-hardware-requirements.html' }
    },
    'rocketchat': {
        name: 'Rocket.Chat',
        description: 'Open-Source Team-Kommunikationsplattform mit Chat, Video-Calls und Omnichannel.',
        components: ['compute', 'kubernetes', 'database_nosql', 'storage_object', 'storage_block', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: 'bis 200', compute: { cpu: 2, ram: 2 }, database: { type: 'MongoDB 5.0+', size: '10GB' }, storage: { type: 'SSD', size: '50GB' }, nodejs: '14' },
            medium: { users: '200-1.000', compute: { cpu: 4, ram: 4 }, database: { type: 'MongoDB 6.0+ Replica Set', size: '50GB' }, storage: { type: 'SSD', size: '200GB' }, nodejs: '14' },
            large: { users: '1.000+', compute: { cpu: 8, ram: 8 }, database: { type: 'MongoDB 6.0+ Sharded Cluster', size: '200GB+' }, storage: { type: 'SSD / S3', size: '1TB+' }, architecture: 'Multiple Instances + LB' }
        },
        sizing: { source: 'https://docs.rocket.chat/setup-and-configure/installing-client-apps/minimum-requirements-for-using-rocket.chat' }
    },
    'matrix': {
        name: 'Matrix/Element',
        description: 'Dezentrales, föderiertes Kommunikationsprotokoll mit End-to-End-Verschlüsselung.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_block', 'loadbalancer', 'dns', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: 'bis 100', compute: { cpu: 2, ram: 4 }, database: { type: 'PostgreSQL 12+ (Synapse)', size: '20GB' }, storage: { type: 'SSD', size: '50GB' } },
            medium: { users: '100-1.000', compute: { cpu: 4, ram: 8 }, database: { type: 'PostgreSQL 14+', size: '100GB' }, storage: { type: 'SSD', size: '200GB' }, redis: 'empfohlen für Caching' },
            large: { users: '1.000+', compute: { cpu: 8, ram: 16 }, database: { type: 'PostgreSQL 15+ (HA)', size: '500GB+' }, storage: { type: 'SSD', size: '1TB+' }, redis: 'erforderlich', architecture: 'Workers für Skalierung (synapse-workers)', ha: { nodes: 3, workers: '2+', type: 'Synapse-Workers with PostgreSQL HA' } }
        },
        sizing: { source: 'https://element-hq.github.io/synapse/latest/usage/configuration/config_documentation.html' }
    },
    'discourse': {
        name: 'Discourse',
        description: 'Moderne Open-Source-Forensoftware mit Echtzeit-Benachrichtigungen auf Ruby on Rails.',
        components: ['compute', 'database_sql', 'storage_block', 'loadbalancer', 'cdn', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { pageviews: 'bis 100K/Monat', compute: { cpu: 2, ram: 2 }, database: { type: 'PostgreSQL 13+', size: '10GB' }, storage: { type: 'SSD', size: '30GB' }, redis: '6+' },
            medium: { pageviews: '100K-1M/Monat', compute: { cpu: 4, ram: 8 }, database: { type: 'PostgreSQL 14+', size: '50GB' }, storage: { type: 'SSD', size: '100GB' }, redis: '6+' },
            large: { pageviews: '1M+/Monat', compute: { cpu: 8, ram: 16 }, database: { type: 'PostgreSQL 15+ (HA)', size: '200GB+' }, storage: { type: 'SSD / S3', size: '500GB+' }, redis: 'Cluster', architecture: 'Docker-Cluster' }
        },
        sizing: { source: 'https://github.com/discourse/discourse/blob/main/docs/INSTALL.md' }
    },
    'mediawiki': {
        name: 'MediaWiki',
        description: 'Die Wiki-Software hinter Wikipedia für große Wissensbasen mit Versionierung.',
        components: ['compute', 'database_sql', 'storage_block', 'storage_object', 'loadbalancer', 'cdn', 'dns', 'cache', 'monitoring', 'logging', 'secrets'],
        systemRequirements: {
            small: { pages: 'bis 10.000', compute: { cpu: 1, ram: 1 }, database: { type: 'MySQL 5.7+ / MariaDB 10.4+ / PostgreSQL 10+', size: '5GB' }, storage: { type: 'SSD', size: '20GB' }, php: '8.1+' },
            medium: { pages: '10.000-100.000', compute: { cpu: 2, ram: 4 }, database: { type: 'MariaDB 10.6+ / MySQL 8.0+', size: '50GB' }, storage: { type: 'SSD', size: '100GB' }, php: '8.2+', cache: 'Memcached / Redis' },
            large: { pages: '100.000+', compute: { cpu: 4, ram: 8, nodes: 'Multiple' }, database: { type: 'MariaDB 10.11+ (HA)', size: '200GB+' }, storage: { type: 'SSD / Object Storage', size: '1TB+' }, php: '8.2+', cache: 'Memcached Cluster', architecture: 'Load Balanced + Swift/S3 für Uploads' }
        },
        sizing: { source: 'https://www.mediawiki.org/wiki/Manual:Installation_requirements' }
    },
    'strapi': {
        name: 'Strapi',
        description: 'Headless CMS auf Node.js-Basis mit REST- und GraphQL-API für moderne Web-Anwendungen.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_object', 'storage_block', 'loadbalancer', 'cdn', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Dev/Small', compute: { cpu: 1, ram: 2 }, database: { type: 'SQLite / PostgreSQL 14+ / MySQL 8+', size: '5GB' }, storage: { type: 'SSD', size: '20GB' }, nodejs: '18/20' },
            medium: { workload: 'Production', compute: { cpu: 2, ram: 4 }, database: { type: 'PostgreSQL 14+ / MySQL 8+', size: '20GB' }, storage: { type: 'SSD / S3', size: '50GB' }, nodejs: '20+' },
            large: { workload: 'High-Traffic', compute: { cpu: 4, ram: 8 }, database: { type: 'PostgreSQL 15+ (HA)', size: '100GB+' }, storage: { type: 'S3 / Object Storage', size: '200GB+' }, nodejs: '20+', architecture: 'PM2 Cluster / Kubernetes' }
        },
        sizing: { source: 'https://docs.strapi.io/dev-docs/installation' }
    },
    'ghost': {
        name: 'Ghost',
        description: 'Moderne Publishing-Plattform auf Node.js für Blogs und Newsletter mit Membership-System.',
        components: ['compute', 'database_sql', 'storage_block', 'loadbalancer', 'cdn', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets'],
        systemRequirements: {
            small: { workload: 'Personal Blog', compute: { cpu: 1, ram: 1 }, database: { type: 'MySQL 8.0+', size: '5GB' }, storage: { type: 'SSD', size: '20GB' }, nodejs: '18/20' },
            medium: { workload: 'Professional Publishing', compute: { cpu: 2, ram: 2 }, database: { type: 'MySQL 8.0+', size: '20GB' }, storage: { type: 'SSD', size: '50GB' }, nodejs: '20+', cdn: 'empfohlen' },
            large: { workload: 'High-Traffic Publication', compute: { cpu: 4, ram: 4 }, database: { type: 'MySQL 8.0+ (Replica)', size: '50GB+' }, storage: { type: 'SSD / S3', size: '200GB+' }, nodejs: '20+', cdn: 'erforderlich' }
        },
        sizing: { source: 'https://ghost.org/docs/hosting/#system-requirements' }
    },
    'typo3': {
        name: 'TYPO3',
        description: 'Enterprise-CMS aus Deutschland für große Websites mit Multi-Site-Fähigkeit.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_block', 'storage_file', 'loadbalancer', 'cdn', 'dns', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Small Site', compute: { cpu: 1, ram: 1 }, database: { type: 'MySQL 8.0+ / MariaDB 10.4+ / PostgreSQL 10+', size: '5GB' }, storage: { type: 'SSD', size: '20GB' }, php: '8.2+' },
            medium: { workload: 'Medium Site', compute: { cpu: 2, ram: 4 }, database: { type: 'MySQL 8.0+ / MariaDB 10.6+', size: '20GB' }, storage: { type: 'SSD', size: '50GB' }, php: '8.2+', cache: 'Redis / Memcached empfohlen' },
            large: { workload: 'Enterprise', compute: { cpu: 4, ram: 8, nodes: 'Multiple' }, database: { type: 'MySQL 8.0+ / MariaDB 10.11+ (Cluster)', size: '100GB+' }, storage: { type: 'SSD + NFS', size: '500GB+' }, php: '8.3+', cache: 'Redis Cluster', architecture: 'Load Balanced mit Shared Storage' }
        },
        sizing: { source: 'https://docs.typo3.org/m/typo3/tutorial-getting-started/main/en-us/SystemRequirements/Index.html' }
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // DATABASES & ANALYTICS
    // ═══════════════════════════════════════════════════════════════════════════════
    'postgresql-managed': {
        name: 'PostgreSQL (Managed)',
        description: 'Enterprise-grade relationale Open-Source-Datenbank mit ACID-Compliance und Erweiterbarkeit.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_block', 'loadbalancer', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Dev/Test', compute: { cpu: 2, ram: 4 }, storage: { type: 'SSD', size: '50GB', iops: 3000 } },
            medium: { workload: 'Production', compute: { cpu: 4, ram: 16 }, storage: { type: 'SSD', size: '200GB', iops: 6000 }, ha: { nodes: 2 } },
            large: { workload: 'High-Performance', compute: { cpu: 8, ram: 32 }, storage: { type: 'NVMe', size: '1TB+', iops: 10000 }, ha: { nodes: 3 } }
        },
        sizing: { source: 'https://www.postgresql.org/docs/current/install-requirements.html' }
    },
    'mysql-mariadb': {
        name: 'MySQL/MariaDB',
        description: 'Weit verbreitete relationale Open-Source-Datenbanken mit Master-Replica-Architekturen.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_block', 'loadbalancer', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Dev/Test', compute: { cpu: 1, ram: 1 }, storage: { type: 'SSD', size: '20GB' } },
            medium: { workload: 'Production', compute: { cpu: 4, ram: 16 }, storage: { type: 'SSD', size: '100GB' }, bufferPool: '12GB' },
            large: { workload: 'High-Performance/Galera', compute: { cpu: 8, ram: 64 }, storage: { type: 'NVMe', size: '500GB+' }, bufferPool: '48GB', ha: { nodes: 3, type: 'Galera Cluster' } }
        },
        sizing: { source: 'https://mariadb.com/docs/galera-cluster' }
    },
    'mongodb': {
        name: 'MongoDB',
        description: 'Dokumentenorientierte NoSQL-Datenbank mit flexiblem Schema und horizontaler Skalierung.',
        components: ['compute', 'kubernetes', 'database_nosql', 'storage_block', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Dev/Test', compute: { cpu: 2, ram: 4 }, storage: { type: 'SSD', size: '50GB' } },
            medium: { workload: 'Production Replica Set', compute: { cpu: 4, ram: 16 }, storage: { type: 'SSD', size: '200GB' }, ha: { nodes: 3, type: 'Replica Set' } },
            large: { workload: 'High-Performance', compute: { cpu: 8, ram: 64 }, storage: { type: 'NVMe', size: '1TB+' }, wiredTigerCache: '50% RAM', ha: { nodes: 3 } }
        },
        sizing: { note: 'WiredTiger Cache = 50% (RAM - 1GB) oder 256MB', source: 'https://www.mongodb.com/docs/manual/administration/production-notes/' }
    },
    'elasticsearch': {
        name: 'Elasticsearch/OpenSearch',
        description: 'Verteilte Such- und Analytics-Engine basierend auf Apache Lucene für Volltextsuche.',
        components: ['compute', 'kubernetes', 'database_nosql', 'storage_block', 'loadbalancer', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Dev/Test', compute: { cpu: 2, ram: 8 }, storage: { type: 'SSD', size: '100GB' }, jvmHeap: '4GB' },
            medium: { workload: 'Production', compute: { cpu: 4, ram: 32 }, storage: { type: 'SSD', size: '500GB' }, jvmHeap: '16GB', ha: { nodes: 3 } },
            large: { workload: 'High-Performance', compute: { cpu: 16, ram: 128 }, storage: { type: 'NVMe', size: '2TB+' }, jvmHeap: '30GB (max!)', ha: { nodes: 3, dataNodes: '3+' } }
        },
        sizing: { note: 'JVM Heap max 30GB (Compressed OOPs), 50% RAM für Filesystem Cache', source: 'https://www.elastic.co/docs/deploy-manage/deploy/cloud-enterprise/ece-hardware-prereq' }
    },
    'apache-kafka': {
        name: 'Apache Kafka',
        description: 'Verteilte Event-Streaming-Plattform für High-Throughput-Daten-Pipelines.',
        components: ['compute', 'kubernetes', 'storage_block', 'loadbalancer', 'dns', 'messaging', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Dev/Test', compute: { cpu: 2, ram: 8 }, storage: { type: 'SSD', size: '100GB' }, jvmHeap: '4GB' },
            medium: { workload: 'Production', compute: { cpu: 8, ram: 32 }, storage: { type: 'SSD', size: '500GB', drives: 'Multiple' }, jvmHeap: '6GB', network: '10Gbps', ha: { brokers: 3, zookeeper: 3 } },
            large: { workload: 'High-Throughput', compute: { cpu: 24, ram: 64 }, storage: { type: 'NVMe', size: '2TB+', drives: 'Multiple JBOD' }, jvmHeap: '6GB', network: '10Gbps+', ha: { brokers: 5 } }
        },
        sizing: { note: 'Nicht mehr als 6GB Heap, Rest für OS Page Cache', source: 'https://docs.confluent.io/platform/current/kafka/deployment.html' }
    },
    'redis-primary': {
        name: 'Redis (als primäre DB)',
        description: 'In-Memory-Datenstruktur-Store als primäre Datenbank mit Persistenz und Clustering.',
        components: ['compute', 'kubernetes', 'database_nosql', 'storage_block', 'loadbalancer', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Dev/Test', compute: { cpu: 1, ram: 2 }, storage: { type: 'SSD', size: '4GB' } },
            medium: { workload: 'Production', compute: { cpu: 2, ram: 16 }, storage: { type: 'SSD', size: '32GB' }, maxmemory: '14GB' },
            large: { workload: 'High-Performance Cluster', compute: { cpu: 8, ram: 64 }, storage: { type: 'NVMe', size: '128GB' }, maxmemory: '50GB', ha: { nodes: 6, type: 'Cluster (3 Master + 3 Replica)' } }
        },
        sizing: { note: 'Storage = RAM * 2 für Persistence; maxmemory = RAM - 2GB', source: 'https://redis.io/docs/latest/operate/rs/installing-upgrading/install/plan-deployment/hardware-requirements/' }
    },
    'grafana': {
        name: 'Grafana',
        description: 'Open-Source-Plattform für Monitoring und Observability mit interaktiven Dashboards.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_block', 'loadbalancer', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Small Team', compute: { cpu: 1, ram: 1 }, database: { type: 'SQLite / PostgreSQL', size: '5GB' }, storage: { type: 'SSD', size: '10GB' } },
            medium: { workload: 'Production', compute: { cpu: 2, ram: 4 }, database: { type: 'PostgreSQL / MySQL', size: '20GB' }, storage: { type: 'SSD', size: '50GB' } },
            large: { workload: 'Enterprise HA', compute: { cpu: 16, ram: 64 }, database: { type: 'PostgreSQL HA', size: '100GB' }, storage: { type: 'SSD', size: '200GB' }, ha: { nodes: '2-3' } }
        },
        sizing: { source: 'https://grafana.com/docs/grafana/latest/setup-grafana/installation/' }
    },
    'prometheus': {
        name: 'Prometheus',
        description: 'Open-Source-Monitoring-System mit Time-Series-Datenbank und PromQL-Abfragesprache.',
        components: ['compute', 'kubernetes', 'storage_block', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Dev/Test', compute: { cpu: 2, ram: 4 }, storage: { type: 'SSD', size: '50GB' } },
            medium: { workload: 'Production', compute: { cpu: 4, ram: 16 }, storage: { type: 'SSD', size: '200GB' }, retention: '15d' },
            large: { workload: 'High-Cardinality', compute: { cpu: 8, ram: 64 }, storage: { type: 'NVMe', size: '1TB+' }, retention: '30d', ha: { nodes: 2, type: 'HA Pair + Thanos/Cortex' } }
        },
        sizing: { note: 'RAM ~1-2 bytes pro unique time series', source: 'https://prometheus.io/docs/prometheus/1.8/storage/' }
    },
    'influxdb': {
        name: 'InfluxDB',
        description: 'Purpose-built Time-Series-Datenbank für IoT-Sensordaten und Metriken.',
        components: ['compute', 'kubernetes', 'storage_block', 'loadbalancer', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Dev/Test', compute: { cpu: 2, ram: 4 }, storage: { type: 'SSD', size: '100GB' } },
            medium: { workload: 'Production', compute: { cpu: 4, ram: 16 }, storage: { type: 'SSD', size: '500GB' } },
            large: { workload: 'High-Throughput', compute: { cpu: 8, ram: 64 }, storage: { type: 'NVMe', size: '2TB+' }, note: 'InfluxDB 3.x basiert auf Apache Arrow' }
        },
        sizing: { source: 'https://docs.influxdata.com/influxdb/v2/install/' }
    },
    'apache-superset': {
        name: 'Apache Superset',
        description: 'Moderne Open-Source-BI-Plattform für Datenexploration und Visualisierung.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_block', 'loadbalancer', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: 'bis 10', compute: { cpu: 2, ram: 4 }, database: { type: 'PostgreSQL 13+ / MySQL 8+', size: '10GB' }, storage: { type: 'SSD', size: '20GB' }, python: '3.9+', redis: '6+' },
            medium: { users: '10-100', compute: { cpu: 4, ram: 8 }, database: { type: 'PostgreSQL 14+', size: '50GB' }, storage: { type: 'SSD', size: '50GB' }, python: '3.10+', redis: '6+', celery: 'für Async Queries' },
            large: { users: '100+', compute: { cpu: 8, ram: 16 }, database: { type: 'PostgreSQL 15+ (HA)', size: '100GB+' }, storage: { type: 'SSD', size: '200GB+' }, python: '3.11+', redis: 'Cluster', celery: 'Multiple Workers' }
        },
        sizing: { source: 'https://superset.apache.org/docs/installation/installing-superset-from-pypi/' }
    },
    'metabase': {
        name: 'Metabase',
        description: 'Benutzerfreundliches Open-Source-BI-Tool für Self-Service-Analytics.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_block', 'loadbalancer', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: 'bis 10', compute: { cpu: 1, ram: 2 }, database: { type: 'H2 (eingebettet) / PostgreSQL 12+', size: '5GB' }, storage: { type: 'SSD', size: '10GB' }, java: 'JRE 11' },
            medium: { users: '10-100', compute: { cpu: 2, ram: 4 }, database: { type: 'PostgreSQL 14+ / MySQL 8+', size: '20GB' }, storage: { type: 'SSD', size: '20GB' }, java: 'JRE 11' },
            large: { users: '100+', compute: { cpu: 4, ram: 8 }, database: { type: 'PostgreSQL 15+ (HA)', size: '50GB+' }, storage: { type: 'SSD', size: '50GB+' }, java: 'JRE 11', architecture: 'Horizontal Scaling mit Load Balancer' }
        },
        sizing: { source: 'https://www.metabase.com/docs/latest/installation-and-operation/installation-guide' }
    },
    'powerbi-report-server': {
        name: 'Power BI Report Server',
        description: 'On-Premises-Reporting-Lösung von Microsoft für Power-BI-Berichte.',
        components: ['compute', 'database_sql', 'storage_block', 'storage_file', 'loadbalancer', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: 'bis 50', compute: { cpu: 4, ram: 8 }, database: { type: 'SQL Server 2017+', size: '50GB' }, storage: { type: 'SSD', size: '100GB' }, os: 'Windows Server 2019/2022' },
            medium: { users: '50-250', compute: { cpu: 8, ram: 16 }, database: { type: 'SQL Server 2019+', size: '100GB' }, storage: { type: 'SSD', size: '200GB' }, os: 'Windows Server 2019/2022' },
            large: { users: '250+', compute: { cpu: 16, ram: 32 }, database: { type: 'SQL Server 2022 Enterprise', size: '500GB+' }, storage: { type: 'SSD', size: '500GB+' }, os: 'Windows Server 2022', architecture: 'Scale-Out Deployment' }
        },
        sizing: { source: 'https://learn.microsoft.com/en-us/power-bi/report-server/system-requirements' }
    },
    'tableau-server': {
        name: 'Tableau Server',
        description: 'Enterprise-BI-Plattform für visuelle Datenanalyse mit Self-Service-Analytics.',
        components: ['compute', 'database_sql', 'storage_block', 'storage_file', 'loadbalancer', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: 'bis 25', compute: { cpu: 8, ram: 32 }, database: { type: 'PostgreSQL 13+ (eingebettet oder extern)', size: '50GB' }, storage: { type: 'SSD', size: '200GB' }, os: ['Windows Server 2019/2022', 'RHEL 7/8/9'] },
            medium: { users: '25-250', compute: { cpu: 16, ram: 64 }, database: { type: 'PostgreSQL 14+ (extern)', size: '200GB' }, storage: { type: 'SSD', size: '500GB' } },
            large: { users: '250+', compute: { cpu: 32, ram: 128 }, database: { type: 'PostgreSQL 15+ (HA)', size: '1TB+' }, storage: { type: 'NVMe', size: '2TB+' }, architecture: 'Multi-Node Cluster mit Backgrounder-Nodes' }
        },
        sizing: { source: 'https://help.tableau.com/current/server/en-us/server_hardware_min.htm' }
    },
    'apache-airflow': {
        name: 'Apache Airflow',
        description: 'Workflow-Orchestrierungsplattform für datengetriebene ETL- und ML-Pipelines.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_block', 'storage_object', 'loadbalancer', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { dags: 'bis 50', compute: { webserver: { cpu: 1, ram: 2 }, scheduler: { cpu: 1, ram: 2 }, workers: { cpu: 2, ram: 4, count: 1 } }, database: { type: 'PostgreSQL 12+', size: '10GB' }, storage: { type: 'SSD', size: '50GB' }, python: '3.8+' },
            medium: { dags: '50-200', compute: { webserver: { cpu: 2, ram: 4 }, scheduler: { cpu: 2, ram: 4 }, workers: { cpu: 4, ram: 8, count: 3 } }, database: { type: 'PostgreSQL 14+', size: '50GB' }, storage: { type: 'SSD', size: '200GB' }, python: '3.10+', executor: 'Celery/Kubernetes' },
            large: { dags: '200+', compute: { webserver: { cpu: 4, ram: 8, nodes: 2 }, scheduler: { cpu: 4, ram: 8, nodes: 2 }, workers: { cpu: 8, ram: 16, count: '10+' } }, database: { type: 'PostgreSQL 15+ (HA)', size: '200GB+' }, storage: { type: 'SSD', size: '1TB+' }, python: '3.11+', executor: 'Kubernetes', redis: 'Cluster für Celery' }
        },
        sizing: { source: 'https://airflow.apache.org/docs/apache-airflow/stable/howto/set-up-database.html' }
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECURITY & IDENTITY
    // ═══════════════════════════════════════════════════════════════════════════════
    'keycloak': {
        name: 'Keycloak',
        description: 'Open-Source Identity and Access Management für SSO mit OpenID Connect, OAuth 2.0 und SAML.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_block', 'loadbalancer', 'dns', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: '1-1.000', sessions: '10.000', compute: { cpu: 2, ram: 2 }, database: { type: 'PostgreSQL 15+', size: '10GB', iops: 500 }, storage: { type: 'SSD', size: '20GB' } },
            medium: { users: '1.000-50.000', sessions: '100.000', loginRate: '15-45/sec', compute: { cpu: 6, ram: 8 }, database: { type: 'PostgreSQL 15+', size: '50GB', iops: 1400 }, storage: { type: 'SSD', size: '50GB' }, ha: { nodes: 3 } },
            large: { users: '50.000+', sessions: '200.000', loginRate: '45+/sec', compute: { cpu: 9, ram: 12 }, database: { type: 'PostgreSQL / Aurora PostgreSQL', size: '100GB+', iops: 2800 }, storage: { type: 'NVMe', size: '100GB+' }, ha: { nodes: 3, architecture: 'Active-Active Infinispan' } }
        },
        sizing: { note: 'CPU Headroom 150% für Spikes; 500MB RAM pro 100k Sessions', source: 'https://www.keycloak.org/high-availability/concepts-memory-and-cpu-sizing' }
    },
    'freeipa': {
        name: 'FreeIPA',
        description: 'Integrierte Security Information Management Lösung mit LDAP, Kerberos und DNS.',
        components: ['compute', 'storage_block', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: 'bis 500', compute: { cpu: 2, ram: 4 }, storage: { type: 'SSD', size: '50GB' }, os: ['RHEL 8/9', 'CentOS Stream 8/9', 'Fedora'] },
            medium: { users: '500-5.000', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '100GB' }, replicas: '1-2', os: ['RHEL 8/9', 'CentOS Stream 9'] },
            large: { users: '5.000+', compute: { cpu: 8, ram: 16 }, storage: { type: 'SSD', size: '200GB+' }, replicas: '3+', ha: true, os: ['RHEL 9'] }
        },
        sizing: { source: 'https://freeipa.org/page/Deployment_Recommendations' }
    },
    'openldap': {
        name: 'OpenLDAP',
        description: 'Freie Open-Source-Implementierung des LDAP-Protokolls mit modularer Architektur.',
        components: ['compute', 'storage_block', 'loadbalancer', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { entries: 'bis 10.000', compute: { cpu: 1, ram: 1 }, storage: { type: 'SSD', size: '10GB' } },
            medium: { entries: '10.000-100.000', compute: { cpu: 2, ram: 4 }, storage: { type: 'SSD', size: '50GB' }, cacheSize: '2GB' },
            large: { entries: '100.000+', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '100GB+' }, cacheSize: '4GB+', replication: 'Multi-Master empfohlen' }
        },
        sizing: { source: 'https://www.openldap.org/doc/admin25/tuning.html' }
    },
    'authentik': {
        name: 'Authentik',
        description: 'Open-Source Identity Provider für SSO mit SAML, OAuth2/OIDC, LDAP und RADIUS.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_block', 'loadbalancer', 'dns', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: 'bis 500', compute: { cpu: 2, ram: 2 }, database: { type: 'PostgreSQL 12+', size: '10GB' }, storage: { type: 'SSD', size: '20GB' }, redis: '6+' },
            medium: { users: '500-5.000', compute: { cpu: 4, ram: 4 }, database: { type: 'PostgreSQL 14+', size: '50GB' }, storage: { type: 'SSD', size: '50GB' }, redis: '6+' },
            large: { users: '5.000+', compute: { cpu: 8, ram: 8 }, database: { type: 'PostgreSQL 15+ (HA)', size: '100GB+' }, storage: { type: 'SSD', size: '100GB+' }, redis: 'Cluster', architecture: 'HA mit Multiple Workers' }
        },
        sizing: { source: 'https://goauthentik.io/docs/installation/requirements' }
    },
    'zitadel': {
        name: 'Zitadel',
        description: 'Identity Infrastructure Platform mit Event Sourcing, Multi-Tenancy und Passkeys.',
        components: ['compute', 'kubernetes', 'serverless', 'database_sql', 'storage_block', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: 'bis 1.000', compute: { cpu: 1, ram: 512 }, database: { type: 'PostgreSQL 14+ / CockroachDB', size: '10GB' }, storage: { type: 'SSD', size: '20GB' } },
            medium: { users: '1.000-10.000', compute: { cpu: 2, ram: 2 }, database: { type: 'PostgreSQL 15+ / CockroachDB', size: '50GB' }, storage: { type: 'SSD', size: '50GB' } },
            large: { users: '10.000+', compute: { cpu: 4, ram: 4 }, database: { type: 'CockroachDB Cluster / PostgreSQL HA', size: '100GB+' }, storage: { type: 'SSD', size: '100GB+' }, architecture: 'Multi-Region mit CockroachDB' }
        },
        sizing: { source: 'https://zitadel.com/docs/self-hosting/deploy/overview' }
    },
    'owasp-zap': {
        name: 'OWASP ZAP',
        description: 'Open-Source Web Application Security Scanner für automatisierte Sicherheitstests.',
        components: ['compute', 'kubernetes', 'storage_block', 'monitoring', 'logging'],
        systemRequirements: {
            small: { workload: 'Basic Scanning', compute: { cpu: 1, ram: 2 }, storage: { type: 'SSD', size: '10GB' }, java: 'JRE 11+' },
            medium: { workload: 'Standard Scanning', compute: { cpu: 2, ram: 4 }, storage: { type: 'SSD', size: '20GB' }, java: 'JRE 11+' },
            large: { workload: 'Enterprise/Automation', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '50GB' }, java: 'JRE 11+', note: 'Mehr RAM für große Web-Apps' }
        },
        sizing: { source: 'https://www.zaproxy.org/docs/docker/about/' }
    },
    'trivy': {
        name: 'Trivy',
        description: 'Umfassender Security Scanner für Container-Images, Kubernetes und IaC.',
        components: ['compute', 'kubernetes', 'storage_block', 'monitoring', 'logging'],
        systemRequirements: {
            small: { workload: 'CLI/CI Scanning', compute: { cpu: 1, ram: 1 }, storage: { type: 'SSD', size: '5GB' } },
            medium: { workload: 'Server Mode', compute: { cpu: 2, ram: 2 }, storage: { type: 'SSD', size: '20GB' } },
            large: { workload: 'Enterprise/Operator', compute: { cpu: 4, ram: 4 }, storage: { type: 'SSD', size: '50GB' }, note: 'Vulnerability DB benötigt regelmäßige Updates' }
        },
        sizing: { source: 'https://aquasecurity.github.io/trivy/latest/getting-started/installation/' }
    },
    'falco': {
        name: 'Falco',
        description: 'Cloud Native Runtime Security Tool (CNCF) für Echtzeit-Bedrohungserkennung.',
        components: ['compute', 'kubernetes', 'storage_block', 'messaging', 'monitoring', 'logging', 'secrets'],
        systemRequirements: {
            small: { workload: 'Small Cluster', compute: { cpu: 0.1, ram: 0.5 }, storage: { type: 'SSD', size: '1GB' }, kernelDriver: 'eBPF / Kernel Module' },
            medium: { workload: 'Production', compute: { cpu: 0.5, ram: 1 }, storage: { type: 'SSD', size: '5GB' }, kernelDriver: 'eBPF empfohlen' },
            large: { workload: 'High-Traffic', compute: { cpu: 1, ram: 2 }, storage: { type: 'SSD', size: '10GB' }, kernelDriver: 'eBPF', note: 'DaemonSet auf jedem Node' }
        },
        sizing: { source: 'https://falco.org/docs/getting-started/deployment/' }
    },
    'wazuh': {
        name: 'Wazuh',
        description: 'Unified XDR und SIEM Plattform für Endpoints und Cloud Workloads.',
        components: ['compute', 'kubernetes', 'database_nosql', 'storage_block', 'storage_object', 'loadbalancer', 'messaging', 'monitoring', 'logging', 'secrets', 'identity', 'ai_ml'],
        systemRequirements: {
            small: { agents: 'bis 100', compute: { cpu: 4, ram: 8 }, manager: { cpu: 2, ram: 4 }, indexer: { cpu: 2, ram: 4 }, storage: { type: 'SSD', size: '100GB' } },
            medium: { agents: '100-1.000', compute: { cpu: 8, ram: 16 }, manager: { cpu: 4, ram: 8 }, indexer: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '500GB' } },
            large: { agents: '1.000+', compute: { cpu: 48, ram: 96 }, manager: { cpu: 8, ram: 16, nodes: 3 }, indexer: { cpu: 8, ram: 16, nodes: 3 }, storage: { type: 'NVMe', size: '2TB+' }, architecture: 'Wazuh Cluster + Indexer Cluster' }
        },
        sizing: { source: 'https://documentation.wazuh.com/current/quickstart.html#hardware-requirements' }
    },
    'graylog': {
        name: 'Graylog',
        description: 'Zentrales Log Management System mit MongoDB und Elasticsearch/OpenSearch.',
        components: ['compute', 'kubernetes', 'database_nosql', 'storage_block', 'loadbalancer', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { throughput: 'bis 5GB/Tag', compute: { cpu: 5, ram: 9 }, graylog: { cpu: 2, ram: 4 }, elasticsearch: { cpu: 2, ram: 4 }, mongodb: { cpu: 1, ram: 1 }, storage: { type: 'SSD', size: '100GB' }, java: 'JRE 17' },
            medium: { throughput: '5-50GB/Tag', compute: { cpu: 10, ram: 28 }, graylog: { cpu: 4, ram: 8 }, elasticsearch: { cpu: 4, ram: 16 }, mongodb: { cpu: 2, ram: 4 }, storage: { type: 'SSD', size: '500GB' }, java: 'JRE 17' },
            large: { throughput: '50GB+/Tag', compute: { cpu: 68, ram: 152 }, graylog: { cpu: 8, ram: 16, nodes: 3 }, elasticsearch: { cpu: 8, ram: 32, nodes: 3 }, mongodb: { cpu: 4, ram: 8 }, storage: { type: 'NVMe', size: '2TB+' }, java: 'JRE 17', architecture: 'Graylog Cluster + Elasticsearch Cluster' }
        },
        sizing: { source: 'https://go2docs.graylog.org/5-0/setting_up_graylog/planning.html' }
    },
    'splunk': {
        name: 'Splunk',
        description: 'Enterprise SIEM und Log-Analyse-Plattform mit SmartStore und Machine Learning.',
        components: ['compute', 'kubernetes', 'database_nosql', 'storage_object', 'storage_block', 'loadbalancer', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity', 'ai_ml'],
        systemRequirements: {
            small: { indexing: 'bis 20GB/Tag', compute: { cpu: 12, ram: 12 }, storage: { type: 'SSD', hotSize: '300GB', coldSize: '1TB' }, os: ['Linux x64', 'Windows Server'] },
            medium: { indexing: '20-100GB/Tag', compute: { cpu: 24, ram: 32 }, storage: { type: 'SSD/NVMe', hotSize: '1TB', coldSize: '5TB' }, architecture: 'Search Head + Indexer Cluster' },
            large: { indexing: '100GB+/Tag', compute: { cpu: 48, ram: 64 }, storage: { type: 'SmartStore + S3', hotSize: '2TB+', remoteSize: 'Unbegrenzt' }, architecture: 'SH Cluster + Indexer Cluster + SmartStore' }
        },
        sizing: { source: 'https://docs.splunk.com/Documentation/Splunk/latest/Capacity/Referencehardware' }
    },
    'crowdsec': {
        name: 'CrowdSec',
        description: 'Open-Source Security Engine mit crowdsourced Threat Intelligence.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_block', 'monitoring', 'logging', 'secrets'],
        systemRequirements: {
            small: { workload: 'Single Server', compute: { cpu: 1, ram: 0.5 }, storage: { type: 'SSD', size: '5GB' } },
            medium: { workload: 'Multiple Servers', compute: { cpu: 2, ram: 1 }, storage: { type: 'SSD', size: '10GB' }, database: { type: 'PostgreSQL (optional)', size: '10GB' } },
            large: { workload: 'Enterprise', compute: { cpu: 4, ram: 2 }, storage: { type: 'SSD', size: '50GB' }, database: { type: 'PostgreSQL / MySQL', size: '50GB' }, architecture: 'Zentrale LAPI + Distributed Agents' }
        },
        sizing: { source: 'https://docs.crowdsec.net/docs/getting_started/installation/' }
    },
    'pfsense': {
        name: 'pfSense',
        description: 'Open-Source Firewall und Router Distribution auf FreeBSD-Basis.',
        components: ['compute', 'storage_block', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { throughput: 'bis 100 Mbit/s', compute: { cpu: 1, ram: 1 }, storage: { type: 'SSD', size: '16GB' }, network: '2+ NICs' },
            medium: { throughput: '100-500 Mbit/s', compute: { cpu: 2, ram: 2 }, storage: { type: 'SSD', size: '32GB' }, network: '2+ NICs' },
            large: { throughput: '1+ Gbit/s', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '64GB+' }, network: '4+ NICs', packages: 'Suricata/Snort für IDS/IPS' }
        },
        sizing: { source: 'https://docs.netgate.com/pfsense/en/latest/hardware/minimum-requirements.html' }
    },
    'wireguard': {
        name: 'WireGuard VPN Server',
        description: 'Modernes, schnelles VPN-Protokoll mit minimaler Angriffsfläche.',
        components: ['compute', 'storage_block', 'dns', 'monitoring', 'logging', 'secrets'],
        systemRequirements: {
            small: { peers: 'bis 50', compute: { cpu: 1, ram: 0.5 }, storage: { type: 'SSD', size: '1GB' }, note: 'Kernel 5.6+ für nativen Support' },
            medium: { peers: '50-500', compute: { cpu: 2, ram: 1 }, storage: { type: 'SSD', size: '5GB' }, network: '1 Gbit/s' },
            large: { peers: '500+', compute: { cpu: 4, ram: 2 }, storage: { type: 'SSD', size: '10GB' }, network: '10 Gbit/s', note: 'Skaliert gut mit mehr CPU Cores' }
        },
        sizing: { source: 'https://www.wireguard.com/' }
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // E-COMMERCE PLATFORMS
    // ═══════════════════════════════════════════════════════════════════════════════
    'magento': {
        name: 'Magento/Adobe Commerce',
        description: 'Enterprise E-Commerce-Plattform mit B2B/B2C-Funktionen, Elasticsearch, Redis und Varnish.',
        components: ['compute', 'database_sql', 'storage_object', 'storage_block', 'loadbalancer', 'cdn', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Small Shop (<10K SKUs)', compute: { cpu: 4, ram: 8 }, database: { type: 'MySQL 8.0+ / MariaDB 10.6+', size: '20GB' }, storage: { type: 'SSD', size: '50GB' }, php: '8.2-8.4', cache: 'Redis 6.2+ / Varnish 7.x', search: 'Elasticsearch 8.x / OpenSearch 2.x' },
            medium: { workload: 'Medium Shop (10K-100K SKUs)', compute: { cpu: 8, ram: 16 }, database: { type: 'MySQL 8.0+ / MariaDB 10.6+', size: '50GB' }, storage: { type: 'SSD', size: '100GB' }, php: '8.2-8.4', phpMemory: '2GB' },
            large: { workload: 'Enterprise (>100K SKUs)', compute: { cpu: 16, ram: 64 }, database: { type: 'MySQL 8.0+ (Replica)', size: '200GB+' }, storage: { type: 'NVMe', size: '500GB+' }, php: '8.3+', cache: 'Redis Cluster / Varnish', search: 'Elasticsearch Cluster', messageQueue: 'RabbitMQ 3.13+' }
        },
        sizing: { source: 'https://experienceleague.adobe.com/en/docs/commerce-operations/installation-guide/system-requirements' }
    },
    'shopware': {
        name: 'Shopware',
        description: 'Deutsche E-Commerce-Plattform für B2B und B2C mit PHP 8.2+, MySQL und Redis.',
        components: ['compute', 'database_sql', 'storage_object', 'storage_block', 'loadbalancer', 'cdn', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets'],
        systemRequirements: {
            small: { workload: 'Small Shop (<5K products)', compute: { cpu: 2, ram: 4 }, database: { type: 'MySQL 8.0.22+ / MariaDB 10.11.6+', size: '10GB' }, storage: { type: 'SSD', size: '20GB' }, php: '8.2+', nodejs: '20+' },
            medium: { workload: 'Medium Shop (5K-50K products)', compute: { cpu: 4, ram: 8 }, database: { type: 'MySQL 8.4 / MariaDB 11.4', size: '30GB' }, storage: { type: 'SSD', size: '50GB' }, php: '8.4', redis: 'erforderlich', varnish: 'empfohlen', search: 'OpenSearch 2.17.1' },
            large: { workload: 'Enterprise (>50K products)', compute: { cpu: 8, ram: 16 }, database: { type: 'MySQL 8.4 / MariaDB 11.4', size: '100GB+' }, storage: { type: 'NVMe', size: '200GB+' }, php: '8.4', redis: 'Cluster', varnish: 'erforderlich', search: 'OpenSearch Cluster', messageQueue: 'RabbitMQ' }
        },
        sizing: { source: 'https://developer.shopware.com/docs/guides/installation/requirements.html' }
    },
    'prestashop': {
        name: 'PrestaShop',
        description: 'Open-Source E-Commerce-Lösung für kleine bis mittlere Online-Shops.',
        components: ['compute', 'database_sql', 'storage_object', 'storage_block', 'loadbalancer', 'cdn', 'dns', 'monitoring', 'logging', 'secrets'],
        systemRequirements: {
            small: { workload: 'Small Shop (<1K products)', compute: { cpu: 1, ram: 2 }, database: { type: 'MySQL 5.7+ / MariaDB 10.2+', size: '5GB' }, storage: { type: 'SSD', size: '10GB' }, php: '8.1', phpMemory: '256MB' },
            medium: { workload: 'Medium Shop (1K-10K products)', compute: { cpu: 2, ram: 4 }, database: { type: 'MySQL 8.0+ / MariaDB 10.4+', size: '20GB' }, storage: { type: 'SSD', size: '30GB' }, php: '8.1', phpMemory: '512MB', cache: 'Redis empfohlen' },
            large: { workload: 'Enterprise (>10K products)', compute: { cpu: 4, ram: 8 }, database: { type: 'MySQL 8.0+ / MariaDB 10.6+', size: '50GB+' }, storage: { type: 'SSD', size: '100GB+' }, php: '8.1-8.2', phpMemory: '1024MB+', cache: 'Redis + Varnish' }
        },
        sizing: { source: 'https://devdocs.prestashop-project.org/8/basics/installation/system-requirements/' }
    },
    'woocommerce': {
        name: 'WooCommerce',
        description: 'WordPress-basierte E-Commerce-Erweiterung mit breiter Hosting-Kompatibilität.',
        components: ['compute', 'database_sql', 'storage_object', 'storage_block', 'loadbalancer', 'cdn', 'dns', 'cache', 'monitoring', 'logging', 'secrets'],
        systemRequirements: {
            small: { products: 'bis 500', compute: { cpu: 1, ram: 2 }, database: { type: 'MySQL 8.0+ / MariaDB 10.6+', size: '5GB' }, storage: { type: 'SSD', size: '20GB' }, php: '8.1+' },
            medium: { products: '500-5.000', compute: { cpu: 2, ram: 4 }, database: { type: 'MySQL 8.0+ / MariaDB 10.6+', size: '20GB' }, storage: { type: 'SSD', size: '50GB' }, php: '8.1+', cache: 'Object Cache (Redis) empfohlen' },
            large: { products: '5.000+', compute: { cpu: 4, ram: 8 }, database: { type: 'MySQL 8.0+ (Replica)', size: '100GB+' }, storage: { type: 'SSD', size: '200GB+' }, php: '8.2+', cache: 'Redis + Varnish', cdn: 'erforderlich' }
        },
        sizing: { source: 'https://woocommerce.com/document/server-requirements/' }
    },
    'saleor': {
        name: 'Saleor',
        description: 'Modernes Headless E-Commerce mit GraphQL-API und MACH-Architektur.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_object', 'storage_block', 'loadbalancer', 'cdn', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Dev/Small Shop', compute: { cpu: 2, ram: 2 }, database: { type: 'PostgreSQL 12+', size: '10GB' }, storage: { type: 'SSD', size: '20GB' }, python: '3.9+', redis: '6+' },
            medium: { workload: 'Production', compute: { cpu: 4, ram: 4 }, database: { type: 'PostgreSQL 14+', size: '50GB' }, storage: { type: 'SSD / S3', size: '50GB' }, python: '3.10+', redis: '6+', celery: 'Workers für Background Tasks' },
            large: { workload: 'High-Traffic', compute: { cpu: 8, ram: 8 }, database: { type: 'PostgreSQL 15+ (HA)', size: '100GB+' }, storage: { type: 'S3 / Object Storage', size: '200GB+' }, redis: 'Cluster', celery: 'Multiple Workers', architecture: 'Kubernetes / Docker Swarm' }
        },
        sizing: { source: 'https://docs.saleor.io/docs/3.x/setup/docker-compose' }
    },
    'spree': {
        name: 'Spree Commerce',
        description: 'Modulare Ruby on Rails E-Commerce-Plattform mit REST/GraphQL APIs.',
        components: ['compute', 'database_sql', 'storage_object', 'storage_block', 'loadbalancer', 'cdn', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Dev/Small Shop', compute: { cpu: 2, ram: 2 }, database: { type: 'PostgreSQL 12+ / MySQL 5.7+', size: '10GB' }, storage: { type: 'SSD', size: '20GB' }, ruby: '3.0+', redis: '6+' },
            medium: { workload: 'Production', compute: { cpu: 4, ram: 4 }, database: { type: 'PostgreSQL 14+', size: '50GB' }, storage: { type: 'SSD / S3', size: '50GB' }, ruby: '3.1+', redis: '6+', sidekiq: 'für Background Jobs' },
            large: { workload: 'High-Traffic', compute: { cpu: 8, ram: 8 }, database: { type: 'PostgreSQL 15+ (HA)', size: '100GB+' }, storage: { type: 'S3 / Object Storage', size: '200GB+' }, ruby: '3.2+', redis: 'Cluster', sidekiq: 'Multiple Workers', architecture: 'Kubernetes / Load Balanced' }
        },
        sizing: { source: 'https://dev-docs.spreecommerce.org/' }
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // WEB FRAMEWORKS & APPLICATIONS
    // ═══════════════════════════════════════════════════════════════════════════════
    'nodejs-webapp': {
        name: 'Node.js Web App',
        description: 'Event-driven JavaScript-Runtime für skalierbare Web-Applikationen und Real-time Apps.',
        components: ['compute', 'kubernetes', 'serverless', 'database_sql', 'database_nosql', 'storage_object', 'loadbalancer', 'cdn', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Low Traffic', compute: { cpu: 1, ram: 0.5 }, storage: { type: 'SSD', size: '10GB' }, nodejs: '18/20/22 LTS' },
            medium: { workload: 'Production', compute: { cpu: 2, ram: 2 }, storage: { type: 'SSD', size: '20GB' }, nodejs: '20/22 LTS', pm2: 'Cluster Mode empfohlen' },
            large: { workload: 'High-Traffic', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '50GB' }, nodejs: '22 LTS', architecture: 'Kubernetes / PM2 Cluster + Load Balancer' }
        },
        sizing: { note: 'Skaliert horizontal sehr gut', source: 'https://nodejs.org/en/download/' }
    },
    'kubernetes-app': {
        name: 'Containerisierte Anwendung (Kubernetes)',
        description: 'Generische containerisierte Anwendung die auf einem Kubernetes-Cluster deployed wird. Inkl. Kubernetes-Cluster-Management (Managed K8s wie AKS/EKS/GKE) plus App-Ressourcen.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_object', 'storage_block', 'loadbalancer', 'dns', 'cache', 'monitoring', 'logging', 'secrets', 'identity', 'container_registry'],
        systemRequirements: {
            small: { workload: 'Dev/Test', nodes: 3, compute: { cpu: 2, ram: 4 }, storage: { type: 'SSD', size: '50GB' }, kubernetes: 'Managed K8s (3 Nodes)', note: 'Single App auf Cluster' },
            medium: { workload: 'Production', nodes: 5, compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '100GB' }, kubernetes: 'Managed K8s (5 Nodes)', replicas: '2-3 Pods', note: 'Multi-Pod Deployment mit Auto-Scaling' },
            large: { workload: 'High-Availability', nodes: 7, compute: { cpu: 8, ram: 16 }, storage: { type: 'SSD', size: '200GB' }, kubernetes: 'Managed K8s (7+ Nodes, Multi-AZ)', replicas: '5+ Pods', note: 'HA-Setup mit HPA, Multi-AZ, Monitoring-Stack' }
        },
        sizing: { note: 'Kosten umfassen Managed Kubernetes + App-Workload. Managed K8s kostet ~70-150€/Monat zusätzlich zu Worker Nodes.' }
    },
    'kubernetes-cluster': {
        name: 'Kubernetes Cluster',
        description: 'Managed Kubernetes Cluster (AKS/EKS/GKE) als Plattform für Container-Workloads. Ohne spezifische Anwendung - nur der Cluster selbst.',
        components: ['compute', 'kubernetes', 'container_registry', 'loadbalancer', 'dns', 'storage_block', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Dev/Test', nodes: 3, compute: { cpu: 2, ram: 4 }, storage: { type: 'SSD', size: '100GB' }, note: 'Managed K8s Control Plane + 3x Worker Nodes (2 vCPU / 4 GB)' },
            medium: { workload: 'Production', nodes: 5, compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '250GB' }, note: 'Multi-AZ Setup, 5x Worker Nodes (4 vCPU / 8 GB), Auto-Scaling aktiviert' },
            large: { workload: 'Enterprise', nodes: 10, compute: { cpu: 4, ram: 16 }, storage: { type: 'SSD', size: '500GB' }, note: 'Multi-AZ HA-Setup, 10x Worker Nodes (4 vCPU / 16 GB), Cluster Autoscaler' }
        },
        sizing: { note: 'Control Plane ist managed (kostenlos oder ~70-150€/Monat). Worker Nodes werden als Compute-VMs abgerechnet.' }
    },
    'spring-boot': {
        name: 'Spring Boot Application',
        description: 'Java-Framework für Enterprise-Applikationen mit eingebettetem Server.',
        components: ['compute', 'kubernetes', 'database_sql', 'database_nosql', 'storage_object', 'storage_block', 'loadbalancer', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Low Traffic', compute: { cpu: 1, ram: 1 }, storage: { type: 'SSD', size: '10GB' }, java: 'JDK 17/21', jvmHeap: '512MB' },
            medium: { workload: 'Production', compute: { cpu: 2, ram: 4 }, storage: { type: 'SSD', size: '20GB' }, java: 'JDK 17/21', jvmHeap: '2GB' },
            large: { workload: 'High-Traffic/Microservices', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '50GB' }, java: 'JDK 21', jvmHeap: '4-6GB', architecture: 'Kubernetes / Container Orchestration' }
        },
        sizing: { source: 'https://spring.io/projects/spring-boot' }
    },
    'django': {
        name: 'Django Application',
        description: 'Python Web-Framework mit Gunicorn/uWSGI, Nginx und Celery für Background-Tasks.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_object', 'storage_block', 'loadbalancer', 'cdn', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Low Traffic', compute: { cpu: 1, ram: 1 }, storage: { type: 'SSD', size: '10GB' }, python: '3.10+', gunicorn: '2-4 Workers' },
            medium: { workload: 'Production', compute: { cpu: 2, ram: 4 }, storage: { type: 'SSD', size: '20GB' }, python: '3.11+', gunicorn: '4-8 Workers', redis: 'für Caching/Celery' },
            large: { workload: 'High-Traffic', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '50GB' }, python: '3.12+', gunicorn: '8-16 Workers', redis: 'Cluster', celery: 'Multiple Workers', architecture: 'Kubernetes / Load Balanced' }
        },
        sizing: { note: 'Workers = (2 * CPU Cores) + 1', source: 'https://docs.djangoproject.com/en/stable/' }
    },
    'laravel': {
        name: 'Laravel Application',
        description: 'PHP-Framework mit Queue-Worker, Redis und optionalem Serverless via Laravel Vapor.',
        components: ['compute', 'kubernetes', 'serverless', 'database_sql', 'storage_object', 'storage_block', 'loadbalancer', 'cdn', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Low Traffic', compute: { cpu: 1, ram: 1 }, storage: { type: 'SSD', size: '10GB' }, php: '8.2+', phpMemory: '256MB' },
            medium: { workload: 'Production', compute: { cpu: 2, ram: 4 }, storage: { type: 'SSD', size: '20GB' }, php: '8.2+', phpMemory: '512MB', redis: 'für Cache/Queue', queue: 'Horizon für Job Management' },
            large: { workload: 'High-Traffic', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '50GB' }, php: '8.3+', phpMemory: '1GB', redis: 'Cluster', queue: 'Horizon + Multiple Workers', architecture: 'Kubernetes / Load Balanced + Vapor (Serverless)' }
        },
        sizing: { source: 'https://laravel.com/docs/deployment' }
    },
    'kubernetes-microservices': {
        name: 'Kubernetes Microservices',
        description: 'Container-orchestrierte Microservices-Architektur mit Service Mesh und Distributed Tracing.',
        components: ['kubernetes', 'database_sql', 'database_nosql', 'storage_object', 'storage_block', 'loadbalancer', 'cdn', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity', 'ai_ml'],
        systemRequirements: {
            small: { workload: 'Dev/Test', compute: { controlPlane: { cpu: 2, ram: 4 }, workers: { cpu: 2, ram: 4, count: 2 } }, storage: { type: 'SSD', size: '100GB' }, kubernetesVersion: '1.28+' },
            medium: { workload: 'Production', compute: { controlPlane: { cpu: 4, ram: 8, nodes: 3 }, workers: { cpu: 4, ram: 16, count: 3 } }, storage: { type: 'SSD', size: '500GB' }, kubernetesVersion: '1.29+', ingress: 'Nginx/Traefik', serviceMesh: 'Istio/Linkerd empfohlen' },
            large: { workload: 'Enterprise', compute: { controlPlane: { cpu: 8, ram: 16, nodes: 3 }, workers: { cpu: 8, ram: 32, count: '5+' } }, storage: { type: 'NVMe', size: '2TB+' }, kubernetesVersion: '1.30+', serviceMesh: 'Istio', observability: 'Prometheus + Grafana + Jaeger' }
        },
        sizing: { source: 'https://kubernetes.io/docs/setup/production-environment/' }
    },
    'kong-gateway': {
        name: 'API Gateway (Kong)',
        description: 'Open-Source API Gateway für Microservices mit PostgreSQL oder Cassandra Backend.',
        components: ['compute', 'kubernetes', 'database_sql', 'database_nosql', 'loadbalancer', 'dns', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { requests: 'bis 1.000/s', compute: { cpu: 1, ram: 1 }, database: { type: 'PostgreSQL 12+ / Cassandra 3.x', size: '10GB' }, storage: { type: 'SSD', size: '10GB' } },
            medium: { requests: '1.000-10.000/s', compute: { cpu: 2, ram: 4 }, database: { type: 'PostgreSQL 14+', size: '50GB' }, storage: { type: 'SSD', size: '20GB' } },
            large: { requests: '10.000+/s', compute: { cpu: 4, ram: 8, nodes: 'Multiple' }, database: { type: 'PostgreSQL 15+ (HA) / Cassandra Cluster', size: '100GB+' }, storage: { type: 'SSD', size: '50GB' }, architecture: 'Kong Cluster + DB-less oder Hybrid Mode' }
        },
        sizing: { source: 'https://docs.konghq.com/gateway/latest/production/sizing-guidelines/' }
    },
    'nginx-proxy': {
        name: 'Nginx Reverse Proxy',
        description: 'High-Performance HTTP-Server und Reverse Proxy mit Load Balancing und Caching.',
        components: ['compute', 'kubernetes', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets'],
        systemRequirements: {
            small: { connections: 'bis 10.000', compute: { cpu: 1, ram: 0.5 }, storage: { type: 'SSD', size: '5GB' } },
            medium: { connections: '10.000-100.000', compute: { cpu: 2, ram: 2 }, storage: { type: 'SSD', size: '10GB' }, workerProcesses: 'auto (= CPU Cores)' },
            large: { connections: '100.000+', compute: { cpu: 4, ram: 4 }, storage: { type: 'SSD', size: '20GB' }, workerProcesses: 'auto', workerConnections: 4096, note: 'Extrem skalierbar, gering RAM-verbrauchend' }
        },
        sizing: { source: 'https://nginx.org/en/docs/ngx_core_module.html' }
    },
    'tomcat': {
        name: 'Apache Tomcat',
        description: 'Java Servlet Container für Java Web-Applikationen (WAR-Dateien).',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_block', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Low Traffic', compute: { cpu: 1, ram: 1 }, storage: { type: 'SSD', size: '10GB' }, java: 'JDK 11/17/21', jvmHeap: '512MB', maxThreads: 200 },
            medium: { workload: 'Production', compute: { cpu: 2, ram: 4 }, storage: { type: 'SSD', size: '20GB' }, java: 'JDK 17/21', jvmHeap: '2GB', maxThreads: 400 },
            large: { workload: 'High-Traffic', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '50GB' }, java: 'JDK 21', jvmHeap: '4-6GB', maxThreads: 800, architecture: 'Cluster mit Apache/Nginx Load Balancer' }
        },
        sizing: { source: 'https://tomcat.apache.org/tomcat-10.1-doc/config/' }
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // AI & MACHINE LEARNING
    // ═══════════════════════════════════════════════════════════════════════════════
    'kubeflow': {
        name: 'Kubeflow',
        description: 'ML-Toolkit für Kubernetes mit Pipelines, Training und Model Serving.',
        components: ['kubernetes', 'database_sql', 'storage_object', 'storage_block', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets', 'identity', 'ai_ml'],
        systemRequirements: {
            small: { workload: 'Dev/Test', compute: { cpu: 4, ram: 12 }, storage: { type: 'SSD', size: '100GB' }, kubernetesVersion: '1.25+', minNodes: 1 },
            medium: { workload: 'Production', compute: { cpu: 8, ram: 32 }, storage: { type: 'SSD', size: '500GB' }, kubernetesVersion: '1.27+', minNodes: 3, gpu: 'empfohlen für Training' },
            large: { workload: 'Enterprise ML Platform', compute: { cpu: 16, ram: 64 }, storage: { type: 'NVMe + Object Storage', size: '2TB+' }, kubernetesVersion: '1.28+', minNodes: 5, gpu: 'erforderlich', architecture: 'Multi-Node Cluster mit GPU Scheduling' }
        },
        sizing: { source: 'https://www.kubeflow.org/docs/started/installing-kubeflow/' }
    },
    'mlflow': {
        name: 'MLflow',
        description: 'Open-Source-Plattform für ML-Lifecycle-Management mit Experiment Tracking.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_object', 'storage_block', 'loadbalancer', 'monitoring', 'logging', 'secrets', 'identity', 'ai_ml'],
        systemRequirements: {
            small: { workload: 'Dev/Small Team', compute: { cpu: 2, ram: 4 }, database: { type: 'SQLite / PostgreSQL 12+', size: '10GB' }, storage: { type: 'SSD / S3', size: '50GB' }, python: '3.8+' },
            medium: { workload: 'Production', compute: { cpu: 4, ram: 8 }, database: { type: 'PostgreSQL 14+ / MySQL 8+', size: '50GB' }, storage: { type: 'S3 / GCS / Azure Blob', size: '500GB' }, python: '3.10+' },
            large: { workload: 'Enterprise', compute: { cpu: 8, ram: 16 }, database: { type: 'PostgreSQL 15+ (HA)', size: '200GB+' }, storage: { type: 'Object Storage', size: '5TB+' }, python: '3.11+', architecture: 'MLflow Server + Multiple Workers + Model Registry' }
        },
        sizing: { source: 'https://mlflow.org/docs/latest/index.html' }
    },
    'jupyterhub': {
        name: 'JupyterHub',
        description: 'Multi-User Jupyter Notebook Server für Data Science Teams.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_object', 'storage_block', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: 'bis 10', compute: { hub: { cpu: 1, ram: 2 }, userPod: { cpu: 1, ram: 2 } }, storage: { type: 'SSD', size: '50GB' }, python: '3.8+' },
            medium: { users: '10-100', compute: { hub: { cpu: 2, ram: 4 }, userPod: { cpu: 2, ram: 4 } }, storage: { type: 'SSD / NFS', size: '500GB' }, python: '3.10+', database: { type: 'PostgreSQL 13+', size: '10GB' } },
            large: { users: '100+', compute: { hub: { cpu: 4, ram: 8 }, userPod: { cpu: 4, ram: 8 } }, storage: { type: 'NFS / Object Storage', size: '2TB+' }, python: '3.11+', database: { type: 'PostgreSQL 15+', size: '50GB' }, architecture: 'Kubernetes (Zero to JupyterHub) mit GPU Support' }
        },
        sizing: { source: 'https://z2jh.jupyter.org/en/stable/' }
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // ADDITIONAL ENTERPRISE APPS
    // ═══════════════════════════════════════════════════════════════════════════════
    'jira': {
        name: 'Jira',
        description: 'Atlassian Projektmanagement und Issue-Tracking für agile Teams.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_block', 'storage_file', 'loadbalancer', 'dns', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: 'bis 25', compute: { cpu: 2, ram: 4 }, database: { type: 'PostgreSQL 13+ / MySQL 8+', size: '20GB' }, storage: { type: 'SSD', size: '50GB' }, java: 'JRE 11' },
            medium: { users: '25-500', compute: { cpu: 4, ram: 8 }, database: { type: 'PostgreSQL 14+', size: '100GB' }, storage: { type: 'SSD', size: '200GB' }, java: 'JRE 11' },
            large: { users: '500+', compute: { cpu: 8, ram: 16 }, database: { type: 'PostgreSQL 15+ (Tuned)', size: '500GB+' }, storage: { type: 'NVMe + NFS', size: '1TB+' }, java: 'JRE 11', architecture: 'Data Center (clustered)', ha: { nodes: 2, type: 'Data Center Cluster' } }
        },
        sizing: { source: 'https://confluence.atlassian.com/jirasoftware/jira-software-server-requirements-702003093.html' }
    },
    'bitbucket': {
        name: 'Bitbucket',
        description: 'Atlassian Git-Repository-Management mit CI/CD-Pipelines.',
        components: ['compute', 'database_sql', 'storage_block', 'storage_file', 'loadbalancer', 'dns', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: 'bis 25', compute: { cpu: 2, ram: 3 }, database: { type: 'PostgreSQL 13+ / MySQL 8+', size: '20GB' }, storage: { type: 'SSD', size: '100GB' }, java: 'JRE 11' },
            medium: { users: '25-250', compute: { cpu: 4, ram: 8 }, database: { type: 'PostgreSQL 14+', size: '50GB' }, storage: { type: 'SSD + NFS', size: '500GB' }, java: 'JRE 11' },
            large: { users: '250+', compute: { cpu: 8, ram: 16 }, database: { type: 'PostgreSQL 15+ (Tuned)', size: '200GB+' }, storage: { type: 'NVMe + NFS', size: '2TB+' }, java: 'JRE 11', architecture: 'Data Center (clustered) + Mesh' }
        },
        sizing: { source: 'https://confluence.atlassian.com/bitbucketserver/bitbucket-server-requirements-776635975.html' }
    },
    'redmine': {
        name: 'Redmine',
        description: 'Open-Source Projektmanagement und Issue-Tracking-System auf Ruby on Rails.',
        components: ['compute', 'database_sql', 'storage_block', 'storage_file', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: 'bis 50', compute: { cpu: 1, ram: 1 }, database: { type: 'MySQL 5.7+ / PostgreSQL 10+ / SQLite', size: '5GB' }, storage: { type: 'SSD', size: '20GB' }, ruby: '3.0+' },
            medium: { users: '50-500', compute: { cpu: 2, ram: 4 }, database: { type: 'MySQL 8.0+ / PostgreSQL 13+', size: '20GB' }, storage: { type: 'SSD', size: '50GB' }, ruby: '3.1+' },
            large: { users: '500+', compute: { cpu: 4, ram: 8 }, database: { type: 'PostgreSQL 14+ / MySQL 8.0+', size: '100GB+' }, storage: { type: 'SSD', size: '200GB+' }, ruby: '3.2+', architecture: 'Passenger/Puma mit Load Balancing' }
        },
        sizing: { source: 'https://www.redmine.org/projects/redmine/wiki/RedmineInstall' }
    },
    'zabbix': {
        name: 'Zabbix',
        description: 'Enterprise-class Open-Source Monitoring für Netzwerke und Applikationen.',
        components: ['compute', 'database_sql', 'storage_block', 'loadbalancer', 'dns', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { hosts: 'bis 100', compute: { cpu: 2, ram: 2 }, database: { type: 'MySQL 8.0+ / PostgreSQL 13+', size: '10GB' }, storage: { type: 'SSD', size: '50GB' } },
            medium: { hosts: '100-1.000', compute: { cpu: 4, ram: 8 }, database: { type: 'MySQL 8.0+ / PostgreSQL 14+ (Tuned)', size: '100GB' }, storage: { type: 'SSD', size: '200GB' } },
            large: { hosts: '1.000+', compute: { cpu: 8, ram: 16 }, database: { type: 'PostgreSQL 15+ / TimescaleDB', size: '500GB+' }, storage: { type: 'NVMe', size: '1TB+' }, architecture: 'Zabbix Server + Proxies für verteiltes Monitoring' }
        },
        sizing: { source: 'https://www.zabbix.com/documentation/current/en/manual/installation/requirements' }
    },
    'nagios': {
        name: 'Nagios',
        description: 'Open-Source IT-Infrastruktur-Monitoring mit Plugin-Architektur.',
        components: ['compute', 'database_sql', 'storage_block', 'dns', 'monitoring', 'logging', 'secrets'],
        systemRequirements: {
            small: { hosts: 'bis 50', compute: { cpu: 1, ram: 1 }, database: { type: 'MySQL 5.7+ (für NDOUtils)', size: '5GB' }, storage: { type: 'SSD', size: '20GB' } },
            medium: { hosts: '50-500', compute: { cpu: 2, ram: 4 }, database: { type: 'MySQL 8.0+ / MariaDB 10.4+', size: '20GB' }, storage: { type: 'SSD', size: '50GB' } },
            large: { hosts: '500+', compute: { cpu: 4, ram: 8 }, database: { type: 'MySQL 8.0+ / PostgreSQL 13+', size: '100GB+' }, storage: { type: 'SSD', size: '200GB+' }, architecture: 'Nagios XI Cluster mit Load Distribution' }
        },
        sizing: { source: 'https://assets.nagios.com/downloads/nagiosxi/docs/Installing-Nagios-XI.pdf' }
    },
    'plex': {
        name: 'Plex Media Server',
        description: 'Media-Server für Streaming von Videos, Musik und Fotos.',
        components: ['compute', 'database_sql', 'storage_object', 'storage_block', 'cdn', 'dns', 'monitoring', 'logging'],
        systemRequirements: {
            small: { streams: '1-2', compute: { cpu: 2, ram: 2 }, storage: { type: 'SSD für Metadata', size: '20GB', mediaStorage: '1TB+ HDD' }, transcoding: 'Software (langsamer)' },
            medium: { streams: '2-5', compute: { cpu: 4, ram: 4 }, storage: { type: 'SSD für Metadata', size: '50GB', mediaStorage: '10TB+ HDD' }, transcoding: 'Intel QuickSync / NVIDIA NVENC empfohlen' },
            large: { streams: '5+', compute: { cpu: 8, ram: 8 }, storage: { type: 'SSD für Metadata', size: '100GB', mediaStorage: '50TB+ HDD/NAS' }, transcoding: 'Hardware Transcoding (GPU) erforderlich', gpu: 'Intel QuickSync / NVIDIA NVENC' }
        },
        sizing: { note: 'Hardware-Transcoding reduziert CPU-Last erheblich', source: 'https://support.plex.tv/articles/200375666-plex-media-server-requirements/' }
    },
    'vaultwarden': {
        name: 'Vaultwarden',
        description: 'Leichtgewichtige Bitwarden-kompatible Password-Manager-Server-Implementierung.',
        components: ['compute', 'database_sql', 'storage_block', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets'],
        systemRequirements: {
            small: { users: 'bis 100', compute: { cpu: 0.5, ram: 0.256 }, database: { type: 'SQLite (eingebettet)', size: '500MB' }, storage: { type: 'SSD', size: '1GB' } },
            medium: { users: '100-500', compute: { cpu: 1, ram: 0.5 }, database: { type: 'SQLite / PostgreSQL 12+', size: '5GB' }, storage: { type: 'SSD', size: '5GB' } },
            large: { users: '500+', compute: { cpu: 2, ram: 1 }, database: { type: 'PostgreSQL 14+ / MySQL 8+', size: '10GB' }, storage: { type: 'SSD', size: '10GB' }, note: 'Extrem ressourcenschonend im Vergleich zu offiziellem Bitwarden' }
        },
        sizing: { source: 'https://github.com/dani-garcia/vaultwarden/wiki' }
    },
    'gitea': {
        name: 'Gitea',
        description: 'Leichtgewichtiger, selbstgehosteter Git-Service als GitHub/GitLab Alternative.',
        components: ['compute', 'database_sql', 'storage_block', 'storage_object', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: 'bis 50', repos: 'bis 100', compute: { cpu: 1, ram: 0.5 }, database: { type: 'SQLite / PostgreSQL 12+ / MySQL 8+', size: '5GB' }, storage: { type: 'SSD', size: '20GB' } },
            medium: { users: '50-500', repos: 'bis 1.000', compute: { cpu: 2, ram: 2 }, database: { type: 'PostgreSQL 14+ / MySQL 8+', size: '20GB' }, storage: { type: 'SSD', size: '100GB' } },
            large: { users: '500+', repos: '1.000+', compute: { cpu: 4, ram: 4 }, database: { type: 'PostgreSQL 15+ / MySQL 8+', size: '100GB+' }, storage: { type: 'SSD', size: '500GB+' }, architecture: 'Load Balanced mit externem Git-LFS Storage' }
        },
        sizing: { source: 'https://docs.gitea.io/en-us/install-from-binary/' }
    },
    'openproject': {
        name: 'OpenProject',
        description: 'Open-Source Projektmanagement-Software für klassisches und agiles PM.',
        components: ['compute', 'kubernetes', 'database_sql', 'storage_block', 'storage_object', 'loadbalancer', 'dns', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: 'bis 20', compute: { cpu: 1, ram: 4 }, database: { type: 'PostgreSQL 13+', size: '10GB' }, storage: { type: 'SSD', size: '20GB' } },
            medium: { users: '20-200', compute: { cpu: 4, ram: 8 }, database: { type: 'PostgreSQL 14+', size: '50GB' }, storage: { type: 'SSD', size: '100GB' }, memcached: 'empfohlen' },
            large: { users: '200+', compute: { cpu: 8, ram: 16 }, database: { type: 'PostgreSQL 15+ (HA)', size: '200GB+' }, storage: { type: 'SSD', size: '500GB+' }, memcached: 'erforderlich', architecture: 'Load Balanced mit Shared Storage' }
        },
        sizing: { source: 'https://www.openproject.org/docs/installation-and-operations/installation/system-requirements/' }
    },
    'minio': {
        name: 'MinIO',
        description: 'High-Performance Object Storage kompatibel mit Amazon S3 API.',
        components: ['compute', 'kubernetes', 'storage_block', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { workload: 'Dev/Test', compute: { cpu: 2, ram: 8 }, storage: { type: 'SSD/NVMe', size: '1TB', drives: 4 }, network: '10 Gbit/s' },
            medium: { workload: 'Production', compute: { cpu: 8, ram: 32 }, storage: { type: 'NVMe', size: '10TB', drives: 4 }, network: '25 Gbit/s', erasureCoding: 'EC:4 empfohlen' },
            large: { workload: 'Enterprise', compute: { cpu: 16, ram: 64 }, storage: { type: 'NVMe', size: '100TB+', drives: '8+' }, network: '100 Gbit/s', erasureCoding: 'EC:8', architecture: 'Multi-Node Cluster (Distributed Mode)' }
        },
        sizing: { note: 'RAM: 1GB pro 1TB Storage empfohlen; NVMe für maximale Performance', source: 'https://min.io/docs/minio/linux/operations/install-deploy-manage/deploy-minio-multi-node-multi-drive.html' }
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // UTILITY & ENERGY MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════════
    'sap-isu': {
        name: 'SAP IS-U (Industry Solution Utilities)',
        description: 'SAP Branchenlösung für Energieversorger mit Zählerdatenverwaltung und Abrechnungsfunktionen.',
        components: ['compute', 'database_sql', 'storage_block', 'storage_file', 'loadbalancer', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: '1-50 (Test/Dev)', compute: { cpu: 8, ram: 32 }, database: { type: 'SAP HANA oder Oracle', size: '200GB' }, storage: { type: 'SSD', size: '500GB' }, os: ['SUSE Linux Enterprise Server', 'RHEL', 'Windows Server'] },
            medium: { users: '50-200', compute: { cpu: 16, ram: 64 }, database: { type: 'SAP HANA', size: '1TB' }, storage: { type: 'NVMe SSD', size: '2TB' }, os: ['SUSE Linux Enterprise Server', 'RHEL'] },
            large: { users: '200+', compute: { cpu: 32, ram: 128 }, database: { type: 'SAP HANA Scale-out', size: '2TB+' }, storage: { type: 'Enterprise NVMe', size: '4TB+' }, os: ['SUSE Linux Enterprise Server 15', 'RHEL 8.x'] }
        },
        sizing: { note: 'Sizing hängt stark von Kundenzahl, Zählerdatenvolumen und Abrechnungszyklen ab. SAP Quick Sizer empfohlen.', source: 'https://www.sap.com/about/benchmark/sizing.html' }
    },
    'lovion-nis': {
        name: 'Lovion Network Information System',
        description: 'Netzinformationssystem für Versorgungsunternehmen mit GIS-Integration für Gas, Wasser, Strom und Fernwärme.',
        components: ['compute', 'database_sql', 'storage_block', 'storage_file', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: '1-20', compute: { cpu: 4, ram: 16 }, database: { type: 'SQL Server oder PostgreSQL', size: '100GB' }, storage: { type: 'SSD', size: '200GB' }, os: ['Windows Server 2019+', 'Windows 10/11 für Clients'] },
            medium: { users: '20-100', compute: { cpu: 8, ram: 32 }, database: { type: 'SQL Server', size: '500GB' }, storage: { type: 'SSD', size: '1TB' }, os: ['Windows Server 2022', 'Azure Cloud möglich'] },
            large: { users: '100+', compute: { cpu: 16, ram: 64 }, database: { type: 'SQL Server Enterprise', size: '1TB+' }, storage: { type: 'Enterprise SSD', size: '2TB+' }, os: ['Windows Server 2022', 'Azure Cloud'], mobile: 'iOS/Android Apps', ha: { nodes: 2, type: 'Active-Active Load Balanced' } }
        },
        sizing: { note: 'Cloud-Deployment auf Microsoft Azure als Standard ab Version 7. Mobile und Web-Clients verfügbar.', source: 'https://lovion.de/en/produkte/system-architecture/' }
    },
    'soptim-itrade': {
        name: 'SOPTIM iTrade',
        description: 'Energiehandelsplattform für Strom- und Gashandel mit Börsenkonnektivität und automatisiertem Intraday-Handel.',
        components: ['compute', 'database_sql', 'storage_block', 'loadbalancer', 'dns', 'messaging', 'cache', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: '1-10', compute: { cpu: 4, ram: 16 }, database: { type: 'SQL Server oder PostgreSQL', size: '100GB' }, storage: { type: 'SSD', size: '200GB' }, os: ['Windows Server', 'Linux'] },
            medium: { users: '10-50', compute: { cpu: 8, ram: 32 }, database: { type: 'SQL Server', size: '500GB' }, storage: { type: 'SSD', size: '1TB' }, os: ['Windows Server', 'Cloud SaaS'] },
            large: { users: '50+', compute: { cpu: 16, ram: 64 }, database: { type: 'SQL Server Enterprise', size: '1TB+' }, storage: { type: 'SSD', size: '2TB+' }, os: ['Cloud SaaS primär'], availability: '24/7 für automatisierten Handel', ha: { nodes: 2, type: 'Active-Active Load Balanced' } }
        },
        sizing: { note: 'Primär als Cloud-SaaS verfügbar. Börsenkonnektivität und 24/7 Betrieb erforderlich.', source: 'https://www.soptim.de/en/services/itrade/' }
    },
    'smallworld-gis': {
        name: 'Smallworld GIS',
        description: 'GE Vernova GIS-Plattform für Versorgungsnetze (Strom, Gas, Wasser, Telekom) mit spezialisierter Netzwerkverwaltung.',
        components: ['compute', 'database_sql', 'storage_block', 'storage_file', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets'],
        systemRequirements: {
            small: { users: '1-10', compute: { cpu: 4, ram: 16 }, database: { type: 'Oracle oder PostgreSQL', size: '100GB' }, storage: { type: 'SSD', size: '200GB' }, os: ['Windows Server', 'RHEL'] },
            medium: { users: '10-50', compute: { cpu: 8, ram: 32 }, database: { type: 'Oracle', size: '500GB' }, storage: { type: 'SSD', size: '1TB' }, os: ['Windows Server', 'RHEL'], jvm: '64-bit JVM erforderlich' },
            large: { users: '50+', compute: { cpu: 16, ram: 64 }, database: { type: 'Oracle Enterprise', size: '1TB+' }, storage: { type: 'Enterprise SSD', size: '2TB+' }, os: ['RHEL', 'Windows Server'], jvm: '64-bit JVM', architecture: 'Multi-tier mit verteilten Datenbanken', ha: { nodes: 2, type: 'Active-Active Load Balanced' } }
        },
        sizing: { note: 'Version 5+ benötigt ca. 1GB RAM (vs. 200MB bei V4). Erheblicher Ressourcenanstieg durch Java-Migration. Performance-Tuning kritisch.', source: 'https://www.ge.com/digital/applications/smallworld-gis-geospatial-asset-management' }
    },
    'arcgis-enterprise': {
        name: 'ArcGIS Enterprise',
        description: 'Esri Enterprise GIS-Plattform für Geoinformationssysteme mit GIS Server, Portal und Image Server.',
        components: ['compute', 'database_sql', 'storage_block', 'storage_file', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: '1-10', compute: { cpu: 4, ram: 8 }, database: { type: 'PostgreSQL/PostGIS oder SQL Server', size: '100GB' }, storage: { type: 'SSD', size: '200GB' }, os: ['Windows Server 2019+', 'RHEL 8+'] },
            medium: { users: '10-50', compute: { cpu: 8, ram: 16 }, database: { type: 'PostgreSQL/PostGIS', size: '500GB' }, storage: { type: 'SSD', size: '1TB' }, os: ['Windows Server 2022', 'RHEL 9'] },
            large: { users: '50+', compute: { cpu: 16, ram: 32 }, database: { type: 'PostgreSQL Enterprise oder SQL Server', size: '1TB+' }, storage: { type: 'Enterprise SSD', size: '2TB+' }, os: ['Windows Server 2022', 'RHEL 9'], geoanalytics: '16GB RAM minimum für GeoAnalytics', ha: { nodes: 2, type: 'Active-Active Load Balanced' } }
        },
        sizing: { note: 'GeoAnalytics Server benötigt mindestens 16GB RAM. 90GB+ freier Speicher für Production empfohlen.', source: 'https://enterprise.arcgis.com/en/system-requirements/latest/windows/arcgis-server-system-requirements.htm' }
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // FILE SERVERS & COLLABORATION
    // ═══════════════════════════════════════════════════════════════════════════════
    'windows-file-server': {
        name: 'Windows File Server',
        description: 'Enterprise-Dateiserver mit SMB 3.1.1 Protokoll für zentrale Dateispeicherung und Freigaben.',
        components: ['storage_file', 'compute', 'storage_block', 'dns', 'monitoring', 'logging', 'identity'],
        systemRequirements: {
            small: { users: '1-50', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '1TB' }, network: '1 Gbps', os: ['Windows Server 2022', 'Windows Server 2025'] },
            medium: { users: '50-200', compute: { cpu: 8, ram: 16 }, storage: { type: 'SSD', size: '5TB' }, network: '10 Gbps', os: ['Windows Server 2022', 'Windows Server 2025'], deduplication: 'empfohlen' },
            large: { users: '200+', compute: { cpu: 16, ram: 32 }, storage: { type: 'Enterprise SSD/NVMe', size: '10TB+' }, network: '10+ Gbps', os: ['Windows Server 2025'], deduplication: 'erforderlich', dfs: 'DFS Replication für HA', ha: { nodes: 2, type: 'DFS Replication' } }
        },
        sizing: { note: 'Höhere CPU-Frequenz bevorzugt. PCIe x8+ für 10GB Ethernet. SMB 3.1.1 in Windows Server 2022+.', source: 'https://learn.microsoft.com/en-us/windows-server/administration/performance-tuning/role/file-server/' }
    },
    'hcl-domino': {
        name: 'HCL Domino Server (ehem. Lotus Notes)',
        description: 'Collaboration-Plattform für E-Mail, Kalender, Dokumente und Workflow-Anwendungen.',
        components: ['compute', 'storage_block', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: '1-100', compute: { cpu: 4, ram: 16 }, storage: { type: 'SSD', size: '200GB' }, os: ['Windows Server 2022', 'RHEL 10'], java: 'OpenJDK 21 erforderlich' },
            medium: { users: '100-500', compute: { cpu: 8, ram: 32 }, storage: { type: 'SSD', size: '1TB' }, os: ['Windows Server 2025', 'RHEL 10'], java: 'OpenJDK 21', clustering: 'empfohlen', ha: { nodes: 2, type: 'Active-Active Cluster' } },
            large: { users: '500+', compute: { cpu: 16, ram: 64 }, storage: { type: 'Enterprise SSD', size: '2TB+' }, os: ['Windows Server 2025', 'RHEL 10'], java: 'OpenJDK 21', clustering: 'erforderlich', architecture: 'Multi-Server Cluster', ha: { nodes: 2, type: 'Active-Active Load Balanced' } }
        },
        sizing: { note: 'Version 14.5+ erfordert zwingend Java 21 und 64-bit OS. Windows Server 2016 nicht mehr unterstützt.', source: 'https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0121296' }
    },
    'lotus-notes-server': {
        name: 'Lotus Notes Server (Legacy)',
        description: 'Legacy-Bezeichnung für HCL Domino Server. Siehe hcl-domino für aktuelle Version.',
        components: ['compute', 'storage_block', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: '1-100', compute: { cpu: 4, ram: 16 }, storage: { type: 'SSD', size: '200GB' }, os: ['Windows Server 2022', 'RHEL 10'], note: 'Siehe HCL Domino für aktuelle Anforderungen' },
            medium: { users: '100-500', compute: { cpu: 8, ram: 32 }, storage: { type: 'SSD', size: '1TB' }, os: ['Windows Server 2025', 'RHEL 10'], note: 'Migration zu HCL Domino 14.5+ empfohlen' },
            large: { users: '500+', compute: { cpu: 16, ram: 64 }, storage: { type: 'Enterprise SSD', size: '2TB+' }, os: ['Windows Server 2025', 'RHEL 10'], note: 'Aktuelle Version ist HCL Domino 14.5+' }
        },
        sizing: { note: 'Legacy-Name. Produkt heißt seit 2019 HCL Domino. Aktuelle Version: 14.5 mit Java 21.', source: 'https://support.hcl-software.com/csm?id=kb_article&sysparm_article=KB0121296' }
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // PRINT & DOCUMENT MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════════
    'printserver-sap': {
        name: 'SAP Printerspooler / Print Server',
        description: 'Print-Spooling-System für SAP-Umgebungen mit TemSe-Verwaltung und Druckerwarteschlangen.',
        components: ['compute', 'storage_block', 'dns', 'monitoring', 'logging'],
        systemRequirements: {
            small: { printers: '1-10', compute: { cpu: 2, ram: 8 }, storage: { type: 'SSD', size: '100GB' }, os: ['Windows Server', 'UNIX/Linux'], printType: 'Local Printing' },
            medium: { printers: '10-50', compute: { cpu: 4, ram: 16 }, storage: { type: 'SSD', size: '500GB' }, os: ['Windows Server', 'UNIX/Linux'], printType: 'Local + Remote Printing', network: 'Stabile IP-Adressen erforderlich' },
            large: { printers: '50+', compute: { cpu: 8, ram: 32 }, storage: { type: 'SSD', size: '1TB+' }, os: ['Windows Server', 'UNIX/Linux'], printType: 'Remote Printing', architecture: 'Dedizierte Print Server', temse: 'Dateisystem statt DB empfohlen' }
        },
        sizing: { note: 'TemSe kann in Datenbank oder Dateisystem gespeichert werden (Parameter rspo/store_location). Local Printing schneller als Remote.', source: 'https://learning.sap.com/courses/technical-implementation-and-operation-ii-of-sap-s-4hana-and-sap-business-suite/planning-the-sap-print-architecture' }
    },
    'kofax-fax-gateway': {
        name: 'Kofax Communication Server',
        description: 'Fax-Gateway und Communication Server für Fax-Versand und -Empfang mit G.711 Pass-Through.',
        components: ['compute', 'storage_block', 'dns', 'monitoring', 'logging'],
        systemRequirements: {
            small: { faxLines: '1-5', compute: { cpu: 2, ram: 8 }, storage: { type: 'SSD', size: '50GB' }, os: ['Windows Server 2019+'] },
            medium: { faxLines: '5-20', compute: { cpu: 4, ram: 16 }, storage: { type: 'SSD', size: '100GB' }, os: ['Windows Server 2022'], note: 'G.711 Pass-Through ist CPU-intensiv' },
            large: { faxLines: '20+', compute: { cpu: 8, ram: 32 }, storage: { type: 'SSD', size: '200GB+' }, os: ['Windows Server 2022'], cpuNote: 'Mindestens 2 Cores für G.711 empfohlen, sonst Fehler möglich' }
        },
        sizing: { note: 'Bei unzureichender CPU-Leistung können Sende-/Empfangsfehler bei G.711 Pass-Through auftreten.', source: 'https://docshield.tungstenautomation.com/KCS/en_US/10.3.0-SihMvq5oti/print/KofaxCommunicationServerTechnicalSpecifications_10.3.0_EN.pdf' }
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // DATABASE SERVERS
    // ═══════════════════════════════════════════════════════════════════════════════
    'oracle-database-enterprise': {
        name: 'Oracle Database Enterprise Edition',
        description: 'Enterprise-Datenbanksystem von Oracle mit RAC, Partitionierung und Advanced Security.',
        components: ['database_sql', 'compute', 'storage_block', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets'],
        systemRequirements: {
            small: { workload: 'Dev/Test', compute: { cpu: 4, ram: 16 }, storage: { type: 'SSD', size: '100GB' }, os: ['Oracle Linux', 'RHEL 8+', 'Windows Server 2022'] },
            medium: { workload: 'Production', compute: { cpu: 8, ram: 32 }, storage: { type: 'SSD', size: '500GB' }, os: ['Oracle Linux', 'RHEL 9', 'Windows Server 2022'], rac: 'empfohlen' },
            large: { workload: 'Enterprise', compute: { cpu: 16, ram: 64 }, storage: { type: 'Enterprise SSD/NVMe', size: '2TB+' }, os: ['Oracle Linux', 'RHEL 9'], rac: 'Oracle RAC für HA', exadata: 'Exadata für Maximum Performance' }
        },
        sizing: { note: 'Minimum 8GB RAM, empfohlen 32GB+ für Enterprise. CPU mindestens 1.4 GHz 64-Bit.', source: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/ladbi/server-hardware-checklist-for-oracle-database-installation.html' }
    },
    'mysql-enterprise': {
        name: 'MySQL Enterprise Server',
        description: 'Enterprise-MySQL-Datenbank mit Enterprise Monitor, Backup und Advanced Security.',
        components: ['database_sql', 'compute', 'storage_block', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets'],
        systemRequirements: {
            small: { workload: 'Dev/Test', compute: { cpu: 2, ram: 4 }, storage: { type: 'SSD', size: '50GB' }, os: ['RHEL', 'Ubuntu', 'Windows Server'], version: 'MySQL 8.0 oder 9.0' },
            medium: { workload: 'Production', compute: { cpu: 4, ram: 16 }, storage: { type: 'SSD', size: '500GB' }, os: ['RHEL', 'Ubuntu', 'Windows Server'], innodbBuffer: '80% des RAMs nutzbar', replication: 'empfohlen' },
            large: { workload: 'Enterprise', compute: { cpu: 8, ram: 64 }, storage: { type: 'RAID10 NVMe', size: '2TB+' }, os: ['RHEL'], innodbBuffer: 'Bis zu 80% RAM', replication: 'Master-Slave Replication', monitor: 'MySQL Enterprise Monitor (8GB+ RAM)' }
        },
        sizing: { note: 'MySQL 8.0 benötigt mehr RAM als 5.7. InnoDB Buffer Pool kann bis zu 80% des RAMs nutzen. NDB Cluster benötigt große RAM-Mengen.', source: 'https://dev.mysql.com/doc/mysql-monitor/8.0/en/system-prereqs-reference.html' }
    },
    'sabio-mysql-test': {
        name: 'SABIO Test MySQL DB',
        description: 'Test-MySQL-Datenbankinstanz für SABIO-System (Hinweis: SABIO-Produkt konnte nicht verifiziert werden).',
        components: ['compute', 'storage_block', 'dns', 'monitoring', 'logging'],
        systemRequirements: {
            small: { workload: 'Test/Dev', compute: { cpu: 2, ram: 4 }, storage: { type: 'SSD', size: '50GB' }, os: ['RHEL', 'Ubuntu', 'Windows Server'], note: 'SABIO-Produkt nicht verifizierbar' },
            medium: { workload: 'Staging', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '100GB' }, os: ['RHEL', 'Ubuntu'], note: 'Produkt konnte nicht identifiziert werden' },
            large: { workload: 'Production-ähnlich', compute: { cpu: 4, ram: 16 }, storage: { type: 'SSD', size: '200GB' }, os: ['RHEL', 'Ubuntu'], note: 'Bitte Hersteller und Produkt verifizieren' }
        },
        sizing: { note: 'SABIO-Produkt konnte nicht identifiziert werden. Allgemeine MySQL-Anforderungen verwendet.', source: 'Generic MySQL requirements' }
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // MANAGEMENT & MONITORING
    // ═══════════════════════════════════════════════════════════════════════════════
    'quest-migration-manager': {
        name: 'Quest Migration Manager for Exchange',
        description: 'Migration-Tool für Exchange-Umgebungen mit Mail- und Kalender-Migration.',
        components: ['compute', 'database_sql', 'storage_block', 'dns', 'monitoring', 'logging'],
        systemRequirements: {
            small: { mailboxes: 'bis 500', compute: { cpu: 4, ram: 8 }, agentServer: { cpu: 10, ram: 16 }, database: { type: 'SQL Server', size: '50GB' }, os: ['Windows Server 2019+'], mageInstances: 'max. 10' },
            medium: { mailboxes: '500-5000', compute: { cpu: 8, ram: 16 }, agentServer: { cpu: 20, ram: 32 }, database: { type: 'SQL Server', size: '200GB', cpu: 8 }, os: ['Windows Server 2022'], mageInstances: 'max. 100' },
            large: { mailboxes: '5000+', compute: { cpu: 16, ram: 32 }, agentServer: { cpu: 32, ram: 64 }, database: { type: 'SQL Server Enterprise', size: '500GB+', cpu: 17 }, os: ['Windows Server 2022'], mageInstances: 'max. 250', architecture: 'Multiple Agent Servers' }
        },
        sizing: { note: 'Pro 2 MAgE-Instanzen 1 CPU-Core und 0.8GB RAM. Database Server: 4-32 Cores je nach Größe.', source: 'https://support.quest.com/kb/4267470/quest-migration-manager-8-14-system-requirements' }
    },
    'mdm-server': {
        name: 'Master Data Management Server',
        description: 'Zentraler MDM-Server für Master Data Management und Stammdatenverwaltung.',
        components: ['compute', 'database_sql', 'storage_block', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { items: 'bis 50.000', users: '10-20', compute: { cpu: 4, ram: 16 }, database: { type: 'SQL Server oder Oracle', size: '100GB' }, os: ['Windows Server', 'RHEL', 'AIX'] },
            medium: { items: '50.000-500.000', users: '20-100', compute: { cpu: 8, ram: 32 }, database: { type: 'SQL Server oder Oracle', size: '500GB' }, os: ['Windows Server', 'RHEL', 'AIX'], appServer: 'WebSphere oder JBoss' },
            large: { items: '500.000+', users: '100+', compute: { cpu: 16, ram: 64 }, database: { type: 'Oracle Enterprise', size: '1TB+' }, os: ['RHEL', 'AIX'], appServer: 'WebSphere', architecture: 'Verteilte App/DB/HTTP Server', ha: { nodes: 2, type: 'Active-Active Load Balanced' } }
        },
        sizing: { note: 'Anforderungen abhängig von Datenmenge, Such-Strategien und gleichzeitigen Benutzern. IBM InfoSphere MDM als Referenz.', source: 'https://www.ibm.com/support/pages/system-requirements-infosphere-master-data-management-0' }
    },
    'power-bi-gateway': {
        name: 'Power BI On-Premises Data Gateway',
        description: 'Gateway für Verbindung zwischen Power BI Cloud und On-Premises Datenquellen.',
        components: ['compute', 'storage_block', 'dns', 'monitoring', 'logging'],
        systemRequirements: {
            small: { users: '1-10', datasets: 'Import', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '50GB' }, os: ['Windows 8+ (64-bit)', 'Windows Server 2012 R2+'], dotnet: '.NET Framework 4.7.2+' },
            medium: { users: '10-50', datasets: 'DirectQuery/Live', compute: { cpu: 8, ram: 16 }, storage: { type: 'SSD', size: '100GB' }, os: ['Windows Server 2019+'], dotnet: '.NET Framework 4.7.2+', network: 'Multiple Gigabit NICs' },
            large: { users: '50+', datasets: 'Mixed Workloads', compute: { cpu: 16, ram: 32 }, storage: { type: 'SSD', size: '200GB+' }, os: ['Windows Server 2022'], dotnet: '.NET Framework 4.7.2+', network: 'Multiple Gigabit NICs', architecture: 'Gateway Cluster', ha: { nodes: 2, type: 'Gateway Cluster' } }
        },
        sizing: { note: 'DirectQuery/Live Connection benötigen mehr CPU. Import/Cache mehr RAM. SSD für Spooling empfohlen.', source: 'https://learn.microsoft.com/en-us/power-bi/guidance/gateway-onprem-sizing' }
    },
    'barramundi-management': {
        name: 'Barramundi Management Suite',
        description: 'Client-Management-Suite für Software-Verteilung, OS-Installation und Endpoint-Management.',
        components: ['compute', 'storage_block', 'storage_file', 'dns', 'monitoring', 'logging'],
        systemRequirements: {
            small: { clients: '1-500', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '50GB+' }, network: '1 GbE', os: ['Windows Server 2019+'], dip: '10GB für Apps + 90GB für Managed Software' },
            medium: { clients: '500-2000', compute: { cpu: 4, ram: 16 }, storage: { type: 'SSD', size: '100GB+' }, network: '1 GbE', os: ['Windows Server 2022'], dip: '10GB Apps + 90GB Managed SW + 6GB pro OS' },
            large: { clients: '2000+', compute: { cpu: 8, ram: 32 }, storage: { type: 'SSD', size: '200GB+' }, network: '10 GbE', os: ['Windows Server 2022'], dip: 'Multiple DIPs für verteilte Standorte', architecture: 'Multi-Site mit regionalen DIPs', ha: { nodes: 2, type: 'Multi-Site' } }
        },
        sizing: { note: 'Mindestens 4 CPU-Kerne und 8GB RAM (16GB empfohlen). Zusätzlicher Storage für Distribution Installation Points (DIP).', source: 'https://www.baramundi.com/en-us/management-suite/' }
    },
    'ingenits-orgmanager': {
        name: 'Ingentis org.manager',
        description: 'Organisationsmanagement-Software für Organigramme und Personalplanung mit SAP-Integration.',
        components: ['compute', 'database_sql', 'storage_block', 'dns', 'monitoring', 'logging', 'identity'],
        systemRequirements: {
            small: { users: '1-50', compute: { cpu: 2, ram: 8 }, database: { type: 'SQL Server oder PostgreSQL', size: '20GB' }, storage: { type: 'SSD', size: '50GB' }, os: ['Windows Server 2019+', 'Windows 10/11'] },
            medium: { users: '50-200', compute: { cpu: 4, ram: 16 }, database: { type: 'SQL Server', size: '100GB' }, storage: { type: 'SSD', size: '100GB' }, os: ['Windows Server 2022', 'SaaS/Cloud möglich'] },
            large: { users: '200+', compute: { cpu: 8, ram: 32 }, database: { type: 'SQL Server Enterprise', size: '200GB+' }, storage: { type: 'SSD', size: '200GB+' }, os: ['Windows Server 2022', 'Cloud SaaS'], integration: 'SAP HCM, SuccessFactors, Workday' }
        },
        sizing: { note: 'Web-basiert, Multi-User, Multi-Client fähig. Integration mit SAP HCM, SuccessFactors, Workday möglich.', source: 'https://www.ingentis.com/products/org-manager/' }
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECURITY & INFRASTRUCTURE
    // ═══════════════════════════════════════════════════════════════════════════════
    'pgp-keyserver': {
        name: 'PGP Keyserver / Symantec Encryption Management Server',
        description: 'PGP-Keyserver für Verschlüsselungs-Management und Zertifikatsverwaltung.',
        components: ['compute', 'storage_block', 'dns', 'monitoring', 'logging', 'secrets'],
        systemRequirements: {
            small: { users: '1-100', compute: { cpu: 2, ram: 16 }, storage: { type: 'SSD', size: '100GB' }, os: ['Custom Debian 11.8'], virtualization: 'VMware ESXi oder Cloud' },
            medium: { users: '100-1000', compute: { cpu: 4, ram: 32 }, storage: { type: 'SSD', size: '100GB' }, os: ['Custom Debian 11.8'], virtualization: 'VMware ESXi', clustering: 'empfohlen (32GB RAM pro Server)' },
            large: { users: '1000+', compute: { cpu: 8, ram: 64 }, storage: { type: 'SSD', size: '100GB+' }, os: ['Custom Debian 11.8'], clustering: '32GB RAM pro Cluster Member erforderlich', architecture: 'High Availability Cluster' }
        },
        sizing: { note: 'Customized Debian 11.8 OS. Cluster Members benötigen mindestens 32GB RAM. Single Server mindestens 16GB RAM.', source: 'https://techdocs.broadcom.com/us/en/symantec-security-software/information-security/symantec-encryption-management-server/11-0-1/symantec-encryption-management-server-system-requirements-11-0-1.html' }
    },
    'zutrittskontrolle': {
        name: 'Zutrittskontrolle / Access Control System',
        description: 'Enterprise-Zutrittskontrollsystem für Türen, Benutzer und Berechtigungsverwaltung.',
        components: ['compute', 'database_sql', 'storage_block', 'dns', 'monitoring', 'logging'],
        systemRequirements: {
            small: { doors: '1-50', users: 'bis 1.000', compute: { cpu: 4, ram: 8 }, database: { type: 'SQL Server', size: '50GB' }, storage: { type: 'SSD', size: '100GB' }, os: ['Windows Server 2016+'] },
            medium: { doors: '50-500', users: '1.000-10.000', compute: { cpu: 8, ram: 16 }, database: { type: 'SQL Server', size: '200GB' }, storage: { type: 'SSD', size: '500GB' }, os: ['Windows Server 2019+'], network: 'IP PoE für Türcontroller' },
            large: { doors: '500+', users: '10.000+', compute: { cpu: 16, ram: 32 }, database: { type: 'SQL Server Enterprise', size: '500GB+' }, storage: { type: 'SSD', size: '1TB+' }, os: ['Windows Server 2022'], network: 'Redundante IP PoE', architecture: 'Multi-Site mit zentraler Verwaltung', ha: { nodes: 2, type: 'Active-Active Load Balanced' } }
        },
        sizing: { note: 'Lenel OnGuard oder Gallagher Security als Referenz. IP PoE für moderne Controller-Anbindung. Unbegrenzte Benutzer möglich.', source: 'https://cdn.lenel.com/collateral/OG13_TS_ENT.pdf' }
    },
    'ftp-ftps-server': {
        name: 'FTP/FTPS Enterprise Server',
        description: 'Enterprise FTP/FTPS-Server für sicheren Dateitransfer mit Verschlüsselung.',
        components: ['compute', 'storage_block', 'storage_file', 'dns', 'monitoring', 'logging', 'secrets'],
        systemRequirements: {
            small: { users: 'bis 50 gleichzeitig', compute: { cpu: 2, ram: 4 }, storage: { type: 'SSD', size: '500GB' }, os: ['Windows Server 2019+', 'Linux'], tls: 'TLS 1.2+ erforderlich' },
            medium: { users: '50-500 gleichzeitig', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '2TB' }, os: ['Windows Server 2022', 'Linux'], tls: 'TLS 1.3', sizing: '1 CPU Core pro 1.250 gleichzeitige User' },
            large: { users: '500+ gleichzeitig', compute: { cpu: 8, ram: 16 }, storage: { type: 'SSD', size: '5TB+' }, os: ['Windows Server 2022', 'Linux'], tls: 'TLS 1.3', sizing: '40MB RAM pro 100 gleichzeitige User', architecture: 'Load Balanced Cluster' }
        },
        sizing: { note: 'CompleteFTP/Robo-FTP als Referenz: 1 CPU Core pro 1.250 User, 40MB RAM pro 100 User. .NET Framework 4.7.2+ erforderlich.', source: 'https://www.robo-ftp.com/requirements' }
    },
    'as4-gateway': {
        name: 'AS4 Gateway Server',
        description: 'AS4-Gateway für sichere B2B-Nachrichtenaustausch (ENTSOG, PEPPOL, eDelivery).',
        components: ['compute', 'storage_block', 'dns', 'monitoring', 'logging', 'secrets'],
        systemRequirements: {
            small: { messages: 'bis 1.000/Tag', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '100GB' }, os: ['Windows Server', 'Linux'], java: 'JVM >= Java 11' },
            medium: { messages: '1.000-10.000/Tag', compute: { cpu: 8, ram: 16 }, storage: { type: 'SSD', size: '500GB' }, os: ['Windows Server', 'Linux'], java: 'JVM >= Java 11', note: 'Mindestens 4 CPU-Kerne empfohlen' },
            large: { messages: '10.000+/Tag', compute: { cpu: 16, ram: 32 }, storage: { type: 'SSD', size: '1TB+' }, os: ['Linux'], java: 'JVM >= Java 11', architecture: 'Cluster mit Shared File System', clients: 'Separate Client/Server Hosts' }
        },
        sizing: { note: 'mendelson AS4 warnt bei nur 2 CPU-Kernen vor langsamer Performance. Java 11+ erforderlich. Shared File System für Cluster.', source: 'https://mendelson.de/as4?language=en' }
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // BUSINESS APPLICATIONS
    // ═══════════════════════════════════════════════════════════════════════════════
    'prevero-fpanda': {
        name: 'Unit4 Prevero (FP&A)',
        description: 'Corporate Performance Management und Financial Planning & Analysis (primär Cloud).',
        components: ['compute', 'database_sql', 'storage_block', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: '1-20', compute: { cpu: 2, ram: 8 }, deployment: 'Cloud (Microsoft Azure)', browser: 'Moderner Browser', bandwidth: '100 Kbps pro User', os: ['Cloud SaaS'] },
            medium: { users: '20-100', compute: { cpu: 4, ram: 16 }, deployment: 'Cloud (Microsoft Azure)', browser: 'Moderner Browser', bandwidth: '100 Kbps pro User', designer: '1024 MB Memory pro Designer', os: ['Cloud SaaS'] },
            large: { users: '100+', compute: { cpu: 8, ram: 32 }, deployment: 'Cloud (Microsoft Azure)', browser: 'Moderner Browser', bandwidth: '100 Kbps pro User', os: ['Cloud SaaS'], note: 'On-Premise Support endet 31.12.2024' }
        },
        sizing: { note: 'Primär Cloud-basiert auf Microsoft Azure. On-Premise-Support endet 31.12.2024. Minimale lokale Hardware-Anforderungen.', source: 'https://www.unit4.com/applications/corporate-performance-management/prevero' }
    },
    'infopian-prevero': {
        name: 'Infopian Prevero N>asset (Legacy)',
        description: 'Legacy-Name für Unit4 Prevero FP&A. Siehe prevero-fpanda für aktuelle Version.',
        components: ['compute', 'database_sql', 'storage_block', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: { users: '1-20', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '100GB' }, deployment: 'Cloud', note: 'Siehe Unit4 Prevero (FP&A) für aktuelle Anforderungen' },
            medium: { users: '20-100', compute: { cpu: 8, ram: 16 }, storage: { type: 'SSD', size: '200GB' }, deployment: 'Cloud', note: 'Produkt heißt jetzt Unit4 Prevero / Unit4 FP&A' },
            large: { users: '100+', compute: { cpu: 16, ram: 32 }, storage: { type: 'SSD', size: '500GB' }, deployment: 'Cloud', note: 'On-Premise-Support endet 31.12.2024, Migration zu Cloud empfohlen' }
        },
        sizing: { note: 'Legacy-Name. Produkt heißt jetzt Unit4 Prevero / Unit4 FP&A. Cloud-basiert auf Microsoft Azure.', source: 'https://www.unit4.com/applications/corporate-performance-management/prevero' }
    },
    'kemas-poolfahrzeug': {
        name: 'KEMAS Poolfahrzeugmanagement',
        description: 'Poolfahrzeugverwaltung und CarSharing-System basierend auf KEMAS NET Plattform.',
        components: ['compute', 'database_sql', 'storage_block', 'dns', 'monitoring', 'logging', 'identity'],
        systemRequirements: {
            small: { vehicles: '1-50', users: '1-100', compute: { cpu: 2, ram: 8 }, database: { type: 'SQL Server oder MySQL', size: '20GB' }, deployment: 'On-Premise oder Cloud', os: ['Windows Server', 'Linux', 'Cloud'] },
            medium: { vehicles: '50-200', users: '100-500', compute: { cpu: 4, ram: 16 }, database: { type: 'SQL Server', size: '100GB' }, deployment: 'Cloud empfohlen', os: ['Cloud SaaS'], interfaces: 'CSV, XML, Webservice, OPC' },
            large: { vehicles: '200+', users: '500+', compute: { cpu: 8, ram: 32 }, database: { type: 'SQL Server Enterprise', size: '200GB+' }, deployment: 'Cloud (EU-Rechenzentren)', os: ['Cloud SaaS'], interfaces: 'CSV, XML, Webservice, OPC', architecture: 'Multi-Tenant Cloud' }
        },
        sizing: { note: 'KEMAS NET Plattform. Cloud-Hosting mit Datenverarbeitung in EU-Rechenzentren verfügbar. Standard-Schnittstellen verfügbar.', source: 'https://www.kemas.de/loesungen/mobility/poolfahrzeugverwaltung-und-carsharing.html' }
    },
    // ═══════════════════════════════════════════════════════════════════════════════
    // CITRIX VIRTUAL APPS AND DESKTOPS (CVAD) - COMPLETE INFRASTRUCTURE
    // ═══════════════════════════════════════════════════════════════════════════════
    'citrix-cvad-complete': {
        name: 'Citrix Virtual Apps and Desktops (Komplette Umgebung)',
        description: 'Vollständige Citrix CVAD-Infrastruktur mit allen Komponenten: Delivery Controller, StoreFront, Director, Licensing, SQL, ADC, VDA.',
        components: ['compute', 'database_sql', 'storage_block', 'loadbalancer', 'dns', 'monitoring', 'logging', 'secrets', 'identity'],
        systemRequirements: {
            small: {
                users: '1-1.000',
                compute: {
                    deliveryController: { cpu: 4, ram: 8, nodes: 2, storage: '100GB' },
                    storefront: { cpu: 4, ram: 8, nodes: 2, storage: '50GB' },
                    director: { cpu: 4, ram: 8, nodes: 1, storage: '100GB' },
                    licensing: { cpu: 2, ram: 4, nodes: 1, storage: '50GB' },
                    sql: { cpu: 4, ram: 8, nodes: 2, storage: '100GB' },
                    adc: { cpu: 2, ram: 8, nodes: 2, storage: '20GB' },
                    pvs: { cpu: 4, ram: 8, nodes: 2, storage: '500GB', optional: true }
                },
                storage: { type: 'SSD', size: '1.3TB' },
                database: { type: 'SQL Server 2022 Express', size: '150GB', note: '3 DBs: Site Config (1GB), Config Logging (5GB), Monitoring (13GB × 50 VDAs)' },
                os: ['Windows Server 2022', 'Windows Server 2025'],
                note: 'Infrastruktur: 2× Controller (4vCPU, 8GB), 2× StoreFront (4vCPU, 8GB), 1× Director (4vCPU, 8GB), 1× Licensing (2vCPU, 4GB), 2× SQL Server (4vCPU, 8GB, 100GB, HA), 2× ADC VPX 200 (2vCPU, 8GB), optional: 2× PVS (4vCPU, 8GB, 500GB). CVAD 2507 LTSR oder 2411 CR. VDA-Worker nicht enthalten.'
            },
            medium: {
                users: '1.000-5.000',
                compute: {
                    deliveryController: { cpu: 7, ram: 14, nodes: 2, storage: '100GB' },
                    storefront: { cpu: 4, ram: 10, nodes: 2, storage: '100GB' },
                    director: { cpu: 5, ram: 12, nodes: 2, storage: '100GB' },
                    licensing: { cpu: 4, ram: 8, nodes: 1, storage: '50GB' },
                    sql: { cpu: 8, ram: 16, nodes: 2, storage: '500GB' },
                    adc: { cpu: 4, ram: 16, nodes: 2, storage: '20GB' },
                    pvs: { cpu: 5, ram: 14, nodes: 2, storage: '1.5TB', optional: true }
                },
                storage: { type: 'SSD', size: '2.5TB' },
                database: { type: 'SQL Server 2022 Standard', size: '500GB', note: '3 DBs: Site Config (2GB), Config Logging (10GB), Monitoring (65GB × 250 VDAs)' },
                os: ['Windows Server 2022', 'Windows Server 2025'],
                note: 'Infrastruktur: 2-3× Controller (6-8vCPU, 12-16GB), 2-3× StoreFront (4vCPU, 8-12GB), 2× Director (4-6vCPU, 12GB), 1× Licensing (4vCPU, 8GB), 2× SQL Server (8vCPU, 16GB, 500GB, HA), 2× ADC VPX 1000 (4vCPU, 16GB), optional: 2-3× PVS (4-6vCPU, 12-16GB, 1-2TB). CVAD 2507 LTSR oder 2411 CR. VDA-Worker nicht enthalten.'
            },
            large: {
                users: '5.000-10.000',
                compute: {
                    deliveryController: { cpu: 8, ram: 20, nodes: 3, storage: '200GB' },
                    storefront: { cpu: 7, ram: 16, nodes: 3, storage: '200GB' },
                    director: { cpu: 8, ram: 16, nodes: 2, storage: '100GB' },
                    licensing: { cpu: 4, ram: 8, nodes: 1, storage: '50GB' },
                    sql: { cpu: 10, ram: 28, nodes: 2, storage: '1.25TB' },
                    adc: { cpu: 8, ram: 32, nodes: 2, storage: '20GB' },
                    pvs: { cpu: 7, ram: 24, nodes: 4, storage: '4TB', optional: true }
                },
                storage: { type: 'Enterprise SSD', size: '6TB' },
                database: { type: 'SQL Server 2022 Enterprise', size: '1.5-2TB', note: '3 DBs: Site Config (5GB), Config Logging (50GB), Monitoring (130GB-1TB × 500 VDAs, wächst mit Retention)' },
                os: ['Windows Server 2022', 'Windows Server 2025'],
                note: 'Infrastruktur: 3-4× Controller (8vCPU, 16-24GB), 3-4× StoreFront (6-8vCPU, 16GB), 2-3× Director (8vCPU, 16GB), 1× Licensing (4vCPU, 8GB), 2× SQL Server (10vCPU, 28GB, 1.5-2TB, HA), 2-3× ADC VPX 3000 (8vCPU, 32GB), optional: 3-5× PVS (6-8vCPU, 16-32GB, 3-5TB). CVAD 2507 LTSR empfohlen. VDA-Worker nicht enthalten.'
            }
        },
        sizing: { note: 'Vollständige Citrix-Infrastruktur mit Hochverfügbarkeit. VDA-Worker nicht enthalten (siehe citrix-vda). Anforderungen ohne VDA-Last. LTSR 2507 für Production empfohlen.', source: 'https://docs.citrix.com/en-us/citrix-virtual-apps-desktops/system-requirements.html' }
    },
    'citrix-delivery-controller': {
        name: 'Citrix Delivery Controller',
        description: 'Zentrale Management-Komponente für Citrix CVAD, verwaltet Brokering, Konfiguration und Machine Catalogs.',
        components: ['compute', 'database_sql', 'storage_block', 'dns', 'monitoring', 'logging', 'identity'],
        systemRequirements: {
            small: { users: 'bis 1.000', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '100GB' }, database: { type: 'SQL Server', size: '150GB' }, os: ['Windows Server 2025', 'Windows Server 2022', 'Windows Server 2019'], dotnet: '.NET Framework 4.8', powershell: 'PowerShell 3.0+', ha: { nodes: 2, type: 'Active-Active Load Balanced' } },
            medium: { users: '1.000-5.000', compute: { cpu: 6, ram: 12 }, storage: { type: 'SSD', size: '100GB' }, database: { type: 'SQL Server Standard', size: '500GB' }, os: ['Windows Server 2025', 'Windows Server 2022'], dotnet: '.NET Framework 4.8', formula: 'User/5000 +1 Server', ha: { nodes: 2, type: 'Active-Active Load Balanced' } },
            large: { users: '5.000+', compute: { cpu: 8, ram: 16 }, storage: { type: 'SSD', size: '200GB' }, database: { type: 'SQL Server Enterprise', size: '1.5-2TB' }, os: ['Windows Server 2025', 'Windows Server 2022'], dotnet: '.NET Framework 4.8', visualCpp: 'MSVC++ 2015-2022', license: 'License Server 11.17.2+', ha: { nodes: 3, type: 'Active-Active Load Balanced' } }
        },
        sizing: { note: 'Minimum 2 Controller für HA. Formel: User/5000 +1. Minimum 5GB RAM. .NET 4.8 und IIS automatisch installiert. Benötigt SQL Server für Site DB, Logging DB und Monitoring DB (siehe citrix-sql-database). Ab 2411: Azure SQL Managed Instance unterstützt.', source: 'https://docs.citrix.com/en-us/citrix-virtual-apps-desktops/system-requirements.html' }
    },
    'citrix-storefront': {
        name: 'Citrix StoreFront',
        description: 'Web-Portal für Citrix-Benutzer, authentifiziert Benutzer und listet verfügbare Ressourcen.',
        components: ['compute', 'storage_block', 'loadbalancer', 'dns', 'monitoring', 'logging'],
        systemRequirements: {
            small: { users: 'bis 2.000', servers: '2 (HA)', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '50GB' }, os: ['Windows Server 2025', 'Windows Server 2022', 'NICHT Server Core'], dotnet: '.NET 8 (ab 2411)', iis: 'IIS mit HTTPS', ha: { nodes: 2, type: 'Active-Active Load Balanced' } },
            medium: { users: '2.000-10.000', servers: '2-3', compute: { cpu: 4, ram: 10 }, storage: { type: 'SSD', size: '100GB' }, os: ['Windows Server 2025', 'Windows Server 2022'], ramFormula: '4GB + 700 Bytes pro Ressource pro User', storageFormula: '5MB + 8MB pro 1.000 Favoriten', ha: { nodes: 2, type: 'Active-Active Load Balanced' } },
            large: { users: '10.000+', servers: '3+', compute: { cpu: 8, ram: 16 }, storage: { type: 'SSD', size: '200GB' }, os: ['Windows Server 2025', 'Windows Server 2022'], ports: 'TCP 443/80 (Client), TCP 808 (Server-Server)', architecture: 'Server Group mit Load Balancer', ha: { nodes: 3, type: 'Active-Active Load Balanced' } }
        },
        sizing: { note: 'Desktop Experience erforderlich (kein Server Core). .NET 8 ab 2411. RAM: 4GB + 700 Bytes × Ressourcen × User. Alle Server in Gruppe müssen identische OS-Version haben.', source: 'https://docs.citrix.com/en-us/storefront/current-release/get-started/system-requirements.html' }
    },
    'citrix-director': {
        name: 'Citrix Director',
        description: 'Monitoring und Troubleshooting-Konsole für Citrix-Administratoren und Help Desk.',
        components: ['compute', 'database_sql', 'storage_block', 'dns', 'monitoring', 'logging'],
        systemRequirements: {
            small: { vdas: 'bis 2.000', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '100GB' }, database: { type: 'SQL Server', size: '150GB' }, os: ['Windows Server 2025', 'Windows Server 2022', 'Windows Server 2019'], dotnet: '.NET Framework 4.8 + 2.0', iis: 'IIS 7.0 mit ASP.NET' },
            medium: { vdas: '2.000-5.000', compute: { cpu: 6, ram: 12 }, storage: { type: 'SSD', size: '100GB' }, database: { type: 'SQL Server Standard', size: '500GB' }, os: ['Windows Server 2025', 'Windows Server 2022'], ramFormula: '4GB pro 100 Help Desk User', ha: { nodes: 2, type: 'Active-Active Load Balanced' } },
            large: { vdas: '5.000-10.000', compute: { cpu: 8, ram: 16 }, storage: { type: 'SSD', size: '200GB' }, database: { type: 'SQL Server Enterprise', size: '1.5-2TB' }, os: ['Windows Server 2025', 'Windows Server 2022'], architecture: 'Ein Server pro geografischer Region', displayRes: '1440×1024 optimal', ha: { nodes: 2, type: 'Active-Active Load Balanced' } }
        },
        sizing: { note: 'Minimum 2GB RAM, empfohlen 4GB pro 100 Help Desk User. Bei Co-Location mit Controller: RAM auf 10-12GB erhöhen. Monitoring-DB benötigt SQL Server (siehe citrix-sql-database).', source: 'https://docs.citrix.com/en-us/citrix-virtual-apps-desktops/system-requirements.html' }
    },
    'citrix-licensing': {
        name: 'Citrix License Server',
        description: 'Lizenzverwaltung für Citrix-Produkte, verwaltet Concurrent User und Subscription Licenses.',
        components: ['compute', 'storage_block', 'dns', 'monitoring', 'logging'],
        systemRequirements: {
            small: { licenses: 'bis 5.000', servers: '1', compute: { cpu: 2, ram: 4 }, storage: { type: 'SSD', size: '50GB' }, os: ['Windows Server 2025', 'Windows Server 2022', 'Windows Server 2019'], version: 'License Server 11.17.2 Build 54100' },
            medium: { licenses: '5.000-25.000', servers: '1', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '50GB' }, os: ['Windows Server 2025', 'Windows Server 2022'], version: '11.17.2+', tested: 'Getestet bis 53.000 Lizenzen' },
            large: { licenses: '25.000-53.000', servers: '1', compute: { cpu: 4, ram: 8 }, storage: { type: 'SSD', size: '50GB' }, os: ['Windows Server 2025', 'Windows Server 2022'], version: '11.17.2+', note: 'Keine zusätzl. HW über OS hinaus' }
        },
        sizing: { note: 'Ab CVAD 2411: License Server 11.17.2 Build 53100+ erforderlich. Aktuelle: 11.17.2 Build 54100. 4 vCPU, 8GB getestet bis 53.000 Lizenzen. Keine Cluster-Plattformen ab Build 51000.', source: 'https://docs.citrix.com/en-us/licensing/current-release/system-requirements.html' }
    },
    'citrix-pvs': {
        name: 'Citrix Provisioning Services (PVS)',
        description: 'Image-Streaming-Technologie für VMs, streamt Betriebssystem-Images über Netzwerk an Target Devices.',
        components: ['compute', 'database_sql', 'storage_block', 'storage_file', 'dns', 'monitoring', 'logging'],
        systemRequirements: {
            small: { targets: 'bis 500', compute: { cpu: 2, ram: 8 }, storage: { type: 'SSD', size: '500GB' }, database: { type: 'SQL Server', size: '50GB' }, vdiskStore: 'Größe aller vDisks + 20%', writeCache: '20-40GB pro Session Host', os: ['Windows Server 2025', 'Windows Server 2022', 'Server Core möglich'], network: '1 Gb Ethernet' },
            medium: { targets: '500-2.000', compute: { cpu: 4, ram: 14 }, storage: { type: 'SSD', size: '1-2TB' }, database: { type: 'SQL Server Standard', size: '100GB' }, ramFormula: '2GB + (vDisks_Multi × 4GB) + (vDisks_Single × 2GB) + 15%', os: ['Windows Server 2025', 'Windows Server 2022'], network: 'Dual 1Gb oder 10Gb', maxTargets: 'Max. 2.000 Targets pro Server', ha: { nodes: 2, type: 'Active-Active Load Balanced' } },
            large: { targets: '2.000-5.000', compute: { cpu: 6, ram: 24 }, storage: { type: 'Enterprise SSD/NVMe', size: '3-5TB' }, database: { type: 'SQL Server Enterprise', size: '200GB' }, writeCache: '5-10GB pro Desktop', os: ['Windows Server 2025', 'Windows Server 2022'], network: '10 Gb Ethernet', cpuFreq: '3.5 GHz Dual Core/HT für 250+ Targets', uefi: 'Nur UEFI (kein BIOS ab 2311)', ha: { nodes: 3, type: 'Active-Active Load Balanced' } }
        },
        sizing: { note: 'RAM-Formel: 2GB + (Multi-Session vDisks × 4GB) + (Single-Session vDisks × 2GB) + 15%. Max. 2.000 Targets pro Server. 10Gb Netzwerk für 1000+ Targets. Ab 2311: Nur UEFI, kein BIOS. Benötigt SQL Server (siehe citrix-sql-database).', source: 'https://docs.citrix.com/en-us/provisioning/2411/system-requirements.html' }
    },
    'citrix-adc-vpx': {
        name: 'Citrix ADC VPX (NetScaler)',
        description: 'Application Delivery Controller als Virtual Appliance für Load Balancing, SSL Offload und Gateway-Funktionen.',
        components: ['compute', 'storage_block', 'loadbalancer', 'dns', 'monitoring', 'logging'],
        systemRequirements: {
            small: { users: 'bis 1.000', model: 'VPX 200', servers: '2 (HA)', compute: { cpu: 2, ram: 8 }, packetEngines: '1', storage: { type: 'SSD', size: '20GB' }, network: 'Minimum 1 Gb, 10 Gb empfohlen', cpuFormula: 'Packet Engines + 1 Management vCPU', ha: { nodes: 2, type: 'Active-Passive HA' } },
            medium: { users: '1.000-5.000', model: 'VPX 1000', servers: '2 (HA)', compute: { cpu: 4, ram: 16 }, packetEngines: '3', storage: { type: 'SSD', size: '40GB' }, network: '10 Gb Ethernet', ramPerVCpu: '4GB RAM pro vCPU empfohlen', ha: { nodes: 2, type: 'Active-Passive HA' } },
            large: { users: '5.000-10.000', model: 'VPX 3000', servers: '2-3 (HA)', compute: { cpu: 8, ram: 32 }, packetEngines: '7', storage: { type: 'SSD', size: '40GB' }, network: '10 Gb Ethernet', cpuReservation: 'vCPU + Memory Reservation erforderlich', pinning: 'vCPU Pinning empfohlen', ha: { nodes: 2, type: 'Active-Passive HA' } }
        },
        sizing: { note: 'CPU-Formel: Anzahl Packet Engines + 1 Management vCPU. 4GB RAM pro vCPU empfohlen. vCPU/Memory Reservation erforderlich. Hyper-Threading auf Host deaktivieren. 10Gb Netzwerk empfohlen.', source: 'https://support.citrix.com/article/CTX139485' }
    },
    'citrix-sql-database': {
        name: 'SQL Server für Citrix CVAD',
        description: 'SQL Server-Infrastruktur für Citrix Site Configuration, Configuration Logging und Monitoring Databases. Benötigt 3 separate Datenbanken.',
        components: ['database_sql', 'storage_block', 'loadbalancer', 'dns', 'monitoring', 'logging'],
        systemRequirements: {
            small: {
                users: 'bis 1.000',
                vdas: '~50 VDAs',
                database: { type: 'SQL Server 2022 Express', size: '150GB' },
                storage: { type: 'SSD', size: '150GB' },
                os: ['SQL Server 2022 Express CU14 on Windows Server 2022'],
                note: '3 DBs: Site Config (1GB) + Config Logging (5GB) + Monitoring (13GB für 50 VDAs × 1 Jahr). Monitoring DB: 260KB pro VDA pro Jahr.'
            },
            medium: {
                users: '1.000-5.000',
                vdas: '~250 VDAs',
                database: { type: 'SQL Server 2022 Standard', size: '500GB' },
                storage: { type: 'SSD', size: '500GB' },
                os: ['SQL Server 2022 Standard on Windows Server 2022'],
                note: '3 DBs: Site Config (2GB) + Config Logging (10GB) + Monitoring (65GB für 250 VDAs × 1 Jahr). 8 vCPUs bei hoher Logon-Rate empfohlen.',
                ha: { nodes: 2, type: 'SQL Always On (optional)' }
            },
            large: {
                users: '5.000-10.000',
                vdas: '~500 VDAs',
                database: { type: 'SQL Server 2022 Enterprise', size: '1.5-2TB' },
                storage: { type: 'RAID10 SSD/NVMe', size: '1.5-2TB' },
                os: ['SQL Server 2022 Enterprise on Windows Server 2022'],
                architecture: 'Separate Monitoring-DB Server empfohlen, SQL Always On für HA',
                note: '3 DBs: Site Config (5GB) + Config Logging (50GB) + Monitoring (130GB-1TB für 500 VDAs × 1-2 Jahre). Monitoring DB wächst stark! Azure SQL Managed Instance ab CVAD 2411 unterstützt.',
                ha: { nodes: 2, type: 'SQL Always On Availability Groups' }
            }
        },
        sizing: { note: 'KRITISCH: 3 separate Datenbanken erforderlich: Site Config (klein, 1-5GB), Config Logging (1-50GB je nach Retention), Monitoring (wächst stark: 260KB pro VDA pro Jahr!). Bei 500 VDAs über 2 Jahre: Monitoring DB ~260GB. Bei 10.000 VDAs über 2 Jahre: 1TB+! Separate Monitoring-DB Server für Large empfohlen. Default: SQL Express 2022 CU14. Azure SQL Managed Instance ab CVAD 2411.', source: 'https://community.citrix.com/tech-zone/build/tech-papers/sql-server-and-citrix-databases/' }
    },
    'citrix-vda': {
        name: 'Citrix Virtual Delivery Agent (VDA)',
        description: 'Agent auf VMs/Desktops für Citrix-Verbindungen. Single-Session (Windows 10/11) oder Multi-Session (Server RDSH). Dies sind die Workload-VMs, die die tatsächlichen User-Sessions ausführen.',
        components: ['compute', 'storage_block', 'storage_file', 'monitoring', 'logging'],
        systemRequirements: {
            small: {
                users: '1-1.000',
                sessionType: 'Multi-Session (RDSH)',
                vdaServers: '40-50 VMs',
                userDensity: '20-25 User pro Server',
                compute: { cpu: 360, ram: 1440 },
                storage: { type: 'SSD', size: '9-10TB' },
                os: ['Windows Server 2022', 'Windows Server 2019'],
                note: '45 VDA-Server je 8 vCPU, 32 GB RAM. Gesamt: 360 vCPU, 1.440 GB RAM. Storage: 3.6TB OS-Disks (80GB/VM) + 450-900GB MCS Cache (10-20GB/VM) + 5TB Profile Storage (5GB/User) = 9-10TB total. Standard Office Worker: 0.8 vCPU + 2GB RAM pro User.'
            },
            medium: {
                users: '1.000-5.000',
                sessionType: 'Multi-Session (RDSH)',
                vdaServers: '200-250 VMs',
                userDensity: '20-25 User pro Server',
                compute: { cpu: 1800, ram: 7200 },
                storage: { type: 'SSD', size: '45-50TB' },
                os: ['Windows Server 2022', 'Windows Server 2019'],
                note: '225 VDA-Server je 8 vCPU, 32 GB RAM. Gesamt: 1.800 vCPU, 7.200 GB RAM. Storage: 18TB OS + 2.25-4.5TB MCS Cache + 25TB Profiles = 45-50TB. N+1 Redundanz empfohlen. Bei 5.000 VDAs: 3 Cloud Connectors für HA erforderlich.'
            },
            large: {
                users: '5.000-10.000',
                sessionType: 'Multi-Session (RDSH)',
                vdaServers: '400-500 VMs',
                userDensity: '20-25 User pro Server',
                compute: { cpu: 3600, ram: 14400 },
                storage: { type: 'Enterprise SSD', size: '90-100TB' },
                os: ['Windows Server 2022', 'Windows Server 2025'],
                architecture: 'Load Balanced VDA Servers, Max. 10.000 VDAs pro Zone',
                gpuSupport: 'GPU für grafik-intensive Workloads optional',
                note: '450 VDA-Server je 8 vCPU, 32 GB RAM. Gesamt: 3.600 vCPU, 14.400 GB RAM. Storage: 36TB OS + 4.5-9TB MCS Cache + 50TB Profiles = 90-100TB. Maximum 10.000 VDAs pro Zone. Über 5.000 VDAs: 3 Cloud Connectors zwingend. VDA-Layer macht 95%+ der Gesamtkosten aus!'
            }
        },
        sizing: { note: 'KRITISCH: VDA-Worker sind die Workload-VMs und machen 95%+ der Gesamtkosten aus! Nicht mit Infrastruktur verwechseln. Standard Office Worker: 0.8 vCPU + 2GB RAM. Multi-Session Density: 20-25 User/Server (light: 30-40, heavy: 10-15). Single-Session VDI: 1:1 User/VM Ratio. Citrix Workloads sind zu 99.9% CPU-bound. Storage: OS 80GB + MCS Cache 10-20GB + Profile 5GB/User. Benchmarking mit LoginVSI empfohlen.', source: 'https://docs.citrix.com/en-us/citrix-virtual-apps-desktops/system-requirements.html' }
    },
    'mde-endgeraete-manager': {
        name: 'MDE Endgeräte Manager (Mobile Device Management)',
        description: 'Mobile Device Management für Android, iOS und iPadOS Geräte.',
        components: ['compute', 'database_sql', 'storage_block', 'dns', 'monitoring', 'logging', 'identity'],
        systemRequirements: {
            small: { devices: '1-1.000', compute: { cpu: 2, ram: 8 }, database: { type: 'SQL Server oder MySQL', size: '20GB' }, os: ['Windows Desktop oder Server', 'Linux'] },
            medium: { devices: '1.000-25.000', compute: { cpu: 4, ram: 16 }, database: { type: 'SQL Server', size: '100GB' }, os: ['Windows Server empfohlen'], processors: '2 empfohlen' },
            large: { devices: '25.000+', compute: { cpu: 8, ram: 32 }, database: { type: 'SQL Server Enterprise', size: '500GB+' }, os: ['Windows Server Edition zwingend'], processors: '2+', architecture: 'Dedizierte Server erforderlich' }
        },
        sizing: { note: 'ManageEngine MDM Plus als Referenz. Über 25.000 Geräte erfordern Windows Server Edition. Android 7.0+, iOS 9.0+, iPadOS 13.0+ unterstützt.', source: 'https://www.manageengine.com/mobile-device-management/system-requirements.html' }
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // GATEWAYS & PROXIES
    // ═══════════════════════════════════════════════════════════════════════════════
    'terminalserver-gis': {
        name: 'Terminalserver GIS-Umgebung',
        description: 'Windows Terminal Server für GIS-Anwendungen mit Remote Desktop Services.',
        components: ['compute', 'storage_block', 'storage_file', 'loadbalancer', 'dns', 'monitoring', 'logging', 'identity'],
        systemRequirements: {
            small: { users: '1-10', compute: { cpu: 4, ram: 16 }, storage: { type: 'SSD', size: '200GB' }, os: ['Windows Server 2022 RDS'], gisApp: 'ArcGIS oder Smallworld', userRam: '2GB RAM pro User' },
            medium: { users: '10-50', compute: { cpu: 8, ram: 32 }, storage: { type: 'SSD', size: '500GB' }, os: ['Windows Server 2022 RDS'], gisApp: 'Enterprise GIS', userRam: '2-4GB RAM pro User', network: '1 Gbps' },
            large: { users: '50+', compute: { cpu: 16, ram: 64 }, storage: { type: 'SSD', size: '1TB+' }, os: ['Windows Server 2022 RDS'], gisApp: 'Enterprise GIS', userRam: '4GB RAM pro User', network: '10 Gbps', architecture: 'RDS Farm mit Session Broker' }
        },
        sizing: { note: 'GIS-Anwendungen sind ressourcenintensiv. 2-4GB RAM pro User empfohlen. GPU-Unterstützung vorteilhaft für 3D-GIS.', source: 'Windows Server RDS best practices' }
    }
};

// Kategorien
const componentCategories = {
    compute: { name: 'Compute', color: '#ef4444' },
    data: { name: 'Daten', color: '#3b82f6' },
    storage: { name: 'Storage', color: '#10b981' },
    network: { name: 'Netzwerk', color: '#f59e0b' },
    integration: { name: 'Integration', color: '#8b5cf6' },
    operations: { name: 'Operations', color: '#6366f1' },
    security: { name: 'Sicherheit', color: '#ec4899' },
    advanced: { name: 'Advanced', color: '#14b8a6' }
};

export { knownApplications, componentCategories };

