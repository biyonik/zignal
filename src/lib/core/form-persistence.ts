import { effect, Signal, DestroyRef } from '@angular/core';
import {FormDataType} from "./form-state";

/**
 * @fileoverview
 * TR: Form state'ini localStorage veya sessionStorage'da saklamak için servis.
 * Signal-based auto-save ve restore desteği sağlar.
 *
 * EN: Service for persisting form state to localStorage or sessionStorage.
 * Provides Signal-based auto-save and restore support.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

// =============================================================================
// TR: Types & Interfaces
// EN: Types & Interfaces
// =============================================================================

/**
 * TR: Storage tipi seçimi.
 * EN: Storage type selection.
 */
export type StorageType = 'local' | 'session';

/**
 * TR: FormPersistence konfigürasyon seçenekleri.
 * EN: FormPersistence configuration options.
 */
export interface FormPersistenceOptions {
    /**
     * TR: Storage anahtarı. Form verisi bu isimle saklanır.
     * EN: Storage key. Form data is stored with this name.
     */
    key: string;

    /**
     * TR: Storage tipi. Varsayılan: 'local'.
     * EN: Storage type. Default: 'local'.
     * @default 'local'
     */
    storage?: StorageType;

    /**
     * TR: Auto-save için debounce süresi (ms). 0 ise debounce kapalı.
     * EN: Debounce time for auto-save (ms). 0 disables debounce.
     * @default 300
     */
    debounce?: number;

    /**
     * TR: Verinin geçerlilik süresi (ms). null ise süresiz.
     * EN: Data expiry time (ms). null means no expiry.
     * @default null
     */
    expiry?: number | null;

    /**
     * TR: Sadece belirli alanları sakla. null ise tüm alanlar.
     * EN: Only persist specific fields. null means all fields.
     * @default null
     */
    include?: string[] | null;

    /**
     * TR: Belirli alanları hariç tut (şifreler gibi).
     * EN: Exclude specific fields (like passwords).
     * @default []
     */
    exclude?: string[];

    /**
     * TR: Storage prefix'i (namespace için).
     * EN: Storage prefix (for namespacing).
     * @default 'zignal_'
     */
    prefix?: string;
}

/**
 * TR: Storage'da saklanan veri yapısı.
 * EN: Data structure stored in storage.
 */
interface PersistedData<T> {
    /**
     * TR: Form verisi.
     * EN: Form data.
     */
    data: T;

    /**
     * TR: Kayıt zamanı (timestamp).
     * EN: Save timestamp.
     */
    timestamp: number;

    /**
     * TR: Zignal versiyonu (uyumluluk için).
     * EN: Zignal version (for compatibility).
     */
    version: string;
}

// =============================================================================
// TR: FormPersistence Class
// EN: FormPersistence Class
// =============================================================================

/**
 * TR: Form state'ini browser storage'da saklamak için yardımcı sınıf.
 *
 * Özellikler:
 * - localStorage veya sessionStorage desteği
 * - Auto-save (Signal effect ile)
 * - Debounce desteği
 * - Expiry (TTL) desteği
 * - Field filtering (include/exclude)
 * - Namespace prefix
 *
 * EN: Helper class for persisting form state to browser storage.
 *
 * Features:
 * - localStorage or sessionStorage support
 * - Auto-save (with Signal effect)
 * - Debounce support
 * - Expiry (TTL) support
 * - Field filtering (include/exclude)
 * - Namespace prefix
 *
 * @example
 * ```typescript
 * // Basit kullanım
 * const persistence = new FormPersistence({
 *   key: 'user-form',
 *   debounce: 500
 * });
 *
 * // Form state'ini kaydet (manuel)
 * persistence.save(form.values());
 *
 * // Form state'ini yükle
 * const saved = persistence.load<UserForm>();
 * if (saved) {
 *   form.patchValues(saved);
 * }
 *
 * // Auto-save aktif et
 * persistence.enableAutoSave(form.values);
 *
 * // Temizle
 * persistence.clear();
 * ```
 *
 * @example
 * ```typescript
 * // Hassas alanları hariç tutma
 * const persistence = new FormPersistence({
 *   key: 'login-form',
 *   exclude: ['password', 'confirmPassword'],
 *   expiry: 30 * 60 * 1000 // 30 dakika
 * });
 * ```
 */
export class FormPersistence<T extends FormDataType = FormDataType> {
    private readonly options: Required<FormPersistenceOptions>;
    private readonly storage: Storage | null;
    private debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private effectCleanup: (() => void) | null = null;

    /**
     * TR: Zignal kütüphane versiyonu.
     * EN: Zignal library version.
     */
    private readonly VERSION = '0.1.0';

    constructor(options: FormPersistenceOptions) {
        // TR: Varsayılan değerlerle birleştir
        // EN: Merge with defaults
        this.options = {
            key: options.key,
            storage: options.storage ?? 'local',
            debounce: options.debounce ?? 300,
            expiry: options.expiry ?? null,
            include: options.include ?? null,
            exclude: options.exclude ?? [],
            prefix: options.prefix ?? 'zignal_',
        };

        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
            this.storage = null;
            return;
        }

        // TR: Storage seçimi
        // EN: Storage selection
        this.storage = this.options.storage === 'session'
            ? sessionStorage
            : localStorage;
    }

    /**
     * TR: Storage anahtarını prefix ile döndürür.
     * EN: Returns storage key with prefix.
     */
    private get storageKey(): string {
        return `${this.options.prefix}${this.options.key}`;
    }

    /**
     * TR: Veriyi filtreleyerek sadece izin verilen alanları döndürür.
     * EN: Filters data to return only allowed fields.
     */
    private filterData(data: T): Partial<T> {
        const result: Partial<T> = {};

        for (const key of Object.keys(data) as (keyof T)[]) {
            // TR: Exclude listesinde mi kontrol et
            // EN: Check if in exclude list
            if (this.options.exclude.includes(key as string)) {
                continue;
            }

            // TR: Include listesi varsa, sadece o alanları al
            // EN: If include list exists, only take those fields
            if (this.options.include && !this.options.include.includes(key as string)) {
                continue;
            }

            result[key] = data[key];
        }

        return result;
    }

    /**
     * TR: Form verisini storage'a kaydeder.
     * EN: Saves form data to storage.
     *
     * @param data - TR: Kaydedilecek form verisi / EN: Form data to save
     */
    save(data: T): void {
        if (!this.storage) return;
        try {
            const filteredData = this.filterData(data);

            const persistedData: PersistedData<Partial<T>> = {
                data: filteredData,
                timestamp: Date.now(),
                version: this.VERSION,
            };

            this.storage?.setItem(this.storageKey, JSON.stringify(persistedData));
        } catch (error) {
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                console.warn(`[Zignal] FormPersistence: Storage quota exceeded for key "${this.storageKey}"`);
            } else {
                console.warn(`[Zignal] FormPersistence save failed:`, error);
            }
        }
    }

    /**
     * TR: Form verisini storage'dan yükler.
     * EN: Loads form data from storage.
     *
     * @returns TR: Kaydedilmiş veri veya null / EN: Saved data or null
     */
    load(): Partial<T> | null {
        if (!this.storage) return null;
        try {
            const raw = this.storage?.getItem(this.storageKey);
            if (!raw) return null;

            const persisted: PersistedData<Partial<T>> = JSON.parse(raw);

            // TR: Expiry kontrolü
            // EN: Expiry check
            if (this.options.expiry !== null) {
                const age = Date.now() - persisted.timestamp;
                if (age > this.options.expiry) {
                    this.clear();
                    return null;
                }
            }

            return persisted.data;
        } catch (error) {
            console.warn(`[Zignal] FormPersistence load failed, clearing corrupted data:`, error);
            this.clear();
            return null;
        }
    }

    /**
     * TR: Storage'daki veriyi temizler.
     * EN: Clears data from storage.
     */
    clear(): void {
        if (!this.storage) return;
        this.storage.removeItem(this.storageKey);
    }

    /**
     * TR: Verinin var olup olmadığını kontrol eder.
     * EN: Checks if data exists.
     */
    exists(): boolean | undefined {
        if (!this.storage) return;
        return this.storage.getItem(this.storageKey) !== null;
    }

    /**
     * TR: Verinin yaşını (ms) döndürür.
     * EN: Returns data age (ms).
     */
    getAge(): number | null {
        if (!this.storage) return null;

        try {
            const raw = this.storage.getItem(this.storageKey);
            if (!raw) return null;

            const persisted: PersistedData<unknown> = JSON.parse(raw);
            return Date.now() - persisted.timestamp;
        } catch (error) {
            console.debug(`[Zignal] FormPersistence getAge failed:`, error);
            return null;
        }
    }

    /**
     * TR: Debounce ile kaydetme işlemi.
     * EN: Save operation with debounce.
     */
    private debouncedSave(data: T): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        if (this.options.debounce === 0) {
            this.save(data);
            return;
        }

        this.debounceTimer = setTimeout(() => {
            this.save(data);
            this.debounceTimer = null;
        }, this.options.debounce);
    }

    /**
     * TR: Signal değişikliklerini izleyerek otomatik kaydetmeyi aktif eder.
     * EN: Enables auto-save by watching Signal changes.
     *
     * @param valuesSignal - TR: Form values signal'i / EN: Form values signal
     * @param destroyRef - TR: Angular DestroyRef (otomatik cleanup için) / EN: Angular DestroyRef (for auto cleanup)
     *
     * @example
     * ```typescript
     * // Component içinde
     * private destroyRef = inject(DestroyRef);
     *
     * ngOnInit() {
     *   this.persistence.enableAutoSave(this.form.values, this.destroyRef);
     * }
     * ```
     */
    enableAutoSave(valuesSignal: Signal<T>, destroyRef?: DestroyRef): void {
        // TR: Önceki effect'i temizle
        // EN: Clean up previous effect
        this.disableAutoSave();

        // TR: Effect ile signal değişikliklerini izle
        // EN: Watch signal changes with effect
        // Not: Angular injection context dışında çalışabilmesi için
        // effect'i try-catch içinde kullanıyoruz
        try {
            const effectRef = effect(() => {
                const currentValues = valuesSignal();
                this.debouncedSave(currentValues);
            });

            this.effectCleanup = () => effectRef.destroy();

            // TR: DestroyRef varsa, component destroy'da cleanup
            // EN: If DestroyRef exists, cleanup on component destroy
            if (destroyRef) {
                destroyRef.onDestroy(() => this.disableAutoSave());
            }
        } catch {
            // TR: Injection context dışında çalışıyoruz, manual save kullanılmalı
            // EN: Running outside injection context, manual save should be used
            console.warn('[Zignal] enableAutoSave requires Angular injection context. Use manual save() instead.');
        }
    }

    /**
     * TR: Otomatik kaydetmeyi devre dışı bırakır.
     * EN: Disables auto-save.
     */
    disableAutoSave(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }

        if (this.effectCleanup) {
            this.effectCleanup();
            this.effectCleanup = null;
        }
    }

    /**
     * TR: Kaynakları temizler (cleanup).
     * EN: Cleans up resources.
     */
    destroy(): void {
        this.disableAutoSave();
    }
}

// =============================================================================
// TR: Helper Functions
// EN: Helper Functions
// =============================================================================

/**
 * TR: Hızlı FormPersistence oluşturmak için factory fonksiyonu.
 * EN: Factory function for quick FormPersistence creation.
 *
 * @example
 * ```typescript
 * const persistence = createFormPersistence('checkout-form', {
 *   expiry: 60 * 60 * 1000, // 1 saat
 *   exclude: ['cardNumber', 'cvv']
 * });
 * ```
 */
export function createFormPersistence<T extends FormDataType>(
    key: string,
    options?: Omit<FormPersistenceOptions, 'key'>
): FormPersistence<T> {
    return new FormPersistence<T>({ key, ...options });
}

/**
 * TR: Tüm Zignal persistence verilerini temizler.
 * EN: Clears all Zignal persistence data.
 *
 * @param storage - TR: Temizlenecek storage tipi / EN: Storage type to clear
 * @param prefix - TR: Prefix (varsayılan: 'zignal_') / EN: Prefix (default: 'zignal_')
 */
export function clearAllZignalPersistence(
    storage: StorageType = 'local',
    prefix: string = 'zignal_'
): void {
    if (typeof window === 'undefined') return;

    const storageObj = storage === 'session' ? sessionStorage : localStorage;
    const keysToRemove: string[] = [];

    for (let i = 0; i < storageObj.length; i++) {
        const key = storageObj.key(i);
        if (key?.startsWith(prefix)) {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach(key => storageObj.removeItem(key));
}
