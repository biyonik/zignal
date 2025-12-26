import {FieldHooks} from "./field-hooks.interface";

/**
 * TR: Değer fonksiyonu tipi - form değerlerini alıp boolean döner
 * EN: Value function type - takes form values and returns boolean
 */
export type ExpressionFn = (values: Record<string, unknown>) => boolean;

/**
 * TR: Expression tipi - fonksiyon veya field adı string
 * EN: Expression type - function or field name string
 */
export type Expression = ExpressionFn | string;

/**
 * @fileoverview
 * TR: Alan (Field) konfigürasyon seçeneklerini tanımlayan arayüz.
 * Bir form alanının görünürlüğü, zorunluluğu ve kullanıcıya sunulan ipuçları gibi
 * temel yapılandırma ayarlarını belirler.
 *
 * EN: Interface defining field configuration options.
 * Determines the basic configuration settings of a form field,
 * such as visibility, requirement status, and hints presented to the user.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: Tüm alan türleri için ortak yapılandırma seçeneklerini tanımlar.
 * Her alan tipi bu temel yapılandırmayı genişletebilir.
 *
 * EN: Defines common configuration options for all field types.
 * Each field type can extend this base configuration.
 *
 * @example
 * ```typescript
 * const config: FieldConfig = {
 *   required: true,
 *   hint: 'E-posta adresinizi giriniz',
 *   placeholder: 'ornek@email.com'
 * };
 * ```
 */
export interface FieldConfig {
    /**
     * TR: Alanın doldurulmasının zorunlu olup olmadığını belirtir.
     * `true` ise Zod şeması bu alanı zorunlu kılar ve boş değer kabul etmez.
     * `false` veya `undefined` ise alan nullable/optional olarak işaretlenir.
     *
     * EN: Indicates whether filling the field is mandatory.
     * If `true`, the Zod schema enforces this field as required and rejects empty values.
     * If `false` or `undefined`, the field is marked as nullable/optional.
     *
     * @default false
     */
    required?: boolean;

    /**
     * TR: Kullanıcı arayüzünde alanın altında veya yanında gösterilecek yardımcı metin.
     * Beklenen veri formatı, kısıtlamalar veya örnekler hakkında bilgi vermek için kullanılır.
     * Hata mesajından farklı olarak her zaman görünür durumda kalabilir.
     *
     * EN: Helper text to be displayed below or next to the field in the user interface.
     * Used to provide information about expected data format, constraints, or examples.
     * Unlike error messages, this can remain visible at all times.
     *
     * @example 'Şifreniz en az 8 karakter olmalıdır'
     */
    hint?: string;

    /**
     * TR: Alan boşken içerisinde görünecek yer tutucu metin.
     * Kullanıcıya beklenen giriş formatı hakkında görsel ipucu sağlar.
     * Değer girildiğinde kaybolur.
     *
     * EN: Placeholder text to appear inside the field when it is empty.
     * Provides visual cues to the user about the expected input format.
     * Disappears when a value is entered.
     *
     * @example 'Ad Soyad'
     */
    placeholder?: string;

    /**
     * TR: Alanın devre dışı (disabled) olup olmadığını belirtir.
     * `true` ise kullanıcı bu alana değer giremez ve alan gri tonlarında gösterilir.
     *
     * EN: Indicates whether the field is disabled.
     * If `true`, the user cannot enter values and the field is displayed in gray tones.
     *
     * @default false
     */
    disabled?: boolean;

    /**
     * TR: Alanın salt okunur (readonly) olup olmadığını belirtir.
     * `true` ise değer görüntülenir ancak düzenlenemez.
     * Disabled'dan farkı: form submit'te değer gönderilir.
     *
     * EN: Indicates whether the field is read-only.
     * If `true`, the value is displayed but cannot be edited.
     * Unlike disabled: the value is sent on form submit.
     *
     * @default false
     */
    readonly?: boolean;

    /**
     * TR: Alanın koşullu olarak zorunlu olup olmadığını belirleyen fonksiyon.
     * Form değerlerine göre dinamik zorunluluk tanımlamak için kullanılır.
     * `required` değeri `true` ise bu fonksiyon göz ardı edilir.
     *
     * EN: Function that determines if the field is conditionally required.
     * Used to define dynamic requirement based on form values.
     * If `required` is `true`, this function is ignored.
     *
     * @example
     * ```typescript
     * // Kurumsal hesap seçildiğinde vergi numarası zorunlu
     * requiredWhen: (values) => values.accountType === 'corporate'
     *
     * // Ülke Türkiye ise TC Kimlik No zorunlu
     * requiredWhen: (values) => values.country === 'TR'
     * ```
     */
    requiredWhen?: (values: Record<string, unknown>) => boolean;

    /**
     * TR: Varsayılan değer. Form oluşturulurken kullanılır.
     *
     * EN: Default value. Used when creating the form.
     */
    defaultValue?: unknown;

    /**
     * TR: Alanın kabul etmesi gereken regex deseni.
     * Girilen değerin bu desene uyması beklenir.
     *
     * EN: Regex pattern that the field value must match.
     * The entered value is expected to conform to this pattern.
     *
     * @example /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ (email format)
     * @example '^[0-9]{10}$' (10 haneli rakamlar)
     *
     */
    pattern?: RegExp | string

    /**
     * TR: Özel validasyon fonksiyonu. Zod şemasından sonra çalışır.
     * EN: Custom validation function. Runs after Zod schema validation.
     */
    customValidator?: (value: unknown) => string | null;

    /**
     * TR: Değeri otomatik olarak trim et (string için).
     * EN: Automatically trim the value (for strings).
     * @default false
     */
    trim?: boolean;

    /**
     * TR: Blur event'inde değeri transform et.
     * EN: Transform value on blur event.
     *
     * @example
     * ```typescript
     * transformOnBlur: (v) => v.toLowerCase().trim()
     * ```
     */
    transformOnBlur?: (value: unknown) => unknown;

    /**
     * TR: Değer değiştiğinde transform et.
     * EN: Transform value on change.
     */
    transformOnChange?: (value: unknown) => unknown;

    /**
     * TR: Validation debounce süresi (ms).
     * Sadece bu alan için geçerli.
     * EN: Validation debounce time (ms).
     * Only applies to this field.
     */
    validationDebounce?: number;

    /**
     * TR: Alan gizleme koşulu. true dönerse alan gizlenir.
     * EN: Field hide condition. Field is hidden if returns true.
     *
     * @example
     * // Fonksiyon olarak
     * hideExpression: (values) => !values['country']
     *
     * // String olarak (falsy ise gizle)
     * hideExpression: '!country'
     *
     * // String olarak (eşitlik)
     * hideExpression: 'type !== "individual"'
     */
    hideExpression?: Expression;

    /**
     * TR: Alan devre dışı bırakma koşulu. true dönerse alan disabled olur.
     * EN: Field disable condition. Field is disabled if returns true.
     *
     * @example
     * disableExpression: (values) => values['status'] === 'locked'
     */
    disableExpression?: Expression;

    /**
     * TR: Field lifecycle hooks.
     * EN: Field lifecycle hooks.
     */
    hooks?: FieldHooks;
}
