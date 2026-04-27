/**
 * Provider-C3A-Daten — pro SAA-Provider-ID die BSI-C3A-Bewertungen,
 * SOV-7-Compliance-Bewertungen und Quellen-URLs.
 *
 * Übernommen aus dem SCC-Schwesterprojekt (provider-assessments.js v4.0.0).
 * Mapping SCC-ID → SAA-ID:
 *   aws → aws, microsoft-azure → azure, google-cloud → gcp,
 *   stackit → stackit, ionos-cloud → ionos, open-telekom-cloud → otc,
 *   aws-european-sovereign-cloud → aws-sovereign, microsoft-delos-cloud → delos,
 *   openstack-private-cloud → openstack, sap-cloud-infrastructure → sap-ci (NEU)
 *
 * @module data/provider-c3a-data
 */

export const PROVIDER_C3A_DATA = {
    "aws": {
        "c3a": {
            "SOV-1-01": {
                "result": "fail",
                "note": "US-Jurisdiktion (Delaware/Washington)"
            },
            "SOV-1-02": {
                "result": "fail",
                "note": "HQ Seattle, US"
            },
            "SOV-1-03": {
                "result": "fail",
                "note": "Effective Control durch Amazon.com Inc."
            },
            "SOV-1-04": {
                "result": "partial",
                "note": "Materielle Änderungen werden über Investor Relations kommuniziert, kein formaler 90-Tage-Prozess"
            },
            "SOV-2-01": {
                "result": "partial",
                "note": "Transparency Reports, aber keine strukturierte Risikoanalyse je Service"
            },
            "SOV-2-02": {
                "result": "partial",
                "note": "Audit-Rechte über AWS Artifact und Bestandsverträge, kein direkter behördlicher Audit"
            },
            "SOV-2-03": {
                "result": "fail",
                "note": "Keine Takeover-Möglichkeit für Mitgliedstaaten"
            },
            "SOV-3-01": {
                "result": "partial",
                "note": "EU-Regionen verfügbar, aber keine vollständige Garantie der Datenresidenz auf Provider-Daten"
            },
            "SOV-3-02": {
                "result": "partial",
                "note": "AWS KMS External Key Store; nicht für alle Services"
            },
            "SOV-3-03": {
                "result": "pass",
                "note": "IAM Identity Center, SAML/OIDC"
            },
            "SOV-3-04": {
                "result": "pass",
                "note": "CloudTrail, CloudWatch"
            },
            "SOV-3-05": {
                "result": "partial",
                "note": "Client-Side Encryption für S3 und ausgewählte Services"
            },
            "SOV-4-01": {
                "result": "fail",
                "note": "Globales Personal, kein EU-Citizenship-Lock"
            },
            "SOV-4-02": {
                "result": "fail",
                "note": "Globaler Admin-Zugriff"
            },
            "SOV-4-03": {
                "result": "partial",
                "note": "Mehrere globale Connectivity-Provider, aber AWS-Konzernstruktur"
            },
            "SOV-4-04": {
                "result": "partial",
                "note": "SOC global, AWS Security Hub als Tooling"
            },
            "SOV-4-05": {
                "result": "pass",
                "note": "Etablierte Update- und Vulnerability-Prozesse"
            },
            "SOV-4-06": {
                "result": "pass",
                "note": "Security Bulletins, Vulnerability Management"
            },
            "SOV-4-07": {
                "result": "partial",
                "note": "Limitierte Transparenz zu internen Datenflüssen"
            },
            "SOV-4-08": {
                "result": "partial",
                "note": "Whitepaper zu Datenflüssen, kein DFD pro Service"
            },
            "SOV-4-09": {
                "result": "fail",
                "note": "Nicht entkoppelbar vom AWS-Konzernnetzwerk"
            },
            "SOV-4-10": {
                "result": "unknown"
            },
            "SOV-5-01": {
                "result": "partial",
                "note": "Limitierte SBOM-Veröffentlichung"
            },
            "SOV-5-02": {
                "result": "fail",
                "note": "Proprietäre Nitro-Hardware, keine Transparenz"
            },
            "SOV-5-03": {
                "result": "partial"
            },
            "SOV-5-04": {
                "result": "partial",
                "note": "US-Exportkontrolle EAR"
            },
            "SOV-5-05": {
                "result": "fail",
                "note": "Capacity-Management global"
            },
            "SOV-6-01": {
                "result": "fail",
                "note": "Quellcode in den USA"
            },
            "SOV-6-02": {
                "result": "partial"
            },
            "SOV-6-03": {
                "result": "fail",
                "note": "Dev-Toolchains AWS-eigen, US-zentriert"
            }
        },
        "sov7": {
            "SOV-7-01": {
                "result": "pass",
                "note": "ISO/IEC 27001:2022 zertifiziert"
            },
            "SOV-7-02": {
                "result": "fail",
                "note": "Kein BSI IT-Grundschutz für US-Konzern"
            },
            "SOV-7-03": {
                "result": "pass",
                "note": "BSI C5 Type 2 Testat"
            },
            "SOV-7-04": {
                "result": "pass",
                "note": "ISO 27017"
            },
            "SOV-7-05": {
                "result": "pass",
                "note": "ISO 27018"
            },
            "SOV-7-06": {
                "result": "pass",
                "note": "ISO 27701"
            },
            "SOV-7-07": {
                "result": "pass",
                "note": "SOC 2 Type 2"
            },
            "SOV-7-08": {
                "result": "fail",
                "note": "US-Konzern, KRITIS nur über AWS European Sovereign Cloud"
            },
            "SOV-7-09": {
                "result": "partial",
                "note": "NIS2-Pflichten dokumentiert, aber US-Mutter"
            },
            "SOV-7-10": {
                "result": "fail",
                "note": "Globaler SOC, kein dedizierter EU-SOC"
            }
        },
        "sources": [
            {
                "title": "AWS – Cloud Act Statement",
                "url": "https://aws.amazon.com/compliance/cloud-act/"
            },
            {
                "title": "AWS Compliance Programs",
                "url": "https://aws.amazon.com/compliance/programs/"
            },
            {
                "title": "AWS – EU Data Protection / GDPR Center",
                "url": "https://aws.amazon.com/compliance/eu-data-protection/"
            },
            {
                "title": "AWS – European Digital Sovereignty FAQ",
                "url": "https://aws.amazon.com/compliance/europe-digital-sovereignty/faq/"
            }
        ]
    },
    "azure": {
        "c3a": {
            "SOV-1-01": {
                "result": "fail",
                "note": "US-Jurisdiktion (Washington State)"
            },
            "SOV-1-02": {
                "result": "fail",
                "note": "HQ Redmond, US"
            },
            "SOV-1-03": {
                "result": "fail",
                "note": "Effective Control durch Microsoft Corp."
            },
            "SOV-1-04": {
                "result": "partial"
            },
            "SOV-2-01": {
                "result": "partial",
                "note": "Microsoft Law Enforcement Requests Report"
            },
            "SOV-2-02": {
                "result": "partial"
            },
            "SOV-2-03": {
                "result": "fail"
            },
            "SOV-3-01": {
                "result": "partial",
                "note": "EU Data Boundary für Microsoft 365 und Azure"
            },
            "SOV-3-02": {
                "result": "partial",
                "note": "Azure Key Vault Managed HSM, BYOK; nicht für alle SaaS"
            },
            "SOV-3-03": {
                "result": "pass",
                "note": "Entra ID, OIDC/SAML"
            },
            "SOV-3-04": {
                "result": "pass",
                "note": "Azure Monitor, Microsoft Sentinel"
            },
            "SOV-3-05": {
                "result": "partial",
                "note": "Customer-Managed Keys, Confidential Computing optional"
            },
            "SOV-4-01": {
                "result": "fail"
            },
            "SOV-4-02": {
                "result": "fail"
            },
            "SOV-4-03": {
                "result": "partial"
            },
            "SOV-4-04": {
                "result": "partial",
                "note": "MSFT-eigene SOCs global"
            },
            "SOV-4-05": {
                "result": "pass"
            },
            "SOV-4-06": {
                "result": "pass"
            },
            "SOV-4-07": {
                "result": "partial"
            },
            "SOV-4-08": {
                "result": "partial"
            },
            "SOV-4-09": {
                "result": "fail"
            },
            "SOV-4-10": {
                "result": "unknown"
            },
            "SOV-5-01": {
                "result": "partial"
            },
            "SOV-5-02": {
                "result": "fail"
            },
            "SOV-5-03": {
                "result": "partial"
            },
            "SOV-5-04": {
                "result": "partial",
                "note": "US EAR-Restriktionen"
            },
            "SOV-5-05": {
                "result": "fail"
            },
            "SOV-6-01": {
                "result": "fail",
                "note": "Quellcode in den USA"
            },
            "SOV-6-02": {
                "result": "partial"
            },
            "SOV-6-03": {
                "result": "fail"
            }
        },
        "sov7": {
            "SOV-7-01": {
                "result": "pass",
                "note": "ISO/IEC 27001"
            },
            "SOV-7-02": {
                "result": "fail",
                "note": "Kein BSI IT-Grundschutz"
            },
            "SOV-7-03": {
                "result": "pass",
                "note": "BSI C5"
            },
            "SOV-7-04": {
                "result": "pass",
                "note": "ISO 27017"
            },
            "SOV-7-05": {
                "result": "pass",
                "note": "ISO 27018"
            },
            "SOV-7-06": {
                "result": "pass",
                "note": "ISO 27701"
            },
            "SOV-7-07": {
                "result": "pass",
                "note": "SOC 2 Type 2"
            },
            "SOV-7-08": {
                "result": "fail",
                "note": "KRITIS nur über DELOS Cloud"
            },
            "SOV-7-09": {
                "result": "partial",
                "note": "NIS2 dokumentiert, US-Mutter"
            },
            "SOV-7-10": {
                "result": "fail",
                "note": "Globaler SOC"
            }
        },
        "sources": [
            {
                "title": "Microsoft – Trust Center",
                "url": "https://www.microsoft.com/en-us/trust-center"
            },
            {
                "title": "Microsoft – CLOUD Act Customer Guidance",
                "url": "https://learn.microsoft.com/en-us/compliance/assurance/assurance-cloud-act"
            },
            {
                "title": "Microsoft – EU Data Boundary",
                "url": "https://www.microsoft.com/en-us/trust-center/privacy/eu-data-boundary"
            },
            {
                "title": "Microsoft – Compliance Offerings",
                "url": "https://learn.microsoft.com/en-us/compliance/regulatory/offering-home"
            }
        ]
    },
    "gcp": {
        "c3a": {
            "SOV-1-01": {
                "result": "fail"
            },
            "SOV-1-02": {
                "result": "fail"
            },
            "SOV-1-03": {
                "result": "fail"
            },
            "SOV-1-04": {
                "result": "partial"
            },
            "SOV-2-01": {
                "result": "partial"
            },
            "SOV-2-02": {
                "result": "partial"
            },
            "SOV-2-03": {
                "result": "fail"
            },
            "SOV-3-01": {
                "result": "partial",
                "note": "Sovereign Controls für ausgewählte Services"
            },
            "SOV-3-02": {
                "result": "partial",
                "note": "External Key Manager (EKM), Confidential Computing"
            },
            "SOV-3-03": {
                "result": "pass",
                "note": "Cloud Identity, OIDC/SAML"
            },
            "SOV-3-04": {
                "result": "pass",
                "note": "Cloud Logging, Audit Logs"
            },
            "SOV-3-05": {
                "result": "partial"
            },
            "SOV-4-01": {
                "result": "fail"
            },
            "SOV-4-02": {
                "result": "fail"
            },
            "SOV-4-03": {
                "result": "partial"
            },
            "SOV-4-04": {
                "result": "partial"
            },
            "SOV-4-05": {
                "result": "pass"
            },
            "SOV-4-06": {
                "result": "pass"
            },
            "SOV-4-07": {
                "result": "partial"
            },
            "SOV-4-08": {
                "result": "partial"
            },
            "SOV-4-09": {
                "result": "fail"
            },
            "SOV-4-10": {
                "result": "unknown"
            },
            "SOV-5-01": {
                "result": "partial",
                "note": "SLSA-Framework von Google entwickelt"
            },
            "SOV-5-02": {
                "result": "fail",
                "note": "Proprietäre TPUs"
            },
            "SOV-5-03": {
                "result": "partial"
            },
            "SOV-5-04": {
                "result": "partial"
            },
            "SOV-5-05": {
                "result": "fail"
            },
            "SOV-6-01": {
                "result": "fail"
            },
            "SOV-6-02": {
                "result": "partial"
            },
            "SOV-6-03": {
                "result": "fail"
            }
        },
        "sov7": {
            "SOV-7-01": {
                "result": "pass",
                "note": "ISO/IEC 27001"
            },
            "SOV-7-02": {
                "result": "fail",
                "note": "Kein BSI IT-Grundschutz"
            },
            "SOV-7-03": {
                "result": "pass",
                "note": "BSI C5"
            },
            "SOV-7-04": {
                "result": "pass",
                "note": "ISO 27017"
            },
            "SOV-7-05": {
                "result": "pass",
                "note": "ISO 27018"
            },
            "SOV-7-06": {
                "result": "pass",
                "note": "ISO 27701"
            },
            "SOV-7-07": {
                "result": "pass",
                "note": "SOC 2 Type 2"
            },
            "SOV-7-08": {
                "result": "fail",
                "note": "KRITIS nicht abgebildet"
            },
            "SOV-7-09": {
                "result": "partial",
                "note": "NIS2 dokumentiert, US-Mutter"
            },
            "SOV-7-10": {
                "result": "fail",
                "note": "Globaler SOC"
            }
        },
        "sources": [
            {
                "title": "Google Cloud – Compliance Resource Center",
                "url": "https://cloud.google.com/security/compliance"
            },
            {
                "title": "Google Cloud – Sovereign Controls",
                "url": "https://cloud.google.com/blog/products/identity-security/announcing-sovereign-controls-by-partners"
            },
            {
                "title": "Google Cloud – Data Protection (GDPR)",
                "url": "https://cloud.google.com/privacy/gdpr"
            },
            {
                "title": "Google – Government Requests Transparency",
                "url": "https://transparencyreport.google.com/user-data/overview"
            }
        ]
    },
    "stackit": {
        "c3a": {
            "SOV-1-01": {
                "result": "pass",
                "variant": "C2",
                "note": "STACKIT GmbH & Co. KG, Heilbronn"
            },
            "SOV-1-02": {
                "result": "pass",
                "variant": "C2",
                "note": "HQ Deutschland"
            },
            "SOV-1-03": {
                "result": "pass",
                "variant": "C2",
                "note": "Schwarz Gruppe, vollständig deutsch"
            },
            "SOV-1-04": {
                "result": "pass"
            },
            "SOV-2-01": {
                "result": "pass"
            },
            "SOV-2-02": {
                "result": "pass",
                "variant": "C2",
                "note": "C5 Type 2 attestiert"
            },
            "SOV-2-03": {
                "result": "partial",
                "variant": "C2",
                "note": "Kein US-Mutterkonzern – State-of-Defense-Klausel auf Anfrage"
            },
            "SOV-3-01": {
                "result": "pass",
                "variant": "C4",
                "note": "Ausschließlich deutsche RZs"
            },
            "SOV-3-02": {
                "result": "pass",
                "note": "External KMS möglich"
            },
            "SOV-3-03": {
                "result": "pass",
                "note": "Standardbasiert (OIDC/SAML)"
            },
            "SOV-3-04": {
                "result": "pass",
                "note": "Audit Logs verfügbar"
            },
            "SOV-3-05": {
                "result": "pass"
            },
            "SOV-4-01": {
                "result": "pass",
                "variant": "C2",
                "note": "Personal in Deutschland"
            },
            "SOV-4-02": {
                "result": "pass",
                "variant": "C2",
                "note": "DE-Access-Pfade"
            },
            "SOV-4-03": {
                "result": "pass"
            },
            "SOV-4-04": {
                "result": "pass",
                "variant": "C2",
                "note": "SOC in Deutschland"
            },
            "SOV-4-05": {
                "result": "pass"
            },
            "SOV-4-06": {
                "result": "pass"
            },
            "SOV-4-07": {
                "result": "pass"
            },
            "SOV-4-08": {
                "result": "partial"
            },
            "SOV-4-09": {
                "result": "pass",
                "note": "Disconnect-fähig, da kein Nicht-EU-Abhängigkeitsdesign"
            },
            "SOV-4-10": {
                "result": "pass"
            },
            "SOV-5-01": {
                "result": "partial",
                "note": "OpenStack-SBOM verfügbar, einzelne Managed Services schwächer"
            },
            "SOV-5-02": {
                "result": "partial"
            },
            "SOV-5-03": {
                "result": "partial"
            },
            "SOV-5-04": {
                "result": "partial"
            },
            "SOV-5-05": {
                "result": "pass",
                "variant": "C2",
                "note": "Capacity Management in Deutschland"
            },
            "SOV-6-01": {
                "result": "pass",
                "note": "OpenStack-Quellen verfügbar"
            },
            "SOV-6-02": {
                "result": "pass"
            },
            "SOV-6-03": {
                "result": "pass"
            }
        },
        "sov7": {
            "SOV-7-01": {
                "result": "pass",
                "note": "ISO 27001 (Schwarz Digits 2024)"
            },
            "SOV-7-02": {
                "result": "partial",
                "note": "IT-Grundschutz für Teile, nicht voll"
            },
            "SOV-7-03": {
                "result": "pass",
                "note": "BSI C5 Type 2 (2024)"
            },
            "SOV-7-04": {
                "result": "pass",
                "note": "ISO 27017"
            },
            "SOV-7-05": {
                "result": "pass",
                "note": "ISO 27018"
            },
            "SOV-7-06": {
                "result": "partial",
                "note": "ISO 27701 in Bearbeitung"
            },
            "SOV-7-07": {
                "result": "pass",
                "note": "ISAE 3000 / SOC 2"
            },
            "SOV-7-08": {
                "result": "pass",
                "note": "KRITIS-fähig"
            },
            "SOV-7-09": {
                "result": "pass",
                "note": "NIS2-konform"
            },
            "SOV-7-10": {
                "result": "pass",
                "note": "SOC in Deutschland"
            }
        },
        "sources": [
            {
                "title": "STACKIT – Zertifikate",
                "url": "https://stackit.com/en/why-stackit/benefits/certificates"
            },
            {
                "title": "Schwarz Digits – Souveräne STACKIT Cloud (BSI C5, ISAE, SOC 2)",
                "url": "https://schwarz-digits.de/en/presse/archive/2024/sovereign-stackit-cloud-with-bsi-s-c5-isae-3000-soc-2-and-isae-3402-certified"
            },
            {
                "title": "Schwarz Digits – C5 Type 2 (2024)",
                "url": "https://schwarz-digits.de/en/presse/archive/2024/c5-type-2-certificate-stackit-receives-confirmation-of-the-highest-security-standards-for-cloud-services"
            },
            {
                "title": "STACKIT – Datensouveränität",
                "url": "https://stackit.com/en/why-stackit/benefits/data-sovereignty"
            }
        ]
    },
    "ionos": {
        "c3a": {
            "SOV-1-01": {
                "result": "pass",
                "variant": "C2",
                "note": "IONOS SE, Karlsruhe"
            },
            "SOV-1-02": {
                "result": "pass",
                "variant": "C2",
                "note": "HQ Deutschland"
            },
            "SOV-1-03": {
                "result": "pass",
                "variant": "C2",
                "note": "United Internet AG, börsennotiert in Deutschland"
            },
            "SOV-1-04": {
                "result": "pass"
            },
            "SOV-2-01": {
                "result": "pass"
            },
            "SOV-2-02": {
                "result": "pass",
                "variant": "C2",
                "note": "BSI C5, IT-Grundschutz"
            },
            "SOV-2-03": {
                "result": "partial",
                "note": "C2"
            },
            "SOV-3-01": {
                "result": "pass",
                "variant": "C4",
                "note": "Daten in Deutschland und EU"
            },
            "SOV-3-02": {
                "result": "pass"
            },
            "SOV-3-03": {
                "result": "pass"
            },
            "SOV-3-04": {
                "result": "pass"
            },
            "SOV-3-05": {
                "result": "pass"
            },
            "SOV-4-01": {
                "result": "pass",
                "note": "C2"
            },
            "SOV-4-02": {
                "result": "pass",
                "note": "C2"
            },
            "SOV-4-03": {
                "result": "pass"
            },
            "SOV-4-04": {
                "result": "pass",
                "note": "C2"
            },
            "SOV-4-05": {
                "result": "pass"
            },
            "SOV-4-06": {
                "result": "pass"
            },
            "SOV-4-07": {
                "result": "pass"
            },
            "SOV-4-08": {
                "result": "partial"
            },
            "SOV-4-09": {
                "result": "pass"
            },
            "SOV-4-10": {
                "result": "pass"
            },
            "SOV-5-01": {
                "result": "partial"
            },
            "SOV-5-02": {
                "result": "partial"
            },
            "SOV-5-03": {
                "result": "partial"
            },
            "SOV-5-04": {
                "result": "partial"
            },
            "SOV-5-05": {
                "result": "pass",
                "note": "C2"
            },
            "SOV-6-01": {
                "result": "pass"
            },
            "SOV-6-02": {
                "result": "pass"
            },
            "SOV-6-03": {
                "result": "pass"
            }
        },
        "sov7": {
            "SOV-7-01": {
                "result": "pass",
                "note": "ISO 27001"
            },
            "SOV-7-02": {
                "result": "pass",
                "note": "BSI-IGZ-0543-2022 (IT-Grundschutz)"
            },
            "SOV-7-03": {
                "result": "pass",
                "note": "BSI C5 (Compute, S3, Cubes)"
            },
            "SOV-7-04": {
                "result": "pass",
                "note": "ISO 27017"
            },
            "SOV-7-05": {
                "result": "pass",
                "note": "ISO 27018"
            },
            "SOV-7-06": {
                "result": "partial",
                "note": "ISO 27701 in Vorbereitung"
            },
            "SOV-7-07": {
                "result": "partial",
                "note": "SOC 2 in Vorbereitung"
            },
            "SOV-7-08": {
                "result": "pass",
                "note": "KRITIS-fähig (govdigital-Cloud)"
            },
            "SOV-7-09": {
                "result": "pass",
                "note": "NIS2-konform"
            },
            "SOV-7-10": {
                "result": "pass",
                "note": "SOC in Deutschland"
            }
        },
        "sources": [
            {
                "title": "IONOS Cloud – Zertifikate",
                "url": "https://cloud.ionos.de/zertifikate"
            },
            {
                "title": "IONOS – BSI IT-Grundschutz Zertifikat",
                "url": "https://www.ionos.de/newsroom/news/ionos-erhaelt-it-grundschutz-zertifikat-vom-bundesamt-fuer-sicherheit-in-der-informationstechnik-bsi/"
            },
            {
                "title": "IONOS – C5 Certification (2023)",
                "url": "https://www.ionos-group.com/investor-relations/publications/announcements/ionos-receives-c5-certification-for-compute-engine-cloud-cubes-and-s3-object-storage.html"
            },
            {
                "title": "BSI – Zertifikat BSI-IGZ-0543-2022",
                "url": "https://www.bsi.bund.de/SharedDocs/Zertifikate_GS_ISO27001/Abgeschlossen/BSI-IGZ-0543-2022.html"
            }
        ]
    },
    "otc": {
        "c3a": {
            "SOV-1-01": {
                "result": "pass",
                "variant": "C2",
                "note": "Deutsche Telekom AG / T-Systems"
            },
            "SOV-1-02": {
                "result": "pass",
                "variant": "C2",
                "note": "HQ Bonn"
            },
            "SOV-1-03": {
                "result": "pass",
                "variant": "C2",
                "note": "KfW-Anteil, börsennotiert in Deutschland"
            },
            "SOV-1-04": {
                "result": "pass"
            },
            "SOV-2-01": {
                "result": "pass"
            },
            "SOV-2-02": {
                "result": "pass",
                "note": "C2"
            },
            "SOV-2-03": {
                "result": "partial",
                "note": "C2"
            },
            "SOV-3-01": {
                "result": "pass",
                "variant": "C4",
                "note": "Daten in Deutschland"
            },
            "SOV-3-02": {
                "result": "pass",
                "note": "BYOK verfügbar"
            },
            "SOV-3-03": {
                "result": "pass"
            },
            "SOV-3-04": {
                "result": "pass"
            },
            "SOV-3-05": {
                "result": "pass"
            },
            "SOV-4-01": {
                "result": "partial",
                "variant": "C2",
                "note": "L2/L3-Support partiell durch Huawei"
            },
            "SOV-4-02": {
                "result": "partial",
                "variant": "C2",
                "note": "Admin-Zugriffe partiell durch Huawei"
            },
            "SOV-4-03": {
                "result": "pass"
            },
            "SOV-4-04": {
                "result": "pass",
                "note": "C2"
            },
            "SOV-4-05": {
                "result": "pass"
            },
            "SOV-4-06": {
                "result": "pass"
            },
            "SOV-4-07": {
                "result": "partial"
            },
            "SOV-4-08": {
                "result": "partial"
            },
            "SOV-4-09": {
                "result": "partial",
                "note": "Huawei-Hardware-Stack als Disconnect-Risiko"
            },
            "SOV-4-10": {
                "result": "partial"
            },
            "SOV-5-01": {
                "result": "partial"
            },
            "SOV-5-02": {
                "result": "fail",
                "note": "Huawei-Hardware – kritisch nach BSI-Empfehlungen"
            },
            "SOV-5-03": {
                "result": "partial"
            },
            "SOV-5-04": {
                "result": "partial",
                "note": "Exportkontrolle CN/EU relevant"
            },
            "SOV-5-05": {
                "result": "pass",
                "note": "C2"
            },
            "SOV-6-01": {
                "result": "partial",
                "note": "OpenStack ja, aber Huawei-Patches"
            },
            "SOV-6-02": {
                "result": "partial"
            },
            "SOV-6-03": {
                "result": "partial"
            }
        },
        "sov7": {
            "SOV-7-01": {
                "result": "pass",
                "note": "ISO 27001"
            },
            "SOV-7-02": {
                "result": "partial",
                "note": "BSI-konform, IT-Grundschutz nicht voll"
            },
            "SOV-7-03": {
                "result": "pass",
                "note": "BSI C5 Testat"
            },
            "SOV-7-04": {
                "result": "pass",
                "note": "ISO 27017"
            },
            "SOV-7-05": {
                "result": "pass",
                "note": "ISO 27018"
            },
            "SOV-7-06": {
                "result": "partial",
                "note": "ISO 27701 in Vorbereitung"
            },
            "SOV-7-07": {
                "result": "partial",
                "note": "SOC 2 nicht vollständig"
            },
            "SOV-7-08": {
                "result": "pass",
                "note": "KRITIS-Eignung"
            },
            "SOV-7-09": {
                "result": "pass",
                "note": "NIS2-konform"
            },
            "SOV-7-10": {
                "result": "pass",
                "note": "SOC in Deutschland"
            }
        },
        "sources": [
            {
                "title": "T-Systems – Industrial AI Cloud Launch (Feb 2026)",
                "url": "https://www.telekom.com/en/media/media-information/archive/launch-industrial-ai-cloud-with-nvidia-1098706"
            },
            {
                "title": "Deutsche Telekom – AI Sovereignty for Germany and Europe",
                "url": "https://www.telekom.com/en/media/media-information/archive/ai-sovereignty-for-germany-and-europe-1098708"
            },
            {
                "title": "Open Telekom Cloud – Compliance",
                "url": "https://www.open-telekom-cloud.com/en/security/certifications-attestations"
            },
            {
                "title": "NVIDIA Blog – Germany Industrial AI Cloud Launch",
                "url": "https://blogs.nvidia.com/blog/germany-industrial-ai-cloud-launch/"
            }
        ]
    },
    "aws-sovereign": {
        "c3a": {
            "SOV-1-01": {
                "result": "pass",
                "variant": "C1",
                "note": "AWS European Sovereign Cloud GmbH unter EU-Recht"
            },
            "SOV-1-02": {
                "result": "pass",
                "variant": "C2",
                "note": "HQ Brandenburg, Deutschland"
            },
            "SOV-1-03": {
                "result": "partial",
                "variant": "C1",
                "note": "100% Tochter Amazon.com Inc. (US) – Effective Control der Mutter unklar"
            },
            "SOV-1-04": {
                "result": "pass",
                "note": "Etablierte Governance über ESC-SRF"
            },
            "SOV-2-01": {
                "result": "pass",
                "note": "Strukturiertes Risk-Assessment im ESC-SRF dokumentiert"
            },
            "SOV-2-02": {
                "result": "pass",
                "variant": "C1",
                "note": "BSI C5 Type 1 attestiert, Audit-Rechte verfügbar"
            },
            "SOV-2-03": {
                "result": "partial",
                "variant": "C1",
                "note": "Takeover-Klauseln vertraglich, aber technische Umsetzung unklar"
            },
            "SOV-3-01": {
                "result": "pass",
                "variant": "C2",
                "note": "Daten ausschließlich in EU"
            },
            "SOV-3-02": {
                "result": "pass",
                "note": "External KMS für IaaS/PaaS"
            },
            "SOV-3-03": {
                "result": "pass"
            },
            "SOV-3-04": {
                "result": "pass",
                "note": "CloudTrail in der ESC eigenständig"
            },
            "SOV-3-05": {
                "result": "pass"
            },
            "SOV-4-01": {
                "result": "pass",
                "variant": "C1",
                "note": "EU-Bürger mit EU-Hauptwohnsitz"
            },
            "SOV-4-02": {
                "result": "pass",
                "variant": "C1",
                "note": "EU-Access-Pfade verbindlich"
            },
            "SOV-4-03": {
                "result": "pass"
            },
            "SOV-4-04": {
                "result": "pass",
                "variant": "C1",
                "note": "EU-SOC etabliert"
            },
            "SOV-4-05": {
                "result": "pass"
            },
            "SOV-4-06": {
                "result": "pass"
            },
            "SOV-4-07": {
                "result": "pass"
            },
            "SOV-4-08": {
                "result": "pass"
            },
            "SOV-4-09": {
                "result": "partial",
                "note": "Disconnect technisch möglich, aber abhängig von US-Mutter-Konzern"
            },
            "SOV-4-10": {
                "result": "partial"
            },
            "SOV-5-01": {
                "result": "partial",
                "note": "SBOM noch nicht öffentlich vollständig"
            },
            "SOV-5-02": {
                "result": "partial",
                "note": "AWS-Hardware aus globaler Lieferkette"
            },
            "SOV-5-03": {
                "result": "partial"
            },
            "SOV-5-04": {
                "result": "partial"
            },
            "SOV-5-05": {
                "result": "pass",
                "variant": "C1",
                "note": "Capacity Management EU"
            },
            "SOV-6-01": {
                "result": "partial",
                "note": "Quellcode-Backup-Strategie EU in Ausarbeitung"
            },
            "SOV-6-02": {
                "result": "partial"
            },
            "SOV-6-03": {
                "result": "partial"
            }
        },
        "sov7": {
            "SOV-7-01": {
                "result": "pass",
                "note": "ISO 27001:2022 (Jan 2026)"
            },
            "SOV-7-02": {
                "result": "partial",
                "note": "IT-Grundschutz auf Roadmap"
            },
            "SOV-7-03": {
                "result": "pass",
                "note": "BSI C5 Type 1 (2026), Type 2 in Vorbereitung"
            },
            "SOV-7-04": {
                "result": "pass",
                "note": "ISO 27017"
            },
            "SOV-7-05": {
                "result": "pass",
                "note": "ISO 27018"
            },
            "SOV-7-06": {
                "result": "pass",
                "note": "ISO 27701"
            },
            "SOV-7-07": {
                "result": "partial",
                "note": "SOC 2 Type 1 erreicht, Type 2 in Bearbeitung"
            },
            "SOV-7-08": {
                "result": "partial",
                "note": "Sovereign-Variante zielt darauf, KRITIS-Cert noch offen"
            },
            "SOV-7-09": {
                "result": "pass",
                "note": "Designed for NIS2"
            },
            "SOV-7-10": {
                "result": "pass",
                "note": "EU-SOC etabliert (Brandenburg)"
            }
        },
        "sources": [
            {
                "title": "AWS – Opening the European Sovereign Cloud (GA, Jan 2026)",
                "url": "https://aws.amazon.com/blogs/aws/opening-the-aws-european-sovereign-cloud/"
            },
            {
                "title": "AWS ESC – First Compliance Milestone (SOC 2, C5, 7 ISO)",
                "url": "https://aws.amazon.com/blogs/security/aws-european-sovereign-cloud-achieves-first-compliance-milestone-soc-2-and-c5-reports-plus-seven-iso-certifications/"
            },
            {
                "title": "AWS European Sovereign Cloud – Compliance",
                "url": "https://aws.eu/compliance/"
            },
            {
                "title": "AWS – European Digital Sovereignty",
                "url": "https://aws.amazon.com/compliance/europe-digital-sovereignty/"
            },
            {
                "title": "AWS – Built, Operated, Controlled, and Secured in Europe",
                "url": "https://www.aboutamazon.eu/news/aws/built-operated-controlled-and-secured-in-europe-aws-unveils-new-sovereign-controls-and-governance-structure-for-the-aws-european-sovereign-cloud"
            }
        ]
    },
    "delos": {
        "c3a": {
            "SOV-1-01": {
                "result": "pass",
                "variant": "C2",
                "note": "Delos Cloud GmbH unter deutschem Recht"
            },
            "SOV-1-02": {
                "result": "pass",
                "variant": "C2",
                "note": "HQ Deutschland"
            },
            "SOV-1-03": {
                "result": "pass",
                "variant": "C2",
                "note": "Effective Control durch SAP SE (DE)"
            },
            "SOV-1-04": {
                "result": "pass"
            },
            "SOV-2-01": {
                "result": "pass",
                "note": "BSI-geprüfte Risikoanalyse"
            },
            "SOV-2-02": {
                "result": "pass",
                "variant": "C2",
                "note": "BSI-Audit als Designprinzip"
            },
            "SOV-2-03": {
                "result": "partial",
                "variant": "C2",
                "note": "Vertragsbasiert, technisch teils umsetzbar"
            },
            "SOV-3-01": {
                "result": "pass",
                "variant": "C4",
                "note": "Daten ausschließlich in Deutschland"
            },
            "SOV-3-02": {
                "result": "pass",
                "note": "Schlüsselverwaltung beim Treuhänder"
            },
            "SOV-3-03": {
                "result": "pass"
            },
            "SOV-3-04": {
                "result": "pass"
            },
            "SOV-3-05": {
                "result": "pass"
            },
            "SOV-4-01": {
                "result": "pass",
                "variant": "C2",
                "note": "Personal mit DE-Hauptwohnsitz"
            },
            "SOV-4-02": {
                "result": "pass",
                "variant": "C2",
                "note": "Admin-Zugriff aus Deutschland"
            },
            "SOV-4-03": {
                "result": "partial"
            },
            "SOV-4-04": {
                "result": "pass",
                "variant": "C2",
                "note": "SOC in Deutschland"
            },
            "SOV-4-05": {
                "result": "pass"
            },
            "SOV-4-06": {
                "result": "pass"
            },
            "SOV-4-07": {
                "result": "pass"
            },
            "SOV-4-08": {
                "result": "pass"
            },
            "SOV-4-09": {
                "result": "partial",
                "note": "Air-gapped Variante geplant; Updates kommen aus MS-Quellen"
            },
            "SOV-4-10": {
                "result": "partial"
            },
            "SOV-5-01": {
                "result": "partial",
                "note": "MS-Software ohne öffentliche SBOM"
            },
            "SOV-5-02": {
                "result": "partial"
            },
            "SOV-5-03": {
                "result": "partial"
            },
            "SOV-5-04": {
                "result": "partial",
                "note": "US-Exportkontrolle für MS-Software relevant"
            },
            "SOV-5-05": {
                "result": "pass",
                "variant": "C2",
                "note": "Capacity Management in Deutschland"
            },
            "SOV-6-01": {
                "result": "partial",
                "note": "Quellcode bei MS, nicht im Treuhänderzugriff"
            },
            "SOV-6-02": {
                "result": "partial"
            },
            "SOV-6-03": {
                "result": "fail",
                "note": "Dev-Tooling in MS-Hand"
            }
        },
        "sov7": {
            "SOV-7-01": {
                "result": "pass",
                "note": "ISO 27001"
            },
            "SOV-7-02": {
                "result": "pass",
                "note": "BSI IT-Grundschutz (zertifiziert)"
            },
            "SOV-7-03": {
                "result": "pass",
                "note": "BSI C5"
            },
            "SOV-7-04": {
                "result": "pass",
                "note": "ISO 27017"
            },
            "SOV-7-05": {
                "result": "pass",
                "note": "ISO 27018"
            },
            "SOV-7-06": {
                "result": "partial",
                "note": "ISO 27701 nicht vollständig dokumentiert"
            },
            "SOV-7-07": {
                "result": "pass",
                "note": "SOC 2 Type 2 über MS-Stack"
            },
            "SOV-7-08": {
                "result": "pass",
                "note": "Designed für deutsche Verwaltung / KRITIS"
            },
            "SOV-7-09": {
                "result": "pass",
                "note": "NIS2-konform"
            },
            "SOV-7-10": {
                "result": "pass",
                "note": "SOC in Deutschland, VS-NfD-fähig"
            }
        },
        "sources": [
            {
                "title": "Delos Cloud GmbH",
                "url": "https://delos.cloud/"
            },
            {
                "title": "Microsoft – Erste Souveräne Cloud-Plattform für die deutsche Verwaltung (Sept 2024)",
                "url": "https://news.microsoft.com/de-de/erste-souveraene-cloud-plattform-fuer-die-deutsche-verwaltung-auf-der-zielgeraden/"
            },
            {
                "title": "SAP – Delos Cloud Pressemitteilung Sept 2024",
                "url": "https://www.sap.com/germany/documents/2024/10/5eb3f216-d97e-0010-bca6-c68f7e60039b.html"
            },
            {
                "title": "Arvato Systems – Delos Cloud",
                "url": "https://www.arvato-systems.com/blog/national-cloud-providers-announce-increased-cooperation"
            }
        ]
    },
    "openstack": {
        "c3a": {
            "SOV-1-01": {
                "result": "pass",
                "note": "Privater Betrieb durch Anwender"
            },
            "SOV-1-02": {
                "result": "pass"
            },
            "SOV-1-03": {
                "result": "pass"
            },
            "SOV-1-04": {
                "result": "pass"
            },
            "SOV-2-01": {
                "result": "pass"
            },
            "SOV-2-02": {
                "result": "pass"
            },
            "SOV-2-03": {
                "result": "pass"
            },
            "SOV-3-01": {
                "result": "pass"
            },
            "SOV-3-02": {
                "result": "pass"
            },
            "SOV-3-03": {
                "result": "pass"
            },
            "SOV-3-04": {
                "result": "pass"
            },
            "SOV-3-05": {
                "result": "pass"
            },
            "SOV-4-01": {
                "result": "pass"
            },
            "SOV-4-02": {
                "result": "pass"
            },
            "SOV-4-03": {
                "result": "partial",
                "note": "Abhängig vom Betreiber"
            },
            "SOV-4-04": {
                "result": "partial",
                "note": "Abhängig vom Betreiber"
            },
            "SOV-4-05": {
                "result": "pass"
            },
            "SOV-4-06": {
                "result": "pass"
            },
            "SOV-4-07": {
                "result": "pass"
            },
            "SOV-4-08": {
                "result": "pass"
            },
            "SOV-4-09": {
                "result": "pass"
            },
            "SOV-4-10": {
                "result": "pass"
            },
            "SOV-5-01": {
                "result": "pass",
                "note": "OpenStack vollständig Open Source"
            },
            "SOV-5-02": {
                "result": "partial",
                "note": "Hardware aus globaler Lieferkette"
            },
            "SOV-5-03": {
                "result": "pass"
            },
            "SOV-5-04": {
                "result": "partial"
            },
            "SOV-5-05": {
                "result": "pass"
            },
            "SOV-6-01": {
                "result": "pass"
            },
            "SOV-6-02": {
                "result": "pass"
            },
            "SOV-6-03": {
                "result": "pass"
            }
        },
        "sov7": {
            "SOV-7-01": {
                "result": "partial",
                "note": "Abhängig vom Betreiber — kann erreicht werden"
            },
            "SOV-7-02": {
                "result": "partial",
                "note": "Abhängig vom Betreiber"
            },
            "SOV-7-03": {
                "result": "partial",
                "note": "Abhängig vom Betreiber"
            },
            "SOV-7-04": {
                "result": "partial",
                "note": "Abhängig vom Betreiber"
            },
            "SOV-7-05": {
                "result": "partial",
                "note": "Abhängig vom Betreiber"
            },
            "SOV-7-06": {
                "result": "partial",
                "note": "Abhängig vom Betreiber"
            },
            "SOV-7-07": {
                "result": "partial",
                "note": "Abhängig vom Betreiber"
            },
            "SOV-7-08": {
                "result": "partial",
                "note": "Bei souveränem Betrieb erreichbar"
            },
            "SOV-7-09": {
                "result": "partial",
                "note": "Bei NIS2-konformem Betrieb erreichbar"
            },
            "SOV-7-10": {
                "result": "partial",
                "note": "Bei eigenem SOC erreichbar"
            }
        },
        "sources": [
            {
                "title": "OpenStack Project",
                "url": "https://www.openstack.org/"
            },
            {
                "title": "OpenInfra Foundation",
                "url": "https://openinfra.dev/"
            }
        ]
    },
    "sap-ci": {
        "c3a": {
            "SOV-1-01": {
                "result": "pass",
                "variant": "C2",
                "note": "SAP SE, Walldorf"
            },
            "SOV-1-02": {
                "result": "pass",
                "variant": "C2",
                "note": "HQ Deutschland"
            },
            "SOV-1-03": {
                "result": "pass",
                "variant": "C2",
                "note": "Börsennotiert in Deutschland"
            },
            "SOV-1-04": {
                "result": "pass"
            },
            "SOV-2-01": {
                "result": "pass"
            },
            "SOV-2-02": {
                "result": "pass",
                "variant": "C2",
                "note": "IT-Grundschutz / C5 Typ II"
            },
            "SOV-2-03": {
                "result": "partial",
                "note": "C2"
            },
            "SOV-3-01": {
                "result": "pass",
                "variant": "C4",
                "note": "Walldorf, St. Leon-Rot"
            },
            "SOV-3-02": {
                "result": "partial",
                "note": "BYOK nicht öffentlich bestätigt"
            },
            "SOV-3-03": {
                "result": "pass"
            },
            "SOV-3-04": {
                "result": "pass"
            },
            "SOV-3-05": {
                "result": "partial"
            },
            "SOV-4-01": {
                "result": "pass",
                "variant": "C2",
                "note": "VS-NfD-Personal in Deutschland"
            },
            "SOV-4-02": {
                "result": "pass",
                "note": "C2"
            },
            "SOV-4-03": {
                "result": "pass"
            },
            "SOV-4-04": {
                "result": "pass",
                "note": "C2"
            },
            "SOV-4-05": {
                "result": "pass"
            },
            "SOV-4-06": {
                "result": "pass"
            },
            "SOV-4-07": {
                "result": "partial"
            },
            "SOV-4-08": {
                "result": "partial"
            },
            "SOV-4-09": {
                "result": "pass"
            },
            "SOV-4-10": {
                "result": "pass"
            },
            "SOV-5-01": {
                "result": "partial",
                "note": "Keine öffentlichen SBOMs"
            },
            "SOV-5-02": {
                "result": "partial"
            },
            "SOV-5-03": {
                "result": "partial"
            },
            "SOV-5-04": {
                "result": "partial"
            },
            "SOV-5-05": {
                "result": "pass",
                "note": "C2"
            },
            "SOV-6-01": {
                "result": "partial"
            },
            "SOV-6-02": {
                "result": "pass"
            },
            "SOV-6-03": {
                "result": "pass"
            }
        },
        "sov7": {
            "SOV-7-01": {
                "result": "pass",
                "note": "ISO 27001 (SAP Trust Center)"
            },
            "SOV-7-02": {
                "result": "pass",
                "note": "ISO 27001 auf IT-Grundschutz (April 2026, RZ Walldorf/St. Leon-Rot, 3 unabhängige AZ)"
            },
            "SOV-7-03": {
                "result": "pass",
                "note": "BSI C5 Typ II"
            },
            "SOV-7-04": {
                "result": "partial",
                "note": "ISO 27017 nicht in CI-Pressemitteilung explizit, in SAP Trust Center allgemein gelistet"
            },
            "SOV-7-05": {
                "result": "partial",
                "note": "ISO 27018 nicht in CI-Pressemitteilung explizit, in SAP Trust Center allgemein gelistet"
            },
            "SOV-7-06": {
                "result": "unknown",
                "note": "ISO 27701 nicht öffentlich dokumentiert"
            },
            "SOV-7-07": {
                "result": "pass",
                "note": "SOC 1 Type 2 + SOC 2 Type 2"
            },
            "SOV-7-08": {
                "result": "pass",
                "note": "KRITIS/NIS2, Schutzziel HOCH (lt. SAP)"
            },
            "SOV-7-09": {
                "result": "pass",
                "note": "KRITIS/NIS2-konform"
            },
            "SOV-7-10": {
                "result": "partial",
                "note": "BSI-zugelassene VS-NfD-Hardware verbaut, Plattform-VS-NfD-Zulassung in Bearbeitung"
            }
        },
        "sources": [
            {
                "title": "SAP News – Cloud Infrastructure IT-Grundschutz Zertifizierung (April 2026)",
                "url": "https://news.sap.com/germany/2026/04/sap-cloud-infrastructure-rechenzentren-deutschland-it-grundschutz-zertifizierung/"
            },
            {
                "title": "SAP Trust Center – Zertifizierungen und Compliance",
                "url": "https://www.sap.com/germany/about/trust-center/certification-compliance.html"
            },
            {
                "title": "SAP News (EN) – IT-Grundschutz Certification",
                "url": "https://news.sap.com/2026/04/sap-cloud-infrastructure-it-grundschutz-certification-data-centers-germany/"
            }
        ]
    }
};
