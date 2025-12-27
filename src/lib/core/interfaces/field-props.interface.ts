/**
 * @fileoverview
 * TR: Field UI özellikleri için arayüz tanımları.
 * EN: Interface definitions for field UI properties.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: HTML attribute tanımları.
 * EN: HTML attribute definitions.
 */
export type FieldAttributes = Record<string, string | number | boolean>;

/**
 * TR: Field UI özellikleri.
 * EN: Field UI properties.
 */
export interface FieldProps {
    /**
     * TR: Input öncesinde gösterilecek ikon.
     * Material icon adı, FontAwesome class veya SVG path olabilir.
     * EN: Icon to display before the input.
     * Can be Material icon name, FontAwesome class, or SVG path.
     *
     * @example 'mail' | 'fa-envelope' | 'assets/icons/email.svg'
     */
    prefixIcon?: string;

    /**
     * TR: Input sonrasında gösterilecek ikon.
     * EN: Icon to display after the input.
     */
    suffixIcon?: string;

    /**
     * TR: Input öncesinde gösterilecek metin.
     * EN: Text to display before the input.
     *
     * @example '$' | 'https://'
     */
    prefix?: string;

    /**
     * TR: Input sonrasında gösterilecek metin.
     * EN: Text to display after the input.
     *
     * @example 'TL' | '@gmail.com'
     */
    suffix?: string;

    /**
     * TR: Field wrapper için CSS class'ları.
     * EN: CSS classes for field wrapper.
     *
     * @example 'col-md-6' | 'mb-3 highlighted'
     */
    cssClass?: string;

    /**
     * TR: Input elementi için CSS class'ları.
     * EN: CSS classes for input element.
     */
    inputClass?: string;

    /**
     * TR: Label için CSS class'ları.
     * EN: CSS classes for label.
     */
    labelClass?: string;

    /**
     * TR: Ekstra HTML attribute'ları.
     * EN: Extra HTML attributes.
     *
     * @example
     * ```typescript
     * attributes: {
     *     'aria-describedby': 'email-help',
     *     'data-testid': 'email-input',
     *     'autocomplete': 'email'
     * }
     * ```
     */
    attributes?: FieldAttributes;

    /**
     * TR: Textarea için satır sayısı.
     * EN: Number of rows for textarea.
     */
    rows?: number;

    /**
     * TR: Textarea için sütun sayısı.
     * EN: Number of columns for textarea.
     */
    cols?: number;

    /**
     * TR: Input tipi (text, password, email vs.).
     * EN: Input type (text, password, email, etc.).
     *
     * @default 'text'
     */
    type?: 'text' | 'password' | 'email' | 'tel' | 'url' | 'search' | 'number';

    /**
     * TR: Minimum değer (number input için).
     * EN: Minimum value (for number input).
     */
    min?: number;

    /**
     * TR: Maksimum değer (number input için).
     * EN: Maximum value (for number input).
     */
    max?: number;

    /**
     * TR: Adım değeri (number input için).
     * EN: Step value (for number input).
     */
    step?: number;

    /**
     * TR: Maksimum karakter sayısı.
     * EN: Maximum character count.
     */
    maxLength?: number;

    /**
     * TR: Minimum karakter sayısı.
     * EN: Minimum character count.
     */
    minLength?: number;

    /**
     * TR: Otomatik tamamlama.
     * EN: Autocomplete attribute.
     *
     * @example 'off' | 'email' | 'current-password' | 'new-password'
     */
    autocomplete?: string;

    /**
     * TR: Otomatik odaklanma.
     * EN: Auto focus on mount.
     */
    autofocus?: boolean;

    /**
     * TR: Tab sırası.
     * EN: Tab index.
     */
    tabindex?: number;

    /**
     * TR: Özel veri - component'lere aktarılabilir.
     * EN: Custom data - can be passed to components.
     */
    data?: Record<string, unknown>;
}
