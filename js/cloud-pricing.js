/**
 * Cloud Pricing Module - Real Pricing Data for German Regions
 *
 * Diese Modul enthält echte Preisdaten der Cloud-Anbieter für deutsche Regionen.
 * Die Preise basieren auf öffentlichen Preislisten und werden regelmäßig aktualisiert.
 *
 * Regionen:
 * - AWS: eu-central-1 (Frankfurt)
 * - Azure: germanywestcentral (Frankfurt)
 * - GCP: europe-west3 (Frankfurt)
 *
 * Preise in EUR, Stand: Januar 2026
 *
 * Quellen:
 * - AWS: https://calculator.aws, https://aws.amazon.com/ec2/pricing/
 * - Azure: https://azure.microsoft.com/pricing/, Retail Prices API
 * - GCP: https://cloud.google.com/compute/all-pricing
 */

const CloudPricing = {
    // Metadaten
    version: '2.0.0',
    lastUpdated: '2026-01-27',
    currency: 'EUR',

    // Deutsche Regionen
    regions: {
        aws: { id: 'eu-central-1', name: 'Frankfurt', country: 'DE' },
        azure: { id: 'germanywestcentral', name: 'Frankfurt', country: 'DE' },
        gcp: { id: 'europe-west3', name: 'Frankfurt', country: 'DE' }
    },

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * COMPUTE PRICING (Virtual Machines)
     * Preise pro Monat (730 Stunden) für On-Demand Instanzen
     * ═══════════════════════════════════════════════════════════════════════════
     */
    compute: {
        // AWS EC2 - eu-central-1 (Frankfurt)
        // Quelle: AWS Pricing Calculator, EC2 On-Demand Pricing
        // Stand: Januar 2026 - m6i.large ~$0.096/h
        aws: {
            region: 'eu-central-1',
            pricePerVCPU: 35,  // €/vCPU/Monat
            pricePerGBRam: 8.75,
            minPrice: 35,
            // Instance-Typen mit spezifischen Preisen (€/Monat)
            instanceTypes: {
                // General Purpose (m6i) - AWS Preise sehr nah an Azure
                'm6i.large':     { vcpu: 2,  ram: 8,   price: 70 },
                'm6i.xlarge':    { vcpu: 4,  ram: 16,  price: 140 },
                'm6i.2xlarge':   { vcpu: 8,  ram: 32,  price: 280 },
                'm6i.4xlarge':   { vcpu: 16, ram: 64,  price: 560 },
                'm6i.8xlarge':   { vcpu: 32, ram: 128, price: 1120 },
                'm6i.16xlarge':  { vcpu: 64, ram: 256, price: 2240 },
                // Memory Optimized (r6i)
                'r6i.large':     { vcpu: 2,  ram: 16,  price: 92 },
                'r6i.xlarge':    { vcpu: 4,  ram: 32,  price: 184 },
                'r6i.2xlarge':   { vcpu: 8,  ram: 64,  price: 368 },
                'r6i.4xlarge':   { vcpu: 16, ram: 128, price: 736 },
                // Compute Optimized (c6i)
                'c6i.large':     { vcpu: 2,  ram: 4,   price: 62 },
                'c6i.xlarge':    { vcpu: 4,  ram: 8,   price: 124 },
                'c6i.2xlarge':   { vcpu: 8,  ram: 16,  price: 248 },
                // SAP-zertifiziert (x2idn - High Memory)
                'x2idn.large':   { vcpu: 2,  ram: 32,  price: 180, sap: true },
                'x2idn.xlarge':  { vcpu: 4,  ram: 64,  price: 360, sap: true },
                'x2idn.2xlarge': { vcpu: 8,  ram: 128, price: 720, sap: true },
                'x2idn.4xlarge': { vcpu: 16, ram: 256, price: 1440, sap: true },
                'x2idn.16xlarge':{ vcpu: 64, ram: 1024,price: 5760, sap: true },
                'x2idn.24xlarge':{ vcpu: 96, ram: 1536,price: 8640, sap: true }
            }
        },

        // Azure VMs - germanywestcentral (Frankfurt)
        // Quelle: Azure Pricing Calculator, Retail Prices API
        // Stand: Januar 2026 - D2s_v5 ~$0.096/h (sehr nah an AWS)
        azure: {
            region: 'germanywestcentral',
            pricePerVCPU: 36,  // Leicht teurer als AWS
            pricePerGBRam: 9,
            minPrice: 33,
            instanceTypes: {
                // General Purpose (Dv5) - Azure leicht teurer als AWS
                'D2s_v5':   { vcpu: 2,  ram: 8,   price: 72 },
                'D4s_v5':   { vcpu: 4,  ram: 16,  price: 144 },
                'D8s_v5':   { vcpu: 8,  ram: 32,  price: 260 },
                'D16s_v5':  { vcpu: 16, ram: 64,  price: 520 },
                'D32s_v5':  { vcpu: 32, ram: 128, price: 1040 },
                'D64s_v5':  { vcpu: 64, ram: 256, price: 2080 },
                // Memory Optimized (Ev5)
                'E2s_v5':   { vcpu: 2,  ram: 16,  price: 85 },
                'E4s_v5':   { vcpu: 4,  ram: 32,  price: 170 },
                'E8s_v5':   { vcpu: 8,  ram: 64,  price: 340 },
                'E16s_v5':  { vcpu: 16, ram: 128, price: 680 },
                // Compute Optimized (Fv2)
                'F2s_v2':   { vcpu: 2,  ram: 4,   price: 58 },
                'F4s_v2':   { vcpu: 4,  ram: 8,   price: 116 },
                'F8s_v2':   { vcpu: 8,  ram: 16,  price: 232 },
                // SAP-zertifiziert (Mv2)
                'M32ts':    { vcpu: 32, ram: 192,  price: 2100, sap: true },
                'M64s':     { vcpu: 64, ram: 1024, price: 5500, sap: true },
                'M128s':    { vcpu: 128,ram: 2048, price: 11000, sap: true }
            }
        },

        // GCP Compute Engine - europe-west3 (Frankfurt)
        // Quelle: GCP Pricing Calculator
        // Stand: Januar 2026 - n2-standard-2 ~$0.088/h (günstiger durch Sustained Use Discount)
        gcp: {
            region: 'europe-west3',
            pricePerVCPU: 32,  // Günstiger als AWS/Azure (Sustained Use Discount)
            pricePerGBRam: 8,
            minPrice: 28,
            instanceTypes: {
                // General Purpose (n2) - GCP leicht günstiger (Sustained Use Discount eingerechnet)
                'n2-standard-2':  { vcpu: 2,  ram: 8,   price: 65 },
                'n2-standard-4':  { vcpu: 4,  ram: 16,  price: 130 },
                'n2-standard-8':  { vcpu: 8,  ram: 32,  price: 240 },
                'n2-standard-16': { vcpu: 16, ram: 64,  price: 480 },
                'n2-standard-32': { vcpu: 32, ram: 128, price: 960 },
                'n2-standard-64': { vcpu: 64, ram: 256, price: 1920 },
                // Memory Optimized (n2-highmem)
                'n2-highmem-2':   { vcpu: 2,  ram: 16,  price: 78 },
                'n2-highmem-4':   { vcpu: 4,  ram: 32,  price: 156 },
                'n2-highmem-8':   { vcpu: 8,  ram: 64,  price: 312 },
                'n2-highmem-16':  { vcpu: 16, ram: 128, price: 624 },
                // Compute Optimized (c2)
                'c2-standard-4':  { vcpu: 4,  ram: 16,  price: 135 },
                'c2-standard-8':  { vcpu: 8,  ram: 32,  price: 270 },
                // SAP-zertifiziert (m2-ultramem)
                'm2-ultramem-208':{ vcpu: 208,ram: 5888, price: 35000, sap: true },
                'm2-ultramem-416':{ vcpu: 416,ram: 11776,price: 70000, sap: true }
            }
        },

        // EU Cloud Provider - Geschätzte Preise basierend auf öffentlichen Informationen
        stackit: {
            region: 'de-fra',
            pricePerVCPU: 22,  // ~25% günstiger als Hyperscaler
            pricePerGBRam: 5.5,
            minPrice: 25,
            instanceTypes: {
                'c1.2':    { vcpu: 2,  ram: 4,   price: 40 },
                'c1.4':    { vcpu: 4,  ram: 8,   price: 80 },
                'c1.8':    { vcpu: 8,  ram: 16,  price: 160 },
                'm1.2':    { vcpu: 2,  ram: 16,  price: 65 },
                'm1.4':    { vcpu: 4,  ram: 32,  price: 130 },
                'm1.8':    { vcpu: 8,  ram: 64,  price: 260 }
            }
        },

        ionos: {
            region: 'de/fra',
            pricePerVCPU: 20,
            pricePerGBRam: 5,
            minPrice: 22,
            instanceTypes: {
                'S': { vcpu: 1, ram: 1, price: 8 },
                'M': { vcpu: 2, ram: 4, price: 30 },
                'L': { vcpu: 4, ram: 8, price: 60 },
                'XL': { vcpu: 8, ram: 16, price: 120 },
                'XXL': { vcpu: 16, ram: 32, price: 240 }
            }
        },

        ovh: {
            region: 'de-fra',
            pricePerVCPU: 18,
            pricePerGBRam: 4.5,
            minPrice: 20,
            instanceTypes: {
                'b2-7':   { vcpu: 2,  ram: 7,   price: 35 },
                'b2-15':  { vcpu: 4,  ram: 15,  price: 70 },
                'b2-30':  { vcpu: 8,  ram: 30,  price: 140 },
                'b2-60':  { vcpu: 16, ram: 60,  price: 280 },
                'b2-120': { vcpu: 32, ram: 120, price: 560 }
            }
        },

        otc: {
            region: 'eu-de',
            pricePerVCPU: 24,
            pricePerGBRam: 6,
            minPrice: 28,
            instanceTypes: {
                's2.medium.2':  { vcpu: 1,  ram: 2,   price: 25 },
                's2.large.2':   { vcpu: 2,  ram: 4,   price: 50 },
                's2.xlarge.2':  { vcpu: 4,  ram: 8,   price: 100 },
                's2.2xlarge.2': { vcpu: 8,  ram: 16,  price: 200 },
                'm2.large.8':   { vcpu: 2,  ram: 16,  price: 75 },
                'm2.xlarge.8':  { vcpu: 4,  ram: 32,  price: 150 }
            }
        },

        // Sovereign Clouds (Premium)
        'aws-sovereign': {
            region: 'eu-central-1-sovereign',
            pricePerVCPU: 38,  // ~15-20% Aufschlag
            pricePerGBRam: 9.5,
            minPrice: 42,
            premiumFactor: 1.18
        },

        delos: {
            region: 'de-delos',
            pricePerVCPU: 40,  // Premium für souveräne Cloud
            pricePerGBRam: 10,
            minPrice: 45,
            premiumFactor: 1.20
        }
    },

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * DATABASE PRICING (SQL & NoSQL)
     * Preise pro Monat
     * ═══════════════════════════════════════════════════════════════════════════
     */
    database: {
        sql: {
            // AWS RDS - eu-central-1
            aws: {
                postgresql: {
                    // db.t3.micro bis db.r6g.16xlarge
                    base: 25,           // Basis-Preis (kleinste Instanz)
                    perVCPU: 45,        // Pro vCPU
                    perGBRam: 12,       // Pro GB RAM
                    storagePerGB: 0.12, // GP3 Storage pro GB/Monat
                    backupPerGB: 0.02,  // Backup Storage
                    multiAZ: 2.0        // Faktor für Multi-AZ
                },
                mysql: {
                    base: 25,
                    perVCPU: 42,
                    perGBRam: 11,
                    storagePerGB: 0.12,
                    backupPerGB: 0.02,
                    multiAZ: 2.0
                },
                oracle: {
                    base: 200,          // Oracle License inkludiert
                    perVCPU: 150,
                    perGBRam: 35,
                    storagePerGB: 0.12,
                    backupPerGB: 0.02,
                    multiAZ: 2.0,
                    licenseFactor: 2.5  // BYOL vs. License Included
                },
                aurora: {
                    base: 40,
                    perVCPU: 55,
                    perGBRam: 14,
                    storagePerGB: 0.11, // Aurora Storage
                    ioPerMillion: 0.22, // I/O Requests
                    backupPerGB: 0.023
                }
            },

            // Azure SQL - germanywestcentral
            azure: {
                postgresql: {
                    base: 22,
                    perVCPU: 40,
                    perGBRam: 10,
                    storagePerGB: 0.11,
                    backupPerGB: 0.018,
                    multiAZ: 2.0
                },
                mysql: {
                    base: 22,
                    perVCPU: 38,
                    perGBRam: 9.5,
                    storagePerGB: 0.11,
                    backupPerGB: 0.018,
                    multiAZ: 2.0
                },
                sqlserver: {
                    base: 150,
                    perVCPU: 120,
                    perGBRam: 30,
                    storagePerGB: 0.13,
                    backupPerGB: 0.02,
                    multiAZ: 2.0
                }
            },

            // GCP Cloud SQL - europe-west3
            gcp: {
                postgresql: {
                    base: 20,
                    perVCPU: 38,
                    perGBRam: 9,
                    storagePerGB: 0.10,
                    backupPerGB: 0.015,
                    multiAZ: 1.8  // GCP HA günstiger
                },
                mysql: {
                    base: 20,
                    perVCPU: 36,
                    perGBRam: 8.5,
                    storagePerGB: 0.10,
                    backupPerGB: 0.015,
                    multiAZ: 1.8
                }
            },

            // EU Provider
            stackit: {
                postgresql: {
                    base: 18,
                    perVCPU: 30,
                    perGBRam: 7,
                    storagePerGB: 0.08,
                    backupPerGB: 0.012,
                    multiAZ: 1.8
                }
            },

            ionos: {
                postgresql: {
                    base: 15,
                    perVCPU: 25,
                    perGBRam: 6,
                    storagePerGB: 0.07,
                    backupPerGB: 0.01,
                    multiAZ: 1.9
                },
                mysql: {
                    base: 15,
                    perVCPU: 25,
                    perGBRam: 6,
                    storagePerGB: 0.07,
                    backupPerGB: 0.01,
                    multiAZ: 1.9
                }
            }
        },

        nosql: {
            // AWS DynamoDB - eu-central-1
            aws: {
                dynamodb: {
                    // On-Demand Pricing
                    writePerMillion: 1.25,    // €/Million Write Request Units
                    readPerMillion: 0.25,     // €/Million Read Request Units
                    storagePerGB: 0.25,       // €/GB/Monat
                    // Provisioned Pricing
                    provisionedWCU: 0.00065,  // €/WCU/Stunde
                    provisionedRCU: 0.00013,  // €/RCU/Stunde
                    globalTable: 1.5          // Faktor für Global Tables
                },
                documentdb: {
                    base: 75,
                    perVCPU: 40,
                    storagePerGB: 0.10,
                    ioPerMillion: 0.20
                }
            },

            // Azure CosmosDB - germanywestcentral
            azure: {
                cosmosdb: {
                    // Request Units
                    ruPer100: 0.008,          // €/100 RU/Stunde (Provisioned)
                    ruPerMillion: 0.28,       // €/Million RU (Serverless)
                    storagePerGB: 0.25,
                    multiRegion: 1.4
                },
                mongodb: {
                    base: 65,
                    perVCPU: 35,
                    storagePerGB: 0.12
                }
            },

            // GCP Firestore - europe-west3
            gcp: {
                firestore: {
                    docWritePerMillion: 0.18,
                    docReadPerMillion: 0.06,
                    docDeletePerMillion: 0.02,
                    storagePerGB: 0.18
                },
                bigtable: {
                    nodePerHour: 0.65,
                    storagePerGB: 0.17,
                    ssdStoragePerGB: 0.19
                }
            }
        },

        // SAP HANA Spezialpreise
        hana: {
            aws: {
                // Preise für HANA-zertifizierte Instanzen (€/GB RAM/Monat)
                pricePerGBRam: 6,
                minRam: 256,  // Minimum 256GB für HANA
                instances: {
                    '256GB':  { ram: 256,  price: 1500 },
                    '512GB':  { ram: 512,  price: 2800 },
                    '1TB':    { ram: 1024, price: 5200 },
                    '2TB':    { ram: 2048, price: 9800 },
                    '4TB':    { ram: 4096, price: 18500 },
                    '6TB':    { ram: 6144, price: 27000 }
                }
            },
            azure: {
                pricePerGBRam: 5.5,
                minRam: 192,
                instances: {
                    '192GB':  { ram: 192,  price: 1050 },
                    '384GB':  { ram: 384,  price: 2000 },
                    '768GB':  { ram: 768,  price: 3800 },
                    '1.5TB':  { ram: 1536, price: 7200 },
                    '3TB':    { ram: 3072, price: 13500 },
                    '6TB':    { ram: 6144, price: 26000 }
                }
            },
            gcp: {
                pricePerGBRam: 5.8,
                minRam: 256,
                instances: {
                    '256GB':  { ram: 256,  price: 1450 },
                    '512GB':  { ram: 512,  price: 2700 },
                    '1TB':    { ram: 1024, price: 5000 },
                    '2TB':    { ram: 2048, price: 9500 }
                }
            }
        }
    },

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * STORAGE PRICING
     * Preise pro GB pro Monat
     * ═══════════════════════════════════════════════════════════════════════════
     */
    storage: {
        object: {
            // AWS S3 - eu-central-1
            aws: {
                standard: 0.024,         // Standard tier
                intelligentTiering: 0.023,
                standardIA: 0.013,       // Infrequent Access
                oneZoneIA: 0.0105,
                glacier: 0.004,
                glacierDeepArchive: 0.002,
                // Requests
                putRequestPer1000: 0.005,
                getRequestPer1000: 0.0004,
                // Data Transfer
                transferOutPerGB: 0.09
            },

            // Azure Blob - germanywestcentral
            azure: {
                hot: 0.022,
                cool: 0.011,
                cold: 0.005,
                archive: 0.002,
                putRequestPer10000: 0.065,
                getRequestPer10000: 0.005,
                transferOutPerGB: 0.087
            },

            // GCP Cloud Storage - europe-west3
            gcp: {
                standard: 0.023,
                nearline: 0.013,
                coldline: 0.006,
                archive: 0.0025,
                classAOpsPer10000: 0.05,
                classBOpsPer10000: 0.004,
                transferOutPerGB: 0.12
            },

            // EU Provider
            stackit: {
                standard: 0.018,
                archive: 0.005,
                transferOutPerGB: 0.05
            },
            ionos: {
                standard: 0.015,
                archive: 0.004,
                transferOutPerGB: 0.045
            },
            ovh: {
                standard: 0.012,
                archive: 0.003,
                transferOutPerGB: 0.01  // Sehr günstiger Egress
            }
        },

        block: {
            // AWS EBS - eu-central-1
            aws: {
                gp3: 0.088,              // General Purpose SSD
                gp3IOPS: 0.0055,         // €/IOPS über 3000
                gp3Throughput: 0.044,    // €/MB/s über 125
                io2: 0.131,              // Provisioned IOPS SSD
                io2IOPS: 0.066,          // €/IOPS
                st1: 0.048,              // Throughput HDD
                sc1: 0.027,              // Cold HDD
                snapshotPerGB: 0.054
            },

            // Azure Managed Disks - germanywestcentral
            azure: {
                premiumSSD: 0.13,        // P-Serie
                standardSSD: 0.05,       // E-Serie
                standardHDD: 0.03,       // S-Serie
                ultraDisk: 0.165,
                ultraDiskIOPS: 0.052,    // €/IOPS
                snapshotPerGB: 0.046
            },

            // GCP Persistent Disk - europe-west3
            gcp: {
                pdSSD: 0.085,
                pdBalanced: 0.065,
                pdStandard: 0.04,
                pdExtreme: 0.11,
                snapshotPerGB: 0.026
            },

            // EU Provider
            stackit: {
                ssd: 0.065,
                hdd: 0.03,
                snapshotPerGB: 0.02
            },
            ionos: {
                ssd: 0.055,
                hdd: 0.025,
                snapshotPerGB: 0.018
            }
        },

        file: {
            // AWS EFS - eu-central-1
            aws: {
                standard: 0.33,
                infrequentAccess: 0.017,
                throughputPerMBs: 0.066
            },

            // Azure Files - germanywestcentral
            azure: {
                premium: 0.18,
                transactionOptimized: 0.065,
                hot: 0.026,
                cool: 0.018
            },

            // GCP Filestore - europe-west3
            gcp: {
                basic: 0.22,
                highScale: 0.16,
                enterprise: 0.35
            }
        }
    },

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * KUBERNETES PRICING
     * ═══════════════════════════════════════════════════════════════════════════
     */
    kubernetes: {
        // AWS EKS - eu-central-1
        aws: {
            controlPlane: 73,            // €/Cluster/Monat
            fargatePerVCPUHour: 0.04,
            fargatePerGBHour: 0.004,
            // Worker-Node Kosten = EC2 Kosten (siehe compute)
        },

        // Azure AKS - germanywestcentral
        azure: {
            controlPlane: 0,             // Kostenlos! (Standard Tier)
            controlPlanePremium: 73,     // Uptime SLA Tier
            // Worker-Node Kosten = VM Kosten
        },

        // GCP GKE - europe-west3
        gcp: {
            controlPlane: 73,            // €/Cluster/Monat (Standard)
            autopilotPerVCPUHour: 0.035,
            autopilotPerGBHour: 0.004,
        },

        // EU Provider
        stackit: {
            controlPlane: 50,            // Günstiger als Hyperscaler
        },
        ionos: {
            controlPlane: 0,             // Auch kostenlos
        },
        ovh: {
            controlPlane: 0,             // Kostenlos
        }
    },

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * SERVERLESS PRICING
     * ═══════════════════════════════════════════════════════════════════════════
     */
    serverless: {
        // AWS Lambda - eu-central-1
        aws: {
            requestsPerMillion: 0.20,
            gbSecondsPrice: 0.0000167,   // €/GB-Sekunde
            freeRequestsPerMonth: 1000000,
            freeGBSecondsPerMonth: 400000
        },

        // Azure Functions - germanywestcentral
        azure: {
            requestsPerMillion: 0.18,
            gbSecondsPrice: 0.000016,
            freeRequestsPerMonth: 1000000,
            freeGBSecondsPerMonth: 400000
        },

        // GCP Cloud Functions - europe-west3
        gcp: {
            requestsPerMillion: 0.40,
            gbSecondsPrice: 0.0000025,   // Compute time
            cpuSecondsPrice: 0.0000100,  // CPU time
            freeRequestsPerMonth: 2000000,
            freeComputePerMonth: 400000
        }
    },

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * MESSAGING PRICING
     * ═══════════════════════════════════════════════════════════════════════════
     */
    messaging: {
        // AWS SQS/SNS - eu-central-1
        aws: {
            sqs: {
                standardPerMillion: 0.40,
                fifoPerMillion: 0.50,
                freePerMonth: 1000000
            },
            sns: {
                publishPerMillion: 0.50,
                httpDeliveryPerMillion: 0.60,
                emailPer1000: 0.10
            },
            eventbridge: {
                eventsPerMillion: 1.00
            }
        },

        // Azure Service Bus - germanywestcentral
        azure: {
            basic: {
                operationsPerMillion: 0.05
            },
            standard: {
                basePerHour: 0.01,
                operationsPerMillion: 0.80
            },
            premium: {
                messagingUnitPerHour: 0.90
            }
        },

        // GCP Pub/Sub - europe-west3
        gcp: {
            dataPerTB: 40,
            seekPerMonth: 0.10,
            snapshotRetainedPerGB: 0.003,
            freePerMonth: 10  // 10GB
        }
    },

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * CACHE PRICING
     * ═══════════════════════════════════════════════════════════════════════════
     */
    cache: {
        // AWS ElastiCache - eu-central-1
        aws: {
            redis: {
                // cache.r6g Instanzen
                small: { memory: 6.38, price: 90 },      // r6g.large
                medium: { memory: 12.93, price: 180 },   // r6g.xlarge
                large: { memory: 26.32, price: 360 },    // r6g.2xlarge
                xlarge: { memory: 52.82, price: 720 },   // r6g.4xlarge
                pricePerGB: 14  // Ca. €/GB/Monat
            },
            memcached: {
                pricePerGB: 12
            }
        },

        // Azure Cache for Redis - germanywestcentral
        azure: {
            basic: { pricePerGB: 10 },
            standard: { pricePerGB: 15 },
            premium: { pricePerGB: 25 },
            enterprise: { pricePerGB: 45 }
        },

        // GCP Memorystore - europe-west3
        gcp: {
            redis: {
                basic: { pricePerGB: 10 },
                standard: { pricePerGB: 20 }  // Mit HA
            },
            memcached: {
                pricePerGB: 8
            }
        }
    },

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * NETWORKING PRICING
     * ═══════════════════════════════════════════════════════════════════════════
     */
    networking: {
        loadbalancer: {
            aws: {
                alb: {
                    perHour: 0.025,
                    lcuPerHour: 0.008  // Load Balancer Capacity Unit
                },
                nlb: {
                    perHour: 0.028,
                    nlcuPerHour: 0.006
                }
            },
            azure: {
                standard: {
                    perHour: 0,  // Kostenlos!
                    rulesPerHour: 0.01,
                    dataPerGB: 0.005
                },
                gateway: {
                    capacityUnitsPerHour: 0.0085
                }
            },
            gcp: {
                perHour: 0.025,
                dataPerGB: 0.008
            }
        },

        cdn: {
            aws: {
                dataOutPerGB: {
                    first10TB: 0.085,
                    next40TB: 0.080,
                    next100TB: 0.060,
                    over150TB: 0.040
                },
                requestsPerMillion: 0.0075
            },
            azure: {
                dataOutPerGB: 0.081,
                requestsPerMillion: 0.0065
            },
            gcp: {
                dataOutPerGB: 0.080,
                cacheInvalidation: 0.005
            }
        },

        dns: {
            aws: {
                hostedZonePerMonth: 0.50,
                queriesPerMillion: 0.40,
                healthCheckPerMonth: 0.50
            },
            azure: {
                zonePerMonth: 0.50,
                queriesPerMillion: 0.40
            },
            gcp: {
                zonePerMonth: 0.20,
                queriesPerMillion: 0.40
            }
        }
    },

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * AI/ML PRICING
     * ═══════════════════════════════════════════════════════════════════════════
     */
    aiml: {
        // AWS Bedrock/SageMaker - eu-central-1
        aws: {
            bedrock: {
                claude3Haiku: {
                    inputPer1MTokens: 0.25,
                    outputPer1MTokens: 1.25
                },
                claude3Sonnet: {
                    inputPer1MTokens: 3.00,
                    outputPer1MTokens: 15.00
                },
                claude35Sonnet: {
                    inputPer1MTokens: 3.00,
                    outputPer1MTokens: 15.00
                },
                titanText: {
                    inputPer1MTokens: 0.30,
                    outputPer1MTokens: 0.40
                }
            },
            sagemaker: {
                trainingPerHour: {
                    mlP3xlarge: 3.80,
                    mlP4d24xlarge: 37.00,
                    mlG5xlarge: 1.20
                },
                inferencePerHour: {
                    mlC5xlarge: 0.20,
                    mlG4dnxlarge: 0.60,
                    mlInf1xlarge: 0.30
                }
            }
        },

        // Azure OpenAI - germanywestcentral
        azure: {
            openai: {
                gpt4: {
                    inputPer1MTokens: 30.00,
                    outputPer1MTokens: 60.00
                },
                gpt4Turbo: {
                    inputPer1MTokens: 10.00,
                    outputPer1MTokens: 30.00
                },
                gpt4o: {
                    inputPer1MTokens: 5.00,
                    outputPer1MTokens: 15.00
                },
                gpt35Turbo: {
                    inputPer1MTokens: 0.50,
                    outputPer1MTokens: 1.50
                }
            }
        },

        // GCP Vertex AI - europe-west3
        gcp: {
            vertexai: {
                geminiPro: {
                    inputPer1MChars: 0.50,
                    outputPer1MChars: 1.50
                },
                geminiProVision: {
                    inputPer1MChars: 0.50,
                    outputPer1MChars: 1.50,
                    imagePerImage: 0.0025
                },
                palmText: {
                    inputPer1MChars: 0.25,
                    outputPer1MChars: 0.50
                }
            },
            trainingPerHour: {
                a2Highgpu1g: 4.00,
                n1Standard8: 0.45
            }
        }
    },

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * MONITORING & LOGGING PRICING
     * ═══════════════════════════════════════════════════════════════════════════
     */
    observability: {
        // Hinweis: EU-Provider verkaufen Observability oft als separates Produkt
        // mit Fixkosten, nicht nach Verbrauch wie Hyperscaler
        monitoring: {
            aws: {
                // CloudWatch - sehr günstig, pay-per-use
                metricsPerMonth: 0.30,           // €/Metrik
                alarmsPerMonth: 0.10,
                dashboardsPerMonth: 3.00,
                customMetricsPerMonth: 0.30
            },
            azure: {
                // Azure Monitor - teurer als AWS
                metricsPerMonth: 0.10,
                logsQueryPerGB: 2.76,
                alertRulesPerMonth: 0.10
            },
            gcp: {
                // Cloud Monitoring - mittleres Preisniveau
                monitoringDataPerMB: 0.26,
                metricsPerMonth: 0.10
            },
            // EU Provider - Observability als separates Add-on
            stackit: {
                // STACKIT Observability Stack (MSP-Angebot)
                // Quelle: stackit.de/produkte/observability
                baseMonthly: 50,                 // Fixpreis/Monat
                metricsPerMonth: 0.50,
                alarmsPerMonth: 0.20
            },
            ionos: {
                // IONOS Monitoring
                baseMonthly: 35,
                metricsPerMonth: 0.40,
                alarmsPerMonth: 0.15
            },
            ovh: {
                // OVH Logs Data Platform + Metrics
                baseMonthly: 30,
                metricsPerMonth: 0.35,
                alarmsPerMonth: 0.10
            },
            otc: {
                // Open Telekom Cloud AOM/LTS
                baseMonthly: 40,
                metricsPerMonth: 0.45,
                alarmsPerMonth: 0.15
            }
        },
        logging: {
            aws: {
                // CloudWatch Logs - günstig
                ingestionPerGB: 0.57,
                storagePerGB: 0.03,
                queryScannedPerGB: 0.006
            },
            azure: {
                // Log Analytics - teurer
                ingestionPerGB: 2.76,
                retentionPerGB: 0.12,
                queryPerGB: 0.006
            },
            gcp: {
                // Cloud Logging
                ingestionPerGB: 0.50,
                storagePerGB: 0.01
            },
            // EU Provider Logging
            stackit: {
                // In Observability Stack enthalten
                ingestionPerGB: 0.80,
                storagePerGB: 0.05
            },
            ionos: {
                ingestionPerGB: 0.70,
                storagePerGB: 0.04
            },
            ovh: {
                ingestionPerGB: 0.60,
                storagePerGB: 0.03
            },
            otc: {
                ingestionPerGB: 0.75,
                storagePerGB: 0.04
            }
        }
    },

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * IDENTITY & SECRETS PRICING
     * ═══════════════════════════════════════════════════════════════════════════
     */
    security: {
        identity: {
            aws: {
                cognitoMAU: 0.00550,         // €/MAU über 50k
                cognitoMAUAdvanced: 0.0140,  // Advanced Security
                freeMAU: 50000
            },
            azure: {
                entraIdFree: 0,
                entraIdP1PerUser: 5.50,
                entraIdP2PerUser: 8.25,
                b2cMAU: 0.0025,
                freeMAU: 50000
            },
            gcp: {
                identityPlatformMAU: 0,      // Kostenlos bis 50k
                mauOver50k: 0.0015
            }
        },
        secrets: {
            aws: {
                secretPerMonth: 0.40,
                apiCallsPer10000: 0.05
            },
            azure: {
                standardOperationsPer10000: 0.03,
                hsmOperationsPer10000: 0.15
            },
            gcp: {
                secretVersionPerMonth: 0.06,
                accessOperationsPer10000: 0.03
            }
        }
    },

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * HELPER FUNCTIONS
     * ═══════════════════════════════════════════════════════════════════════════
     */

    /**
     * Berechnet VM-Kosten basierend auf vCPU und RAM
     * @param {string} providerId - Provider ID
     * @param {number} vcpu - Anzahl vCPUs
     * @param {number} ramGB - RAM in GB
     * @param {boolean} isSAP - SAP-zertifiziert benötigt
     * @returns {Object} - { price, breakdown }
     */
    calculateComputeCost(providerId, vcpu, ramGB, isSAP = false) {
        // Sovereign Cloud Handling: Nutze Basis-Provider-Preise + Premium
        const sovereignMapping = {
            'aws-sovereign': { base: 'aws', factor: 1.15 },
            'delos': { base: 'azure', factor: 1.18 },
            'azure-confidential': { base: 'azure', factor: 1.20 }
        };
        const sovereign = sovereignMapping[providerId];
        const sourceId = sovereign ? sovereign.base : providerId;
        const premiumFactor = sovereign ? sovereign.factor : 1.0;

        const providerPricing = this.compute[sourceId];
        if (!providerPricing) {
            // Fallback für unbekannte Provider
            return {
                price: Math.round(Math.max(35, vcpu * 25 + ramGB * 7) * premiumFactor),
                breakdown: `${vcpu} vCPU, ${ramGB} GB RAM (geschätzt)${sovereign ? ' (Sovereign)' : ''}`
            };
        }

        // SAP HANA benötigt spezielle Preise
        if (isSAP && this.database.hana[sourceId]) {
            const hana = this.database.hana[sourceId];
            // Finde passende HANA-Instanz
            for (const [name, instance] of Object.entries(hana.instances || {})) {
                if (instance.ram >= ramGB) {
                    return {
                        price: Math.round(instance.price * premiumFactor),
                        breakdown: `SAP HANA ${name} (${instance.ram} GB RAM)${sovereign ? ' (Sovereign)' : ''}`,
                        instanceType: name
                    };
                }
            }
            // Fallback: Preis pro GB RAM
            return {
                price: Math.round(ramGB * hana.pricePerGBRam * premiumFactor),
                breakdown: `SAP HANA ${ramGB} GB RAM${sovereign ? ' (Sovereign)' : ''}`
            };
        }

        // Suche passende Instanz
        if (providerPricing.instanceTypes) {
            let bestMatch = null;
            let bestPrice = Infinity;

            for (const [name, instance] of Object.entries(providerPricing.instanceTypes)) {
                if (instance.vcpu >= vcpu && instance.ram >= ramGB) {
                    if (instance.price < bestPrice) {
                        bestPrice = instance.price;
                        bestMatch = { name, ...instance };
                    }
                }
            }

            if (bestMatch) {
                return {
                    price: Math.round(bestMatch.price * premiumFactor),
                    breakdown: `${bestMatch.name} (${bestMatch.vcpu} vCPU, ${bestMatch.ram} GB RAM)${sovereign ? ' (Sovereign)' : ''}`,
                    instanceType: bestMatch.name
                };
            }
        }

        // Fallback: Berechnung basierend auf vCPU/RAM Preisen
        const cpuCost = vcpu * providerPricing.pricePerVCPU;
        const ramCost = ramGB * providerPricing.pricePerGBRam;
        const price = Math.max(providerPricing.minPrice || 30, cpuCost + ramCost);

        return {
            price: Math.round(price * premiumFactor),
            breakdown: `${vcpu} vCPU, ${ramGB} GB RAM${sovereign ? ' (Sovereign)' : ''}`
        };
    },

    /**
     * Berechnet Datenbank-Kosten
     * @param {string} providerId - Provider ID
     * @param {string} dbType - Datenbank-Typ (postgresql, mysql, oracle, etc.)
     * @param {number} sizeGB - Speichergröße in GB
     * @param {boolean} multiAZ - Multi-AZ/HA aktiviert
     * @returns {Object} - { price, breakdown }
     */
    calculateDatabaseCost(providerId, dbType, sizeGB, multiAZ = false) {
        const normalizedType = dbType.toLowerCase();

        // Sovereign Cloud Handling: Nutze Basis-Provider-Preise + Premium
        const sovereignMapping = {
            'aws-sovereign': { base: 'aws', factor: 1.15 },
            'delos': { base: 'azure', factor: 1.18 },
            'azure-confidential': { base: 'azure', factor: 1.20 }
        };
        const sovereign = sovereignMapping[providerId];
        const sourceId = sovereign ? sovereign.base : providerId;
        const premiumFactor = sovereign ? sovereign.factor : 1.0;

        const providerSQL = this.database.sql[sourceId];

        if (!providerSQL) {
            // Fallback
            return {
                price: Math.round((80 + (sizeGB * 0.5)) * premiumFactor),
                breakdown: `${dbType} ${sizeGB} GB (geschätzt)`
            };
        }

        // Finde passenden DB-Typ
        let dbPricing = null;
        if (normalizedType.includes('postgres')) {
            dbPricing = providerSQL.postgresql;
        } else if (normalizedType.includes('mysql') || normalizedType.includes('maria')) {
            dbPricing = providerSQL.mysql || providerSQL.postgresql;
        } else if (normalizedType.includes('oracle')) {
            dbPricing = providerSQL.oracle;
        } else if (normalizedType.includes('sql server') || normalizedType.includes('mssql')) {
            dbPricing = providerSQL.sqlserver;
        } else if (normalizedType.includes('aurora')) {
            dbPricing = providerSQL.aurora;
        } else {
            dbPricing = providerSQL.postgresql; // Default
        }

        if (!dbPricing) {
            return {
                price: Math.round((80 + (sizeGB * 0.5)) * premiumFactor),
                breakdown: `${dbType} ${sizeGB} GB (geschätzt)`
            };
        }

        // Berechne Kosten
        let price = dbPricing.base || 20;
        price += sizeGB * (dbPricing.storagePerGB || 0.1);

        if (multiAZ && dbPricing.multiAZ) {
            price *= dbPricing.multiAZ;
        }

        // Sovereign Premium anwenden
        price *= premiumFactor;

        return {
            price: Math.round(price),
            breakdown: `${dbType} ${sizeGB} GB${multiAZ ? ' (HA)' : ''}${sovereign ? ' (Sovereign)' : ''}`
        };
    },

    /**
     * Berechnet Storage-Kosten
     * @param {string} providerId - Provider ID
     * @param {string} storageType - object, block, file
     * @param {number} sizeGB - Größe in GB
     * @param {string} tier - Tier (standard, premium, etc.)
     * @returns {Object} - { price, breakdown }
     */
    calculateStorageCost(providerId, storageType, sizeGB, tier = 'standard') {
        // Sovereign Cloud Handling: Nutze Basis-Provider-Preise + Premium
        const sovereignMapping = {
            'aws-sovereign': { base: 'aws', factor: 1.15 },
            'delos': { base: 'azure', factor: 1.18 },
            'azure-confidential': { base: 'azure', factor: 1.20 }
        };
        const sovereign = sovereignMapping[providerId];
        const sourceId = sovereign ? sovereign.base : providerId;
        const premiumFactor = sovereign ? sovereign.factor : 1.0;

        const storageSection = this.storage[storageType];
        if (!storageSection) {
            return {
                price: Math.round(sizeGB * 0.05 * premiumFactor),
                breakdown: `${sizeGB} GB ${storageType} (geschätzt)`
            };
        }

        const providerPricing = storageSection[sourceId];
        if (!providerPricing) {
            return {
                price: Math.round(sizeGB * 0.05 * premiumFactor),
                breakdown: `${sizeGB} GB ${storageType} (geschätzt)`
            };
        }

        // Tier-Normalisierung: Verschiedene Provider nutzen unterschiedliche Namen
        // AWS: gp3, io2, st1, sc1
        // Azure: premiumSSD, standardSSD, standardHDD
        // GCP: pdSSD, pdBalanced, pdStandard
        const tierMapping = {
            // Generische SSD-Tier-Namen zu Provider-spezifischen
            'ssd': sourceId === 'aws' ? 'gp3' : sourceId === 'azure' ? 'premiumSSD' : 'pdSSD',
            'pdSSD': sourceId === 'aws' ? 'gp3' : sourceId === 'azure' ? 'premiumSSD' : 'pdSSD',
            'hdd': sourceId === 'aws' ? 'st1' : sourceId === 'azure' ? 'standardHDD' : 'pdStandard',
            'pdStandard': sourceId === 'aws' ? 'st1' : sourceId === 'azure' ? 'standardHDD' : 'pdStandard',
            'nvme': sourceId === 'aws' ? 'io2' : sourceId === 'azure' ? 'ultraDisk' : 'pdExtreme',
            'pdExtreme': sourceId === 'aws' ? 'io2' : sourceId === 'azure' ? 'ultraDisk' : 'pdExtreme'
        };
        const normalizedTier = tierMapping[tier] || tier;

        // Finde passenden Tier-Preis
        const tierPrice = providerPricing[normalizedTier] || providerPricing[tier] ||
                          providerPricing.standard || Object.values(providerPricing)[0] || 0.05;

        const price = sizeGB * tierPrice * premiumFactor;

        return {
            price: Math.round(price * 100) / 100,
            breakdown: `${sizeGB} GB ${storageType} (${normalizedTier})${sovereign ? ' (Sovereign)' : ''}`
        };
    },

    /**
     * Berechnet Kubernetes-Kosten
     * @param {string} providerId - Provider ID
     * @param {number} nodes - Anzahl Worker-Nodes
     * @param {number} nodeVCPU - vCPU pro Node
     * @param {number} nodeRAM - RAM pro Node in GB
     * @returns {Object} - { price, breakdown }
     */
    calculateKubernetesCost(providerId, nodes, nodeVCPU = 4, nodeRAM = 16) {
        // Sovereign Cloud Handling: Nutze Basis-Provider-Preise + Premium
        const sovereignMapping = {
            'aws-sovereign': { base: 'aws', factor: 1.15 },
            'delos': { base: 'azure', factor: 1.18 },
            'azure-confidential': { base: 'azure', factor: 1.20 }
        };
        const sovereign = sovereignMapping[providerId];
        const sourceId = sovereign ? sovereign.base : providerId;
        const premiumFactor = sovereign ? sovereign.factor : 1.0;

        const k8sPricing = this.kubernetes[sourceId];

        // Control Plane Kosten (mit Premium-Aufschlag für Sovereign Clouds)
        const baseControlPlaneCost = k8sPricing?.controlPlane || 70;
        const controlPlaneCost = Math.round(baseControlPlaneCost * premiumFactor);

        // Worker Node Kosten (berechnet über Compute - hat eigene Sovereign-Behandlung)
        const nodeResult = this.calculateComputeCost(providerId, nodeVCPU, nodeRAM);
        const workerCost = nodeResult.price * nodes;

        const totalCost = controlPlaneCost + workerCost;

        return {
            price: Math.round(totalCost),
            breakdown: `Control Plane + ${nodes}× Worker (${nodeVCPU} vCPU, ${nodeRAM} GB)${sovereign ? ' (Sovereign)' : ''}`,
            details: {
                controlPlane: controlPlaneCost,
                workers: workerCost,
                perNode: nodeResult.price
            }
        };
    },

    /**
     * Holt alle Preise für einen bestimmten Service-Typ
     * @param {string} serviceType - Service-Typ (compute, database, storage, etc.)
     * @returns {Object} - Preise aller Provider
     */
    getPricingForService(serviceType) {
        return this[serviceType] || {};
    },

    /**
     * Vergleicht Preise für einen Service über alle Provider
     * @param {string} serviceType - Service-Typ
     * @param {Object} config - Konfiguration (vcpu, ram, size, etc.)
     * @returns {Array} - Sortierte Liste der Provider mit Preisen
     */
    compareProviderPrices(serviceType, config = {}) {
        const results = [];
        const pricing = this[serviceType];

        if (!pricing) return results;

        for (const providerId of Object.keys(pricing)) {
            let result;

            switch (serviceType) {
                case 'compute':
                    result = this.calculateComputeCost(
                        providerId,
                        config.vcpu || 4,
                        config.ram || 16,
                        config.sap || false
                    );
                    break;
                case 'database':
                    result = this.calculateDatabaseCost(
                        providerId,
                        config.type || 'PostgreSQL',
                        config.size || 100,
                        config.multiAZ || false
                    );
                    break;
                default:
                    continue;
            }

            results.push({
                providerId,
                region: this.regions[providerId]?.name || 'Unknown',
                ...result
            });
        }

        return results.sort((a, b) => a.price - b.price);
    },

    /**
     * Gibt die Region-Info für einen Provider zurück
     * @param {string} providerId - Provider ID
     * @returns {Object} - Region-Info
     */
    getRegion(providerId) {
        // Mapping für Provider-IDs die nicht direkt in regions sind
        const regionMap = {
            'aws': this.regions.aws,
            'azure': this.regions.azure,
            'gcp': this.regions.gcp,
            'aws-sovereign': { id: 'eu-central-1-sovereign', name: 'Frankfurt (Sovereign)', country: 'DE' },
            'delos': { id: 'de-delos', name: 'Deutschland (DELOS)', country: 'DE' },
            'stackit': { id: 'de-fra', name: 'Frankfurt', country: 'DE' },
            'ionos': { id: 'de/fra', name: 'Frankfurt', country: 'DE' },
            'ovh': { id: 'de-fra', name: 'Frankfurt', country: 'DE' },
            'otc': { id: 'eu-de', name: 'Deutschland', country: 'DE' }
        };

        return regionMap[providerId] || { id: 'de', name: 'Deutschland', country: 'DE' };
    },

    /**
     * Berechnet Observability-Kosten (Monitoring + Logging)
     * @param {string} providerId - Provider ID
     * @param {number} metrics - Anzahl Custom Metriken
     * @param {number} alarms - Anzahl Alarme
     * @param {number} logsGB - Log-Ingestion pro Monat in GB
     * @param {number} retentionGB - Log-Retention in GB
     * @returns {Object} - { price, breakdown }
     */
    calculateObservabilityCost(providerId, metrics = 10, alarms = 5, logsGB = 10, retentionGB = 30) {
        // Sovereign Cloud Handling: Nutze Basis-Provider-Preise + Premium
        const sovereignMapping = {
            'aws-sovereign': { base: 'aws', factor: 1.15 },
            'delos': { base: 'azure', factor: 1.18 },
            'azure-confidential': { base: 'azure', factor: 1.20 }
        };
        const sovereign = sovereignMapping[providerId];
        const sourceId = sovereign ? sovereign.base : providerId;
        const premiumFactor = sovereign ? sovereign.factor : 1.0;

        const mon = this.observability?.monitoring?.[sourceId];
        const log = this.observability?.logging?.[sourceId];

        // Provider-Typ für Fallback-Schätzung
        const isEuProvider = ['stackit', 'ionos', 'ovh', 'otc', 'plusserver', 'noris'].includes(providerId);
        const isOpenStack = providerId === 'openstack';

        if (!mon || !log) {
            // Fallback basierend auf Provider-Typ
            if (isOpenStack) {
                return { price: Math.round(70 * premiumFactor), breakdown: `Self-hosted Observability Stack (geschätzt)${sovereign ? ' (Sovereign)' : ''}` };
            } else if (isEuProvider) {
                return { price: Math.round(50 * premiumFactor), breakdown: `Observability Add-on (geschätzt)${sovereign ? ' (Sovereign)' : ''}` };
            } else {
                return { price: Math.round(20 * premiumFactor), breakdown: `Cloud-native Observability (geschätzt)${sovereign ? ' (Sovereign)' : ''}` };
            }
        }

        let cost = 0;
        const breakdown = [];

        // EU-Provider haben oft Fixkosten
        if (mon.baseMonthly) {
            cost += mon.baseMonthly;
            breakdown.push(`Basis: €${mon.baseMonthly}`);
        }

        // Metriken und Alarme
        const metricsCost = (mon.metricsPerMonth || 0.30) * metrics;
        const alarmsCost = (mon.alarmsPerMonth || 0.10) * alarms;
        cost += metricsCost + alarmsCost;

        // Logging
        const ingestionCost = (log.ingestionPerGB || 0.50) * logsGB;
        const storageCost = (log.storagePerGB || 0.03) * retentionGB;
        cost += ingestionCost + storageCost;

        breakdown.push(`${metrics} Metriken, ${alarms} Alarme, ${logsGB}GB Logs`);

        // Sovereign Premium anwenden
        cost *= premiumFactor;

        return {
            price: Math.round(cost),
            breakdown: breakdown.join(', ') + (sovereign ? ' (Sovereign)' : '')
        };
    },

    /**
     * Berechnet Standard-Workload-Kosten für einen Provider
     * Single Source of Truth für alle Workload-Berechnungen
     *
     * Standard-Workload:
     * - VM: 2 vCPU, 8 GB RAM
     * - Database: PostgreSQL 100 GB
     * - Object Storage: 500 GB
     * - Block Storage: 200 GB SSD
     * - Observability: 10 Metriken, 5 Alarme, 10GB Logs
     *
     * @param {string} providerId - Provider ID
     * @param {Object} config - Optionale Konfiguration
     * @returns {Object} - { total, compute, db, objStorage, blockStorage, observability, breakdown }
     */
    calculateStandardWorkload(providerId, config = {}) {
        // Standard-Konfiguration
        const cfg = {
            vcpu: config.vcpu || 2,
            ram: config.ram || 8,
            dbSize: config.dbSize || 100,
            objStorageSize: config.objStorageSize || 500,
            blockStorageSize: config.blockStorageSize || 200,
            metrics: config.metrics || 10,
            alarms: config.alarms || 5,
            logsGB: config.logsGB || 10,
            retentionGB: config.retentionGB || 30
        };

        // Sovereign Cloud Handling
        const sovereignMapping = {
            'aws-sovereign': { base: 'aws', factor: 1.15 },
            'delos': { base: 'azure', factor: 1.18 },
            'azure-confidential': { base: 'azure', factor: 1.20 }
        };

        const sovereign = sovereignMapping[providerId];
        const sourceId = sovereign ? sovereign.base : providerId;
        const premiumFactor = sovereign ? sovereign.factor : 1.0;

        // Berechne Einzelkosten
        const computeResult = this.calculateComputeCost(sourceId, cfg.vcpu, cfg.ram);
        const dbResult = this.calculateDatabaseCost(sourceId, 'postgresql', cfg.dbSize);
        const objStorageResult = this.calculateStorageCost(sourceId, 'object', cfg.objStorageSize);
        const blockStorageResult = this.calculateStorageCost(sourceId, 'block', cfg.blockStorageSize, 'gp3');
        const obsResult = this.calculateObservabilityCost(sourceId, cfg.metrics, cfg.alarms, cfg.logsGB, cfg.retentionGB);

        // Einzelpreise (mit Aufschlag für Sovereign Clouds)
        const compute = Math.round(computeResult.price * premiumFactor);
        const db = Math.round(dbResult.price * premiumFactor);
        const objStorage = Math.round(objStorageResult.price * premiumFactor);
        const blockStorage = Math.round(blockStorageResult.price * premiumFactor);
        const observability = Math.round(obsResult.price * premiumFactor);

        const total = compute + db + objStorage + blockStorage + observability;

        return {
            total,
            compute,
            db,
            objStorage,
            blockStorage,
            observability,
            premiumFactor,
            breakdown: {
                compute: computeResult.breakdown,
                db: dbResult.breakdown,
                objStorage: objStorageResult.breakdown,
                blockStorage: blockStorageResult.breakdown,
                observability: obsResult.breakdown
            },
            config: cfg
        };
    },

    /**
     * Vergleicht Standard-Workload-Kosten über alle Provider
     * @param {Object} config - Optionale Konfiguration
     * @returns {Array} - Sortierte Liste der Provider mit Kosten
     */
    compareStandardWorkload(config = {}) {
        const providerIds = [
            'aws', 'azure', 'gcp',
            'aws-sovereign', 'delos', 'azure-confidential',
            'stackit', 'ionos', 'ovh', 'otc',
            'plusserver', 'noris', 'openstack'
        ];

        const results = providerIds.map(providerId => ({
            providerId,
            region: this.getRegion(providerId),
            ...this.calculateStandardWorkload(providerId, config)
        }));

        return results.sort((a, b) => a.total - b.total);
    }
};

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CloudPricing };
}
