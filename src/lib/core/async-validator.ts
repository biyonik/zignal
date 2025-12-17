import { signal, computed, Signal, WritableSignal } from '@angular/core';

/**
 * @fileoverview
 * TR: Asenkron validasyon için AsyncValidator sınıfı.
 * API üzerinden email/username benzersizlik kontrolü gibi işlemler için kullanılır.
 *
 * EN: AsyncValidator class for asynchronous validation.
 * Used for operations like email/username uniqueness check via API.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

// =============================================================================
// TR: Types & Interfaces
// EN: Types & Interfaces
// =============================================================================

/**
 * TR: Asenkron validasyon fonksiyonunun tipi.
 * EN: Type of async validation function.
 *
 * @param value - TR: Doğrulanacak değer / EN: Value to validate
 * @param signal - TR: İptal sinyali / EN: Abort signal
 * @returns TR: Hata mesajı veya null (geçerli) / EN: Error message or null (valid)
 */
export type AsyncValidatorFn<T = unknown> = (
    value: T,
    signal?: AbortSignal
) => Promise<string | null>;

/**
 * TR: Asenkron validasyon durumu.
 * EN: Async validation state.
 */
export type AsyncValidationStatus = 'idle' | 'pending' | 'valid' | 'invalid';

/**
 * TR: AsyncValidator konfigürasyon seçenekleri.
 * EN: AsyncValidator configuration options.
 */
export interface AsyncValidatorOptions {
    /**
     * TR: Debounce süresi (ms). API çağrılarını sınırlar.
     * EN: Debounce time (ms). Limits API calls.
     * @default 300
     */
    debounce?: number;

    /**
     * TR: Sonuçları cache'le. Aynı değer için tekrar API çağrısı yapmaz.
     * EN: Cache results. Won't call API again for same value.
     * @default true
     */
    cache?: boolean;

    /**
     * TR: Cache boyutu (LRU). En fazla kaç sonuç saklanacak.
     * EN: Cache size (LRU). Maximum number of results to store.
     * @default 50
     */
    cacheSize?: number;

    /**
     * TR: Minimum karakter sayısı. Bu sayının altında validasyon yapılmaz.
     * EN: Minimum character count. No validation below this count.
     * @default 0
     */
    minLength?: number;

    /**
     * TR: Boş değer için validasyon yapılsın mı?
     * EN: Should validate empty values?
     * @default false
     */
    validateEmpty?: boolean;
}

/**
 * TR: Cache girişi yapısı.
 * EN: Cache entry structure.
 */
interface CacheEntry {
    /**
     * TR: Validasyon sonucu (hata mesajı veya null).
     * EN: Validation result (error message or null).
     */
    result: string | null;

    /**
     * TR: Kayıt zamanı.
     * EN: Record timestamp.
     */
    timestamp: number;
}

// =============================================================================
// TR: AsyncValidator Class
// EN: AsyncValidator Class
// =============================================================================

/**
 * TR: Asenkron validasyon yönetimi için sınıf.
 *
 * Özellikler:
 * - Debounce ile API çağrı optimizasyonu
 * - LRU cache ile tekrar sorguları önleme
 * - AbortController ile eski istekleri iptal etme
 * - Signal-based reaktif state
 * - Loading durumu takibi
 *
 * EN: Class for async validation management.
 *
 * Features:
 * - API call optimization with debounce
 * - Prevent repeat queries with LRU cache
 * - Cancel old requests with AbortController
 * - Signal-based reactive state
 * - Loading state tracking
 *
 * @example
 * ```typescript
 * // Email benzersizlik kontrolü
 * const emailValidator = new AsyncValidator<string>(
 *   async (email, signal) => {
 *     const response = await fetch(`/api/check-email?email=${email}`, { signal });
 *     const { exists } = await response.json();
 *     return exists ? 'Bu email zaten kullanılıyor' : null;
 *   },
 *   { debounce: 500 }
 * );
 *
 * // Kullanım
 * await emailValidator.validate('test@example.com');
 * console.log(emailValidator.error());    // null veya hata mesajı
 * console.log(emailValidator.status());   // 'valid' veya 'invalid'
 * console.log(emailValidator.pending());  // false
 * ```
 *
 * @example
 * ```typescript
 * // Username kontrolü (minimum 3 karakter)
 * const usernameValidator = new AsyncValidator<string>(
 *   async (username) => {
 *     const res = await api.checkUsername(username);
 *     return res.available ? null : 'Bu kullanıcı adı alınmış';
 *   },
 *   { debounce: 300, minLength: 3 }
 * );
 * ```
 */
export class AsyncValidator<T = unknown> {
    private readonly options: Required<AsyncValidatorOptions>;
    private readonly cache: Map<string, CacheEntry> = new Map();
    private debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private abortController: AbortController | null = null;

    // TR: Reaktif state
    // EN: Reactive state
    private readonly _status: WritableSignal<AsyncValidationStatus> = signal('idle');
    private readonly _error: WritableSignal<string | null> = signal(null);
    private readonly _lastValidatedValue: WritableSignal<T | null> = signal(null);

    /**
     * TR: Validasyon durumu signal'i.
     * EN: Validation status signal.
     */
    readonly status: Signal<AsyncValidationStatus> = this._status.asReadonly();

    /**
     * TR: Hata mesajı signal'i.
     * EN: Error message signal.
     */
    readonly error: Signal<string | null> = this._error.asReadonly();

    /**
     * TR: Validasyon bekliyor mu?
     * EN: Is validation pending?
     */
    readonly pending: Signal<boolean> = computed(() => this._status() === 'pending');

    /**
     * TR: Değer geçerli mi?
     * EN: Is value valid?
     */
    readonly valid: Signal<boolean> = computed(() => this._status() === 'valid');

    /**
     * TR: Değer geçersiz mi?
     * EN: Is value invalid?
     */
    readonly invalid: Signal<boolean> = computed(() => this._status() === 'invalid');

    /**
     * TR: Son doğrulanan değer.
     * EN: Last validated value.
     */
    readonly lastValidatedValue: Signal<T | null> = this._lastValidatedValue.asReadonly();

    constructor(
        private readonly validatorFn: AsyncValidatorFn<T>,
        options?: AsyncValidatorOptions
    ) {
        this.options = {
            debounce: options?.debounce ?? 300,
            cache: options?.cache ?? true,
            cacheSize: options?.cacheSize ?? 50,
            minLength: options?.minLength ?? 0,
            validateEmpty: options?.validateEmpty ?? false,
        };
    }

    /**
     * TR: Değeri cache key'ine dönüştürür.
     * EN: Converts value to cache key.
     */
    private getCacheKey(value: T): string {
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return String(value);
        return JSON.stringify(value);
    }

    /**
     * TR: Cache'den sonucu getirir.
     * EN: Gets result from cache.
     */
    private getFromCache(value: T): string | null | undefined {
        if (!this.options.cache) return undefined;

        const key = this.getCacheKey(value);
        const entry = this.cache.get(key);

        if (entry) {
            // TR: LRU: erişilen öğeyi sona taşı
            // EN: LRU: move accessed item to end
            this.cache.delete(key);
            this.cache.set(key, entry);
            return entry.result;
        }

        return undefined;
    }

    /**
     * TR: Sonucu cache'e ekler.
     * EN: Adds result to cache.
     */
    private addToCache(value: T, result: string | null): void {
        if (!this.options.cache) return;

        const key = this.getCacheKey(value);

        // TR: LRU: boyut aşıldıysa en eski öğeyi sil
        // EN: LRU: remove oldest item if size exceeded
        if (this.cache.size >= this.options.cacheSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            result,
            timestamp: Date.now(),
        });
    }

    /**
     * TR: Değerin validasyona uygun olup olmadığını kontrol eder.
     * EN: Checks if value is eligible for validation.
     */
    private shouldValidate(value: T): boolean {
        // TR: Boş değer kontrolü
        // EN: Empty value check
        if (value === null || value === undefined) {
            return this.options.validateEmpty;
        }

        if (typeof value === 'string') {
            if (value.trim() === '') {
                return this.options.validateEmpty;
            }

            // TR: Minimum uzunluk kontrolü
            // EN: Minimum length check
            if (value.length < this.options.minLength) {
                return false;
            }
        }

        return true;
    }

    /**
     * TR: Değeri asenkron olarak doğrular.
     * EN: Validates value asynchronously.
     *
     * @param value - TR: Doğrulanacak değer / EN: Value to validate
     * @returns TR: Hata mesajı veya null / EN: Error message or null
     */
    async validate(value: T): Promise<string | null> {
        // TR: Validasyona uygun değilse idle'a dön
        // EN: Return to idle if not eligible for validation
        if (!this.shouldValidate(value)) {
            this._status.set('idle');
            this._error.set(null);
            return null;
        }

        // TR: Cache kontrolü
        // EN: Cache check
        const cachedResult = this.getFromCache(value);
        if (cachedResult !== undefined) {
            this._status.set(cachedResult === null ? 'valid' : 'invalid');
            this._error.set(cachedResult);
            this._lastValidatedValue.set(value);
            return cachedResult;
        }

        // TR: Önceki isteği iptal et
        // EN: Cancel previous request
        if (this.abortController) {
            this.abortController.abort();
        }

        this.abortController = new AbortController();
        this._status.set('pending');

        try {
            const result = await this.validatorFn(value, this.abortController.signal);

            // TR: Sonucu cache'e ekle
            // EN: Add result to cache
            this.addToCache(value, result);

            this._status.set(result === null ? 'valid' : 'invalid');
            this._error.set(result);
            this._lastValidatedValue.set(value);

            return result;
        } catch (error) {
            // TR: İptal edilmişse sessizce geç
            // EN: Silently pass if aborted
            if (error instanceof Error && error.name === 'AbortError') {
                return null;
            }

            // TR: Diğer hatalarda invalid olarak işaretle
            // EN: Mark as invalid for other errors
            const errorMessage = error instanceof Error ? error.message : 'Doğrulama hatası';
            this._status.set('invalid');
            this._error.set(errorMessage);

            return errorMessage;
        }
    }

    /**
     * TR: Debounce ile değeri doğrular.
     * EN: Validates value with debounce.
     *
     * @param value - TR: Doğrulanacak değer / EN: Value to validate
     * @returns TR: Promise<hata mesajı veya null> / EN: Promise<error message or null>
     */
    validateDebounced(value: T): Promise<string | null> {
        return new Promise((resolve) => {
            // TR: Önceki timer'ı temizle
            // EN: Clear previous timer
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }

            // TR: Validasyona uygun değilse hemen çöz
            // EN: Resolve immediately if not eligible
            if (!this.shouldValidate(value)) {
                this._status.set('idle');
                this._error.set(null);
                resolve(null);
                return;
            }

            // TR: Pending durumuna geç
            // EN: Switch to pending state
            this._status.set('pending');

            this.debounceTimer = setTimeout(async () => {
                const result = await this.validate(value);
                resolve(result);
            }, this.options.debounce);
        });
    }

    /**
     * TR: Validasyonu sıfırlar.
     * EN: Resets validation.
     */
    reset(): void {
        // TR: Timer'ı temizle
        // EN: Clear timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }

        // TR: İsteği iptal et
        // EN: Abort request
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }

        this._status.set('idle');
        this._error.set(null);
        this._lastValidatedValue.set(null);
    }

    /**
     * TR: Cache'i temizler.
     * EN: Clears cache.
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * TR: Cache boyutunu döndürür.
     * EN: Returns cache size.
     */
    getCacheSize(): number {
        return this.cache.size;
    }

    /**
     * TR: Kaynakları temizler.
     * EN: Cleans up resources.
     */
    destroy(): void {
        this.reset();
        this.clearCache();
    }
}

// =============================================================================
// TR: Factory Functions
// EN: Factory Functions
// =============================================================================

/**
 * TR: Email benzersizlik validator'ü oluşturur.
 * EN: Creates email uniqueness validator.
 *
 * @example
 * ```typescript
 * const emailCheck = createEmailValidator(async (email) => {
 *   const res = await fetch(`/api/check-email?email=${email}`);
 *   return (await res.json()).exists;
 * });
 *
 * await emailCheck.validate('test@example.com');
 * ```
 */
export function createEmailValidator(
    checkFn: (email: string, signal?: AbortSignal) => Promise<boolean>,
    options?: AsyncValidatorOptions & { errorMessage?: string }
): AsyncValidator<string> {
    const errorMessage = options?.errorMessage ?? 'Bu email adresi zaten kullanılıyor';

    return new AsyncValidator<string>(
        async (email, signal) => {
            const exists = await checkFn(email, signal);
            return exists ? errorMessage : null;
        },
        { minLength: 5, ...options }
    );
}

/**
 * TR: Username benzersizlik validator'ü oluşturur.
 * EN: Creates username uniqueness validator.
 *
 * @example
 * ```typescript
 * const usernameCheck = createUsernameValidator(async (username) => {
 *   const res = await fetch(`/api/check-username?username=${username}`);
 *   return (await res.json()).available;
 * });
 * ```
 */
export function createUsernameValidator(
    checkFn: (username: string, signal?: AbortSignal) => Promise<boolean>,
    options?: AsyncValidatorOptions & { errorMessage?: string }
): AsyncValidator<string> {
    const errorMessage = options?.errorMessage ?? 'Bu kullanıcı adı zaten alınmış';

    return new AsyncValidator<string>(
        async (username, signal) => {
            const available = await checkFn(username, signal);
            return available ? null : errorMessage;
        },
        { minLength: 3, ...options }
    );
}

/**
 * TR: Genel benzersizlik validator'ü oluşturur.
 * EN: Creates general uniqueness validator.
 *
 * @example
 * ```typescript
 * const slugCheck = createUniquenessValidator(
 *   async (slug) => api.checkSlug(slug),
 *   'Bu URL zaten kullanılıyor'
 * );
 * ```
 */
export function createUniquenessValidator<T = string>(
    checkFn: (value: T, signal?: AbortSignal) => Promise<boolean>,
    errorMessage: string,
    options?: AsyncValidatorOptions
): AsyncValidator<T> {
    return new AsyncValidator<T>(
        async (value, signal) => {
            const isUnique = await checkFn(value, signal);
            return isUnique ? null : errorMessage;
        },
        options
    );
}