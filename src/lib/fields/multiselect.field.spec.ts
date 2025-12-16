import { MultiselectField } from './multiselect.field';
import { SelectOption } from './select.field';

describe('MultiselectField ( The Collection Master ) Hard Core Tests', () => {

    // --------------------------------------------------------------------------
    // TEST DATA
    // --------------------------------------------------------------------------
    const TECH_STACK: SelectOption<string>[] = [
        { value: 'ng', label: 'Angular' },
        { value: 'react', label: 'React' },
        { value: 'vue', label: 'Vue.js' },
        { value: 'jquery', label: 'jQuery', disabled: true } // Legacy, disabled
    ];

    const PRIMES: SelectOption<number>[] = [
        { value: 2, label: 'Two' },
        { value: 3, label: 'Three' },
        { value: 5, label: 'Five' },
        { value: 7, label: 'Seven', disabled: true }
    ];

    // --------------------------------------------------------------------------
    // 1. VALIDATION LOGIC (Schema & Constraints)
    // --------------------------------------------------------------------------
    describe('Schema Validation Logic', () => {

        describe('Strict Value Integrity', () => {
            const field = new MultiselectField('stack', 'Tech Stack', {
                options: TECH_STACK,
                required: true
            });
            const schema = field.schema();

            it('should accept array of valid, enabled options', () => {
                const result = schema.safeParse(['ng', 'vue']);
                expect(result.success).toBe(true);
            });

            it('should reject values NOT in options list (Ghost Values)', () => {
                const result = schema.safeParse(['ng', 'svelte']); // 'svelte' yok
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.issues[0].message).toContain('Geçersiz seçenek');
                }
            });

            it('should reject DISABLED options (The Zombie Trap)', () => {
                // 'jquery' listede var AMA disabled. Schema bunu reddetmeli.
                const result = schema.safeParse(['ng', 'jquery']);
                expect(result.success).toBe(false);
            });

            it('should reject non-array inputs (Type Guard)', () => {
                // Multiselect her zaman array bekler
                expect(schema.safeParse('ng').success).toBe(false);
                expect(schema.safeParse(123).success).toBe(false);
            });
        });

        describe('Quantity Constraints (Min/Max)', () => {
            const field = new MultiselectField('limit', 'Limits', {
                options: TECH_STACK,
                minSelections: 2,
                maxSelections: 2 // Exact match required
            });
            const schema = field.schema();

            it('should reject fewer than minSelections', () => {
                const result = schema.safeParse(['ng']); // 1 < 2
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.issues[0].message).toContain('En az 2 seçenek');
                }
            });

            it('should reject more than maxSelections', () => {
                const result = schema.safeParse(['ng', 'react', 'vue']); // 3 > 2
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.issues[0].message).toContain('En fazla 2 seçenek');
                }
            });

            it('should accept count within range', () => {
                expect(schema.safeParse(['ng', 'react']).success).toBe(true);
            });
        });
    });

    // --------------------------------------------------------------------------
    // 2. IMPORT LOGIC (The Smart Parser)
    // --------------------------------------------------------------------------
    describe('Import Logic (fromImport)', () => {
        const field = new MultiselectField('imp', 'Import', { options: TECH_STACK });

        describe('Array Strategy (Value & Label Matching)', () => {
            it('should import by VALUE match', () => {
                const raw = ['ng', 'vue'];
                expect(field.fromImport(raw)).toEqual(['ng', 'vue']);
            });

            it('should import by LABEL match (Reverse Lookup)', () => {
                // User sends ["Angular", "React"] -> System stores ["ng", "react"]
                const raw = ['Angular', 'React'];
                expect(field.fromImport(raw)).toEqual(['ng', 'react']);
            });

            it('should handle MIXED inputs (Value + Label)', () => {
                const raw = ['ng', 'React'];
                expect(field.fromImport(raw)).toEqual(['ng', 'react']);
            });

            it('should filter out garbage/invalid items', () => {
                const raw = ['ng', 'cobol', 'assembly']; // cobol/assembly yok
                expect(field.fromImport(raw)).toEqual(['ng']);
            });

            it('should return null if result is empty', () => {
                const raw = ['invalid', 'stuff'];
                expect(field.fromImport(raw)).toBeNull();
            });
        });

        describe('String Strategy (CSV Parsing)', () => {
            it('should split comma-separated values', () => {
                const raw = 'ng,react,vue';
                expect(field.fromImport(raw)).toEqual(['ng', 'react', 'vue']);
            });

            it('should trim whitespace around items', () => {
                const raw = '  ng  ,   React   '; // Trimming + Label Match
                expect(field.fromImport(raw)).toEqual(['ng', 'react']);
            });

            it('should return null for empty or invalid string', () => {
                expect(field.fromImport('')).toBeNull();
                expect(field.fromImport('invalid,values')).toBeNull();
            });
        });

        describe('Numeric Generics Handling', () => {
            const numField = new MultiselectField('primes', 'Primes', { options: PRIMES });

            it('should handle Number Arrays correctly', () => {
                // [2, 5] -> valid
                expect(numField.fromImport([2, 5])).toEqual([2, 5]);
            });

            it('should return null for Type Mismatch in String Import', () => {
                // "2, 3" string olarak gelir.
                // Kodda: item (string) === opt.value (number) kontrolü strict equality ise fail eder.
                // Kod: opt.value === item. '2' === 2 -> false.
                // Bu yüzden Number tipli field'larda string import (CSV) çalışmayabilir (beklenen davranış).
                expect(numField.fromImport('2, 3')).toBeNull();
            });
        });
    });

    // --------------------------------------------------------------------------
    // 3. PRESENTATION LOGIC
    // --------------------------------------------------------------------------
    describe('Presentation Logic (present)', () => {
        const field = new MultiselectField('p', 'P', { options: TECH_STACK });

        it('should join labels with comma', () => {
            const val = ['ng', 'react'];
            expect(field.present(val)).toBe('Angular, React');
        });

        it('should fallback to value if label not found', () => {
            // 'svelte' listede yok
            // @ts-ignore
            const val = ['ng', 'svelte'];
            expect(field.present(val)).toBe('Angular, svelte');
        });

        it('should return dash for empty/null', () => {
            expect(field.present([])).toBe('-');
            expect(field.present(null)).toBe('-');
        });
    });

    // --------------------------------------------------------------------------
    // 4. FILTER PREVIEW (Smart Summary)
    // --------------------------------------------------------------------------
    describe('Filter Preview Logic', () => {
        const field = new MultiselectField('f', 'F', { options: TECH_STACK });

        it('should show Label when exactly 1 item selected', () => {
            expect(field.filterPreview(['ng'])).toBe('Angular');
        });

        it('should show "X seçili" when > 1 items selected', () => {
            // 2 selected -> "2 seçili"
            expect(field.filterPreview(['ng', 'react'])).toBe('2 seçili');
        });

        it('should return null when empty', () => {
            expect(field.filterPreview([])).toBeNull();
        });
    });

    // --------------------------------------------------------------------------
    // 5. HELPER METHODS & STATE CHECKS
    // --------------------------------------------------------------------------
    describe('Helper Methods', () => {
        const field = new MultiselectField('h', 'H', {
            options: TECH_STACK,
            maxSelections: 2
        });

        it('getActiveOptions should exclude disabled items', () => {
            const active = field.getActiveOptions();
            // jQuery is disabled
            expect(active.length).toBe(3);
            expect(active.find(o => o.value === 'jquery')).toBeUndefined();
        });

        it('isSelected should check array inclusion', () => {
            expect(field.isSelected(['ng', 'react'], 'ng')).toBe(true);
            expect(field.isSelected(['ng', 'react'], 'vue')).toBe(false);
        });

        it('isMaxReached should validate against limit', () => {
            expect(field.isMaxReached(1)).toBe(false);
            expect(field.isMaxReached(2)).toBe(true); // Exact limit
            expect(field.isMaxReached(3)).toBe(true); // Over limit
        });

        it('getAllValues should return all active values', () => {
            expect(field.getAllValues()).toEqual(['ng', 'react', 'vue']);
        });
    });
});