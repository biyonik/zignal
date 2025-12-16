import { StringField } from './string.field';

describe('StringField Integration Tests (Real BaseField)', () => {

    // 1. Schema Generation & Validation Rules
    describe('Schema Validation Logic', () => {

        describe('Min/Max Length Constraints', () => {
            it('should enforce minLength strictly via Zod', () => {
                // BaseField'in constructor'ı ve config yapısı burada gerçekten çalışıyor
                const field = new StringField('min', 'Min', { minLength: 3, required: true });
                const schema = field.schema();

                // Boundary Check
                expect(schema.safeParse('ab').success).toBe(false);
                expect(schema.safeParse('abc').success).toBe(true);
            });

            it('should enforce maxLength strictly', () => {
                const field = new StringField('max', 'Max', { maxLength: 5, required: true });
                const schema = field.schema();

                expect(schema.safeParse('12345').success).toBe(true);
                expect(schema.safeParse('123456').success).toBe(false);
            });
        });

        describe('Email Validation', () => {
            const field = new StringField('email', 'Email', { email: true, required: true });
            const schema = field.schema();

            test.each([
                'test@example.com',
                'user+tag@domain.com'
            ])('should accept valid email: %s', (email) => {
                expect(schema.safeParse(email).success).toBe(true);
            });

            test.each([
                'plainaddress',
                '@example.com',
                'test space@test.com'
            ])('should reject invalid email: %s', (email) => {
                expect(schema.safeParse(email).success).toBe(false);
            });
        });

        describe('URL Validation', () => {
            const field = new StringField('url', 'URL', { url: true, required: true });
            const schema = field.schema();

            it('should validate proper URLs', () => {
                expect(schema.safeParse('https://google.com').success).toBe(true);
                expect(schema.safeParse('not-url').success).toBe(false);
            });
        });

        describe('Regex Pattern', () => {
            it('should enforce custom regex', () => {
                const field = new StringField('digits', 'Only Digits', {
                    pattern: /^\d+$/,
                    patternMessage: 'Sadece rakam'
                });
                const schema = field.schema();

                const res = schema.safeParse('123a');
                expect(res.success).toBe(false);
                if (!res.success) {
                    expect(res.error.issues[0].message).toBe('Sadece rakam');
                }
            });
        });

        describe('Inheritance Check: applyRequired', () => {
            // Bu test BaseField'deki protected applyRequired metodunun
            // StringField içinde doğru çalışıp çalışmadığını kanıtlar.

            it('should make schema optional when required is false', () => {
                const field = new StringField('opt', 'Optional', { required: false });
                const schema = field.schema();

                // BaseField mantığı çalışıyor mu?
                expect(schema.safeParse(null).success).toBe(true);
                expect(schema.safeParse(undefined).success).toBe(true);
            });

            it('should make schema strict when required is true', () => {
                const field = new StringField('req', 'Required', { required: true });
                const schema = field.schema();

                // BaseField mantığı çalışıyor mu?
                expect(schema.safeParse(null).success).toBe(false);
                expect(schema.safeParse(undefined).success).toBe(false);
            });
        });
    });

    // 2. Presentation Logic
    describe('Presentation Logic (present)', () => {
        const field = new StringField('test', 'Test');

        it('should return value as-is for strings', () => {
            expect(field.present('Test')).toBe('Test');
        });

        it('should handle null/undefined/empty via Override logic', () => {
            // StringField.present override'ı çalışıyor mu?
            expect(field.present(null)).toBe('-');
            expect(field.present('')).toBe('-'); // StringField özel mantığı
        });
    });

    // 3. Import Logic (Coercion)
    describe('Import Logic (fromImport)', () => {
        const field = new StringField('import', 'Import');

        it('should import string directly', () => {
            expect(field.fromImport('data')).toBe('data');
        });

        it('should coerce numbers to string', () => {
            // StringField.fromImport override'ı çalışıyor mu?
            expect(field.fromImport(123)).toBe('123');
        });

        it('should coerce booleans to string', () => {
            expect(field.fromImport(true)).toBe('true');
        });

        it('should validate after coercion', () => {
            // Hem coercion hem validation zinciri
            const patternField = new StringField('p', 'P', { pattern: /^\d+$/ }); // Sadece rakam

            // true -> "true" -> Regex Fail -> Null döner
            expect(patternField.fromImport(true)).toBeNull();

            // 123 -> "123" -> Regex Pass -> "123" döner
            expect(patternField.fromImport(123)).toBe('123');
        });
    });
});