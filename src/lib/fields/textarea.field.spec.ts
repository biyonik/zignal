import { TextareaField } from './textarea.field';

describe('TextareaField (The Storyteller) Hard Core Tests', () => {

    // --------------------------------------------------------------------------
    // 1. VALIDATION LOGIC (Schema & Boundaries)
    // --------------------------------------------------------------------------
    describe('Schema Validation Logic', () => {

        describe('Min/Max Length Constraints', () => {
            const field = new TextareaField('bio', 'Bio', {
                minLength: 10,
                maxLength: 20,
                required: true
            });
            const schema = field.schema();

            it('should reject text shorter than minLength', () => {
                // Len: 9
                expect(schema.safeParse('123456789').success).toBe(false);
            });

            it('should accept text at exact minLength', () => {
                // Len: 10
                expect(schema.safeParse('1234567890').success).toBe(true);
            });

            it('should accept text at exact maxLength', () => {
                // Len: 20
                const text = 'a'.repeat(20);
                expect(schema.safeParse(text).success).toBe(true);
            });

            it('should reject text longer than maxLength', () => {
                // Len: 21
                const text = 'a'.repeat(21);
                const result = schema.safeParse(text);
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.issues[0].message).toContain('En fazla 20 karakter');
                }
            });
        });
    });

    // --------------------------------------------------------------------------
    // 2. PRESENTATION LOGIC (The Truncator)
    // --------------------------------------------------------------------------
    describe('Presentation Logic (present)', () => {
        const field = new TextareaField('desc', 'Description');

        it('should return dash for null or empty string', () => {
            expect(field.present(null)).toBe('-');
            expect(field.present('')).toBe('-');
        });

        it('should display short text as-is', () => {
            const text = 'Short description';
            expect(field.present(text)).toBe(text);
        });

        describe('Truncation Logic (100 char limit)', () => {
            // Boundary Analysis

            it('should NOT truncate text exactly at 100 chars', () => {
                const text = 'a'.repeat(100);
                expect(field.present(text)).toBe(text);
                expect(field.present(text).length).toBe(100);
            });

            it('should truncate text at 101 chars', () => {
                const text = 'a'.repeat(101);
                const presented = field.present(text);

                // Logic: substring(0, 100) + '...'
                // Expected length: 100 + 3 = 103
                expect(presented.length).toBe(103);
                expect(presented.endsWith('...')).toBe(true);

                // İlk 100 karakter korunmalı
                expect(presented.startsWith('a'.repeat(100))).toBe(true);
            });
        });
    });

    // --------------------------------------------------------------------------
    // 3. IMPORT LOGIC (Coercion)
    // --------------------------------------------------------------------------
    describe('Import Logic (fromImport)', () => {
        const field = new TextareaField('imp', 'Import');

        it('should accept string input directly', () => {
            expect(field.fromImport('hello')).toBe('hello');
        });

        it('should coerce Numbers to String', () => {
            // 12345 -> "12345"
            expect(field.fromImport(12345)).toBe('12345');
        });

        it('should coerce Booleans to String', () => {
            expect(field.fromImport(true)).toBe('true');
        });

        it('should validate AFTER coercion', () => {
            // Senaryo: Min length 5, ama import edilen sayı 123 (len 3)
            const minField = new TextareaField('min', 'Min', { minLength: 5 });

            // 123 -> "123" -> Validation (Len 3 < 5) -> Fail -> Return Null
            expect(minField.fromImport(123)).toBeNull();
        });

        it('should return null for null input', () => {
            expect(field.fromImport(null)).toBeNull();
        });
    });

    // --------------------------------------------------------------------------
    // 4. UI HELPERS & MATH
    // --------------------------------------------------------------------------
    describe('Helper Methods', () => {

        describe('getRows()', () => {
            it('should return configured rows', () => {
                const f = new TextareaField('r', 'R', { rows: 10 });
                expect(f.getRows()).toBe(10);
            });

            it('should return default rows (3) if not configured', () => {
                const f = new TextareaField('r', 'R');
                expect(f.getRows()).toBe(3);
            });
        });

        describe('getRemainingCharacters()', () => {
            it('should return null if no maxLength configured', () => {
                const f = new TextareaField('u', 'U'); // No maxLength
                expect(f.getRemainingCharacters(50)).toBeNull();
            });

            it('should calculate remaining characters correctly', () => {
                const f = new TextareaField('l', 'L', { maxLength: 100 });
                // 100 - 10 = 90
                expect(f.getRemainingCharacters(10)).toBe(90);
            });

            it('should return 0 at limit', () => {
                const f = new TextareaField('l', 'L', { maxLength: 50 });
                expect(f.getRemainingCharacters(50)).toBe(0);
            });

            it('should return negative if over limit (Validation Fail state)', () => {
                const f = new TextareaField('l', 'L', { maxLength: 10 });
                // 10 - 15 = -5
                expect(f.getRemainingCharacters(15)).toBe(-5);
            });
        });
    });
});