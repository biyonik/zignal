/**
 * @fileoverview
 * TR: Dış kaynaktan veri import işleminin sonucunu temsil eden arayüz.
 * Başarı durumunda veri, hata durumunda detaylı hata bilgisi içerir.
 *
 * EN: Interface representing the result of importing data from external source.
 * Contains data on success, detailed error information on failure.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: Veri import işleminin sonucunu kapsayan tip güvenli yapı.
 * API response, Excel veya CSV dosyası gibi dış kaynaklardan gelen verilerin
 * parse edilmesi sonucunda oluşan başarı/hata durumunu temsil eder.
 *
 * EN: Type-safe structure encapsulating the result of data import operation.
 * Represents the success/failure state resulting from parsing data coming
 * from external sources like API responses, Excel or CSV files.
 *
 * @template T - TR: Başarılı import sonucunda dönen verinin tipi
 *               EN: Type of data returned on successful import
 *
 * @example
 * ```typescript
 * // Başarılı import
 * const successResult: ImportResult<Date> = {
 *   success: true,
 *   data: new Date('2024-01-15')
 * };
 *
 * // Başarısız import
 * const errorResult: ImportResult<Date> = {
 *   success: false,
 *   data: null,
 *   error: {
 *     message: 'Geçersiz tarih formatı',
 *     path: ['birthDate'],
 *     code: 'invalid_date'
 *   }
 * };
 * ```
 */
export interface ImportResult<T> {
  /**
   * TR: Import işleminin başarılı olup olmadığını belirtir.
   * `true` ise `data` alanı geçerli veri içerir, `false` ise `error` alanı dolu olur.
   *
   * EN: Indicates whether the import operation was successful.
   * If `true`, the `data` field contains valid data; if `false`, the `error` field is populated.
   */
  success: boolean;

  /**
   * TR: Başarılı import sonucunda parse edilen veri.
   * Hata durumunda `null` değer alır.
   *
   * EN: Data parsed on successful import.
   * Takes `null` value on error.
   */
  data: T | null;

  /**
   * TR: Hata durumunda detaylı hata bilgisi.
   * Kullanıcıya gösterilecek mesaj, hata konumu ve kod içerir.
   *
   * EN: Detailed error information on failure.
   * Contains message to display to user, error location, and code.
   */
  error?: {
    /**
     * TR: Kullanıcıya gösterilecek hata mesajı.
     * Lokalize edilebilir ve anlaşılır olmalıdır.
     *
     * EN: Error message to be displayed to the user.
     * Should be localizable and understandable.
     */
    message: string;

    /**
     * TR: Hatanın oluştuğu alan yolu.
     * Nested objeler için ['user', 'address', 'city'] formatında olabilir.
     *
     * EN: Path to the field where the error occurred.
     * Can be in ['user', 'address', 'city'] format for nested objects.
     */
    path?: (string | number)[];

    /**
     * TR: Hata kodu. Programatik hata işleme için kullanılır.
     * Zod hata kodlarıyla uyumludur (invalid_type, too_small vb.)
     *
     * EN: Error code. Used for programmatic error handling.
     * Compatible with Zod error codes (invalid_type, too_small, etc.)
     */
    code?: string;
  };
}
