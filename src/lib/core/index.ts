/**
 * @fileoverview
 * TR: Zignal core modülünün barrel export dosyası.
 * Temel interface'ler, registry ve factory buradan dışa aktarılır.
 *
 * EN: Barrel export file for Zignal core module.
 * Base interfaces, registry, and factory are exported from here.
 */

// Interfaces
export * from './interfaces';

// Registry
export * from './registry';

// Factory
export * from './factory';

// Form State
export * from './form-state';

// Field Dependencies (Conditional Fields)
export * from './field-dependency';

// Form Persistence (localStorage/sessionStorage)
export * from './form-persistence';

// Async Validation
export * from './async-validator';

// i18n
export * from './i18n';

// Debugging
export * from './debug';

// Expression Parser
export * from './expression-parser';

// Utility Types
export * from './utils';


