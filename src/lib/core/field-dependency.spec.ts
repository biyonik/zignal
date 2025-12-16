import { signal } from '@angular/core';
import {
    DependencyResolver,
    FieldDependency,
    DependencyPatterns,
    DependencyContext
} from './field-dependency';

/**
 * DependencyResolver (The Dependency Orchestrator) - Extreme Hard Core Tests
 *
 * Bu test dosyası alan bağımlılıkları sistemini test eder:
 * - Görünürlük koşulları (showWhen)
 * - Aktiflik koşulları (enableWhen)
 * - Hesaplanmış değerler (compute)
 * - Döngüsel bağımlılık tespiti
 * - Bağımlılık kalıpları (DependencyPatterns)
 *
 * NOT: Angular'ın effect() fonksiyonu test ortamında farklı davranabilir.
 * Bu testler temel mantığı ve hata durumlarını test eder.
 */
describe('DependencyResolver (The Dependency Orchestrator) Hard Core Tests', () => {

    let resolver: DependencyResolver;

    beforeEach(() => {
        resolver = new DependencyResolver();
    });

    afterEach(() => {
        resolver.cleanup();
    });

    // ==========================================================================
    // 1. BASIC REGISTRATION
    // ==========================================================================
    describe('Basic Registration', () => {

        it('should register single dependency', () => {
            const dependency: FieldDependency = {
                dependsOn: ['country'],
                showWhen: (values) => values['country'] === 'TR'
            };

            resolver.register('city', dependency);

            expect(resolver.getDependencies('city')).toEqual(['country']);
        });

        it('should register multiple dependencies for same field', () => {
            const dependency: FieldDependency = {
                dependsOn: ['a', 'b', 'c'],
                showWhen: (values) => !!values['a'] && !!values['b'] && !!values['c']
            };

            resolver.register('target', dependency);

            expect(resolver.getDependencies('target')).toEqual(['a', 'b', 'c']);
        });

        it('should registerAll multiple fields at once', () => {
            const dependencies = {
                city: {
                    dependsOn: ['country'],
                    showWhen: (values: Record<string, unknown>) => values['country'] === 'TR'
                },
                state: {
                    dependsOn: ['country'],
                    showWhen: (values: Record<string, unknown>) => values['country'] === 'US'
                },
                province: {
                    dependsOn: ['country'],
                    showWhen: (values: Record<string, unknown>) => values['country'] === 'CA'
                }
            };

            resolver.registerAll(dependencies);

            expect(resolver.getDependencies('city')).toEqual(['country']);
            expect(resolver.getDependencies('state')).toEqual(['country']);
            expect(resolver.getDependencies('province')).toEqual(['country']);
        });

        it('should return empty array for non-registered field', () => {
            expect(resolver.getDependencies('nonexistent')).toEqual([]);
        });
    });

    // ==========================================================================
    // 2. DEPENDENT TRACKING (Reverse Lookup)
    // ==========================================================================
    describe('Dependent Tracking', () => {

        it('should track which fields depend on a given field', () => {
            resolver.register('city', {
                dependsOn: ['country'],
                showWhen: () => true
            });

            resolver.register('state', {
                dependsOn: ['country'],
                showWhen: () => true
            });

            resolver.register('postalCode', {
                dependsOn: ['city'],
                showWhen: () => true
            });

            const countryDependents = resolver.getDependents('country');
            expect(countryDependents).toContain('city');
            expect(countryDependents).toContain('state');
            expect(countryDependents).not.toContain('postalCode');

            const cityDependents = resolver.getDependents('city');
            expect(cityDependents).toContain('postalCode');
        });

        it('should return empty array if no dependents', () => {
            resolver.register('orphan', {
                dependsOn: ['something'],
                showWhen: () => true
            });

            expect(resolver.getDependents('orphan')).toEqual([]);
        });
    });

    // ==========================================================================
    // 3. CIRCULAR DEPENDENCY DETECTION
    // ==========================================================================
    describe('Circular Dependency Detection', () => {

        it('should detect simple circular dependency (A -> B -> A)', () => {
            resolver.register('fieldA', {
                dependsOn: ['fieldB'],
                showWhen: () => true
            });

            resolver.register('fieldB', {
                dependsOn: ['fieldA'],
                showWhen: () => true
            });

            expect(resolver.hasCircularDependency()).toBe(true);
        });

        it('should detect complex circular dependency (A -> B -> C -> A)', () => {
            resolver.register('a', {
                dependsOn: ['b'],
                showWhen: () => true
            });

            resolver.register('b', {
                dependsOn: ['c'],
                showWhen: () => true
            });

            resolver.register('c', {
                dependsOn: ['a'],
                showWhen: () => true
            });

            expect(resolver.hasCircularDependency()).toBe(true);
        });

        it('should not falsely detect circular in valid chain (A -> B -> C)', () => {
            resolver.register('a', {
                dependsOn: ['b'],
                showWhen: () => true
            });

            resolver.register('b', {
                dependsOn: ['c'],
                showWhen: () => true
            });

            // c has no dependencies, chain is valid
            expect(resolver.hasCircularDependency()).toBe(false);
        });

        it('should not falsely detect circular when multiple fields depend on same source', () => {
            // Diamond pattern: A -> B, A -> C, B -> D, C -> D
            resolver.register('b', {
                dependsOn: ['a'],
                showWhen: () => true
            });

            resolver.register('c', {
                dependsOn: ['a'],
                showWhen: () => true
            });

            resolver.register('d', {
                dependsOn: ['b', 'c'],
                showWhen: () => true
            });

            expect(resolver.hasCircularDependency()).toBe(false);
        });

        it('should find circular dependency chains', () => {
            resolver.register('x', {
                dependsOn: ['y'],
                showWhen: () => true
            });

            resolver.register('y', {
                dependsOn: ['z'],
                showWhen: () => true
            });

            resolver.register('z', {
                dependsOn: ['x'],
                showWhen: () => true
            });

            const cycles = resolver.findCircularDependencies();

            expect(cycles.length).toBeGreaterThan(0);
            // Cycle should contain x, y, z
            const cycleFields = cycles.flat();
            expect(cycleFields).toContain('x');
            expect(cycleFields).toContain('y');
            expect(cycleFields).toContain('z');
        });

        it('should return empty array when no circular dependencies', () => {
            resolver.register('child', {
                dependsOn: ['parent'],
                showWhen: () => true
            });

            const cycles = resolver.findCircularDependencies();

            expect(cycles).toEqual([]);
        });

        it('should detect self-referencing dependency', () => {
            resolver.register('selfRef', {
                dependsOn: ['selfRef'],
                showWhen: () => true
            });

            expect(resolver.hasCircularDependency()).toBe(true);
        });
    });

    // ==========================================================================
    // 4. STATE MANAGEMENT
    // ==========================================================================
    describe('State Management', () => {

        it('should return undefined state for non-initialized fields', () => {
            resolver.register('field', {
                dependsOn: ['other'],
                showWhen: () => true
            });

            // Before initialize
            expect(resolver.getState('field')).toBeUndefined();
        });

        // NOTE: These tests require Angular injection context (TestBed)
        // Skip in unit test environment - test via integration tests instead
        it.skip('should track initialized status (requires Angular TestBed)', () => {
            expect(resolver.isInitialized()).toBe(false);

            const values = signal<Record<string, unknown>>({});
            resolver.register('test', {
                dependsOn: ['source'],
                showWhen: () => true
            });

            resolver.initialize(values, () => {}, () => {});

            expect(resolver.isInitialized()).toBe(true);
        });

        it.skip('should cleanup and reset initialized status (requires Angular TestBed)', () => {
            const values = signal<Record<string, unknown>>({});
            resolver.register('test', {
                dependsOn: ['source'],
                showWhen: () => true
            });

            resolver.initialize(values, () => {}, () => {});
            expect(resolver.isInitialized()).toBe(true);

            resolver.cleanup();
            expect(resolver.isInitialized()).toBe(false);
        });

        it('should return default visibility (true) for non-registered fields', () => {
            expect(resolver.isVisible('nonexistent')).toBe(true);
        });

        it('should return default enabled (true) for non-registered fields', () => {
            expect(resolver.isEnabled('nonexistent')).toBe(true);
        });

        it('should return undefined computed value for non-registered fields', () => {
            expect(resolver.getComputedValue('nonexistent')).toBeUndefined();
        });
    });

    // ==========================================================================
    // 5. INITIALIZATION ERROR HANDLING
    // ==========================================================================
    describe('Initialization Error Handling', () => {

        it('should throw error on initialize if circular dependency exists', () => {
            resolver.register('a', {
                dependsOn: ['b'],
                showWhen: () => true
            });

            resolver.register('b', {
                dependsOn: ['a'],
                showWhen: () => true
            });

            const values = signal<Record<string, unknown>>({});

            expect(() => {
                resolver.initialize(values, () => {}, () => {});
            }).toThrow(/[Dd]öngüsel|[Cc]ircular/);
        });

        it.skip('should cleanup previous effects on re-initialize (requires Angular TestBed)', () => {
            const values = signal<Record<string, unknown>>({ source: 'initial' });

            resolver.register('target', {
                dependsOn: ['source'],
                showWhen: (v) => v['source'] === 'show'
            });

            // First initialize
            resolver.initialize(values, () => {}, () => {});
            expect(resolver.isInitialized()).toBe(true);

            // Re-initialize (should cleanup first)
            resolver.initialize(values, () => {}, () => {});
            expect(resolver.isInitialized()).toBe(true);
        });
    });

    // ==========================================================================
    // 6. DEPENDENCY PATTERNS (Factory Functions)
    // ==========================================================================
    describe('Dependency Patterns', () => {

        describe('showWhenEquals', () => {
            it('should create dependency that shows when value equals target', () => {
                const dep = DependencyPatterns.showWhenEquals('status', 'active');

                expect(dep.dependsOn).toEqual(['status']);
                expect(dep.showWhen!({ status: 'active' })).toBe(true);
                expect(dep.showWhen!({ status: 'inactive' })).toBe(false);
                expect(dep.showWhen!({ status: null })).toBe(false);
            });
        });

        describe('showWhenTruthy', () => {
            it('should create dependency that shows when value is truthy', () => {
                const dep = DependencyPatterns.showWhenTruthy('hasValue');

                expect(dep.showWhen!({ hasValue: true })).toBe(true);
                expect(dep.showWhen!({ hasValue: 'something' })).toBe(true);
                expect(dep.showWhen!({ hasValue: 1 })).toBe(true);
                expect(dep.showWhen!({ hasValue: false })).toBe(false);
                expect(dep.showWhen!({ hasValue: null })).toBe(false);
                expect(dep.showWhen!({ hasValue: '' })).toBe(false);
                expect(dep.showWhen!({ hasValue: 0 })).toBe(false);
            });
        });

        describe('showWhenFalsy', () => {
            it('should create dependency that shows when value is falsy', () => {
                const dep = DependencyPatterns.showWhenFalsy('isEmpty');

                expect(dep.showWhen!({ isEmpty: false })).toBe(true);
                expect(dep.showWhen!({ isEmpty: null })).toBe(true);
                expect(dep.showWhen!({ isEmpty: '' })).toBe(true);
                expect(dep.showWhen!({ isEmpty: 0 })).toBe(true);
                expect(dep.showWhen!({ isEmpty: true })).toBe(false);
                expect(dep.showWhen!({ isEmpty: 'value' })).toBe(false);
            });
        });

        describe('showWhenIn', () => {
            it('should create dependency that shows when value is in list', () => {
                const dep = DependencyPatterns.showWhenIn('country', ['TR', 'US', 'UK']);

                expect(dep.showWhen!({ country: 'TR' })).toBe(true);
                expect(dep.showWhen!({ country: 'US' })).toBe(true);
                expect(dep.showWhen!({ country: 'UK' })).toBe(true);
                expect(dep.showWhen!({ country: 'DE' })).toBe(false);
                expect(dep.showWhen!({ country: null })).toBe(false);
            });
        });

        describe('showWhenNotIn', () => {
            it('should create dependency that shows when value is NOT in list', () => {
                const dep = DependencyPatterns.showWhenNotIn('type', ['hidden', 'system']);

                expect(dep.showWhen!({ type: 'user' })).toBe(true);
                expect(dep.showWhen!({ type: 'admin' })).toBe(true);
                expect(dep.showWhen!({ type: 'hidden' })).toBe(false);
                expect(dep.showWhen!({ type: 'system' })).toBe(false);
            });
        });

        describe('disableWhenEmpty', () => {
            it('should create dependency that disables when source is empty', () => {
                const dep = DependencyPatterns.disableWhenEmpty('parentField');

                expect(dep.enableWhen!({ parentField: 'value' })).toBe(true);
                expect(dep.enableWhen!({ parentField: 123 })).toBe(true);
                expect(dep.enableWhen!({ parentField: '' })).toBe(false);
                expect(dep.enableWhen!({ parentField: null })).toBe(false);
            });
        });

        describe('sum', () => {
            it('should create dependency that computes sum of fields', () => {
                const dep = DependencyPatterns.sum(['a', 'b', 'c']);

                expect(dep.compute!({ a: 10, b: 20, c: 30 })).toBe(60);
                expect(dep.compute!({ a: 1, b: 2, c: 3 })).toBe(6);
                expect(dep.compute!({ a: 0, b: 0, c: 0 })).toBe(0);
            });

            it('should handle null/undefined values in sum', () => {
                const dep = DependencyPatterns.sum(['a', 'b', 'c']);

                expect(dep.compute!({ a: 10, b: null, c: 20 })).toBe(30);
                expect(dep.compute!({ a: null, b: null, c: null })).toBe(0);
            });

            it('should handle non-numeric values in sum', () => {
                const dep = DependencyPatterns.sum(['a', 'b']);

                expect(dep.compute!({ a: 'not a number', b: 10 })).toBe(10); // NaN becomes 0
            });
        });

        describe('multiply', () => {
            it('should create dependency that computes product of two fields', () => {
                const dep = DependencyPatterns.multiply(['quantity', 'price']);

                expect(dep.compute!({ quantity: 5, price: 10 })).toBe(50);
                expect(dep.compute!({ quantity: 3, price: 7 })).toBe(21);
                expect(dep.compute!({ quantity: 0, price: 100 })).toBe(0);
            });

            it('should handle null values in multiply', () => {
                const dep = DependencyPatterns.multiply(['a', 'b']);

                expect(dep.compute!({ a: null, b: 10 })).toBe(0);
                expect(dep.compute!({ a: 5, b: null })).toBe(0);
            });
        });

        describe('concat', () => {
            it('should create dependency that concatenates fields', () => {
                const dep = DependencyPatterns.concat(['firstName', 'lastName'], ' ');

                expect(dep.compute!({ firstName: 'John', lastName: 'Doe' })).toBe('John Doe');
            });

            it('should handle custom separator', () => {
                const dep = DependencyPatterns.concat(['day', 'month', 'year'], '/');

                expect(dep.compute!({ day: '15', month: '01', year: '2024' })).toBe('15/01/2024');
            });

            it('should filter out empty values', () => {
                const dep = DependencyPatterns.concat(['a', 'b', 'c'], '-');

                expect(dep.compute!({ a: 'X', b: null, c: 'Z' })).toBe('X-Z');
                expect(dep.compute!({ a: '', b: 'Y', c: '' })).toBe('Y');
            });

            it('should use default space separator', () => {
                const dep = DependencyPatterns.concat(['first', 'second']);

                expect(dep.compute!({ first: 'Hello', second: 'World' })).toBe('Hello World');
            });
        });

        describe('resetOnChange', () => {
            it('should create dependency with reset callback', () => {
                const dep = DependencyPatterns.resetOnChange('trigger');

                expect(dep.dependsOn).toEqual(['trigger']);
                expect(dep.onDependencyChange).toBeDefined();
            });

            it('should call reset on context when triggered', () => {
                const dep = DependencyPatterns.resetOnChange('trigger');

                const mockReset = jest.fn();
                const mockSetValue = jest.fn();

                const context: DependencyContext = {
                    fieldName: 'target',
                    reset: mockReset,
                    setValue: mockSetValue
                };

                dep.onDependencyChange!({ trigger: 'new value' }, context);

                expect(mockReset).toHaveBeenCalled();
            });
        });

        describe('showWhenAllFilled', () => {
            it('should show only when ALL fields are filled', () => {
                const dep = DependencyPatterns.showWhenAllFilled(['a', 'b', 'c']);

                expect(dep.showWhen!({ a: 'x', b: 'y', c: 'z' })).toBe(true);
                expect(dep.showWhen!({ a: 'x', b: 'y', c: '' })).toBe(false);
                expect(dep.showWhen!({ a: 'x', b: null, c: 'z' })).toBe(false);
                expect(dep.showWhen!({ a: null, b: null, c: null })).toBe(false);
            });
        });

        describe('showWhenAnyFilled', () => {
            it('should show when ANY field is filled', () => {
                const dep = DependencyPatterns.showWhenAnyFilled(['a', 'b', 'c']);

                expect(dep.showWhen!({ a: 'x', b: null, c: null })).toBe(true);
                expect(dep.showWhen!({ a: null, b: 'y', c: null })).toBe(true);
                expect(dep.showWhen!({ a: null, b: null, c: 'z' })).toBe(true);
                expect(dep.showWhen!({ a: 'x', b: 'y', c: 'z' })).toBe(true);
                expect(dep.showWhen!({ a: null, b: null, c: null })).toBe(false);
                expect(dep.showWhen!({ a: '', b: '', c: '' })).toBe(false);
            });
        });
    });

    // ==========================================================================
    // 7. REAL-WORLD SCENARIOS
    // ==========================================================================
    describe('Real-World Scenarios', () => {

        it('should handle country-specific address fields', () => {
            resolver.registerAll({
                // US-specific
                state: DependencyPatterns.showWhenEquals('country', 'US'),
                zipCode: DependencyPatterns.showWhenEquals('country', 'US'),

                // TR-specific
                il: DependencyPatterns.showWhenEquals('country', 'TR'),
                ilce: DependencyPatterns.showWhenEquals('country', 'TR'),
                postaKodu: DependencyPatterns.showWhenEquals('country', 'TR'),

                // UK-specific
                county: DependencyPatterns.showWhenEquals('country', 'UK'),
                postCode: DependencyPatterns.showWhenEquals('country', 'UK')
            });

            // All should depend on 'country'
            expect(resolver.getDependents('country')).toContain('state');
            expect(resolver.getDependents('country')).toContain('il');
            expect(resolver.getDependents('country')).toContain('county');
        });

        it('should handle invoice calculation dependencies', () => {
            resolver.registerAll({
                subtotal: DependencyPatterns.multiply(['quantity', 'unitPrice']),
                taxAmount: {
                    dependsOn: ['subtotal', 'taxRate'],
                    compute: (v) => ((v['subtotal'] as number) || 0) * ((v['taxRate'] as number) || 0) / 100
                },
                total: {
                    dependsOn: ['subtotal', 'taxAmount', 'discount'],
                    compute: (v) => {
                        const subtotal = (v['subtotal'] as number) || 0;
                        const tax = (v['taxAmount'] as number) || 0;
                        const discount = (v['discount'] as number) || 0;
                        return subtotal + tax - discount;
                    }
                }
            });

            // Verify dependency chain
            expect(resolver.getDependencies('subtotal')).toEqual(['quantity', 'unitPrice']);
            expect(resolver.getDependencies('taxAmount')).toEqual(['subtotal', 'taxRate']);
            expect(resolver.getDependencies('total')).toContain('subtotal');
            expect(resolver.getDependencies('total')).toContain('taxAmount');
        });

        it('should handle form wizard step visibility', () => {
            resolver.registerAll({
                step2: {
                    dependsOn: ['step1Complete'],
                    showWhen: (v) => v['step1Complete'] === true
                },
                step3: {
                    dependsOn: ['step2Complete'],
                    showWhen: (v) => v['step2Complete'] === true
                },
                submitButton: DependencyPatterns.showWhenAllFilled([
                    'step1Complete',
                    'step2Complete',
                    'step3Complete'
                ])
            });

            // No circular dependency
            expect(resolver.hasCircularDependency()).toBe(false);
        });

        it('should handle conditional field requirements', () => {
            // Example: If "hasPartner" is true, "partnerName" becomes visible
            resolver.register('partnerName', DependencyPatterns.showWhenTruthy('hasPartner'));
            resolver.register('partnerEmail', DependencyPatterns.showWhenTruthy('hasPartner'));
            resolver.register('partnerPhone', DependencyPatterns.showWhenTruthy('hasPartner'));

            // All partner fields depend on hasPartner
            expect(resolver.getDependents('hasPartner')).toContain('partnerName');
            expect(resolver.getDependents('hasPartner')).toContain('partnerEmail');
            expect(resolver.getDependents('hasPartner')).toContain('partnerPhone');
        });

        it('should handle cascading dropdowns (country -> state -> city)', () => {
            resolver.registerAll({
                state: {
                    ...DependencyPatterns.resetOnChange('country'),
                    showWhen: (v) => !!v['country']
                },
                city: {
                    ...DependencyPatterns.resetOnChange('state'),
                    showWhen: (v) => !!v['state']
                }
            });

            // Verify cascade direction
            expect(resolver.getDependencies('state')).toContain('country');
            expect(resolver.getDependencies('city')).toContain('state');

            // No circular
            expect(resolver.hasCircularDependency()).toBe(false);
        });
    });

    // ==========================================================================
    // 8. EDGE CASES
    // ==========================================================================
    describe('Edge Cases', () => {

        it('should handle empty dependsOn array', () => {
            resolver.register('orphan', {
                dependsOn: [],
                showWhen: () => true
            });

            expect(resolver.getDependencies('orphan')).toEqual([]);
            expect(resolver.hasCircularDependency()).toBe(false);
        });

        it('should handle dependency on non-existent field', () => {
            resolver.register('child', {
                dependsOn: ['nonExistentParent'],
                showWhen: () => true
            });

            // Should not cause issues
            expect(resolver.getDependencies('child')).toEqual(['nonExistentParent']);
            expect(resolver.hasCircularDependency()).toBe(false);
        });

        it('should handle multiple calls to cleanup', () => {
            resolver.register('test', {
                dependsOn: ['source'],
                showWhen: () => true
            });

            // Multiple cleanups should not throw
            expect(() => {
                resolver.cleanup();
                resolver.cleanup();
                resolver.cleanup();
            }).not.toThrow();
        });

        it('should handle special characters in field names', () => {
            resolver.register('field-with-dash', {
                dependsOn: ['field.with.dots', 'field_with_underscores'],
                showWhen: () => true
            });

            expect(resolver.getDependencies('field-with-dash')).toContain('field.with.dots');
            expect(resolver.getDependencies('field-with-dash')).toContain('field_with_underscores');
        });

        it('should handle very long dependency chains', () => {
            // Create chain: a -> b -> c -> ... -> z (26 levels)
            const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');

            for (let i = 1; i < letters.length; i++) {
                resolver.register(letters[i], {
                    dependsOn: [letters[i - 1]],
                    showWhen: () => true
                });
            }

            // No circular dependency
            expect(resolver.hasCircularDependency()).toBe(false);

            // z depends on y
            expect(resolver.getDependencies('z')).toEqual(['y']);

            // a has many dependents (all other letters eventually)
            expect(resolver.getDependents('a').length).toBe(1); // Direct dependent: b
        });

        it('should handle duplicate registration (overwrite)', () => {
            resolver.register('field', {
                dependsOn: ['source1'],
                showWhen: () => true
            });

            resolver.register('field', {
                dependsOn: ['source2'],
                showWhen: () => false
            });

            // Second registration should overwrite
            expect(resolver.getDependencies('field')).toEqual(['source2']);
        });
    });
});