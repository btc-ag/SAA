#!/usr/bin/env node
/**
 * Smoke-Tests für die CloudPricing Public-API.
 * Deckt alle 8 öffentlichen Methoden über alle relevanten Provider ab.
 *
 * Wichtig zur Erinnerung an die echte API:
 *   - Alle calculate*-Methoden geben { price, breakdown, ... } zurück (Object), keine plain number.
 *   - getRegion() hat einen Default-Fallback und gibt nie null/undefined zurück, sondern
 *     mindestens { id: 'de', name: 'Deutschland', country: 'DE' }.
 *   - getPricingForService() gibt das Sub-Objekt zurück oder {} bei Unbekanntem.
 */

import { CloudPricing } from '../js/cloud-pricing.js';

let pass = 0, fail = 0;
function check(name, actual, expected) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) { console.log(`✓ ${name}`); pass++; }
    else    { console.log(`✗ ${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`); fail++; }
}
function checkTrue(name, value)  { check(name, value === true, true); }
function checkType(name, actualType, expectedType) {
    if (actualType === expectedType) { console.log(`✓ ${name} (${actualType})`); pass++; }
    else { console.log(`✗ ${name}: type ${actualType}, expected ${expectedType}`); fail++; }
}
function checkRange(name, value, min, max) {
    const ok = typeof value === 'number' && value >= min && value <= max;
    if (ok) { console.log(`✓ ${name} (${value} in [${min},${max}])`); pass++; }
    else    { console.log(`✗ ${name}: ${value} not in [${min},${max}]`); fail++; }
}

// === calculateComputeCost ===
const cmpAws = CloudPricing.calculateComputeCost('aws', 2, 8);
checkType('AWS compute returns object', typeof cmpAws, 'object');
checkRange('AWS m6i.large 2vCPU 8GB > 0', cmpAws.price, 1, 1000);
checkType('AWS compute breakdown is string', typeof cmpAws.breakdown, 'string');

const cmpAzure = CloudPricing.calculateComputeCost('azure', 2, 8);
checkRange('Azure 2vCPU 8GB > 0', cmpAzure.price, 1, 1000);

const cmpGcp = CloudPricing.calculateComputeCost('gcp', 2, 8);
checkRange('GCP 2vCPU 8GB > 0', cmpGcp.price, 1, 1000);

const cmpLarge = CloudPricing.calculateComputeCost('aws', 4, 16);
const cmpMedium = CloudPricing.calculateComputeCost('aws', 2, 8);
checkTrue('AWS large > medium', cmpLarge.price > cmpMedium.price);

const cmpStandard = CloudPricing.calculateComputeCost('aws', 8, 32, false);
const cmpSAP = CloudPricing.calculateComputeCost('aws', 8, 32, true);
checkTrue('SAP-Optimized > Standard', cmpSAP.price > cmpStandard.price);

const cmpUnknown = CloudPricing.calculateComputeCost('xyz-unknown', 2, 8);
checkType('Unknown provider liefert sinnvollen Default-Object', typeof cmpUnknown, 'object');
checkRange('Unknown provider price > 0', cmpUnknown.price, 1, 99999);

// IONOS / STACKIT / OTC (sovereign / EU)
const cmpIonos = CloudPricing.calculateComputeCost('ionos', 2, 8);
checkRange('IONOS Compute > 0', cmpIonos.price, 1, 1000);
const cmpStackit = CloudPricing.calculateComputeCost('stackit', 2, 8);
checkRange('STACKIT Compute > 0', cmpStackit.price, 1, 1000);
const cmpOtc = CloudPricing.calculateComputeCost('otc', 2, 8);
checkRange('OTC Compute > 0', cmpOtc.price, 1, 1000);

// Sovereign-Mapping: aws-sovereign hat 1.15 Premium auf aws
const cmpAwsSov = CloudPricing.calculateComputeCost('aws-sovereign', 2, 8);
checkTrue('aws-sovereign > aws (Premium-Aufschlag)', cmpAwsSov.price > cmpAws.price);

// delos = azure + 1.18
const cmpDelos = CloudPricing.calculateComputeCost('delos', 2, 8);
checkTrue('delos > azure (Premium-Aufschlag)', cmpDelos.price > cmpAzure.price);

// === calculateDatabaseCost ===
const dbAws = CloudPricing.calculateDatabaseCost('aws', 'PostgreSQL', 100, false);
checkType('AWS DB returns object', typeof dbAws, 'object');
checkRange('AWS PostgreSQL 100GB > 0', dbAws.price, 1, 99999);

const dbAzure = CloudPricing.calculateDatabaseCost('azure', 'MySQL', 100, false);
checkRange('Azure MySQL 100GB > 0', dbAzure.price, 1, 99999);

const dbGcp = CloudPricing.calculateDatabaseCost('gcp', 'PostgreSQL', 100, false);
checkRange('GCP PostgreSQL 100GB > 0', dbGcp.price, 1, 99999);

const dbSingle = CloudPricing.calculateDatabaseCost('aws', 'PostgreSQL', 500, false);
const dbMultiAZ = CloudPricing.calculateDatabaseCost('aws', 'PostgreSQL', 500, true);
checkTrue('MultiAZ >= Single', dbMultiAZ.price >= dbSingle.price);

const dbBig = CloudPricing.calculateDatabaseCost('aws', 'PostgreSQL', 2000, false);
checkTrue('Big DB > Small DB', dbBig.price > dbSingle.price);

const dbOracle = CloudPricing.calculateDatabaseCost('aws', 'Oracle', 200, false);
checkRange('Oracle DB > 0', dbOracle.price, 1, 99999);

const dbMariaDB = CloudPricing.calculateDatabaseCost('azure', 'MariaDB', 100, false);
checkRange('MariaDB DB > 0', dbMariaDB.price, 1, 99999);

const dbMssql = CloudPricing.calculateDatabaseCost('aws', 'SQL Server', 100, false);
checkRange('SQL Server DB > 0', dbMssql.price, 1, 99999);

const dbUnknown = CloudPricing.calculateDatabaseCost('xyz-unknown', 'PostgreSQL', 100, false);
checkRange('Unknown provider DB Fallback', dbUnknown.price, 1, 99999);

// Sovereign: aws-sovereign DB > aws DB
const dbAwsSov = CloudPricing.calculateDatabaseCost('aws-sovereign', 'PostgreSQL', 100, false);
checkTrue('aws-sovereign DB > aws DB', dbAwsSov.price > dbAws.price);

// === calculateStorageCost ===
const stoObjAws = CloudPricing.calculateStorageCost('aws', 'object', 1000, 'standard');
checkType('AWS Object Storage returns object', typeof stoObjAws, 'object');
checkRange('AWS S3 1000GB > 0', stoObjAws.price, 1, 99999);

const stoObjAzure = CloudPricing.calculateStorageCost('azure', 'object', 1000, 'standard');
checkRange('Azure Blob 1000GB > 0', stoObjAzure.price, 1, 99999);

const stoObjGcp = CloudPricing.calculateStorageCost('gcp', 'object', 1000, 'standard');
checkRange('GCP GCS 1000GB > 0', stoObjGcp.price, 1, 99999);

// Tier-Vergleich: archive < standard
const stoStd = CloudPricing.calculateStorageCost('aws', 'object', 5000, 'standard');
const stoArchive = CloudPricing.calculateStorageCost('aws', 'object', 5000, 'archive');
checkTrue('Archive Tier <= Standard Tier', stoArchive.price <= stoStd.price);

// Block storage
const stoBlock = CloudPricing.calculateStorageCost('aws', 'block', 500, 'ssd');
checkRange('Block storage SSD > 0', stoBlock.price, 1, 99999);

// Block storage HDD vs NVMe
const stoBlockHdd = CloudPricing.calculateStorageCost('aws', 'block', 500, 'hdd');
const stoBlockNvme = CloudPricing.calculateStorageCost('aws', 'block', 500, 'nvme');
checkRange('Block HDD > 0', stoBlockHdd.price, 1, 99999);
checkRange('Block NVMe > 0', stoBlockNvme.price, 1, 99999);

// Unknown storage type → Fallback
const stoUnknown = CloudPricing.calculateStorageCost('aws', 'unknown_type', 100);
checkRange('Unknown storage type Fallback', stoUnknown.price, 0.01, 99999);

// Unknown provider
const stoUnknownProv = CloudPricing.calculateStorageCost('xyz-unknown', 'object', 1000);
checkRange('Unknown provider storage Fallback', stoUnknownProv.price, 1, 99999);

// === calculateKubernetesCost ===
const k8sAws = CloudPricing.calculateKubernetesCost('aws', 3);
checkType('AWS K8s returns object', typeof k8sAws, 'object');
checkRange('AWS EKS 3 nodes > 0', k8sAws.price, 10, 99999);
checkType('K8s breakdown is string', typeof k8sAws.breakdown, 'string');
checkType('K8s details is object', typeof k8sAws.details, 'object');

const k8sAzure = CloudPricing.calculateKubernetesCost('azure', 3);
checkRange('Azure AKS 3 nodes > 0', k8sAzure.price, 10, 99999);

const k8sGcp = CloudPricing.calculateKubernetesCost('gcp', 3);
checkRange('GCP GKE 3 nodes > 0', k8sGcp.price, 10, 99999);

const k8sSmall = CloudPricing.calculateKubernetesCost('aws', 3, 4, 16);
const k8sLarge = CloudPricing.calculateKubernetesCost('aws', 6, 8, 32);
checkTrue('Larger K8s cluster costs more', k8sLarge.price > k8sSmall.price);

// Zero nodes (managed control plane only)
const k8sZeroNodes = CloudPricing.calculateKubernetesCost('aws', 0);
checkRange('K8s 0 nodes (control plane) > 0', k8sZeroNodes.price, 1, 99999);

// === getRegion ===
checkType('AWS region object', typeof CloudPricing.getRegion('aws'), 'object');
check('AWS region name', CloudPricing.getRegion('aws').name, 'Frankfurt');
check('Azure region country', CloudPricing.getRegion('azure').country, 'DE');
check('GCP region country', CloudPricing.getRegion('gcp').country, 'DE');
check('STACKIT region', CloudPricing.getRegion('stackit').country, 'DE');
check('IONOS region', CloudPricing.getRegion('ionos').country, 'DE');
check('OTC region', CloudPricing.getRegion('otc').country, 'DE');
// Default-Fallback für unbekannte Provider
check('Unknown provider default region', CloudPricing.getRegion('xyz-unknown').country, 'DE');

// === getPricingForService ===
checkType('Pricing for compute', typeof CloudPricing.getPricingForService('compute'), 'object');
checkType('Pricing for database', typeof CloudPricing.getPricingForService('database'), 'object');
checkType('Pricing for storage', typeof CloudPricing.getPricingForService('storage'), 'object');
// Unknown service → leeres Objekt
const unknownSvc = CloudPricing.getPricingForService('xyz_unknown_service');
check('Unknown service liefert leeres Objekt', unknownSvc, {});

// === calculateObservabilityCost ===
const obsAws = CloudPricing.calculateObservabilityCost('aws', 10, 5, 10, 30);
checkType('AWS Observability returns object', typeof obsAws, 'object');
checkRange('AWS Observability > 0', obsAws.price, 0.1, 99999);

const obsAzure = CloudPricing.calculateObservabilityCost('azure', 10, 5, 10, 30);
checkRange('Azure Observability > 0', obsAzure.price, 0.1, 99999);

const obsGcp = CloudPricing.calculateObservabilityCost('gcp', 10, 5, 10, 30);
checkRange('GCP Observability > 0', obsGcp.price, 0.1, 99999);

// Mehr Logs/Metriken = mehr Kosten
const obsSmall = CloudPricing.calculateObservabilityCost('aws', 5, 2, 5, 10);
const obsLarge = CloudPricing.calculateObservabilityCost('aws', 100, 50, 500, 365);
checkTrue('Mehr Logs/Metriken = mehr Kosten', obsLarge.price > obsSmall.price);

// EU-Provider Fallback (kein direkter Eintrag)
const obsStackit = CloudPricing.calculateObservabilityCost('stackit', 10, 5, 10, 30);
checkRange('STACKIT Observability (Fallback) > 0', obsStackit.price, 0.1, 99999);
const obsIonos = CloudPricing.calculateObservabilityCost('ionos', 10, 5, 10, 30);
checkRange('IONOS Observability (Fallback) > 0', obsIonos.price, 0.1, 99999);
// OpenStack-Fallback (Self-hosted)
const obsOpenStack = CloudPricing.calculateObservabilityCost('openstack', 10, 5, 10, 30);
checkRange('OpenStack Observability (Self-hosted) > 0', obsOpenStack.price, 0.1, 99999);

// Unknown Provider Fallback
const obsUnknown = CloudPricing.calculateObservabilityCost('xyz-unknown', 10, 5, 10, 30);
checkRange('Unknown Provider Observability Fallback', obsUnknown.price, 0.1, 99999);

// Sovereign Premium
const obsAwsSov = CloudPricing.calculateObservabilityCost('aws-sovereign', 10, 5, 10, 30);
checkTrue('aws-sovereign Obs > aws Obs', obsAwsSov.price > obsAws.price);

// === calculateStandardWorkload ===
const stdAws = CloudPricing.calculateStandardWorkload('aws', {});
checkType('AWS standard workload returns object', typeof stdAws, 'object');
checkType('Result has total', typeof stdAws.total, 'number');
checkType('Result has compute', typeof stdAws.compute, 'number');
checkType('Result has db', typeof stdAws.db, 'number');
checkType('Result has objStorage', typeof stdAws.objStorage, 'number');
checkType('Result has blockStorage', typeof stdAws.blockStorage, 'number');
checkType('Result has observability', typeof stdAws.observability, 'number');
checkType('Result has breakdown', typeof stdAws.breakdown, 'object');
checkType('Result has config', typeof stdAws.config, 'object');
checkRange('AWS standard total > 0', stdAws.total, 100, 99999);

// Sum prüfen: total = sum aller Komponenten
const expectedTotal = stdAws.compute + stdAws.db + stdAws.objStorage + stdAws.blockStorage + stdAws.observability;
check('Total = Summe aller Komponenten', stdAws.total, expectedTotal);

// Standard für Azure / GCP
const stdAzure = CloudPricing.calculateStandardWorkload('azure', {});
checkRange('Azure standard total > 0', stdAzure.total, 100, 99999);
const stdGcp = CloudPricing.calculateStandardWorkload('gcp', {});
checkRange('GCP standard total > 0', stdGcp.total, 100, 99999);

// Custom Config
const stdBig = CloudPricing.calculateStandardWorkload('aws', { vcpu: 8, ram: 32, dbSize: 1000 });
checkTrue('Bigger workload total > Standard', stdBig.total > stdAws.total);

// Sovereign Premium
const stdAwsSov = CloudPricing.calculateStandardWorkload('aws-sovereign', {});
checkTrue('aws-sovereign std > aws std', stdAwsSov.total > stdAws.total);
check('aws-sovereign premiumFactor = 1.15', stdAwsSov.premiumFactor, 1.15);
check('aws premiumFactor = 1.0', stdAws.premiumFactor, 1.0);

// === compareProviderPrices (zusätzlich, da public) ===
const cmpRes = CloudPricing.compareProviderPrices('compute', { vcpu: 2, ram: 8 });
checkTrue('compareProviderPrices: Array zurückgegeben', Array.isArray(cmpRes));
checkTrue('compareProviderPrices: nicht leer', cmpRes.length > 0);
checkTrue('compareProviderPrices: aufsteigend sortiert',
    cmpRes.length < 2 || cmpRes[0].price <= cmpRes[cmpRes.length - 1].price);

// Unknown Service-Typ → leeres Array
const cmpUnknownSvc = CloudPricing.compareProviderPrices('xyz_unknown', {});
check('compareProviderPrices unknown svc = []', cmpUnknownSvc, []);

// === compareStandardWorkload (zusätzlich) ===
const cswRes = CloudPricing.compareStandardWorkload({});
checkTrue('compareStandardWorkload: Array zurückgegeben', Array.isArray(cswRes));
checkTrue('compareStandardWorkload: 13 Provider', cswRes.length === 13);
checkTrue('compareStandardWorkload: aufsteigend sortiert',
    cswRes[0].total <= cswRes[cswRes.length - 1].total);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
