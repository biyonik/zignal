import { DateField } from './date.field';

describe('DateField Hard Core Tests', () => {

    // --------------------------------------------------------------------------
    // SETUP: TIME TRAVEL
    // TR: Testlerin deterministik olması için zamanı donduruyoruz.
    // "Bugün" her zaman: 15 Haziran 2024, Saat 12:00:00
    // --------------------------------------------------------------------------
    const MOCK_TODAY = new Date(2024, 5, 15, 12, 0, 0); // Month 5 = June

    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(MOCK_TODAY);
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    // --------------------------------------------------------------------------
    // 1. VALIDATION LOGIC (Schema & Boundaries)
    // --------------------------------------------------------------------------
    describe('Schema Validation Logic', () => {

        describe('Static Min/Max Constraints', () => {
            const minDate = new Date(2024, 0, 1); // 1 Jan 2024
            const maxDate = new Date(2024, 11, 31); // 31 Dec 2024

            const field = new DateField('static', 'Static', {
                min: minDate,
                max: maxDate,
                required: true
            });
            const schema = field.schema();

            it('should accept dates within range', () => {
                expect(schema.safeParse(new Date(2024, 5, 15)).success).toBe(true);
            });

            it('should accept exact boundary dates', () => {
                expect(schema.safeParse(minDate).success).toBe(true);
                expect(schema.safeParse(maxDate).success).toBe(true);
            });

            it('should reject dates outside range', () => {
                // Min boundary check (1 ms before)
                const beforeMin = new Date(minDate.getTime() - 1);
                expect(schema.safeParse(beforeMin).success).toBe(false);

                // Max boundary check (1 ms after)
                const afterMax = new Date(maxDate.getTime() + 1);
                expect(schema.safeParse(afterMax).success).toBe(false);
            });
        });

        describe('Dynamic Constraints (minToday / maxToday)', () => {
            // Mock Date: 15 June 2024

            it('should enforce minToday (Start of Today)', () => {
                const field = new DateField('future', 'Future', { minToday: true, required: true });
                const schema = field.schema();

                // 14 June (Yesterday) -> Fail
                const yesterday = new Date(2024, 5, 14, 23, 59, 59);
                expect(schema.safeParse(yesterday).success).toBe(false);

                // 15 June 00:00:00 (Start of Today) -> Pass
                const startOfToday = new Date(2024, 5, 15, 0, 0, 0);
                expect(schema.safeParse(startOfToday).success).toBe(true);
            });

            it('should enforce maxToday (End of Today)', () => {
                const field = new DateField('past', 'Past', { maxToday: true, required: true });
                const schema = field.schema();

                // 15 June 23:59:59 (End of Today) -> Pass
                const endOfToday = new Date(2024, 5, 15, 23, 59, 59, 999);
                expect(schema.safeParse(endOfToday).success).toBe(true);

                // 16 June 00:00:00 (Tomorrow) -> Fail
                const tomorrow = new Date(2024, 5, 16, 0, 0, 0);
                expect(schema.safeParse(tomorrow).success).toBe(false);
            });
        });
    });

    // --------------------------------------------------------------------------
    // 2. IMPORT LOGIC (The Parsing Beast)
    // --------------------------------------------------------------------------
    describe('Import Logic (fromImport)', () => {
        const field = new DateField('imp', 'Import');

        describe('String Parsing Strategies', () => {
            it('should parse ISO 8601 strings', () => {
                const result = field.fromImport('2024-06-15T12:00:00.000Z');
                expect(result).toBeInstanceOf(Date);
                expect(result?.toISOString()).toContain('2024-06-15');
            });

            it('should parse Turkish Date Format (DD.MM.YYYY)', () => {
                // Regex test: /^(\d{2})\.(\d{2})\.(\d{4})$/
                const result = field.fromImport('15.06.2024');

                expect(result).toBeInstanceOf(Date);
                expect(result?.getFullYear()).toBe(2024);
                expect(result?.getMonth()).toBe(5); // June is 5
                expect(result?.getDate()).toBe(15);
            });

            it('should handle Leap Year correctly in Turkish format', () => {
                const result = field.fromImport('29.02.2024'); // 2024 is leap
                expect(result).not.toBeNull();
                expect(result?.getDate()).toBe(29);
            });

            it('should return NULL for invalid string formats', () => {
                expect(field.fromImport('not-a-date')).toBeNull();
                expect(field.fromImport('32.01.2024')).toBeNull(); // Invalid day
                expect(field.fromImport('15/06/2024')).toBeNull(); // Wrong separator (code supports dot)
            });
        });

        describe('Number Parsing Strategies', () => {
            it('should parse Unix Timestamp (Milliseconds)', () => {
                const timestamp = MOCK_TODAY.getTime();
                const result = field.fromImport(timestamp);

                expect(result).toEqual(MOCK_TODAY);
            });

            it('should parse Excel Serial Date', () => {
                // Excel Serial 45458 = ~ 2024-06-15 (approx check)
                // Calculation: 15 June 2024 is roughly 45458 days after 1900
                const excelSerial = 45458;
                const result = field.fromImport(excelSerial);

                expect(result).toBeInstanceOf(Date);
                expect(result?.getFullYear()).toBe(2024);
            });

            it('should handle Excel Leap Year Bug Logic', () => {
                // Excel logic involves starting from 1899-12-30 due to bug
                // Serial 1 = 1899-12-31
                const result = field.fromImport(1);
                expect(result?.getFullYear()).toBe(1899);
            });
        });

        describe('Integration: Parse + Validation', () => {
            // TR: Parse etse bile, eğer tarih validasyon kurallarına uymuyorsa NULL dönmeli.

            it('should return NULL if parsed date is outside MIN constraints', () => {
                const restrictedField = new DateField('res', 'Res', {
                    min: new Date(2025, 0, 1) // Only 2025+
                });

                // Valid ISO string but strictly in 2024
                const result = restrictedField.fromImport('2024-01-01');

                // Parse successful (Date object created) -> Validation Failed -> Return Null
                expect(result).toBeNull();
            });

            it('should return NULL if parsed Excel date is outside MAX constraints', () => {
                const restrictedField = new DateField('res', 'Res', {
                    max: new Date(2000, 0, 1) // Only past
                });

                const futureSerial = 45458; // 2024
                expect(restrictedField.fromImport(futureSerial)).toBeNull();
            });
        });
    });

    // --------------------------------------------------------------------------
    // 3. EXPORT LOGIC
    // --------------------------------------------------------------------------
    describe('Export Logic (toExport)', () => {
        const field = new DateField('ex', 'Ex');

        it('should export Date as ISO String', () => {
            const result = field.toExport(MOCK_TODAY);
            expect(result).toBe(MOCK_TODAY.toISOString());
        });

        it('should return null for null input', () => {
            expect(field.toExport(null)).toBeNull();
        });
    });

    // --------------------------------------------------------------------------
    // 4. PRESENTATION LOGIC
    // --------------------------------------------------------------------------
    describe('Presentation Logic (present)', () => {

        it('should format date according to default locale (tr-TR)', () => {
            const field = new DateField('p', 'P', { locale: 'tr-TR' });
            // 15.06.2024
            const output = field.present(MOCK_TODAY);

            // Node environment Intl implementation might vary slightly on spaces,
            // but standard check:
            expect(output).toMatch(/15\.06\.2024/);
        });

        it('should respect custom format options', () => {
            const field = new DateField('p', 'P', {
                locale: 'en-US',
                format: { month: 'long', year: 'numeric' }
            });
            // June 2024
            const output = field.present(MOCK_TODAY);
            expect(output).toBe('June 2024');
        });

        it('should return dash for null', () => {
            const field = new DateField('p', 'P');
            expect(field.present(null)).toBe('-');
        });
    });
});