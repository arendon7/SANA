export type InventoryApplicationTrust = 'DEMO_RECONSTRUCTED' | 'CANONICAL_RUNTIME';
export type InventoryUnit = 'L' | 'KG' | 'UND';
export interface InventoryLotRef { tenantId: string; inventoryLotId: string; sku: string; productName: string; batchCode: string; unit: InventoryUnit; canonicalAvailable: number; minimumLevel: number; }
export interface ApplicationContext { farmId: string; plotId: string; cropCycleId: string; taskId: string; planAction: string; operatorId: string; evidenceId: string; }
export interface LocalInventoryConsumptionEnvelope { kind: 'LOCAL_INVENTORY_CONSUMPTION_RECORDED'; localOnly: true; inventoryLotId: string; sku: string; quantity: number; unit: InventoryUnit; projectedAvailableAfter: number; context: ApplicationContext; createdAt: string; }
export const FIELD_INVENTORY_ROUTE = '/field/inventory';
export const FIELD_APPLICATION_ROUTE = '/field/inventory/:inventoryLotId/apply';
