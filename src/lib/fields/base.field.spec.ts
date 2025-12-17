import { z } from 'zod';
import { isSignal } from '@angular/core';
import { BaseField } from './base.field';
import { FieldConfig } from '../core';

// -----------------------------------------------------------------------------
// CONCRETE TEST IMPLEMENTATION
// TR: Abstract class'ı test etmek için somutlaştırılmış "kobay" sınıf.
// -----------------------------------------------------------------------------
class TestableField extends BaseField<string> {
    // Protected methodu test için public'e açıyoruz (Exposure)
    public override applyRequired<S extends z.ZodType>(schema: S): S {
        return super.applyRequired(schema);
    }

    // Basit bir schema implementasyonu: String ve min(3)
    schema(): z.ZodType<string> {
        const base = z.string().min(3, 'En az 3 karakter');
        return this.applyRequired(base);
    }
}

// -----------------------------------------------------------------------------
// EXTREME TEST SUITE
// -----------------------------------------------------------------------------
describe('BaseField Architecture (The Backbone)', () => {

    describe('1. Construction & Initialization', () => {
        it('should initialize with correct identity and config', () => {
            const config: FieldConfig = { placeholder: 'Enter data', hint: 'Help text' };
            const field = new TestableField('testField', 'Test Label', config);

            expect(field.name).toBe('testField');
            expect(field.label).toBe('Test Label');
            expect(field.config).toEqual(config);
            // Config referans kontrolü
            expect(field.config.placeholder).toBe('Enter data');
        });

        it('should default config to empty object if not provided', () => {
            const field = new TestableField('emptyConf', 'Label');
            expect(field.config).toEqual({});
        });
    });

    describe('2. Reactivity & Signals (The Heartbeat)', () => {
        let field: TestableField;

        beforeEach(() => {
            field = new TestableField('signalTest', 'Signal Label', { required: true });
        });

        it('should create a complete signal ecosystem via createValue()', () => {
            const state = field.createValue('initial');

            // Sinyallerin varlığını ve tipini kontrol et
            expect(isSignal(state.value)).toBe(true);
            expect(isSignal(state.touched)).toBe(true);
            expect(isSignal(state.error)).toBe(true);
            expect(isSignal(state.valid)).toBe(true);

            // Başlangıç değerleri
            expect(state.value()).toBe('initial');
            expect(state.touched()).toBe(false);
        });

        it('should update validation status reactively when value changes', () => {
            const state = field.createValue(''); // Invalid (min 3 chars required)

            // Initial check (Invalid but untouched)
            expect(state.valid()).toBe(false);
            expect(state.error()).toBeNull(); // Touched false olduğu için null olmalı!

            // Update value to valid
            state.value.set('validData');
            expect(state.valid()).toBe(true);
            expect(state.error()).toBeNull();
        });

        it('should masking error message until touched (UX Best Practice)', () => {
            const state = field.createValue('no'); // Invalid (<3 chars)

            // Henüz dokunulmadı, hata GİZLİ olmalı
            expect(state.touched()).toBe(false);
            expect(state.valid()).toBe(false);
            expect(state.error()).toBeNull();

            // Dokunuldu olarak işaretle
            state.touched.set(true);

            // Şimdi hata GÖRÜNÜR olmalı
            expect(state.error()).toBe('En az 3 karakter');
        });

        it('should clear error immediately when data becomes valid, even if touched', () => {
            const state = field.createValue('no');
            state.touched.set(true);
            expect(state.error()).not.toBeNull();

            // Veriyi düzelt
            state.value.set('yes');

            // Hata anında silinmeli
            expect(state.valid()).toBe(true);
            expect(state.error()).toBeNull();
        });
    });

    describe('3. Validation Logic (schema & applyRequired)', () => {

        it('should enforce REQUIRED validation strictness', () => {
            const field = new TestableField('req', 'Label', { required: true });
            const schema = field.schema();

            expect(schema.safeParse('abc').success).toBe(true);
            expect(schema.safeParse(null).success).toBe(false);
            expect(schema.safeParse(undefined).success).toBe(false);
        });

        it('should allow NULL/UNDEFINED when not required (Optional behavior)', () => {
            const field = new TestableField('opt', 'Label', { required: false });
            const schema = field.schema();

            expect(schema.safeParse('abc').success).toBe(true);
            // Optional olduğu için geçmeli
            expect(schema.safeParse(null).success).toBe(true);
            expect(schema.safeParse(undefined).success).toBe(true);
        });
    });

    describe('4. Data Marshalling (Import/Export)', () => {
        let field: TestableField;

        beforeEach(() => {
            field = new TestableField('io', 'IO', { required: true });
        });

        describe('fromImport()', () => {
            it('should return null (silent fail) on invalid import data', () => {
                // "ab" is invalid (min 3)
                const result = field.fromImport('ab');
                expect(result).toBeNull();
            });

            it('should return typed data on valid import', () => {
                const result = field.fromImport('validData');
                expect(result).toBe('validData');
            });
        });

        describe('fromImportWithDetails()', () => {
            it('should provide full error context on failure', () => {
                // Invalid data import
                const result = field.fromImportWithDetails('ab');

                expect(result.success).toBe(false);
                expect(result.data).toBeNull();
                expect(result.error).toBeDefined();

                // Hata mesajı Zod'dan gelmeli
                expect(result.error?.message).toBe('En az 3 karakter');
                // Hata kodu Zod issue code olmalı
                expect(result.error?.code).toBeDefined();
            });

            it('should provide clean success object on valid data', () => {
                const result = field.fromImportWithDetails('abc');

                expect(result.success).toBe(true);
                expect(result.data).toBe('abc');
                expect(result.error).toBeUndefined();
            });
        });

        describe('toExport()', () => {
            it('should return value identity by default', () => {
                // BaseField default implementation returns value as-is
                expect(field.toExport('exportMe')).toBe('exportMe');
                expect(field.toExport(null)).toBeNull();
            });
        });
    });

    describe('5. UI Presentation (present & filterPreview)', () => {
        const field = new TestableField('ui', 'UI');

        it('should default null values to dash (-)', () => {
            expect(field.present(null)).toBe('-');
        });

        it('should cast valid values to string', () => {
            // Generic T testing via string coercion
            expect(field.present('hello')).toBe('hello');
        });

        it('should implement filterPreview using present logic by default', () => {
            expect(field.filterPreview('hello')).toBe('hello');
        });

        it('should return null for filterPreview when value is null', () => {
            expect(field.filterPreview(null)).toBeNull();
        });
    });
});