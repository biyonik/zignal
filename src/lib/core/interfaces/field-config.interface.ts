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
}
