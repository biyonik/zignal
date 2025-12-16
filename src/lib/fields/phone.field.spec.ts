import { PhoneField } from './phone.field';

describe('PhoneField (The Communicator) Hard Core Tests', () => {

    // --------------------------------------------------------------------------
    // 1. VALIDATION LOGIC (Schema & Regex)
    // --------------------------------------------------------------------------
    describe('Schema Validation Logic', () => {

        describe('Turkey (TR) Validation', () => {
            const field = new PhoneField('tr', 'TR Phone', { country: 'TR', required: true });
            const schema = field.schema();

            it('should accept clean numbers (532...)', () => {
                expect(schema.safeParse('5321234567').success).toBe(true);
            });

            it('should accept numbers with leading zero (0532...)', () => {
                expect(schema.safeParse('05321234567').success).toBe(true);
            });

            it('should accept numbers with country code (+90532...)', () => {
                expect(schema.safeParse('+905321234567').success).toBe(true);
            });

            it('should accept formatted input via transform (User Friendly)', () => {
                // Zod transform: val.replace(...)
                expect(schema.safeParse('(532) 123 45 67').success).toBe(true);
                expect(schema.safeParse('0 (532) 123-45-67').success).toBe(true);
            });

            it('should REJECT invalid numbers', () => {
                expect(schema.safeParse('532').success).toBe(false); // Too short
                expect(schema.safeParse('532123456789').success).toBe(false); // Too long
                expect(schema.safeParse('1234567890').success).toBe(false); // Not starting with 5 (TR mobile convention mostly)
            });
        });

        describe('USA (US) Validation', () => {
            const field = new PhoneField('us', 'US Phone', { country: 'US', required: true });
            const schema = field.schema();

            it('should accept valid US numbers', () => {
                // Area code 200-999 allowed
                expect(schema.safeParse('2025550123').success).toBe(true);
                expect(schema.safeParse('+12025550123').success).toBe(true);
            });

            it('should reject invalid US numbers', () => {
                // Area code cannot start with 0 or 1
                expect(schema.safeParse('1025550123').success).toBe(false);
            });
        });

        describe('International (INTL) Validation', () => {
            const field = new PhoneField('intl', 'Intl', { country: 'INTL', required: true });
            const schema = field.schema();

            it('should accept varied lengths', () => {
                expect(schema.safeParse('1234567').success).toBe(true); // Shortest
                expect(schema.safeParse('123456789012345').success).toBe(true); // Longest
            });
        });
    });

    // --------------------------------------------------------------------------
    // 2. NORMALIZATION & FORMATTING (The Cleaner)
    // --------------------------------------------------------------------------
    describe('Normalization & Formatting', () => {

        describe('Normalize Method', () => {
            const field = new PhoneField('norm', 'Norm', { country: 'TR' });

            it('should strip non-digits and country prefixes', () => {
                // Hedef: veritabanına sadece "5321234567" kaydetmek (prefixsiz)
                // Regex: /^(?:\+90|90|0)?([5][0-9]{9})$/ -> Group 1 is captured

                expect(field.normalize('0532 123 45 67')).toBe('5321234567');
                expect(field.normalize('+90 532 123 45 67')).toBe('5321234567');
                expect(field.normalize('532-123-4567')).toBe('5321234567');
            });

            it('should return null for empty', () => {
                expect(field.normalize('')).toBeNull();
            });
        });

        describe('FormatPhone Method (Present)', () => {
            const trField = new PhoneField('tr', 'TR', { country: 'TR', showCountryCode: true });
            const usField = new PhoneField('us', 'US', { country: 'US', showCountryCode: true });

            it('should format TR number correctly', () => {
                // Input: Clean 10 digits -> Output: +90 (532) 123 45 67
                const clean = '5321234567';
                expect(trField.formatPhone(clean)).toBe('+90 (532) 123 45 67');
            });

            it('should format US number correctly', () => {
                const clean = '2025550123';
                expect(usField.formatPhone(clean)).toBe('+1 (202) 555-0123');
            });

            it('should respect showCountryCode: false', () => {
                const localField = new PhoneField('local', 'Local', {
                    country: 'TR',
                    showCountryCode: false
                });
                const clean = '5321234567';
                // Prefixsiz format
                expect(localField.formatPhone(clean)).toBe('(532) 123 45 67');
            });

            it('should return as-is if length mismatch (Graceful degradation)', () => {
                const broken = '532'; // Too short for TR formatting logic
                // Should return with prefix but no internal formatting
                expect(trField.formatPhone(broken)).toBe('+90 532');
            });
        });
    });

    // --------------------------------------------------------------------------
    // 3. IMPORT / EXPORT (E.164 Standard)
    // --------------------------------------------------------------------------
    describe('Import / Export Logic', () => {
        const field = new PhoneField('io', 'IO', { country: 'TR' });

        describe('toExport (E.164)', () => {
            it('should export in E.164 format (+CountryCode + Number)', () => {
                // Input: 0532... -> Normalize: 532... -> Export: +90532...
                expect(field.toExport('0532 123 45 67')).toBe('+905321234567');
            });

            it('should handle already prefixed input', () => {
                expect(field.toExport('+905321234567')).toBe('+905321234567');
            });

            it('should return null for null', () => {
                expect(field.toExport(null)).toBeNull();
            });
        });

        describe('fromImport (Strict Cleaning)', () => {
            it('should accept clean numbers', () => {
                expect(field.fromImport('5321234567')).toBe('5321234567');
            });

            it('should clean formatted strings', () => {
                // Importa "(532) 123" gibi kirli veri gelirse temizler
                // Regex.test(cleaned) kontrolü var
                expect(field.fromImport('(532) 123 45 67')).toBe('5321234567');
            });

            it('should handle Number type input', () => {
                expect(field.fromImport(5321234567)).toBe('5321234567');
            });

            it('should return null for invalid pattern match', () => {
                // "123" is too short for TR pattern -> returns null
                expect(field.fromImport('123')).toBeNull();
            });
        });
    });

    // --------------------------------------------------------------------------
    // 4. UI HELPERS
    // --------------------------------------------------------------------------
    describe('UI Helpers', () => {
        const field = new PhoneField('ui', 'UI', { country: 'TR' });

        it('should provide correct mask', () => {
            expect(field.getMask()).toBe('(5XX) XXX XX XX');
        });

        it('should provide correct example', () => {
            expect(field.getExample()).toBe('532 123 45 67');
        });

        it('should provide correct pattern info', () => {
            expect(field.pattern.prefix).toBe('+90');
        });
    });
});