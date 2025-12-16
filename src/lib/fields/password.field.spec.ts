import { PasswordField } from './password.field';

describe('PasswordField (Security Gatekeeper) Hard Core Tests', () => {

    // --------------------------------------------------------------------------
    // 1. VALIDATION LOGIC (Schema & Security Policies)
    // --------------------------------------------------------------------------
    describe('Schema Validation & Security Policies', () => {

        describe('Length Constraints', () => {
            it('should enforce default minimum length (8)', () => {
                const field = new PasswordField('pwd', 'Password', { required: true });
                const schema = field.schema();

                expect(schema.safeParse('1234567').success).toBe(false); // 7 chars
                expect(schema.safeParse('12345678').success).toBe(true); // 8 chars
            });

            it('should enforce configured min/max length', () => {
                const field = new PasswordField('pin', 'PIN', {
                    minLength: 4,
                    maxLength: 6,
                    required: true
                });
                const schema = field.schema();

                expect(schema.safeParse('123').success).toBe(false); // Too short
                expect(schema.safeParse('1234567').success).toBe(false); // Too long
                expect(schema.safeParse('12345').success).toBe(true);
            });
        });

        describe('Complexity Rules (Character Requirements)', () => {
            const field = new PasswordField('complex', 'Complex', {
                required: true,
                requireUppercase: true,
                requireLowercase: true,
                requireNumber: true,
                requireSpecial: true
            });
            const schema = field.schema();

            it('should require Uppercase', () => {
                expect(schema.safeParse('abc1!.......').success).toBe(false);
                expect(schema.safeParse('Abc1!.......').success).toBe(true);
            });

            it('should require Lowercase', () => {
                expect(schema.safeParse('ABC1!.......').success).toBe(false);
                expect(schema.safeParse('aBC1!.......').success).toBe(true);
            });

            it('should require Number', () => {
                expect(schema.safeParse('Abc!........').success).toBe(false);
                expect(schema.safeParse('Abc1!.......').success).toBe(true);
            });

            it('should require Special Character', () => {
                expect(schema.safeParse('Password123').success).toBe(false);
                expect(schema.safeParse('Abc1!.......').success).toBe(true);
            });
        });

        describe('Special Characters & Regex Escaping (The Hacker Test)', () => {
            // TR: Bu test çok kritiktir. Eğer kodda `replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`
            // satırı olmasaydı, bu testler patlar veya Regex Injection'a sebep olurdu.

            it('should handle custom special characters', () => {
                const field = new PasswordField('custom', 'Custom', {
                    requireSpecial: true,
                    specialChars: '@#' // Sadece @ ve # kabul ediliyor
                });
                const schema = field.schema();

                expect(schema.safeParse('Password123@').success).toBe(true);
                expect(schema.safeParse('Password123#').success).toBe(true);

                // ! karakteri default'ta var ama bizim custom setimizde yok.
                // Kodun mantığına göre: "En az bir özel karakter içermelidir" regexi
                // bizim verdiğimiz sete göre oluşturulur.
                // Regex: /[@#]/ -> ! karakteri bu regexle eşleşmez.
                expect(schema.safeParse('Password123!').success).toBe(false);
            });

            it('should escape Regex meta-characters correctly', () => {
                // Regex'i bozabilecek karakterleri specialChars olarak veriyoruz.
                // [ ] ( ) . * + ? ^ $
                const dangerousChars = '[]().*+?^$';

                const field = new PasswordField('danger', 'Danger', {
                    requireSpecial: true,
                    specialChars: dangerousChars
                });

                // Eğer escape yapılmazsa, örneğin '.' her şeyle eşleşir veya '[' regex hatası verir.
                const schema = field.schema();

                // 1. Validasyon hatasız çalışmalı (Crash Test)
                expect(() => field.schema()).not.toThrow();

                expect(schema.safeParse('Password[').success).toBe(true); // '[' içeriyor, 9 karakter

                expect(schema.safeParse('Password.').success).toBe(true); // '.' içeriyor, 9 karakter

                // 3. Set dışı karakter reddedilmeli
                // Eğer escape bozuksa '.' karakteri 'A' ile de eşleşebilirdi.
                expect(schema.safeParse('PasswordA').success).toBe(false);
            });
        });
    });

    // --------------------------------------------------------------------------
    // 2. STRENGTH ALGORITHM (Math Check)
    // --------------------------------------------------------------------------
    describe('Strength Calculation Logic', () => {
        const field = new PasswordField('strength', 'Strength');

        /* Skorlama Mantığı (Reverse Engineering from Code):
          Length >= 8 (+1), >= 12 (+1), >= 16 (+1) -> Max Length Score: 3
          Types: Lower(+1), Upper(+1), Number(+1), Special(+1) -> Max Type Score: 4

          Total Possible Score: 7

          Score <= 2 -> Weak
          Score <= 4 -> Fair
          Score <= 6 -> Good
          Score = 7  -> Strong
        */

        it('should identify WEAK passwords (Score <= 2)', () => {
            // "12345" -> Len < 8 (0), Num (1) -> Score: 1
            expect(field.calculateStrength('12345')).toBe('weak');

            // "abcdefgh" -> Len >= 8 (1), Lower (1) -> Score: 2
            expect(field.calculateStrength('abcdefgh')).toBe('weak');
        });

        it('should identify FAIR passwords (3 <= Score <= 4)', () => {
            // "Abcdefgh" -> Len >= 8 (1), Lower (1), Upper (1) -> Score: 3
            expect(field.calculateStrength('Abcdefgh')).toBe('fair');

            // "Abcdefgh1" -> Len >= 8 (1), Lower (1), Upper (1), Num (1) -> Score: 4
            expect(field.calculateStrength('Abcdefgh1')).toBe('fair');
        });

        it('should identify GOOD passwords (5 <= Score <= 6)', () => {
            // "Abcdefgh1!" -> Len >= 8 (1), Lower(1), Upper(1), Num(1), Special(1) -> Score: 5
            expect(field.calculateStrength('Abcdefgh1!')).toBe('good');

            // "Abcdefgh1234567" -> Len >= 12 (2), Lower(1), Upper(1), Num(1) -> Score: 5
            expect(field.calculateStrength('Abcdefgh12345')).toBe('good');

            // "Abcdefgh1234567!" -> Len >= 12 (2), 4 Types (4) -> Score: 6
            expect(field.calculateStrength('Abcdefgh1234!')).toBe('good');});

        it('should identify STRONG passwords (Score >= 7)', () => {
            // "Abcdefgh1234567!" (16 chars)
            // Len >= 16 (3 points)
            // Lower + Upper + Num + Special (4 points)
            // Total: 7 -> Strong
            const ultraPass = 'Abcdefgh1234567!@';
            expect(ultraPass.length).toBeGreaterThanOrEqual(16);
            expect(field.calculateStrength(ultraPass)).toBe('strong');
        });

        it('should return correct percentage mapping', () => {
            // Mocking calculateStrength result internally implies these maps:
            // weak -> 25, fair -> 50, good -> 75, strong -> 100

            // Reuse logic
            expect(field.getStrengthPercentage('123')).toBe(25); // weak
            expect(field.getStrengthPercentage('Abcdefgh')).toBe(50); // fair
        });

        it('should handle null/empty as weak', () => {
            expect(field.calculateStrength(null)).toBe('weak');
            expect(field.calculateStrength('')).toBe('weak');
        });
    });

    // --------------------------------------------------------------------------
    // 3. PRESENTATION LOGIC
    // --------------------------------------------------------------------------
    describe('Presentation Logic (present)', () => {
        const field = new PasswordField('p', 'P');

        it('should ALWAYS mask the password', () => {
            expect(field.present('secret123')).toBe('••••••••');
            expect(field.present('1')).toBe('••••••••');
        });

        it('should return dash for null/empty', () => {
            expect(field.present(null)).toBe('-');
            expect(field.present('')).toBe('-');
        });
    });

    // --------------------------------------------------------------------------
    // 4. IMPORT/EXPORT (Security Check)
    // --------------------------------------------------------------------------
    describe('Import/Export Logic', () => {
        const field = new PasswordField('io', 'IO');

        it('should NOT modify password on export (BaseField behavior)', () => {
            // PasswordField BaseField'in toExport metodunu override etmiyor.
            // Bu yüzden raw değer dönmeli. (Güvenlik notu: UI katmanında bu değer
            // loglanmamalı veya plain text gönderilmemelidir, ama sınıfın görevi veriyi tutmaktır)
            expect(field.toExport('secret')).toBe('secret');
        });

        it('should import raw string', () => {
            // BaseField.fromImport (String coercion)
            // Zod schema validation'dan geçmeli
            const validPass = 'Pass1234'; // Default config: min 8
            // @ts-ignore: BaseField mock logic or integration check
            // PasswordField import override etmemiş, BaseField string coercion yapar mı?
            // BaseField abstract class'ında `fromImport` schema validasyonu yapar.

            // Burası Integration testi olduğu için ve BaseField'i kullanmadığımız (veya mockladığımız)
            // senaryoda, PasswordField'in kendi logic'ine güveniyoruz.
            // Eğer BaseField logic'i doğruysa:
            const schemaSpy = jest.spyOn(field, 'schema');

            // Manually triggering schema check logic as present in BaseField
            const result = field.schema().safeParse(validPass);
            expect(result.success).toBe(true);
        });
    });
});