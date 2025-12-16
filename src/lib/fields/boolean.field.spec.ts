import { BooleanField } from './boolean.field';

describe('BooleanField Integration Tests', () => {

    // 1. Validation Logic (Strictness Check)
    describe('Schema Validation Logic', () => {

        describe('When required is TRUE (The "Accept Terms" Trap)', () => {
            // TR: Bu test çok kritik. Genelde required=not null sanılır ama
            // BooleanField'de required=true demek "Değer true olmalı" demektir.

            const field = new BooleanField('terms', 'Terms', { required: true });
            const schema = field.schema();

            it('should PASS only when value is strictly TRUE', () => {
                const result = schema.safeParse(true);
                expect(result.success).toBe(true);
            });

            it('should FAIL when value is FALSE', () => {
                // Burası hard core nokta! false bir boolean'dır ama required şartını sağlamaz.
                const result = schema.safeParse(false);
                expect(result.success).toBe(false);

                if (!result.success) {
                    expect(result.error.issues[0].message).toContain('Bu alanı onaylamanız gerekmektedir');
                }
            });

            it('should FAIL when value is NULL or UNDEFINED', () => {
                expect(schema.safeParse(null).success).toBe(false);
                expect(schema.safeParse(undefined).success).toBe(false);
            });
        });

        describe('When required is FALSE (Optional/Toggle Mode)', () => {
            const field = new BooleanField('opt', 'Optional', { required: false });
            const schema = field.schema();

            it('should accept TRUE', () => {
                expect(schema.safeParse(true).success).toBe(true);
            });

            it('should accept FALSE', () => {
                // Required değilse false geçerli bir değerdir
                expect(schema.safeParse(false).success).toBe(true);
            });

            // BooleanField z.boolean() kullanıyor, null/undefined kabul etmez
            // Bu davranış kasıtlıdır - boolean alanı explicit true/false bekler
            it('should REJECT NULL/UNDEFINED (strict boolean)', () => {
                expect(schema.safeParse(null).success).toBe(false);
                expect(schema.safeParse(undefined).success).toBe(false);
            });
        });
    });

    // 2. Presentation Logic (UI Labels)
    describe('Presentation Logic (present)', () => {

        it('should use default labels (Evet/Hayır)', () => {
            const field = new BooleanField('active', 'Is Active');

            expect(field.present(true)).toBe('Evet');
            expect(field.present(false)).toBe('Hayır');
        });

        it('should use custom labels from config', () => {
            const field = new BooleanField('status', 'Status', {
                trueLabel: 'Aktif',
                falseLabel: 'Pasif'
            });

            expect(field.present(true)).toBe('Aktif');
            expect(field.present(false)).toBe('Pasif');
        });

        it('should handle NULL gracefully', () => {
            const field = new BooleanField('test', 'Test');
            expect(field.present(null)).toBe('-');
        });
    });

    // 3. Import Strategy (The Coercion Matrix)
    describe('Import Logic (fromImport) - The Matrix', () => {
        const field = new BooleanField('importer', 'Import Test');

        // A. DIRECT BOOLEAN
        it('should pass boolean values directly', () => {
            expect(field.fromImport(true)).toBe(true);
            expect(field.fromImport(false)).toBe(false);
        });

        // B. STRING COERCION (Data Driven Test)
        // Kodundaki tüm varyasyonları (case-insensitive, trim) deniyoruz.
        const stringTestCases = [
            // Truthy Strings
            { input: 'true', expected: true },
            { input: 'TRUE', expected: true },
            { input: '  true  ', expected: true },
            { input: '1', expected: true },
            { input: 'evet', expected: true },
            { input: 'EVET', expected: true }, // Case insensitive check

            // Falsy Strings
            { input: 'false', expected: false },
            { input: 'FALSE', expected: false },
            { input: '0', expected: false },
            { input: 'hayır', expected: false },
            { input: 'HAYIR', expected: null },

            // Invalid Strings
            { input: 'yes', expected: null }, // Kodunda 'yes' yok
            { input: 'no', expected: null },  // Kodunda 'no' yok
            { input: 'random', expected: null },
            { input: '', expected: null },
        ];

        test.each(stringTestCases)('should convert string "$input" to $expected', ({ input, expected }) => {
            expect(field.fromImport(input)).toBe(expected);
        });

        // C. NUMBER COERCION
        const numberTestCases = [
            { input: 1, expected: true },
            { input: 0, expected: false },
            { input: 1.0, expected: true }, // Floating point representation of integer
            // Invalid numbers
            { input: 2, expected: null },
            { input: -1, expected: null },
            { input: 0.5, expected: null },
        ];

        test.each(numberTestCases)('should convert number $input to $expected', ({ input, expected }) => {
            expect(field.fromImport(input)).toBe(expected);
        });

        // D. EDGE CASES
        it('should return null for non-primitive types', () => {
            expect(field.fromImport({ val: true })).toBeNull();
            expect(field.fromImport(['true'])).toBeNull();
        });

        it('should return null for null/undefined', () => {
            expect(field.fromImport(null)).toBeNull();
            expect(field.fromImport(undefined)).toBeNull();
        });
    });

    // 4. Export Logic
    describe('Export Logic (toExport)', () => {
        const field = new BooleanField('ex', 'Export');

        it('should export boolean as boolean (Identity)', () => {
            expect(field.toExport(true)).toBe(true);
            expect(field.toExport(false)).toBe(false);
            expect(field.toExport(null)).toBeNull();
        });
    });
});