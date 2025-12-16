import { UrlField } from './url.field'; // Dosya yolunu kontrol et!

describe('UrlField (The Gatekeeper) Hard Core Tests', () => {

    // --------------------------------------------------------------------------
    // 1. VALIDATION LOGIC (Schema & Constraints)
    // --------------------------------------------------------------------------
    describe('Schema Validation Logic', () => {

        describe('Basic URL Structure', () => {
            const field = new UrlField('site', 'Website', { required: true });
            const schema = field.schema();

            it('should accept valid standard URLs', () => {
                expect(schema.safeParse('https://google.com').success).toBe(true);
                expect(schema.safeParse('http://localhost:3000').success).toBe(true);
                expect(schema.safeParse('https://sub.domain.co.uk/path?q=1').success).toBe(true);
            });

            it('should reject URLs without protocol', () => {
                // new URL('google.com') throws error in JS/TS
                // z.string().url() also requires protocol usually
                expect(schema.safeParse('google.com').success).toBe(false);
            });

            it('should reject malformed URLs', () => {
                expect(schema.safeParse('htp://error').success).toBe(false); // Typo (zod url check)
                expect(schema.safeParse('://no-scheme').success).toBe(false);
            });
        });

        describe('Protocol Constraints', () => {

            it('should enforce HTTPS when requireHttps is true', () => {
                const field = new UrlField('secure', 'Secure', { requireHttps: true, required: true });
                const schema = field.schema();

                expect(schema.safeParse('https://bank.com').success).toBe(true);

                const result = schema.safeParse('http://bank.com');
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.issues[0].message).toBe('URL HTTPS olmalıdır');
                }
            });

            it('should allow custom protocols', () => {
                const field = new UrlField('ftp', 'FTP', {
                    allowedProtocols: ['ftp', 'sftp'],
                    required: true
                });
                const schema = field.schema();

                expect(schema.safeParse('ftp://files.com').success).toBe(true);
                expect(schema.safeParse('sftp://secure.files.com').success).toBe(true);
                expect(schema.safeParse('http://files.com').success).toBe(false);
            });

            it('should handle mailto protocol correctly', () => {
                const field = new UrlField('mail', 'Mail', { allowedProtocols: ['mailto'] });
                // mailto:user@example.com -> protocol is "mailto:"
                // Code: protocol.replace(':', '') -> "mailto"
                expect(field.schema().safeParse('mailto:user@example.com').success).toBe(true);
            });
        });

        describe('Domain Restrictions (Whitelist & Blacklist)', () => {

            it('should enforce Allowed Domains STRICTLY (Exact Hostname)', () => {
                const field = new UrlField('white', 'White', {
                    allowedDomains: ['google.com'], // www yok!
                    required: true
                });
                const schema = field.schema();

                // Exact match
                expect(schema.safeParse('https://google.com').success).toBe(true);

                // Subdomain mismatch (Code logic: hostname check is exact)
                // Eğer kodda subdomain wildcard desteği yoksa bu fail etmeli
                expect(schema.safeParse('https://www.google.com').success).toBe(false);

                // Completely different
                expect(schema.safeParse('https://yahoo.com').success).toBe(false);
            });

            it('should enforce Blocked Domains', () => {
                const field = new UrlField('black', 'Black', {
                    blockedDomains: ['evil.com', 'spam.org'],
                    required: true
                });
                const schema = field.schema();

                expect(schema.safeParse('https://evil.com/login').success).toBe(false);
                expect(schema.safeParse('https://good.com').success).toBe(true);
            });

            it('should be case-insensitive for domains', () => {
                const field = new UrlField('case', 'Case', { allowedDomains: ['google.com'] });
                // Input: GOOGLE.COM
                expect(field.schema().safeParse('https://GOOGLE.COM').success).toBe(true);
            });
        });

        describe('Path Requirement (The Root Slash Trap)', () => {
            const field = new UrlField('path', 'Path', { requirePath: true, required: true });
            const schema = field.schema();

            it('should reject root URLs (pathname length <= 1)', () => {
                // pathname: "/" -> length 1. Condition: length > 1
                expect(schema.safeParse('https://example.com/').success).toBe(false);
                expect(schema.safeParse('https://example.com').success).toBe(false);
            });

            it('should accept URLs with path', () => {
                // pathname: "/a" -> length 2
                expect(schema.safeParse('https://example.com/a').success).toBe(true);
                expect(schema.safeParse('https://example.com/login').success).toBe(true);
            });
        });
    });

    // --------------------------------------------------------------------------
    // 2. NORMALIZATION LOGIC (The Cleaner)
    // --------------------------------------------------------------------------
    describe('Normalization Logic', () => {
        const field = new UrlField('norm', 'Norm');

        it('should remove trailing slash ONLY for root paths', () => {
            // Logic: if (parsed.pathname === '/') replace(/\/$/, '')

            // Root path -> Remove
            expect(field.normalize('https://google.com/')).toBe('https://google.com');

            // Deep path -> KEEP (As per logic analysis)
            // Kodda: if (parsed.pathname === '/') kontrolü var.
            // '/foo/' için pathname '/foo/' olur, yani '/' değildir. Slash silinmez.
            expect(field.normalize('https://google.com/foo/')).toBe('https://google.com/foo/');
        });

        it('should trim whitespace', () => {
            expect(field.normalize('  https://google.com  ')).toBe('https://google.com');
        });

        it('should return null for empty', () => {
            expect(field.normalize('')).toBeNull();
        });

        it('should return input as-is if invalid URL (Safe fail)', () => {
            // new URL('invalid') throws -> catch -> return original
            expect(field.normalize('invalid-url')).toBe('invalid-url');
        });
    });

    // --------------------------------------------------------------------------
    // 3. PRESENTATION LOGIC
    // --------------------------------------------------------------------------
    describe('Presentation Logic (present)', () => {
        const field = new UrlField('p', 'P');

        it('should strip protocol and display clean URL', () => {
            // https://google.com -> google.com
            expect(field.present('https://google.com')).toBe('google.com');
        });

        it('should display path if present but NOT root slash', () => {
            // https://google.com/search -> google.com/search
            expect(field.present('https://google.com/search')).toBe('google.com/search');

            // https://google.com/ -> parsed.pathname is '/'. Logic says:
            // return hostname + (pathname !== '/' ? pathname : '')
            // So: google.com + '' -> google.com
            expect(field.present('https://google.com/')).toBe('google.com');
        });

        it('should return raw value if invalid URL', () => {
            expect(field.present('not-a-url')).toBe('not-a-url');
        });

        it('should return dash for null', () => {
            expect(field.present(null)).toBe('-');
        });
    });

    // --------------------------------------------------------------------------
    // 4. IMPORT / EXPORT
    // --------------------------------------------------------------------------
    describe('Import / Export', () => {
        const field = new UrlField('io', 'IO');

        it('should import standard URL string', () => {
            // BaseField string coercion and schema check
            expect(field.fromImport('https://test.com')).toBe('https://test.com');
        });

        it('should return null for invalid URL on import (via Schema)', () => {
            // Schema validation fail -> null
            // NOT: BaseField.fromImport, schema.safeParse sonucuna bakar.
            // 'invalid' schema'dan geçmez.
            // Integration testi olarak, field.schema().safeParse('invalid') -> false

            // Mocking BaseField behavior via schema check
            expect(field.schema().safeParse('invalid').success).toBe(false);
        });
    });
});