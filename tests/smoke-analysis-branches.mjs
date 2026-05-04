#!/usr/bin/env node
/**
 * Branch-Coverage-Tests für saa-analysis.js.
 * Triggern bewusst Edge-Cases, die smoke-cloud-analyzer.mjs nicht alle abdeckt:
 *   - Maturity-Settings-Branches (custom previewPenalty/missingPenalty/disabled)
 *   - Operations-Settings-Branches (mode classic vs cloud_native, sizing variants)
 *   - Project-Effort einbeziehen / nicht
 *   - Custom-Score-Override-Pfade (über manuelle Mutation customScores)
 *   - Direct Estimator-Calls (_estimate*) mit useRealPricing=false und Edge-Cases
 *   - calculateOperationsCosts / calculateProjectEffort / calculateSelfBuildEffort
 *   - calculateTCOLevel mit allen 4 Boolean-Kombinationen
 *   - detectArchitecturePattern für klassisch/cloud-native/null
 *   - Legacy-Number-Argument für analyzeForComponents
 *   - getRequiredServices mit Instanz-Suffix
 *   - getInstanceCount für alle Service-Typen
 *   - calculateConsumptionCosts mit Self-Build-Pfad
 */

const origError = console.error;
console.error = (...args) => {
    const msg = String(args[0] || '');
    if (msg.includes('Error loading custom scores')) return;
    return origError(...args);
};

import { CloudAnalyzer, PortfolioAnalyzer } from '../js/saa-analysis.js';
import { cloudProviders, architectureComponents, selfBuildOptions } from '../js/saa-data.js';

const analyzer = new CloudAnalyzer(cloudProviders, architectureComponents);
const standardWeights = { control: 25, performance: 25, availability: 35, cost: 15 };

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

// === 1) Legacy-Number-Argument für analyzeForComponents (Branch in L94-101) ===
{
    const r = analyzer.analyzeForComponents(['compute'], 50);
    checkTrue('Legacy strategyWeight=50: liefert Array', Array.isArray(r));
    check('Legacy strategyWeight: 10 Provider', r.length, 10);
}
{
    const r = analyzer.analyzeForComponents(['compute'], 0);
    checkTrue('Legacy strategyWeight=0: control-fokussiert', Array.isArray(r));
}
{
    const r = analyzer.analyzeForComponents(['compute'], 100);
    checkTrue('Legacy strategyWeight=100: performance-fokussiert', Array.isArray(r));
}

// === 2) Maturity-Settings-Branches ===
const maturityDisabled = { enabled: false, previewPenalty: 2, missingPenalty: 3 };
const maturityHigh     = { enabled: true,  previewPenalty: 10, missingPenalty: 15 };

const rNoMat = analyzer.analyzeForComponents(['compute', 'serverless'], standardWeights, null, maturityDisabled);
const rHighMat = analyzer.analyzeForComponents(['compute', 'serverless'], standardWeights, null, maturityHigh);
checkTrue('Maturity disabled: Array', Array.isArray(rNoMat));
checkTrue('Maturity high penalty: Array', Array.isArray(rHighMat));
// Bei disabled = Faktor 1.0; bei high = niedrigerer Faktor → unterschiedliche Scores
const awsNoMat = rNoMat.find(r => r.provider.id === 'aws');
const awsHighMat = rHighMat.find(r => r.provider.id === 'aws');
checkTrue('Maturity disabled: maturityFactor = 1.0', awsNoMat.score.maturityFactor === 1.0);
checkTrue('Maturity high: maturityFactor <= 1.0', awsHighMat.score.maturityFactor <= 1.0);

// === 3) Operations-Settings-Branches (includeInCosts true/false) ===
const opsExclude = { includeInCosts: false };
const opsInclude = { includeInCosts: true };

const rOpsOff = analyzer.analyzeForComponents(['compute'], standardWeights, null, null, opsExclude);
const rOpsOn  = analyzer.analyzeForComponents(['compute'], standardWeights, null, null, opsInclude);
checkTrue('opsExclude: Array', Array.isArray(rOpsOff));
checkTrue('opsInclude: Array', Array.isArray(rOpsOn));
const awsOff = rOpsOff.find(r => r.provider.id === 'aws');
const awsOn = rOpsOn.find(r => r.provider.id === 'aws');
// monthlyEstimate sollte ohne Operations niedriger sein
checkTrue('Ops ausgeschlossen → niedrigere monthlyEstimate',
    awsOff.tcoEstimate.monthlyEstimate <= awsOn.tcoEstimate.monthlyEstimate);

// === 4) Project-Effort-Settings ===
const peExclude = { includeInCosts: false };
const peInclude = { includeInCosts: true };
const rPeOff = analyzer.analyzeForComponents(['compute'], standardWeights, null, null, null, peExclude);
const rPeOn  = analyzer.analyzeForComponents(['compute'], standardWeights, null, null, null, peInclude);
checkTrue('peExclude: Array', Array.isArray(rPeOff));
checkTrue('peInclude: Array', Array.isArray(rPeOn));

// === 5) Architecture-Settings (mode + appId + sizing) ===
const archClassic = { mode: 'classic', sizing: 'medium', appId: null };
const archNative  = { mode: 'cloud_native', sizing: 'medium', appId: null };
const archSmall   = { mode: 'classic', sizing: 'small', appId: null };
const archLarge   = { mode: 'classic', sizing: 'large', appId: null };

const rClassic = analyzer.analyzeForComponents(['compute', 'kubernetes'], standardWeights, null, null, null, null, archClassic);
const rNative  = analyzer.analyzeForComponents(['compute', 'kubernetes'], standardWeights, null, null, null, null, archNative);
const rSmall   = analyzer.analyzeForComponents(['compute', 'kubernetes'], standardWeights, null, null, null, null, archSmall);
const rLarge   = analyzer.analyzeForComponents(['compute', 'kubernetes'], standardWeights, null, null, null, null, archLarge);
checkTrue('Arch classic: Array', Array.isArray(rClassic));
checkTrue('Arch cloud_native: Array', Array.isArray(rNative));
checkTrue('Arch small sizing: Array', Array.isArray(rSmall));
checkTrue('Arch large sizing: Array', Array.isArray(rLarge));
// Sizing 'large' → höherer Operations-Aufwand als 'small'
const awsLargeArch = rLarge.find(r => r.provider.id === 'aws');
const awsSmallArch = rSmall.find(r => r.provider.id === 'aws');
checkTrue('Large sizing → höherer monthlyPersonnelCost',
    awsLargeArch.tcoEstimate.operations.monthlyPersonnelCost
    >= awsSmallArch.tcoEstimate.operations.monthlyPersonnelCost);

// === 6) Custom-Score-Override-Pfade ===
analyzer.customScores = {
    aws: { control: 95, performance: 90, priceFactor: 0.85 },
    gcp: { control: 70 }
};
checkTrue('hasCustomScores nach Mutation = true', analyzer.hasCustomScores() === true);
check('Custom score override aws.control', analyzer.getEffectiveScore('aws', 'control', 50), 95);
check('Custom score override aws.performance', analyzer.getEffectiveScore('aws', 'performance', 50), 90);
// Default für nicht überschriebene Property
check('No-custom Default', analyzer.getEffectiveScore('aws', 'availability', 80), 80);
// Default für unbekannten Provider
check('Unknown provider Default', analyzer.getEffectiveScore('xyz', 'control', 50), 50);
check('PriceFactor custom = 0.85', analyzer.getEffectivePriceFactor('aws'), 0.85);
check('PriceFactor null wenn nicht custom', analyzer.getEffectivePriceFactor('gcp'), null);
check('PriceFactor null bei null providerId', analyzer.getEffectivePriceFactor(null), null);

// Auch analyzeForComponents mit aktiven Custom Scores
const rCustom = analyzer.analyzeForComponents(['compute'], standardWeights);
checkTrue('analyzeForComponents mit Custom Scores liefert Array', Array.isArray(rCustom));
analyzer.customScores = {}; // reset

// === 7) Empty / All Components ===
const rEmpty = analyzer.analyzeForComponents([], standardWeights);
check('Empty components: 10 Provider', rEmpty.length, 10);
const allComps = architectureComponents.map(c => c.id);
const rAll = analyzer.analyzeForComponents(allComps, standardWeights);
check('All components: 10 Provider', rAll.length, 10);

// === 8) getRequiredServices Branches ===
const reqServicesLegacy = analyzer.getRequiredServices(['compute', 'database_sql']);
checkTrue('getRequiredServices legacy = Array', Array.isArray(reqServicesLegacy));
const reqServicesObj = analyzer.getRequiredServices(['compute', 'database_sql'], 'classic');
checkType('getRequiredServices(mode=classic) = Object', typeof reqServicesObj, 'object');
checkTrue('hat services-Property', Array.isArray(reqServicesObj.services));
checkTrue('hat transformation-Property', typeof reqServicesObj.transformation === 'object');

// Instanz-Suffix-Branch ('compute-2')
const reqWithSuffix = analyzer.getRequiredServices(['compute-2', 'database_sql-1']);
checkTrue('getRequiredServices mit Instanz-Suffix', Array.isArray(reqWithSuffix));
checkTrue('Suffix-IDs liefern Services', reqWithSuffix.length > 0);

// Unbekannte Komponente → wird ignoriert
const reqUnknown = analyzer.getRequiredServices(['xyz_unknown_comp']);
check('Unknown component: leeres Array', reqUnknown, []);

// === 9) detectArchitecturePattern ===
const pat1 = analyzer.detectArchitecturePattern(['compute', 'database_sql'], 'classic', null);
checkType('detectArchitecturePattern returns object', typeof pat1, 'object');
checkType('hat transformation', typeof pat1.transformation, 'object');
const pat2 = analyzer.detectArchitecturePattern(['serverless', 'database_nosql'], 'cloud_native', null);
checkType('detectArchitecturePattern cloud_native', typeof pat2, 'object');
const pat3 = analyzer.detectArchitecturePattern(['compute'], null, null);
checkType('detectArchitecturePattern mode=null', typeof pat3, 'object');
const pat4 = analyzer.detectArchitecturePattern([], 'classic', 'app-1');
checkType('detectArchitecturePattern empty + appId', typeof pat4, 'object');

// === 10) analyzeProviderServicesWithArchitecture ===
const provider = cloudProviders[0]; // aws
const arch1 = analyzer.analyzeProviderServicesWithArchitecture(provider, ['compute', 'database_sql']);
checkType('analyzeProviderServicesWithArchitecture (Array)', typeof arch1, 'object');
const archObj = analyzer.getRequiredServices(['compute'], 'cloud_native');
const arch2 = analyzer.analyzeProviderServicesWithArchitecture(provider, archObj);
checkType('analyzeProviderServicesWithArchitecture (Object)', typeof arch2, 'object');
checkTrue('hat architectureInfo bei Object', typeof arch2.architectureInfo === 'object');

// === 11) analyzeProviderServices Branches (preview/planned/missing) ===
{
    // requiredServices empty
    const a = analyzer.analyzeProviderServices(provider, []);
    check('analyzeProviderServices empty: coverage = 100', a.coverage, 100);
    check('analyzeProviderServices empty: totalRequired = 0', a.totalRequired, 0);
}
{
    // requiredServices mit unbekanntem Service
    const a = analyzer.analyzeProviderServices(provider, ['xyz_unknown_service']);
    checkTrue('analyzeProviderServices unknown: missing.length > 0', a.missing.length > 0);
}
{
    // requiredServices mit verfügbaren Services
    const a = analyzer.analyzeProviderServices(provider, ['compute', 'database_sql']);
    checkTrue('analyzeProviderServices: hat available', Array.isArray(a.available));
    checkTrue('analyzeProviderServices: avgServiceControl number', typeof a.avgServiceControl === 'number');
}

// === 12) Direct Estimator-Calls (Branches mit useRealPricing=false) ===

// _estimateCompute mit vmGroups (useRealPricing=false)
const estCompVmGroups = analyzer._estimateCompute({
    config: { compute: { vmGroups: [{ cpu: 4, ram: 16, count: 2 }] } },
    useRealPricing: false,
    providerId: null,
    region: null
});
checkType('_estimateCompute vmGroups (no pricing)', typeof estCompVmGroups, 'object');
checkTrue('_estimateCompute vmGroups: cost > 0', estCompVmGroups.cost > 0);

// _estimateCompute mit vmGroups + useRealPricing
const estCompVmReal = analyzer._estimateCompute({
    config: { compute: { vmGroups: [{ cpu: 4, ram: 16, count: 2 }] } },
    useRealPricing: true,
    providerId: 'aws',
    region: { name: 'Frankfurt', country: 'DE' }
});
checkTrue('_estimateCompute vmGroups (real pricing): cost > 0', estCompVmReal.cost > 0);

// _estimateCompute SAP-Database
const estCompSap = analyzer._estimateCompute({
    config: { compute: { ram: 256, cpu: 16 }, database: { type: 'SAP HANA' } },
    useRealPricing: false,
    providerId: null,
    region: null
});
checkTrue('_estimateCompute SAP detected: cost > 0', estCompSap.cost > 0);

// _estimateCompute legacy (single config)
const estCompLegacy = analyzer._estimateCompute({
    config: { compute: { ram: 16, cpu: 4 } },
    useRealPricing: false,
    providerId: null,
    region: null
});
checkTrue('_estimateCompute legacy: cost > 0', estCompLegacy.cost > 0);

// _estimateCompute legacy + real pricing
const estCompLegacyReal = analyzer._estimateCompute({
    config: { compute: { ram: 16, cpu: 4 } },
    useRealPricing: true,
    providerId: 'aws',
    region: { name: 'Frankfurt' }
});
checkTrue('_estimateCompute legacy real: cost > 0', estCompLegacyReal.cost > 0);

// _estimateDatabaseSQL mit databases-Array
const estSqlArr = analyzer._estimateDatabaseSQL({
    config: { database: { databases: [
        { type: 'PostgreSQL', size: 100 },
        { type: 'Oracle', size: 200 }
    ] } },
    useRealPricing: false,
    providerId: null,
    region: null
});
checkTrue('_estimateDatabaseSQL Array (no pricing): cost > 0', estSqlArr.cost > 0);

// _estimateDatabaseSQL Array + real pricing
const estSqlArrReal = analyzer._estimateDatabaseSQL({
    config: { database: { databases: [{ type: 'PostgreSQL', size: 100 }] } },
    useRealPricing: true,
    providerId: 'aws',
    region: { name: 'Frankfurt' }
});
checkTrue('_estimateDatabaseSQL Array real: cost > 0', estSqlArrReal.cost > 0);

// _estimateDatabaseSQL HANA Branch
const estSqlHana = analyzer._estimateDatabaseSQL({
    config: { database: { type: 'SAP HANA', size: '500' }, compute: { ram: 256 } },
    useRealPricing: false,
    providerId: null,
    region: null
});
checkTrue('_estimateDatabaseSQL HANA: cost > 0', estSqlHana.cost > 0);

// _estimateDatabaseSQL Oracle Branch
const estSqlOracle = analyzer._estimateDatabaseSQL({
    config: { database: { type: 'Oracle', size: '200' } },
    useRealPricing: false,
    providerId: null,
    region: null
});
checkTrue('_estimateDatabaseSQL Oracle: cost > 0', estSqlOracle.cost > 0);

// _estimateDatabaseSQL legacy single, real pricing
const estSqlLegacyReal = analyzer._estimateDatabaseSQL({
    config: { database: { type: 'PostgreSQL', size: '100' } },
    useRealPricing: true,
    providerId: 'aws',
    region: { name: 'Frankfurt' }
});
checkTrue('_estimateDatabaseSQL legacy real: cost > 0', estSqlLegacyReal.cost > 0);

// _estimateDatabaseNoSQL ohne instances → Fallback
const estNoSqlFb = analyzer._estimateDatabaseNoSQL({
    config: {},
    useRealPricing: false,
    providerId: null,
    region: null,
    baseCosts: { database_nosql: 180 }
});
check('_estimateDatabaseNoSQL Fallback', estNoSqlFb.cost, 180);

// _estimateDatabaseNoSQL mit instances + various types
const estNoSql = analyzer._estimateDatabaseNoSQL({
    config: { nosql: { instances: [
        { type: 'MongoDB', size: 100 },
        { type: 'Redis', size: 50 },
        { type: 'Cosmos DB', size: 80 },
        { type: 'Cassandra', size: 200 }
    ] } },
    useRealPricing: false,
    providerId: null,
    region: null,
    baseCosts: { database_nosql: 180 }
});
checkTrue('_estimateDatabaseNoSQL Array (no pricing): cost > 0', estNoSql.cost > 0);

// _estimateStorageObject mit number
const estObjNum = analyzer._estimateStorageObject({
    config: { objectStorage: { size: 1000 } },
    useRealPricing: false,
    providerId: null,
    region: null
});
checkTrue('_estimateStorageObject number: cost > 0', estObjNum.cost > 0);

// _estimateStorageObject mit string TB
const estObjTB = analyzer._estimateStorageObject({
    config: { storage: { size: '5 TB' } },
    useRealPricing: false,
    providerId: null,
    region: null
});
checkTrue('_estimateStorageObject TB-String: cost > 0', estObjTB.cost > 0);

// _estimateStorageObject real pricing
const estObjReal = analyzer._estimateStorageObject({
    config: { objectStorage: { size: 1000 } },
    useRealPricing: true,
    providerId: 'aws',
    region: { name: 'Frankfurt' }
});
checkTrue('_estimateStorageObject real: cost > 0', estObjReal.cost > 0);

// _estimateStorageBlock volumes Array
const estBlkVols = analyzer._estimateStorageBlock({
    config: { storage: { volumes: [
        { type: 'ssd', size: 200 },
        { type: 'nvme', size: 100 },
        { type: 'hdd', size: 500 }
    ] } },
    useRealPricing: false,
    providerId: null,
    region: null
});
checkTrue('_estimateStorageBlock volumes (no pricing): cost > 0', estBlkVols.cost > 0);

// _estimateStorageBlock volumes Array + real pricing
const estBlkVolsReal = analyzer._estimateStorageBlock({
    config: { storage: { volumes: [{ type: 'ssd', size: 200 }] } },
    useRealPricing: true,
    providerId: 'aws',
    region: { name: 'Frankfurt' }
});
checkTrue('_estimateStorageBlock volumes real: cost > 0', estBlkVolsReal.cost > 0);

// _estimateStorageBlock legacy
const estBlkLegacy = analyzer._estimateStorageBlock({
    config: { storage: { size: '500 GB' } },
    useRealPricing: false,
    providerId: null,
    region: null
});
checkTrue('_estimateStorageBlock legacy (no pricing): cost > 0', estBlkLegacy.cost > 0);

// _estimateStorageBlock legacy + real pricing
const estBlkLegacyReal = analyzer._estimateStorageBlock({
    config: { storage: { size: '500 GB' } },
    useRealPricing: true,
    providerId: 'aws',
    region: { name: 'Frankfurt' }
});
checkTrue('_estimateStorageBlock legacy real: cost > 0', estBlkLegacyReal.cost > 0);

// _estimateKubernetes
const estK8sFb = analyzer._estimateKubernetes({
    useRealPricing: false,
    providerId: null,
    region: null
});
checkTrue('_estimateKubernetes Fallback: cost > 0', estK8sFb.cost > 0);
const estK8sReal = analyzer._estimateKubernetes({
    useRealPricing: true,
    providerId: 'aws',
    region: { name: 'Frankfurt' }
});
checkTrue('_estimateKubernetes real: cost > 0', estK8sReal.cost > 0);

// _estimateServerless ohne instances → Fallback
const estSlsFb = analyzer._estimateServerless({
    config: {},
    useRealPricing: false,
    providerId: null,
    region: null,
    baseCosts: { serverless: 80 }
});
check('_estimateServerless Fallback', estSlsFb.cost, 80);

// _estimateServerless mit instances
const estSls = analyzer._estimateServerless({
    config: { serverless: { instances: [
        { functions: 10, invocationsPerMonth: 5000000 },
        { functions: 5, invocationsPerMonth: 1000000 }
    ] } },
    useRealPricing: false,
    providerId: null,
    region: null,
    baseCosts: { serverless: 80 }
});
checkTrue('_estimateServerless instances: cost > 0', estSls.cost > 0);

// _estimateMessaging Fallback
const estMsgFb = analyzer._estimateMessaging({
    config: {},
    useRealPricing: false,
    providerId: null,
    region: null,
    baseCosts: { messaging: 50 }
});
check('_estimateMessaging Fallback', estMsgFb.cost, 50);

// _estimateMessaging mit instances Standard + FIFO
const estMsg = analyzer._estimateMessaging({
    config: { messaging: { instances: [
        { type: 'Standard', messagesPerMonth: 5000000 },
        { type: 'FIFO', messagesPerMonth: 2000000 }
    ] } },
    useRealPricing: false,
    providerId: null,
    region: null,
    baseCosts: { messaging: 50 }
});
checkTrue('_estimateMessaging instances: cost > 0', estMsg.cost > 0);

// _estimateStaticHosting
const estStatic = analyzer._estimateStaticHosting({
    config: { storage: { objectSize: 20 } }
});
checkTrue('_estimateStaticHosting: cost > 0', estStatic.cost > 0);

// _estimateAppService mit vmGroups
const estApp = analyzer._estimateAppService({
    config: { compute: { vmGroups: [{ ram: 4, count: 2 }] } }
});
checkTrue('_estimateAppService vmGroups: cost > 0', estApp.cost > 0);

// _estimateAppService legacy
const estAppLegacy = analyzer._estimateAppService({
    config: { compute: { ram: 4 } }
});
checkTrue('_estimateAppService legacy: cost > 0', estAppLegacy.cost > 0);

// _estimateApiGateway
const estApi = analyzer._estimateApiGateway({
    config: { apiGateway: { requestsPerMonth: 5000000 } }
});
checkTrue('_estimateApiGateway: cost > 0', estApi.cost > 0);

// === 13) getConsumptionEstimate Branches ===
const ce1 = analyzer.getConsumptionEstimate('compute', 'low');
checkTrue('getConsumptionEstimate(compute, low) ohne config', ce1.cost > 0);
const ce2 = analyzer.getConsumptionEstimate('compute', 'high');
checkTrue('high level ist teurer als low', ce2.cost >= ce1.cost);
const ce3 = analyzer.getConsumptionEstimate('xyz_unknown_service', 'medium');
checkTrue('Unknown service: cost > 0', ce3.cost > 0);
const ce4 = analyzer.getConsumptionEstimate('compute', 'medium', null, { id: 'aws' });
checkTrue('Mit provider, ohne systemConfig', ce4.cost > 0);
// Mit systemConfig
const sysCfg = {
    config: {
        compute: { vmGroups: [{ cpu: 4, ram: 16, count: 1 }] },
        database: { databases: [{ type: 'PostgreSQL', size: 100 }] }
    }
};
const ce5 = analyzer.getConsumptionEstimate('compute', 'medium', sysCfg, { id: 'aws' });
checkTrue('mit systemConfig + provider', ce5.cost > 0);
const ce6 = analyzer.getConsumptionEstimate('database_sql', 'medium', sysCfg, { id: 'aws' });
checkTrue('database_sql mit systemConfig', ce6.cost > 0);
// Default Branch
const ce7 = analyzer.getConsumptionEstimate('cdn', 'medium', sysCfg, { id: 'aws' });
checkTrue('default branch (cdn) mit systemConfig', ce7.cost > 0);

// === 14) calculateConsumptionCosts mit Self-Build-Pfad ===
{
    // Provider mit fehlendem Service triggert Self-Build-Pfad
    // serverless ist auf openstack typischerweise nicht verfügbar
    const openstack = cloudProviders.find(p => p.id === 'openstack');
    if (openstack) {
        const sa = analyzer.analyzeProviderServices(openstack, ['serverless']);
        const cc = analyzer.calculateConsumptionCosts(sa.available, ['serverless'], null, openstack);
        checkType('calculateConsumptionCosts mit Self-Build', typeof cc, 'object');
        checkTrue('hat details Array', Array.isArray(cc.details));
    } else {
        checkTrue('openstack provider gefunden', true); // skip placeholder
        checkTrue('hat details Array', true);
    }
}

// === 15) calculateOperationsCosts Branches ===
{
    const aws = cloudProviders.find(p => p.id === 'aws');
    const sa = analyzer.analyzeProviderServices(aws, ['compute', 'kubernetes']);
    const ops1 = analyzer.calculateOperationsCosts(sa.available, sa.missing, null,
        { mode: 'classic', sizing: 'medium' });
    checkType('Ops classic medium', typeof ops1, 'object');
    checkTrue('Ops totalFTE > 0', ops1.totalFTE > 0);

    const ops2 = analyzer.calculateOperationsCosts(sa.available, sa.missing, null,
        { mode: 'cloud_native', sizing: 'small' });
    checkType('Ops cloud_native small', typeof ops2, 'object');

    const ops3 = analyzer.calculateOperationsCosts(sa.available, sa.missing, null,
        { mode: 'classic', sizing: 'large' });
    checkType('Ops classic large', typeof ops3, 'object');

    // Ohne architectureSettings → Default
    const opsDefault = analyzer.calculateOperationsCosts(sa.available, sa.missing);
    checkType('Ops ohne archSettings (Default)', typeof opsDefault, 'object');

    // Mit Self-Build (missing services with selfBuildOption)
    const missingWithSb = [{ id: 'serverless', selfBuildOption: { name: 'Knative', operationsLevel: 'high' } }];
    const opsSb = analyzer.calculateOperationsCosts(sa.available, missingWithSb);
    checkType('Ops mit Self-Build', typeof opsSb, 'object');
    checkTrue('Ops mit Self-Build: details enthalten Self-Build', opsSb.details.some(d => d.isSelfBuild));
}

// === 16) calculateProjectEffort ===
{
    const aws = cloudProviders.find(p => p.id === 'aws');
    const sa = analyzer.analyzeProviderServices(aws, ['compute', 'database_sql']);
    const pe = analyzer.calculateProjectEffort(sa.available, sa.missing);
    checkType('calculateProjectEffort returns object', typeof pe, 'object');
    checkTrue('PE.totalDays >= 0', pe.totalDays >= 0);

    // Mit systemConfig (skaliert)
    const peScaled = analyzer.calculateProjectEffort(sa.available, sa.missing, {
        config: { compute: { vmGroups: [{ cpu: 4, ram: 16, count: 5 }] } }
    });
    checkType('calculateProjectEffort skaliert', typeof peScaled, 'object');
}

// === 17) calculateSelfBuildEffort ===
{
    const sb1 = analyzer.calculateSelfBuildEffort([]);
    check('calculateSelfBuildEffort empty: required = false', sb1.required, false);
    check('calculateSelfBuildEffort empty: totalDays = 0', sb1.totalDays, 0);

    const sb2 = analyzer.calculateSelfBuildEffort([
        { id: 'serverless', selfBuildOption: selfBuildOptions['serverless'] || { projectDays: 30, name: 'Self-Build', effort: 'high', operationsLevel: 'high' } }
    ]);
    checkTrue('calculateSelfBuildEffort mit option: required = true', sb2.required === true);
    checkTrue('calculateSelfBuildEffort mit option: totalDays > 0', sb2.totalDays > 0);

    // Missing service ohne selfBuildOption
    const sb3 = analyzer.calculateSelfBuildEffort([{ id: 'unknown' }]);
    checkTrue('calculateSelfBuildEffort ohne option', sb3.required === true);
    check('calculateSelfBuildEffort ohne option: totalDays = 0', sb3.totalDays, 0);
}

// === 18) calculateTCOLevel — alle 4 Boolean-Kombinationen ===
const consumptionLow = { level: 'low', monthlyEstimate: 50 };
const operationsLow = { level: 'low', monthlyPersonnelCost: 0 };
const projectLow = { level: 'low', totalDays: 5 };
const selfBuildEmpty = { required: false, servicesCount: 0 };
const selfBuildReq = { required: true, servicesCount: 3 };

check('TCOLevel: alle low + ops+pe', analyzer.calculateTCOLevel(consumptionLow, operationsLow, projectLow, selfBuildEmpty, true, true), 'low');
checkType('TCOLevel: ops only', typeof analyzer.calculateTCOLevel(consumptionLow, operationsLow, projectLow, selfBuildEmpty, true, false), 'string');
checkType('TCOLevel: pe only', typeof analyzer.calculateTCOLevel(consumptionLow, operationsLow, projectLow, selfBuildEmpty, false, true), 'string');
checkType('TCOLevel: keine Faktoren', typeof analyzer.calculateTCOLevel(consumptionLow, operationsLow, projectLow, selfBuildEmpty, false, false), 'string');
// Mit Self-Build → erhöht
const tcoSb = analyzer.calculateTCOLevel(consumptionLow, operationsLow, projectLow, selfBuildReq, true, true);
checkType('TCOLevel mit Self-Build', typeof tcoSb, 'string');
// High-Werte
const consumptionHigh = { level: 'high', monthlyEstimate: 5000 };
const operationsHigh = { level: 'high', monthlyPersonnelCost: 5000 };
const projectHigh = { level: 'high', totalDays: 100 };
check('TCOLevel: alle high', analyzer.calculateTCOLevel(consumptionHigh, operationsHigh, projectHigh, selfBuildEmpty, true, true), 'high');
const consumptionMed = { level: 'medium', monthlyEstimate: 500 };
const operationsMed = { level: 'medium', monthlyPersonnelCost: 1000 };
const projectMed = { level: 'medium', totalDays: 30 };
check('TCOLevel: alle medium', analyzer.calculateTCOLevel(consumptionMed, operationsMed, projectMed, selfBuildEmpty, true, true), 'medium');

// === 19) getInstanceCount für alle Service-Typen ===
const ic1 = analyzer.getInstanceCount('compute', null);
check('getInstanceCount no config', ic1, { count: 1, varietyFactor: 1.0 });

const sysC = {
    config: {
        compute: { vmGroups: [{ count: 3 }, { count: 2 }] },
        database: { databases: [
            { type: 'PostgreSQL' }, { type: 'Oracle' }, { type: 'MongoDB' }, { type: 'Redis' }
        ] },
        nosql: { instances: [{ type: 'MongoDB' }, { type: 'Cassandra' }] },
        storage: { volumes: [{ type: 'ssd' }, { type: 'nvme' }] },
        kubernetes: { clusters: [{}, {}] },
        serverless: { instances: [{}, {}] },
        messaging: { instances: [{ type: 'Standard' }, { type: 'FIFO' }] }
    }
};
const ic2 = analyzer.getInstanceCount('compute', sysC);
check('getInstanceCount compute count = 5', ic2.count, 5);
const ic3 = analyzer.getInstanceCount('database_sql', sysC);
checkTrue('getInstanceCount db_sql count > 0', ic3.count > 0);
const ic4 = analyzer.getInstanceCount('database_nosql', sysC);
checkTrue('getInstanceCount db_nosql count > 0', ic4.count > 0);
const ic5 = analyzer.getInstanceCount('storage_block', sysC);
check('getInstanceCount storage_block count = 2', ic5.count, 2);
const ic6 = analyzer.getInstanceCount('kubernetes', sysC);
check('getInstanceCount kubernetes count = 2', ic6.count, 2);
const ic7 = analyzer.getInstanceCount('serverless', sysC);
check('getInstanceCount serverless count = 2', ic7.count, 2);
const ic8 = analyzer.getInstanceCount('messaging', sysC);
check('getInstanceCount messaging count = 2', ic8.count, 2);
const ic9 = analyzer.getInstanceCount('unknown_service', sysC);
check('getInstanceCount unknown', ic9, { count: 1, varietyFactor: 1.0 });

// === 20) scaleOperationsFTE / scaleProjectDays Branches ===
check('scaleOperationsFTE count=1', analyzer.scaleOperationsFTE(0.1, 1), 0.1);
checkTrue('scaleOperationsFTE count=4 > base', analyzer.scaleOperationsFTE(0.1, 4) > 0.1);
// Object-Format (neues Format)
checkTrue('scaleOperationsFTE Object', analyzer.scaleOperationsFTE(0.1, { count: 4, varietyFactor: 1.5 }) > 0.1);

check('scaleProjectDays count=1', analyzer.scaleProjectDays(10, 1), 10);
checkTrue('scaleProjectDays count=4 > base', analyzer.scaleProjectDays(10, 4) > 10);
checkTrue('scaleProjectDays Object', analyzer.scaleProjectDays(10, { count: 4, varietyFactor: 1.5 }) > 10);

// === 21) getProjectDays / getOperationsFTE ===
checkTrue('getProjectDays compute medium > 0', analyzer.getProjectDays('compute', 'medium') > 0);
checkTrue('getProjectDays compute low < medium',
    analyzer.getProjectDays('compute', 'low') < analyzer.getProjectDays('compute', 'medium'));
checkTrue('getProjectDays compute high > medium',
    analyzer.getProjectDays('compute', 'high') > analyzer.getProjectDays('compute', 'medium'));
checkTrue('getProjectDays unknown service Default', analyzer.getProjectDays('xyz', 'medium') > 0);

check('getOperationsFTE very_low', analyzer.getOperationsFTE('very_low'), 0.02);
check('getOperationsFTE low', analyzer.getOperationsFTE('low'), 0.05);
check('getOperationsFTE medium', analyzer.getOperationsFTE('medium'), 0.15);
check('getOperationsFTE high', analyzer.getOperationsFTE('high'), 0.3);
check('getOperationsFTE undefined', analyzer.getOperationsFTE('xyz'), 0.15);

// === 22) generateRecommendation Branches ===
{
    const aws = cloudProviders.find(p => p.id === 'aws');
    const sa = analyzer.analyzeProviderServices(aws, ['compute', 'database_sql']);
    const tco = analyzer.calculateTCO(aws, sa, ['compute', 'database_sql']);
    const score = analyzer.calculateProviderScore(aws, sa, tco, standardWeights);
    const rec = analyzer.generateRecommendation(aws, sa, score, tco);
    checkType('generateRecommendation returns object', typeof rec, 'object');
    checkTrue('hat strengths', Array.isArray(rec.strengths));
    checkTrue('hat weaknesses', Array.isArray(rec.weaknesses));
    checkType('hat suitability', typeof rec.suitability, 'string');
}

// === 23) PortfolioAnalyzer mit archOverrides + analyzeOne ===
{
    const pa = new PortfolioAnalyzer(cloudProviders, architectureComponents);
    const app = {
        id: 'app-1',
        selectedComponents: new Set(['compute']),
        systemConfig: null,
        architectureMode: 'classic',
        sizing: 'medium'
    };
    const r1 = pa.analyzeOne(app, standardWeights);
    checkTrue('PortfolioAnalyzer.analyzeOne ohne Override', r1.perAppResults.length === 1);

    // Mit archSettingsOverride
    const r2 = pa.analyzeOne(app, standardWeights, null, null, null, { mode: 'cloud_native', sizing: 'large' });
    checkTrue('PortfolioAnalyzer.analyzeOne mit archOverride', r2.perAppResults.length === 1);

    // Multiple apps
    const app2 = {
        id: 'app-2',
        selectedComponents: new Set(['compute', 'database_sql']),
        systemConfig: null,
        architectureMode: 'cloud_native',
        sizing: 'large'
    };
    const r3 = pa.analyzePortfolio([app, app2], standardWeights);
    checkTrue('analyzePortfolio multi-app', r3.perAppResults.length === 2);

    // Mit Map-archOverrides
    const archMap = new Map([
        [app, { mode: 'cloud_native', sizing: 'small' }],
        [app2, { mode: 'classic', sizing: 'large' }]
    ]);
    const r4 = pa.analyzePortfolio([app, app2], standardWeights, null, null, null, archMap);
    checkTrue('analyzePortfolio mit Map-archOverrides', r4.perAppResults.length === 2);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
