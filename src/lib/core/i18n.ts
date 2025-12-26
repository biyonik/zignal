import {signal, computed, Signal, WritableSignal} from '@angular/core';

/**
 * @fileoverview
 * TR: Validasyon mesajları için çoklu dil (i18n) desteği.
 * Signal-based reaktif locale yönetimi sağlar.
 *
 * EN: Multi-language (i18n) support for validation messages.
 * Provides Signal-based reactive locale management.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

// =============================================================================
// TR: Types & Interfaces
// EN: Types & Interfaces
// =============================================================================

/**
 * TR: Desteklenen locale kodları.
 * EN: Supported locale codes.
 */
export type LocaleCode = 'tr' | 'en' | string;

/**
 * TR: Validasyon mesaj anahtarları.
 * EN: Validation message keys.
 */
export type ValidationMessageKey =
// Common
    | 'required'
    | 'invalid'
    // String
    | 'string.min'
    | 'string.max'
    | 'string.email'
    | 'string.url'
    | 'string.pattern'
    // Number
    | 'number.min'
    | 'number.max'
    | 'number.integer'
    | 'number.positive'
    | 'number.negative'
    // Date
    | 'date.min'
    | 'date.max'
    | 'date.invalid'
    // Boolean
    | 'boolean.required'
    // Password
    | 'password.min'
    | 'password.max'
    | 'password.uppercase'
    | 'password.lowercase'
    | 'password.number'
    | 'password.special'
    // Select
    | 'select.required'
    | 'select.invalid'
    // Multiselect
    | 'multiselect.min'
    | 'multiselect.max'
    // File
    | 'file.required'
    | 'file.maxSize'
    | 'file.minSize'
    | 'file.type'
    | 'file.acceptedTypes'
    | 'file.acceptedType'
    | 'file.acceptedExtensions'
    | 'file.acceptedExtension'
    | 'file.maxFiles'
    | 'file.acceptDescriptionImage'
    | 'file.acceptDescriptionVideo'
    | 'file.acceptDescriptionAudio'
    | 'file.acceptDescriptionDocument'
    | 'file.acceptDescriptionPdf'
    | 'file.acceptDescriptionWord'
    | 'file.acceptDescriptionExcel'
    | 'file.dictionaryMeaning'
    | 'file.maxWidthExceeded'
    | 'file.minWidthRequired'
    | 'file.maxHeightExceeded'
    | 'file.minHeightRequired'
    // Array
    | 'array.min'
    | 'array.max'
    // Async
    | 'async.pending'
    | 'async.error'
    // TR Validators
    | 'tr.tckn'
    | 'tr.vkn'
    | 'tr.iban'
    | 'tr.phone'
    | 'tr.plate'
    | 'tr.postalCode'
    // Email
    | 'email.domain'
    | 'email.disposable'
    | 'email.allowedDomains'
    | 'email.blockedDomains'
    | 'email.blockedDomain'
    | 'email.blockDisposable'
    // Rating
    | 'rating.halfStep'
    | 'rating.minValue'
    | 'rating.maxValue'
    | 'rating.mustBeInteger'
    // Percent
    | 'percent.min'
    | 'percent.max'
    // Tags
    | 'tags.minTags'
    | 'tags.maxTags'
    | 'tags.minLength'
    | 'tags.maxLength'
    | 'tags.duplicate'
    // Time
    | 'time.invalid'
    | 'time.minTime'
    | 'time.maxTime'
    // URL
    | 'url.invalidProtocol'
    | 'url.invalidDomain'
    // Validation
    | 'validation.min'
    | 'validation.max'
    | 'validation.dateRange'
    // Custom
    | string;

/**
 * TR: Mesaj parametreleri tipi.
 * EN: Message parameters type.
 */
export type MessageParams = Record<string, string | number>;

/**
 * TR: Bir locale için mesaj sözlüğü.
 * EN: Message dictionary for a locale.
 */
export type MessageDictionary = Partial<Record<ValidationMessageKey, string>>;

/**
 * TR: Tüm locale'ler için mesaj haritası.
 * EN: Message map for all locales.
 */
export type LocaleMessages = Record<LocaleCode, MessageDictionary>;

// =============================================================================
// TR: Default Messages
// EN: Default Messages
// =============================================================================

/**
 * TR: Türkçe varsayılan mesajlar.
 * EN: Turkish default messages.
 */
export const TR_MESSAGES: MessageDictionary = {
    // Common
    required: 'Bu alan zorunludur',
    invalid: 'Geçersiz değer',

    // String
    'string.min': 'En az {min} karakter olmalıdır',
    'string.max': 'En fazla {max} karakter olabilir',
    'string.email': 'Geçerli bir e-posta adresi giriniz',
    'string.url': 'Geçerli bir URL giriniz',
    'string.pattern': 'Geçersiz format',

    // Number
    'number.min': 'En az {min} olmalıdır',
    'number.max': 'En fazla {max} olabilir',
    'number.integer': 'Tam sayı olmalıdır',
    'number.positive': 'Pozitif bir sayı olmalıdır',
    'number.negative': 'Negatif bir sayı olmalıdır',

    // Date
    'date.min': 'Tarih {min} veya sonrası olmalıdır',
    'date.max': 'Tarih {max} veya öncesi olmalıdır',
    'date.invalid': 'Geçerli bir tarih giriniz',

    // Boolean
    'boolean.required': 'Bu alanı onaylamanız gerekmektedir',

    // Password
    'password.min': 'Şifre en az {min} karakter olmalıdır',
    'password.max': 'Şifre en fazla {max} karakter olabilir',
    'password.uppercase': 'En az bir büyük harf içermelidir',
    'password.lowercase': 'En az bir küçük harf içermelidir',
    'password.number': 'En az bir rakam içermelidir',
    'password.special': 'En az bir özel karakter içermelidir',

    // Select
    'select.required': 'Lütfen bir seçenek seçiniz',
    'select.invalid': 'Geçersiz seçenek',

    // Multiselect
    'multiselect.min': 'En az {min} seçenek seçmelisiniz',
    'multiselect.max': 'En fazla {max} seçenek seçebilirsiniz',

    // File
    'file.required': 'Lütfen bir dosya seçiniz',
    'file.maxSize': 'Dosya boyutu en fazla {maxSize} olabilir',
    'file.minSize': 'Dosya boyutu en az {minSize} olmalıdır',
    'file.type': 'Geçersiz dosya türü. İzin verilen: {types}',
    'file.acceptedTypes': 'İzin verilen dosya türleri: {types}',
    'file.acceptedType': 'İzin verilen dosya türü: {type}',
    'file.acceptedExtensions': 'İzin verilen dosya uzantıları: {extensions}',
    'file.acceptedExtension': 'İzin verilen dosya uzantısı: {extension}',
    'file.maxFiles': 'En fazla {maxFiles} dosya seçebilirsiniz',
    'file.acceptDescriptionImage': 'Resimler',
    'file.acceptDescriptionVideo': 'Videolar',
    'file.acceptDescriptionAudio': 'Sesler',
    'file.acceptDescriptionDocument': 'Döküman',
    'file.acceptDescriptionPdf': 'PDF',
    'file.acceptDescriptionWord': 'Word Belgeleri',
    'file.acceptDescriptionExcel': 'Excel Belgeleri',
    'file.dictionaryMeaning': 'Dosya',
    'file.maxWidthExceeded': 'Görsel genişliği en fazla {max}px olabilir',
    'file.minWidthRequired': 'Görsel genişliği en az {min}px olmalı',
    'file.maxHeightExceeded': 'Görsel yüksekliği en fazla {max}px olabilir',
    'file.minHeightRequired': 'Görsel yüksekliği en az {min}px olmalı',

    // Array
    'array.min': 'En az {min} öğe eklemelisiniz',
    'array.max': 'En fazla {max} öğe ekleyebilirsiniz',

    // Async
    'async.pending': 'Doğrulanıyor...',
    'async.error': 'Doğrulama hatası',

    // TR Validators
    'tr.tckn': 'Geçerli bir T.C. Kimlik Numarası giriniz',
    'tr.vkn': 'Geçerli bir Vergi Kimlik Numarası giriniz',
    'tr.iban': 'Geçerli bir IBAN giriniz',
    'tr.phone': 'Geçerli bir telefon numarası giriniz',
    'tr.plate': 'Geçerli bir plaka giriniz',
    'tr.postalCode': 'Geçerli bir posta kodu giriniz',

    // Email
    'email.domain': 'E-posta yalnızca şu domainlerden biri olmalıdır: {domains}',
    'email.disposable': 'Tek kullanımlık e-posta adresleri kabul edilmiyor',
    'email.allowedDomains': 'E-posta yalnızca şu domainlerden biri olmalıdır: {domains}',
    'email.blockedDomains': 'Aşağıdaki domainlerden e-posta kabul edilmiyor: {domains}',
    'email.blockedDomain': 'Bu domainden e-posta kabul edilmiyor: {domain}',
    'email.blockDisposable': 'Tek kullanımlık e-posta adresleri kabul edilmiyor',

    // Rating
    'rating.halfStep': 'Rating 0.5\'in katı olmalıdır',
    'rating.minValue': 'Rating {min} veya üzeri olmalıdır',
    'rating.maxValue': 'Rating en fazla {max} olabilir',
    'rating.mustBeInteger': 'Rating tam sayı olmalıdır',

    // Percent
    'percent.min': 'Minimum %{min} olmalıdır',
    'percent.max': 'Maksimum %{max} olabilir',

    // Tags
    'tags.minTags': 'En az {min} etiket eklenmeli',
    'tags.maxTags': 'En fazla {max} etiket eklenebilir',
    'tags.minLength': 'Etiket en az {min} karakter olmalı',
    'tags.maxLength': 'Etiket en fazla {max} karakter olabilir',
    'tags.duplicate': 'Bu etiket zaten eklenmiş',

    // Time
    'time.invalid': 'Geçersiz saat formatı',
    'time.minTime': 'Saat en erken {min} olabilir',
    'time.maxTime': 'Saat en geç {max} olabilir',

    // URL
    'url.invalidProtocol': 'Geçersiz protokol. Beklenen: {protocols}',
    'url.invalidDomain': 'Geçersiz domain',

    // Validation
    'validation.min': 'En az {min} olmalıdır',
    'validation.max': 'En fazla {max} olabilir',

    // Multiselect
    'multiselect.selected': '{count} seçili',
    'validation.dateRange': 'Başlangıç tarihi bitiş tarihinden önce olmalıdır',
};

/**
 * TR: İngilizce varsayılan mesajlar.
 * EN: English default messages.
 */
export const EN_MESSAGES: MessageDictionary = {
    // Common
    required: 'This field is required',
    invalid: 'Invalid value',

    // String
    'string.min': 'Must be at least {min} characters',
    'string.max': 'Must be at most {max} characters',
    'string.email': 'Please enter a valid email address',
    'string.url': 'Please enter a valid URL',
    'string.pattern': 'Invalid format',

    // Number
    'number.min': 'Must be at least {min}',
    'number.max': 'Must be at most {max}',
    'number.integer': 'Must be an integer',
    'number.positive': 'Must be a positive number',
    'number.negative': 'Must be a negative number',

    // Date
    'date.min': 'Date must be {min} or later',
    'date.max': 'Date must be {max} or earlier',
    'date.invalid': 'Please enter a valid date',

    // Boolean
    'boolean.required': 'You must accept this field',

    // Password
    'password.min': 'Password must be at least {min} characters',
    'password.max': 'Password must be at most {max} characters',
    'password.uppercase': 'Must contain at least one uppercase letter',
    'password.lowercase': 'Must contain at least one lowercase letter',
    'password.number': 'Must contain at least one number',
    'password.special': 'Must contain at least one special character',

    // Select
    'select.required': 'Please select an option',
    'select.invalid': 'Invalid option',

    // Multiselect
    'multiselect.min': 'Please select at least {min} options',
    'multiselect.max': 'You can select at most {max} options',

    // File
    'file.required': 'Please select a file',
    'file.maxSize': 'File size must be at most {maxSize}',
    'file.minSize': 'File size must be at least {minSize}',
    'file.type': 'Invalid file type. Allowed: {types}',
    'file.acceptedTypes': 'Accepted file types: {types}',
    'file.acceptedType': 'Accepted file type: {type}',
    'file.acceptedExtensions': 'Accepted file extensions: {extensions}',
    'file.acceptedExtension': 'Accepted file extension: {extension}',
    'file.maxFiles': 'You can select at most {maxFiles} files',
    'file.acceptDescriptionImage': 'Images',
    'file.acceptDescriptionVideo': 'Videos',
    'file.acceptDescriptionAudio': 'Audios',
    'file.acceptDescriptionDocument': 'Document',
    'file.acceptDescriptionPdf': 'PDF',
    'file.acceptDescriptionWord': 'Word Documents',
    'file.acceptDescriptionExcel': 'Excel Documents',
    'file.dictionaryMeaning': 'File',

    // Array
    'array.min': 'Please add at least {min} items',
    'array.max': 'You can add at most {max} items',

    // Async
    'async.pending': 'Validating...',
    'async.error': 'Validation error',

    // TR Validators
    'tr.tckn': 'Please enter a valid Turkish ID number',
    'tr.vkn': 'Please enter a valid Tax ID number',
    'tr.iban': 'Please enter a valid IBAN',
    'tr.phone': 'Please enter a valid phone number',
    'tr.plate': 'Please enter a valid license plate',
    'tr.postalCode': 'Please enter a valid postal code',

    // Email
    'email.domain': 'Email must be from one of the following domains: {domains}',
    'email.disposable': 'Disposable email addresses are not allowed',
    'email.allowedDomains': 'Email must be from one of the following domains: {domains}',
    'email.blockedDomains': 'Email from the following domains are not allowed: {domains}',
    'email.blockedDomain': 'Email from the following this domain is not allowed: {domain}',
    'email.blockDisposable': 'Disposable email addresses are not allowed',

    // Rating
    'rating.halfStep': 'Rating must be a multiple of 0.5',
    'rating.minValue': 'Rating must be {min} or higher',
    'rating.maxValue': 'Rating can be at most {max}',
    'rating.mustBeInteger': 'Rating must be an integer',

    // Percent
    'percent.min': 'Minimum must be {min}%',
    'percent.max': 'Maximum can be {max}%',

    // Tags
    'tags.minTags': 'At least {min} tags required',
    'tags.maxTags': 'At most {max} tags allowed',
    'tags.minLength': 'Tag must be at least {min} characters',
    'tags.maxLength': 'Tag can be at most {max} characters',
    'tags.duplicate': 'This tag already exists',

    // Time
    'time.invalid': 'Invalid time format',
    'time.minTime': 'Time must be at earliest {min}',
    'time.maxTime': 'Time must be at latest {max}',

    // URL
    'url.invalidProtocol': 'Invalid protocol. Expected: {protocols}',
    'url.invalidDomain': 'Invalid domain',

    // File
    'file.maxWidthExceeded': 'Image width cannot exceed {max}px',
    'file.minWidthRequired': 'Image width must be at least {min}px',
    'file.maxHeightExceeded': 'Image height cannot exceed {max}px',
    'file.minHeightRequired': 'Image height must be at least {min}px',

    // Validation
    'validation.min': 'Must be at least {min}',
    'validation.max': 'Can be at most {max}',

    // Multiselect
    'multiselect.selected': '{count} selected',
    'validation.dateRange': 'Start date must be before end date',
};

/**
 * TR: Varsayılan locale mesajları.
 * EN: Default locale messages.
 */
const DEFAULT_MESSAGES: LocaleMessages = {
    tr: TR_MESSAGES,
    en: EN_MESSAGES,
};

// =============================================================================
// TR: I18nService Class
// EN: I18nService Class
// =============================================================================

/**
 * TR: Validasyon mesajları için çoklu dil servisi.
 *
 * Özellikler:
 * - Signal-based reaktif locale yönetimi
 * - Placeholder desteği ({min}, {max} gibi)
 * - Custom locale ekleme
 * - Fallback mekanizması (en -> tr -> key)
 * - Singleton pattern
 *
 * EN: Multi-language service for validation messages.
 *
 * Features:
 * - Signal-based reactive locale management
 * - Placeholder support ({min}, {max}, etc.)
 * - Custom locale addition
 * - Fallback mechanism (en -> tr -> key)
 * - Singleton pattern
 *
 * @example
 * ```typescript
 * // Singleton instance
 * const i18n = I18nService.getInstance();
 *
 * // Locale değiştir
 * i18n.setLocale('en');
 *
 * // Mesaj al
 * const msg = i18n.t('string.min', { min: 3 });
 * // "Must be at least 3 characters"
 *
 * // Custom locale ekle
 * i18n.addLocale('de', {
 *   required: 'Dieses Feld ist erforderlich',
 *   'string.min': 'Mindestens {min} Zeichen erforderlich'
 * });
 * ```
 */
export class I18nService {
    private static instance: I18nService | null = null;

    private readonly messages: LocaleMessages;
    private readonly _locale: WritableSignal<LocaleCode>;
    private readonly _fallbackLocale: LocaleCode = 'tr';

    /**
     * TR: Mevcut locale signal'i.
     * EN: Current locale signal.
     */
    readonly locale: Signal<LocaleCode>;

    /**
     * TR: Mevcut locale'in mesaj sözlüğü (computed).
     * EN: Current locale's message dictionary (computed).
     */
    readonly currentMessages: Signal<MessageDictionary>;

    private constructor(initialLocale: LocaleCode = 'tr') {
        this.messages = {...DEFAULT_MESSAGES};
        this._locale = signal(initialLocale);
        this.locale = this._locale.asReadonly();

        this.currentMessages = computed(() => {
            const loc = this._locale();
            return this.messages[loc] ?? this.messages[this._fallbackLocale] ?? {};
        });
    }

    /**
     * TR: Singleton instance'ı döndürür.
     * EN: Returns singleton instance.
     */
    static getInstance(initialLocale?: LocaleCode): I18nService {
        if (!I18nService.instance) {
            I18nService.instance = new I18nService(initialLocale);
        } else if (initialLocale && I18nService.instance.getLocale() !== initialLocale) {
            // Farklı locale isteniyorsa, locale'i değiştir (opsiyonel)
            // Veya uyarı ver
            console.warn(
                `I18nService already initialized with locale "${I18nService.instance.getLocale()}". ` +
                `Cannot change to "${initialLocale}". Use setLocale() instead.`
            );
        }
        return I18nService.instance;
    }

    /**
     * TR: Singleton instance'ı sıfırlar (test için).
     * EN: Resets singleton instance (for testing).
     */
    static resetInstance(): void {
        I18nService.instance = null;
    }

    /**
     * TR: Mevcut locale'i değiştirir.
     * EN: Changes current locale.
     */
    setLocale(locale: LocaleCode): void {
        this._locale.set(locale);
    }

    /**
     * TR: Mevcut locale'i döndürür.
     * EN: Returns current locale.
     */
    getLocale(): LocaleCode {
        return this._locale();
    }

    /**
     * TR: Yeni bir locale ekler veya mevcut olanı günceller.
     * EN: Adds a new locale or updates existing one.
     */
    addLocale(locale: LocaleCode, messages: MessageDictionary): void {
        this.messages[locale] = {
            ...this.messages[locale],
            ...messages,
        };
    }

    /**
     * TR: Belirli bir locale için mesaj ekler.
     * EN: Adds messages for a specific locale.
     */
    addMessages(locale: LocaleCode, messages: MessageDictionary): void {
        this.addLocale(locale, messages);
    }

    /**
     * TR: Belirli bir anahtar için çeviri döndürür.
     * EN: Returns translation for a specific key.
     *
     * @param key - TR: Mesaj anahtarı / EN: Message key
     * @param params - TR: Placeholder parametreleri / EN: Placeholder parameters
     * @returns TR: Çevrilmiş mesaj / EN: Translated message
     */
    t(key: ValidationMessageKey, params?: MessageParams): string {
        return this.translate(key, params);
    }

    /**
     * TR: Belirli bir anahtar için çeviri döndürür (uzun form).
     * EN: Returns translation for a specific key (long form).
     */
    translate(key: ValidationMessageKey, params?: MessageParams): string {
        const locale = this._locale();

        // TR: Önce mevcut locale'de ara
        // EN: First search in current locale
        let message = this.messages[locale]?.[key];

        // TR: Yoksa fallback locale'de ara
        // EN: If not found, search in fallback locale
        if (!message && locale !== this._fallbackLocale) {
            message = this.messages[this._fallbackLocale]?.[key];
        }

        // TR: Hâlâ yoksa key'i döndür
        // EN: If still not found, return key
        if (!message) {
            return key;
        }

        // TR: Parametreleri yerleştir
        // EN: Replace parameters
        if (params) {
            return this.interpolate(message, params);
        }

        return message;
    }

    /**
     * TR: Belirli bir locale için çeviri döndürür.
     * EN: Returns translation for a specific locale.
     */
    translateFor(locale: LocaleCode, key: ValidationMessageKey, params?: MessageParams): string {
        let message = this.messages[locale]?.[key];

        if (!message) {
            message = this.messages[this._fallbackLocale]?.[key];
        }

        if (!message) {
            return key;
        }

        if (params) {
            return this.interpolate(message, params);
        }

        return message;
    }

    /**
     * TR: Mesaj içindeki placeholder'ları değerlerle değiştirir.
     * EN: Replaces placeholders in message with values.
     */
    private interpolate(message: string, params: MessageParams): string {
        return message.replace(/\{(\w+)\}/g, (_, key) => {
            const value = params[key];
            return value !== undefined ? String(value) : `{${key}}`;
        });
    }

    /**
     * TR: Desteklenen locale'lerin listesini döndürür.
     * EN: Returns list of supported locales.
     */
    getSupportedLocales(): LocaleCode[] {
        return Object.keys(this.messages);
    }

    /**
     * TR: Bir locale'in desteklenip desteklenmediğini kontrol eder.
     * EN: Checks if a locale is supported.
     */
    isLocaleSupported(locale: LocaleCode): boolean {
        return locale in this.messages;
    }

    /**
     * TR: Bir mesaj anahtarının mevcut locale'de tanımlı olup olmadığını kontrol eder.
     * EN: Checks if a message key is defined in current locale.
     */
    hasKey(key: ValidationMessageKey): boolean {
        const locale = this._locale();
        return !!(this.messages[locale]?.[key] || this.messages[this._fallbackLocale]?.[key]);
    }
}

// =============================================================================
// TR: Helper Functions
// EN: Helper Functions
// =============================================================================

/**
 * TR: Global I18n instance'ı döndürür.
 * EN: Returns global I18n instance.
 */
export function getI18n(): I18nService {
    return I18nService.getInstance();
}

/**
 * TR: Hızlı çeviri fonksiyonu.
 * EN: Quick translation function.
 *
 * @example
 * ```typescript
 * const msg = t('string.min', { min: 3 });
 * ```
 */
export function t(key: ValidationMessageKey, params?: MessageParams): string {
    return I18nService.getInstance().t(key, params);
}

/**
 * TR: Locale'i değiştirir.
 * EN: Changes locale.
 */
export function setLocale(locale: LocaleCode): void {
    I18nService.getInstance().setLocale(locale);
}

/**
 * TR: Mevcut locale'i döndürür.
 * EN: Returns current locale.
 */
export function getLocale(): LocaleCode {
    return I18nService.getInstance().getLocale();
}

/**
 * TR: Custom mesajlar ekler.
 * EN: Adds custom messages.
 */
export function addMessages(locale: LocaleCode, messages: MessageDictionary): void {
    I18nService.getInstance().addMessages(locale, messages);
}

/**
 * TR: Browser locale'ini algılar.
 * EN: Detects browser locale.
 */
export function detectBrowserLocale(): LocaleCode {
    if (typeof navigator === 'undefined') {
        return 'en';
    }

    const browserLang = navigator.language?.split('-')[0]?.toLowerCase();

    if (browserLang && I18nService.getInstance().isLocaleSupported(browserLang)) {
        return browserLang;
    }

    return 'en';
}

/**
 * TR: Browser locale'ini otomatik olarak ayarlar.
 * EN: Automatically sets browser locale.
 */
export function useAutoLocale(): LocaleCode {
    const locale = detectBrowserLocale();
    setLocale(locale);
    return locale;
}