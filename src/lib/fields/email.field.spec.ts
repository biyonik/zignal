import { EmailField } from './email.field';

describe('EmailField Hard Core Tests', () => {

    // --------------------------------------------------------------------------
    // 1. VALIDATION LOGIC (Schema & Constraints)
    // --------------------------------------------------------------------------
    describe('Schema Validation Logic', () => {

        describe('Basic Email Format', () => {
            const field = new EmailField('basic', 'Basic', { required: true });
            const schema = field.schema();

            it('should accept standard email formats', () => {
                expect(schema.safeParse('user@example.com').success).toBe(true);
                expect(schema.safeParse('user.name+tag@sub.domain.co').success).toBe(true);
            });

            it('should reject invalid email formats', () => {
                const invalidEmails = [
                    'plainaddress',
                    '#@%^%#$@#$@#.com',
                    '@example.com',
                    'user@.com',
                    'user@com',
                    'user name@example.com'
                ];

                invalidEmails.forEach(email => {
                    const result = schema.safeParse(email);
                    expect(result.success).toBe(false);
                    if (!result.success) {
                        expect(result.error.issues[0].message).toContain('Geçerli bir e-posta');
                    }
                });
            });
        });

        describe('Allowed Domains Whitelist', () => {
            const field = new EmailField('work', 'Work', {
                required: true,
                allowedDomains: ['company.com', 'corp.net']
            });
            const schema = field.schema();

            it('should accept emails from allowed domains', () => {
                expect(schema.safeParse('ceo@company.com').success).toBe(true);
                expect(schema.safeParse('dev@corp.net').success).toBe(true);
            });

            it('should reject emails from non-allowed domains', () => {
                const result = schema.safeParse('spy@competitor.com');
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.issues[0].message).toContain('İzin verilen domainler');
                }
            });

            it('should match domains case-insensitively', () => {
                // Config: company.com -> Input: COMPANY.COM
                expect(schema.safeParse('user@COMPANY.COM').success).toBe(true);
            });

            it('should reject subdomains if not explicitly allowed', () => {
                // Kod analizi: "parts[1]" direkt karşılaştırılıyor.
                // company.com izinliyken mail.company.com REDDEDİLMELİDİR.
                expect(schema.safeParse('user@mail.company.com').success).toBe(false);
            });
        });

        describe('Blocked Domains Blacklist', () => {
            const field = new EmailField('personal', 'Personal', {
                required: true,
                blockedDomains: ['evil.com', 'spam.org']
            });
            const schema = field.schema();

            it('should reject blocked domains', () => {
                const result = schema.safeParse('hacker@evil.com');
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.issues[0].message).toBe('Bu e-posta domaini kabul edilmiyor');
                }
            });

            it('should accept domains not in the blocklist', () => {
                expect(schema.safeParse('user@gmail.com').success).toBe(true);
            });

            it('should handle case-insensitivity in blocklist', () => {
                expect(schema.safeParse('user@EVIL.COM').success).toBe(false);
            });
        });

        describe('Disposable Email Protection', () => {
            const field = new EmailField('signup', 'Signup', {
                required: true,
                blockDisposable: true
            });
            const schema = field.schema();

            const disposableSamples = [
                'user@tempmail.com',
                'user@10minutemail.com',
                'user@yopmail.com',
                'USER@TEMP-MAIL.ORG' // Case check
            ];

            test.each(disposableSamples)('should reject disposable domain: %s', (email) => {
                const result = schema.safeParse(email);
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.issues[0].message).toContain('Tek kullanımlık');
                }
            });

            it('should accept regular providers', () => {
                expect(schema.safeParse('user@gmail.com').success).toBe(true);
                expect(schema.safeParse('user@outlook.com').success).toBe(true);
            });
        });
    });

    // --------------------------------------------------------------------------
    // 2. NORMALIZATION LOGIC (The "Clean Up" Crew)
    // --------------------------------------------------------------------------
    describe('Normalization Logic', () => {

        describe('Default Behavior (Lowercase + Trim)', () => {
            const field = new EmailField('norm', 'Norm'); // lowercase: true default

            it('should lowercase and trim standard input', () => {
                expect(field.normalize('  User@Example.COM  ')).toBe('user@example.com');
            });

            it('should return null for null input', () => {
                expect(field.normalize(null)).toBeNull();
            });
        });

        describe('Case Preservation Mode', () => {
            const field = new EmailField('case', 'Case', { lowercase: false });

            it('should trim but PRESERVE case', () => {
                // Bazen case-sensitive email routing gerekebilir (nadir ama olur)
                expect(field.normalize('  User@Example.COM  ')).toBe('User@Example.COM');
            });
        });
    });

    // --------------------------------------------------------------------------
    // 3. IMPORT LOGIC (Integration Test)
    // --------------------------------------------------------------------------
    describe('Import Logic (fromImport)', () => {
        const field = new EmailField('imp', 'Import', { blockDisposable: true });

        it('should normalize valid emails on import', () => {
            // Input: Messy string -> Output: Clean email
            expect(field.fromImport('  User@Gmail.COM  ')).toBe('user@gmail.com');
        });

        it('should return NULL for invalid emails', () => {
            expect(field.fromImport('not-an-email')).toBeNull();
        });

        it('should return NULL for valid formatted but FORBIDDEN emails', () => {
            // Format doğru ama disposable olduğu için logic reddetmeli
            expect(field.fromImport('user@tempmail.com')).toBeNull();
        });

        it('should return NULL for non-string inputs', () => {
            expect(field.fromImport(12345)).toBeNull();
            expect(field.fromImport({ email: 'test' })).toBeNull();
            expect(field.fromImport(null)).toBeNull();
        });
    });

    // --------------------------------------------------------------------------
    // 4. EXPORT LOGIC
    // --------------------------------------------------------------------------
    describe('Export Logic (toExport)', () => {
        const field = new EmailField('ex', 'Export');

        it('should normalize email before export', () => {
            // Veritabanına veya API'ye giderken temizlenmeli
            expect(field.toExport('  User@Example.COM ')).toBe('user@example.com');
        });

        it('should return null for null input', () => {
            expect(field.toExport(null)).toBeNull();
        });
    });

    // --------------------------------------------------------------------------
    // 5. EDGE CASES & INTERNAL HELPERS
    // --------------------------------------------------------------------------
    describe('Edge Cases (Domain Extraction Logic)', () => {
        // extractDomain private metodunu dolaylı yoldan test ediyoruz.

        it('should handle emails with multiple @ signs gracefully', () => {
            const field = new EmailField('edge', 'Edge', { allowedDomains: ['company.com'] });
            const schema = field.schema();

            // "user@sub@company.com" -> split('@') 3 parça döner.
            // extractDomain: parts.length === 2 ? ... : null
            // domain null döner.
            // allowedDomains check: domain ? allowed.includes : false -> FALSE döner.

            const result = schema.safeParse('user@sub@company.com');
            expect(result.success).toBe(false);
            // Hata mesajı Zod'un email validasyonundan mı yoksa domain check'ten mi geliyor?
            // Zod 'user@sub@company.com'u genelde geçersiz sayar.
            // Ama biz domain extraction logic'inin patlamadığını (exception atmadığını) doğruluyoruz.
        });
    });
});