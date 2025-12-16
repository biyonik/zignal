import { signal, computed, isSignal } from '@angular/core';
import { z } from 'zod';
import { GroupField } from './group.field';
import { BaseField } from './base.field';
import { FieldValue } from '../core';

// -----------------------------------------------------------------------------
// TEST HELPER: CONCRETE SUB-FIELD IMPLEMENTATION
// -----------------------------------------------------------------------------
class TestSubField extends BaseField<string> {
    schema(): z.ZodType<string> {
        return this.applyRequired(z.string().min(1));
    }

    // Custom transform logic for import/export testing
    override fromImport(raw: unknown): string | null {
        return typeof raw === 'string' ? `Imported_${raw}` : null;
    }

    override toExport(value: string | null): string | null {
        return value ? `Exported_${value}` : null;
    }

    // Basic signal simulation
    override createValue(initial?: string): FieldValue<string> {
        const value = signal(initial ?? '');
        const touched = signal(false);
        const valid = computed(() => value().length > 0);
        const error = computed(() => valid() ? null : 'Required');
        return { value, touched, valid, error };
    }
}

describe('GroupField (The Composer) Hard Core Tests', () => {

    // Test Setup
    const streetField = new TestSubField('street', 'Street', { required: true });
    const cityField = new TestSubField('city', 'City', { required: true });

    describe('1. Schema Generation & Structure', () => {

        it('should combine sub-field schemas into one Zod Object', () => {
            const group = new GroupField('address', 'Address', [streetField, cityField]);
            const schema = group.schema();

            // Valid structure
            expect(schema.safeParse({ street: 'Main', city: 'NY' }).success).toBe(true);

            // Missing required field
            const result = schema.safeParse({ street: 'Main' }); // city missing
            expect(result.success).toBe(false);
        });
    });

    describe('2. State Management (createGroupState)', () => {
        let group: GroupField;

        beforeEach(() => {
            group = new GroupField('profile', 'Profile', [streetField, cityField]);
        });

        it('should initialize signals for all sub-fields', () => {
            const state = group.createGroupState({ street: 'Wall St' });

            expect(isSignal(state.values)).toBe(true);
            expect(isSignal(state.valid)).toBe(true);

            // Initial Value Check
            expect(state.fields['street'].value()).toBe('Wall St');
            expect(state.fields['city'].value()).toBe(''); // Default empty
        });

        it('should Aggregate Values reactively', () => {
            const state = group.createGroupState();

            // Update sub-field signal directly
            state.fields['street'].value.set('Broadway');
            state.fields['city'].value.set('NYC');

            // Check aggregated output
            expect(state.values()).toEqual({
                street: 'Broadway',
                city: 'NYC'
            });
        });

        it('should Aggregate Validation (Cascade)', () => {
            const state = group.createGroupState();

            // Both required, initially empty -> Invalid
            expect(state.valid()).toBe(false);

            // Set one -> Still invalid
            state.fields['street'].value.set('A');
            expect(state.valid()).toBe(false);

            // Set both -> Valid
            state.fields['city'].value.set('B');
            expect(state.valid()).toBe(true);
        });

        it('should support patchValues (Partial Update)', () => {
            const state = group.createGroupState({ street: 'Old', city: 'Old' });

            state.patchValues({ city: 'New' }); // Only update city

            expect(state.values()).toEqual({
                street: 'Old',
                city: 'New'
            });
        });

        it('should support reset to initial or new values', () => {
            const state = group.createGroupState({ street: 'Init' });

            // Change values
            state.setValue('street', 'Changed');
            state.touchAll();
            expect(state.fields['street'].touched()).toBe(true);

            // Reset to initial
            state.reset();
            expect(state.values()).toEqual({ street: 'Init', city: '' });
            expect(state.fields['street'].touched()).toBe(false);

            // Reset to specific
            state.reset({ street: 'Reset' });
            expect(state.values()).toEqual({ street: 'Reset', city: '' });
        });

        it('should touchAll sub-fields', () => {
            const state = group.createGroupState();
            state.touchAll();

            expect(state.fields['street'].touched()).toBe(true);
            expect(state.fields['city'].touched()).toBe(true);
        });
    });

    describe('3. Import / Export Logic (Deep Processing)', () => {
        const group = new GroupField('io', 'IO', [streetField, cityField]);

        it('should delegate Import to sub-fields', () => {
            const raw = { street: 'Main', city: 'London' };
            const imported = group.fromImport(raw);

            // TestSubField.fromImport prefix ekler: "Imported_"
            expect(imported).toEqual({
                street: 'Imported_Main',
                city: 'Imported_London'
            });
        });

        it('should delegate Export to sub-fields', () => {
            const data = { street: 'Main', city: 'Paris' };
            const exported = group.toExport(data);

            // TestSubField.toExport prefix ekler: "Exported_"
            expect(exported).toEqual({
                street: 'Exported_Main',
                city: 'Exported_Paris'
            });
        });

        it('should handle missing or partial data on import', () => {
            const raw = { street: 'Main' }; // city missing
            const imported = group.fromImport(raw);

            expect(imported).toEqual({
                street: 'Imported_Main',
                city: null // TestSubField returns null for undefined/null input
            });
        });

        it('should return null for invalid group input', () => {
            expect(group.fromImport(null)).toBeNull();
            expect(group.fromImport('not-object')).toBeNull();
        });
    });

    describe('4. Presentation Logic', () => {
        const group = new GroupField('p', 'P', [streetField, cityField]);

        it('should present summary (first 3 fields)', () => {
            const value = { street: 'Main', city: 'NYC', extra: 'Hide' };
            // Test implementation logic: Object.entries -> slice(0, 3) -> join(', ')
            // Note: Object keys order isn't guaranteed in JS spec but usually insertion order
            const display = group.present(value);

            expect(display).toContain('Main');
            expect(display).toContain('NYC');
        });

        it('should filter out empty values from summary', () => {
            const value = { street: 'Main', city: null };
            expect(group.present(value)).toBe('Main');
        });

        it('should return dash for empty', () => {
            expect(group.present({})).toBe('-');
            expect(group.present(null)).toBe('-');
        });
    });

    describe('5. BaseField Integration (createValue Override)', () => {
        // GroupField createValue metodunu override edip özel bir yapı (GroupFieldState'e wrap edilmiş) döner.
        // Ancak BaseField.createValue imzası FieldValue<T> dönmelidir.
        // Kodda: value: groupState.values (Signal), touched: signal(false), etc.

        it('should return standard FieldValue interface wrapping internal state', () => {
            const group = new GroupField('wrap', 'Wrap', [streetField]);
            const fieldValue = group.createValue({ street: 'Init' });

            // Check standard signals
            expect(isSignal(fieldValue.value)).toBe(true);
            expect(isSignal(fieldValue.touched)).toBe(true);
            expect(isSignal(fieldValue.valid)).toBe(true);

            // Check value content
            expect(fieldValue.value()).toEqual({ street: 'Init' });
        });
    });

    describe('6. Helper Methods', () => {
        const group = new GroupField('h', 'H', [streetField], { layout: 'grid', columns: 3 });

        it('should return correct config getters', () => {
            expect(group.layout).toBe('grid');
            expect(group.columns).toBe(3);
        });

        it('should find field by name', () => {
            expect(group.getField('street')).toBeDefined();
            expect(group.getField('ghost')).toBeUndefined();
        });

        it('should return field names', () => {
            expect(group.getFieldNames()).toEqual(['street']);
        });
    });
});