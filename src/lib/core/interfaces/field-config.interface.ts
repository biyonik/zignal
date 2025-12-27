import {FieldHooks} from "./field-hooks.interface";
import {FieldProps} from "./field-props.interface";

/**
 * TR: Değer fonksiyonu tipi - form değerlerini alıp boolean döner
 * EN: Value function type - takes form values and returns boolean
 */
export type ExpressionFn = (values: Record<string, unknown>) => boolean;

/**
 * TR: Expression tipi - fonksiyon veya string expression
 * EN: Expression type - function or string expression
 *
 * @example
 * ```typescript
 * // Fonksiyon olarak
 * hideExpression: (values) => !values.country
 *
 * // String expression olarak (JSON'a çevrilebilir!)
 * hideExpression: "!country"
 * hideExpression: "type !== 'individual'"
 * ```
 */
export type Expression<TResult = boolean> =
    | ((values: Record<string, unknown>) => TResult)
    | string;

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
     * TR: Alanın koşullu olarak zorunlu olup olmadığını belirleyen expression.
     * Form değerlerine göre dinamik zorunluluk tanımlamak için kullanılır.
     *
     * EN: Expression that determines if the field is conditionally required.
     * Used to define dynamic requirement based on form values.
     *
     * @example
     * ```typescript
     * // Fonksiyon olarak
     * requiredWhen: (values) => values.accountType === 'corporate'
     *
     * // String expression olarak (JSON'a çevrilebilir!)
     * requiredWhen: "accountType === 'corporate'"
     * requiredWhen: "country === 'TR' && age >= 18"
     * ```
     */
    requiredWhen?: Expression<boolean>;

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
     * TR: Özel validasyon expression'ı.
     * Geçerliyse null, değilse hata mesajı döner.
     *
     * EN: Custom validation expression.
     * Returns null if valid, error message otherwise.
     *
     * @example
     * ```typescript
     * // Fonksiyon olarak
     * customValidator: (value) => {
     *   return value.length >= 3 ? null : 'En az 3 karakter';
     * }
     *
     * // Form values ile
     * customValidator: (value, values) => {
     *   return value === values.password ? null : 'Şifreler eşleşmiyor';
     * }
     *
     * // String expression olarak (JSON'a çevrilebilir!)
     * customValidator: "value.length >= 3 ? null : 'En az 3 karakter'"
     * customValidator: "value === values.password ? null : 'Şifreler eşleşmiyor'"
     * ```
     */
    customValidator?:
        | string
        | ((value: unknown, values?: Record<string, unknown>) => string | null);

    /**
     * TR: Değeri otomatik olarak trim et (string için).
     * EN: Automatically trim the value (for strings).
     * @default false
     */
    trim?: boolean;

    /**
     * TR: Blur event'inde değeri transform eden expression.
     * EN: Expression that transforms value on blur event.
     *
     * @example
     * ```typescript
     * // Fonksiyon olarak
     * transformOnBlur: (v) => v.toLowerCase().trim()
     *
     * // String expression olarak (JSON'a çevrilebilir!)
     * transformOnBlur: "value.toLowerCase().trim()"
     * ```
     */
    transformOnBlur?: Expression<unknown>;

    /**
     * TR: Değer değiştiğinde transform eden expression.
     * EN: Expression that transforms value on change.
     *
     * @example
     * ```typescript
     * // String expression
     * transformOnChange: "value.toUpperCase()"
     * ```
     */
    transformOnChange?: Expression<unknown>;

    /**
     * TR: Validation debounce süresi (ms).
     * Sadece bu alan için geçerli.
     * EN: Validation debounce time (ms).
     * Only applies to this field.
     */
    validationDebounce?: number;

    /**
     * TR: Alan gizleme expression'ı. true dönerse alan gizlenir.
     * EN: Field hide expression. Field is hidden if returns true.
     *
     * @example
     * ```typescript
     * // String expression (zaten destekleniyor!)
     * hideExpression: "!country"
     * hideExpression: "type !== 'individual'"
     *
     * // Fonksiyon olarak
     * hideExpression: (values) => !values.country
     * ```
     */
    hideExpression?: Expression<boolean>;

    /**
     * TR: Alan devre dışı bırakma expression'ı.
     * EN: Field disable expression.
     *
     * @example
     * ```typescript
     * disableExpression: "status === 'locked'"
     * ```
     */
    disableExpression?: Expression<boolean>;

    /**
     * TR: Field lifecycle hooks.
     * EN: Field lifecycle hooks.
     */
    hooks?: FieldHooks;

    /**
     * TR: Field UI özellikleri.
     * EN: Field UI properties.
     *
     * @example
     * ```typescript
     * props: {
     *     prefixIcon: 'mail',
     *     cssClass: 'col-md-6',
     *     attributes: {
     *         'data-testid': 'email-input'
     *     }
     * }
     * ```
     */
    props?: FieldProps;
}
