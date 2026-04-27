/**
 * Provider-spezifische Service-Mappings.
 *
 * Bisher hardcoded als if-Branches in saa-analysis.js#_estimateDatabaseNoSQL.
 * Datengetrieben sauberer und erweiterbar.
 *
 * @module modules/provider-service-mapping
 */

/**
 * NoSQL-Service-Lookup je Provider.
 * Key: Substring im User-DB-Typ (lowercase), Value: Pfad in CloudPricing.database.nosql[providerId]
 *
 * Beispiel: User schreibt „DynamoDB" → matched 'dynamo' → AWS-Pfad 'dynamodb'.
 */
export const PROVIDER_NOSQL_LOOKUP = Object.freeze({
    aws:   { 'dynamo': 'dynamodb' },
    azure: { 'cosmos': 'cosmosdb' },
    gcp:   { 'firestore': 'firestore' }
});

/**
 * Liefert den Pfad-Key des passenden NoSQL-Services oder null.
 *
 * @param {string} providerId
 * @param {string} userDbType - z.B. „DynamoDB", „Cosmos DB"
 * @returns {string|null}
 */
export function getNosqlServiceKey(providerId, userDbType) {
    const lookup = PROVIDER_NOSQL_LOOKUP[providerId];
    if (!lookup) return null;
    const lower = userDbType.toLowerCase();
    for (const [keyword, serviceKey] of Object.entries(lookup)) {
        if (lower.includes(keyword)) return serviceKey;
    }
    return null;
}
