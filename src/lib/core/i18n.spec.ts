import {
    I18nService,
    TR_MESSAGES,
    EN_MESSAGES,
    t,
    setLocale,
    getLocale,
    addMessages,
    getI18n,
    detectBrowserLocale,
} from './i18n';

/**
 * TR: I18nService için test suite'i.
 * EN: Test suite for I18nService.
 */
describe('I18nService (The Translator)', () => {

    // TR: Her testten önce singleton'ı sıfırla
    // EN: Reset singleton before each test
    beforeEach(() => {
        I18nService.resetInstance();
    });

    // ==========================================================================
    // 1. SINGLETON PATTERN
    // ==========================================================================
    describe('Singleton Pattern', () => {

        it('should return same instance', () => {
            const instance1 = I18nService.getInstance();
            const instance2 = I18nService.getInstance();

            expect(instance1).toBe(instance2);
        });

        it('should respect initial locale', () => {
            const instance = I18nService.getInstance('en');

            expect(instance.getLocale()).toBe('en');
        });

        it('should reset instance correctly', () => {
            const instance1 = I18nService.getInstance('en');
            I18nService.resetInstance();
            const instance2 = I18nService.getInstance('tr');

            expect(instance1).not.toBe(instance2);
            expect(instance2.getLocale()).toBe('tr');
        });
    });

    // ==========================================================================
    // 2. LOCALE MANAGEMENT
    // ==========================================================================
    describe('Locale Management', () => {

        it('should default to Turkish locale', () => {
            const i18n = I18nService.getInstance();

            expect(i18n.getLocale()).toBe('tr');
        });

        it('should change locale', () => {
            const i18n = I18nService.getInstance();

            i18n.setLocale('en');

            expect(i18n.getLocale()).toBe('en');
            expect(i18n.locale()).toBe('en');
        });

        it('should have reactive locale signal', () => {
            const i18n = I18nService.getInstance();
            const localeValues: string[] = [];

            // TR: Initial değer
            localeValues.push(i18n.locale());

            i18n.setLocale('en');
            localeValues.push(i18n.locale());

            i18n.setLocale('tr');
            localeValues.push(i18n.locale());

            expect(localeValues).toEqual(['tr', 'en', 'tr']);
        });

        it('should list supported locales', () => {
            const i18n = I18nService.getInstance();

            const locales = i18n.getSupportedLocales();

            expect(locales).toContain('tr');
            expect(locales).toContain('en');
        });

        it('should check if locale is supported', () => {
            const i18n = I18nService.getInstance();

            expect(i18n.isLocaleSupported('tr')).toBe(true);
            expect(i18n.isLocaleSupported('en')).toBe(true);
            expect(i18n.isLocaleSupported('fr')).toBe(false);
        });
    });

    // ==========================================================================
    // 3. TRANSLATION
    // ==========================================================================
    describe('Translation', () => {

        it('should translate Turkish messages', () => {
            const i18n = I18nService.getInstance('tr');

            expect(i18n.t('required')).toBe('Bu alan zorunludur');
            expect(i18n.t('string.email')).toBe('Geçerli bir e-posta adresi giriniz');
        });

        it('should translate English messages', () => {
            const i18n = I18nService.getInstance('en');

            expect(i18n.t('required')).toBe('This field is required');
            expect(i18n.t('string.email')).toBe('Please enter a valid email address');
        });

        it('should return key when message not found', () => {
            const i18n = I18nService.getInstance();

            expect(i18n.t('nonexistent.key')).toBe('nonexistent.key');
        });

        it('should fallback to Turkish when message not in current locale', () => {
            const i18n = I18nService.getInstance();

            // TR: Almanca locale ekle (eksik mesajlarla)
            i18n.addLocale('de', {
                required: 'Dieses Feld ist erforderlich',
            });

            i18n.setLocale('de');

            // TR: Almanca'da var
            expect(i18n.t('required')).toBe('Dieses Feld ist erforderlich');

            // TR: Almanca'da yok, Türkçe'ye fallback
            expect(i18n.t('string.email')).toBe('Geçerli bir e-posta adresi giriniz');
        });

        it('should work with translate() alias', () => {
            const i18n = I18nService.getInstance();

            expect(i18n.translate('required')).toBe(i18n.t('required'));
        });

        it('should translate for specific locale', () => {
            const i18n = I18nService.getInstance('tr');

            // TR: Mevcut locale Türkçe ama İngilizce mesaj al
            const enMessage = i18n.translateFor('en', 'required');

            expect(enMessage).toBe('This field is required');
            expect(i18n.getLocale()).toBe('tr'); // Locale değişmemeli
        });
    });

    // ==========================================================================
    // 4. PARAMETER INTERPOLATION
    // ==========================================================================
    describe('Parameter Interpolation', () => {

        it('should replace single parameter', () => {
            const i18n = I18nService.getInstance('tr');

            const msg = i18n.t('string.min', { min: 3 });

            expect(msg).toBe('En az 3 karakter olmalıdır');
        });

        it('should replace multiple parameters', () => {
            const i18n = I18nService.getInstance('en');

            const msg = i18n.t('file.type', { types: 'jpg, png, pdf' });

            expect(msg).toBe('Invalid file type. Allowed: jpg, png, pdf');
        });

        it('should handle numeric parameters', () => {
            const i18n = I18nService.getInstance();

            const msg = i18n.t('number.min', { min: 100 });

            expect(msg).toBe('En az 100 olmalıdır');
        });

        it('should keep placeholder if param not provided', () => {
            const i18n = I18nService.getInstance();

            const msg = i18n.t('string.min', {}); // min parametresi yok

            expect(msg).toBe('En az {min} karakter olmalıdır');
        });

        it('should handle missing params gracefully', () => {
            const i18n = I18nService.getInstance();

            const msg = i18n.t('string.min'); // Hiç parametre yok

            expect(msg).toBe('En az {min} karakter olmalıdır');
        });
    });

    // ==========================================================================
    // 5. CUSTOM LOCALES
    // ==========================================================================
    describe('Custom Locales', () => {

        it('should add new locale', () => {
            const i18n = I18nService.getInstance();

            i18n.addLocale('de', {
                required: 'Dieses Feld ist erforderlich',
                'string.min': 'Mindestens {min} Zeichen erforderlich',
            });

            i18n.setLocale('de');

            expect(i18n.t('required')).toBe('Dieses Feld ist erforderlich');
            expect(i18n.t('string.min', { min: 5 })).toBe('Mindestens 5 Zeichen erforderlich');
        });

        it('should merge messages with existing locale', () => {
            const i18n = I18nService.getInstance();

            // TR: Türkçe'ye custom mesaj ekle
            i18n.addMessages('tr', {
                'custom.message': 'Özel mesaj',
            });

            expect(i18n.t('custom.message')).toBe('Özel mesaj');
            expect(i18n.t('required')).toBe('Bu alan zorunludur'); // Orijinal mesaj korunmalı
        });

        it('should override existing messages', () => {
            const i18n = I18nService.getInstance();

            i18n.addMessages('tr', {
                required: 'Bu alan boş bırakılamaz!',
            });

            expect(i18n.t('required')).toBe('Bu alan boş bırakılamaz!');
        });
    });

    // ==========================================================================
    // 6. HELPER FUNCTIONS
    // ==========================================================================
    describe('Helper Functions', () => {

        it('t() should work as shorthand', () => {
            I18nService.getInstance('tr');

            expect(t('required')).toBe('Bu alan zorunludur');
            expect(t('string.min', { min: 3 })).toBe('En az 3 karakter olmalıdır');
        });

        it('setLocale() should change global locale', () => {
            I18nService.getInstance();

            setLocale('en');

            expect(getLocale()).toBe('en');
            expect(t('required')).toBe('This field is required');
        });

        it('addMessages() should add to global instance', () => {
            I18nService.getInstance();

            addMessages('tr', { 'custom.test': 'Test mesajı' });

            expect(t('custom.test')).toBe('Test mesajı');
        });

        it('getI18n() should return global instance', () => {
            const instance1 = I18nService.getInstance();
            const instance2 = getI18n();

            expect(instance1).toBe(instance2);
        });
    });

    // ==========================================================================
    // 7. BROWSER LOCALE DETECTION
    // ==========================================================================
    describe('Browser Locale Detection', () => {

        const originalNavigator = globalThis.navigator;

        afterEach(() => {
            Object.defineProperty(globalThis, 'navigator', {
                value: originalNavigator,
                writable: true,
                configurable: true,
            });
        });

        it('should detect Turkish locale', () => {
            Object.defineProperty(globalThis, 'navigator', {
                value: { language: 'tr-TR' },
                writable: true,
                configurable: true,
            });

            const locale = detectBrowserLocale();

            expect(locale).toBe('tr');
        });

        it('should detect English locale', () => {
            Object.defineProperty(globalThis, 'navigator', {
                value: { language: 'en-US' },
                writable: true,
                configurable: true,
            });

            const locale = detectBrowserLocale();

            expect(locale).toBe('en');
        });

        it('should fallback to English for unsupported locales', () => {
            Object.defineProperty(globalThis, 'navigator', {
                value: { language: 'fr-FR' },
                writable: true,
                configurable: true,
            });

            const locale = detectBrowserLocale();

            expect(locale).toBe('en');
        });

        it('should fallback to English when navigator undefined', () => {
            Object.defineProperty(globalThis, 'navigator', {
                value: undefined,
                writable: true,
                configurable: true,
            });

            const locale = detectBrowserLocale();

            expect(locale).toBe('en');
        });
    });

    // ==========================================================================
    // 8. KEY EXISTENCE CHECK
    // ==========================================================================
    describe('Key Existence Check', () => {

        it('should return true for existing keys', () => {
            const i18n = I18nService.getInstance();

            expect(i18n.hasKey('required')).toBe(true);
            expect(i18n.hasKey('string.min')).toBe(true);
        });

        it('should return false for non-existing keys', () => {
            const i18n = I18nService.getInstance();

            expect(i18n.hasKey('nonexistent')).toBe(false);
        });

        it('should check fallback locale', () => {
            const i18n = I18nService.getInstance();

            i18n.addLocale('de', { 'de.only': 'German only' });
            i18n.setLocale('de');

            // TR: 'required' Almanca'da yok ama fallback'te var
            expect(i18n.hasKey('required')).toBe(true);
        });
    });

    // ==========================================================================
    // 9. DEFAULT MESSAGES COMPLETENESS
    // ==========================================================================
    describe('Default Messages Completeness', () => {

        it('TR_MESSAGES should have all common keys', () => {
            const commonKeys = [
                'required', 'invalid',
                'string.min', 'string.max', 'string.email',
                'number.min', 'number.max',
                'password.min', 'password.uppercase',
            ];

            commonKeys.forEach(key => {
                expect(TR_MESSAGES[key]).toBeDefined();
            });
        });

        it('EN_MESSAGES should have all common keys', () => {
            const commonKeys = [
                'required', 'invalid',
                'string.min', 'string.max', 'string.email',
                'number.min', 'number.max',
                'password.min', 'password.uppercase',
            ];

            commonKeys.forEach(key => {
                expect(EN_MESSAGES[key]).toBeDefined();
            });
        });

        it('TR and EN should have same keys', () => {
            const trKeys = Object.keys(TR_MESSAGES).sort();
            const enKeys = Object.keys(EN_MESSAGES).sort();

            expect(trKeys).toEqual(enKeys);
        });
    });

    // ==========================================================================
    // 10. REAL-WORLD SCENARIOS
    // ==========================================================================
    describe('Real-World Scenarios', () => {

        it('Scenario: Multi-language form validation', () => {
            const i18n = I18nService.getInstance();

            // TR: Türkçe form
            i18n.setLocale('tr');
            const trErrors = {
                email: t('string.email'),
                password: t('password.min', { min: 8 }),
            };

            expect(trErrors.email).toBe('Geçerli bir e-posta adresi giriniz');
            expect(trErrors.password).toBe('Şifre en az 8 karakter olmalıdır');

            // EN: İngilizce'ye geç
            i18n.setLocale('en');
            const enErrors = {
                email: t('string.email'),
                password: t('password.min', { min: 8 }),
            };

            expect(enErrors.email).toBe('Please enter a valid email address');
            expect(enErrors.password).toBe('Password must be at least 8 characters');
        });

        it('Scenario: Custom branding messages', () => {
            const i18n = I18nService.getInstance();

            // TR: Firma özel mesajları
            i18n.addMessages('tr', {
                required: 'Bu bilgi zorunludur',
                'string.email': 'Lütfen kurumsal e-posta adresinizi giriniz',
            });

            expect(t('required')).toBe('Bu bilgi zorunludur');
            expect(t('string.email')).toBe('Lütfen kurumsal e-posta adresinizi giriniz');
        });

        it('Scenario: TR Validator messages', () => {
            const i18n = I18nService.getInstance('tr');

            expect(t('tr.tckn')).toBe('Geçerli bir T.C. Kimlik Numarası giriniz');
            expect(t('tr.iban')).toBe('Geçerli bir IBAN giriniz');

            i18n.setLocale('en');

            expect(t('tr.tckn')).toBe('Please enter a valid Turkish ID number');
            expect(t('tr.iban')).toBe('Please enter a valid IBAN');
        });
    });
});