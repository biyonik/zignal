import { Signal, WritableSignal } from '@angular/core';

/**
 * @fileoverview
 * TR: Alan değerini ve durumunu yöneten Signal tabanlı reaktif yapı.
 * Angular Signals mimarisini kullanarak fine-grained reactivity sağlar.
 * Form state yönetiminin kalbidir.
 *
 * EN: Signal-based reactive structure managing field value and state.
 * Provides fine-grained reactivity using Angular Signals architecture.
 * This is the heart of form state management.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: Bir form alanının tüm reaktif durumunu kapsayan sarmalayıcı yapı.
 * Her bir alan için ayrı bir FieldValue instance'ı oluşturulur ve bu instance
 * alanın değerini, hata durumunu, etkileşim bilgisini ve geçerlilik durumunu
 * Signal'ler aracılığıyla yönetir.
 *
 * EN: Wrapper structure encapsulating the entire reactive state of a form field.
 * A separate FieldValue instance is created for each field, managing the field's
 * value, error state, interaction information, and validity status through Signals.
 *
 * @template T - TR: Alanın taşıyacağı verinin tipi (string, number, Date vb.)
 *               EN: The type of data the field will hold (string, number, Date, etc.)
 *
 * @example
 * ```typescript
 * // String alan için FieldValue kullanımı
 * const emailValue: FieldValue<string> = emailField.createValue('');
 *
 * // Değer güncelleme
 * emailValue.value.set('user@example.com');
 *
 * // Dokunuldu olarak işaretle (blur event'inde)
 * emailValue.touched.set(true);
 *
 * // Reaktif validasyon durumunu oku
 * if (emailValue.valid()) {
 *   console.log('Email geçerli');
 * } else {
 *   console.log('Hata:', emailValue.error());
 * }
 * ```
 */
export interface FieldValue<T> {
  /**
   * TR: Alanın anlık değerini tutan yazılabilir sinyal (WritableSignal).
   * UI bileşenleri veya programatik kod tarafından güncellenebilir.
   * Değer değiştiğinde bağlı tüm computed signal'ler otomatik güncellenir.
   *
   * EN: Writable signal holding the current value of the field.
   * Can be updated by UI components or programmatic code.
   * When the value changes, all dependent computed signals are automatically updated.
   *
   * @example
   * ```typescript
   * // Değer okuma
   * const currentValue = fieldValue.value();
   *
   * // Değer yazma
   * fieldValue.value.set('yeni değer');
   *
   * // Mevcut değere göre güncelleme
   * fieldValue.value.update(v => v.toUpperCase());
   * ```
   */
  value: WritableSignal<T>;

  /**
   * TR: Doğrulama sonucu oluşan hata mesajını taşıyan salt okunur sinyal.
   * Değer geçerli ise `null` döner.
   * Hata mesajı yalnızca `touched` true olduğunda hesaplanır (kullanıcı deneyimi için).
   *
   * EN: Read-only signal carrying the error message resulting from validation.
   * Returns `null` if the value is valid.
   * Error message is only computed when `touched` is true (for better UX).
   *
   * @remarks
   * TR: Bu sinyal computed olduğundan doğrudan set edilemez.
   * Hata durumu otomatik olarak value ve touched değişikliklerinden türetilir.
   *
   * EN: Since this signal is computed, it cannot be set directly.
   * Error state is automatically derived from value and touched changes.
   */
  error: Signal<string | null>;

  /**
   * TR: Kullanıcının alanla etkileşime girip girmediğini (focus/blur) belirten sinyal.
   * Genellikle hata mesajlarının ne zaman gösterileceğini kontrol etmek için kullanılır.
   * Kullanıcı alanı terk ettiğinde (blur) `true` yapılır.
   *
   * EN: Signal indicating whether the user has interacted with the field (focus/blur).
   * Typically used to control when to display error messages.
   * Set to `true` when the user leaves the field (blur).
   *
   * @remarks
   * TR: UX best practice: Hata mesajlarını kullanıcı alanı terk etmeden gösterme.
   * Bu sayede kullanıcı henüz yazmaya başlamışken "zorunlu alan" hatası görmez.
   *
   * EN: UX best practice: Don't show error messages until user leaves the field.
   * This prevents showing "required field" errors while user is still typing.
   */
  touched: WritableSignal<boolean>;

  /**
   * TR: Alanın geçerlilik durumunu belirten salt okunur sinyal.
   * Zod şeması ile yapılan doğrulama sonucuna göre `true` veya `false` döner.
   * `touched` durumundan bağımsızdır - her zaman gerçek geçerlilik durumunu yansıtır.
   *
   * EN: Read-only signal indicating the validity status of the field.
   * Returns `true` or `false` based on the validation result from the Zod schema.
   * Independent of `touched` state - always reflects the actual validity.
   *
   * @remarks
   * TR: Form submit öncesi tüm alanların valid() kontrolü yapılmalıdır.
   * error() null olabilir (touched=false) ama valid() false olabilir.
   *
   * EN: All fields should be checked with valid() before form submit.
   * error() can be null (touched=false) while valid() can still be false.
   */
  valid: Signal<boolean>;

  /**
   * TR: Alanın değerinin değiştirilip değiştirilmediğini belirten salt okunur sinyal.
   * Initial değerden farklı bir değer girildiğinde `true` olur.
   * Form'un "kaydedilmemiş değişiklikler" uyarısı göstermesi için kullanılır.
   *
   * EN: Read-only signal indicating whether the field value has been modified.
   * Becomes `true` when a value different from the initial value is entered.
   * Used for showing "unsaved changes" warnings in forms.
   */
  dirty?: Signal<boolean>;
}
