/**
 * @fileoverview
 * TR: UI adaptör sistemi barrel export dosyası.
 * EN: UI adapter system barrel export file.
 */

// Interfaces
export * from './ui-adapter.interface';

// Base
export * from './base-adapter';

// Adapters
export * from './native-adapter';
export * from './material-adapter';
export * from './primeng-adapter';

// Registry & DI
export * from './adapter-registry';
