import { Type, TemplateRef } from '@angular/core';
import { IField, FieldValue } from '../../core';

/**
 * @fileoverview
 * TR: UI adaptör sistemi için temel interface'ler.
 * Farklı UI kütüphaneleri (Material, PrimeNG, Native) için ortak arayüz.
 *
 * EN: Base interfaces for UI adapter system.
 * Common interface for different UI libraries (Material, PrimeNG, Native).
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

// =============================================================================
// TR: Types & Interfaces
// EN: Types & Interfaces
// =============================================================================

/**
 * TR: Desteklenen UI kütüphaneleri.
 * EN: Supported UI libraries.
 */
export type UILibrary = 'native' | 'material' | 'primeng' | 'bootstrap' | 'custom';

/**
 * TR: Field tiplerine göre component mapping.
 * EN: Component mapping by field types.
 */
export type FieldComponentMap = {
    string: Type<any>;
    number: Type<any>;
    boolean: Type<any>;
    date: Type<any>;
    select: Type<any>;
    multiselect: Type<any>;
    textarea: Type<any>;
    password: Type<any>;
    email: Type<any>;
    url: Type<any>;
    phone: Type<any>;
    color: Type<any>;
    file: Type<any>;
    [key: string]: Type<any>;
};

/**
 * TR: UI adaptör yapılandırması.
 * EN: UI adapter configuration.
 */
export interface UIAdapterConfig {
    /**
     * TR: Kullanılacak UI kütüphanesi.
     * EN: UI library to use.
     */
    library: UILibrary;

    /**
     * TR: CSS class prefix'i.
     * EN: CSS class prefix.
     */
    classPrefix?: string;

    /**
     * TR: Global tema ayarları.
     * EN: Global theme settings.
     */
    theme?: {
        primaryColor?: string;
        errorColor?: string;
        successColor?: string;
        borderRadius?: string;
        fontSize?: string;
    };

    /**
     * TR: Label pozisyonu.
     * EN: Label position.
     */
    labelPosition?: 'top' | 'left' | 'floating' | 'none';

    /**
     * TR: Hata mesajı gösterimi.
     * EN: Error message display.
     */
    errorDisplay?: 'below' | 'tooltip' | 'inline' | 'none';

    /**
     * TR: Animasyon kullanılsın mı?
     * EN: Use animations?
     */
    animations?: boolean;

    /**
     * TR: Özel component mapping'leri.
     * EN: Custom component mappings.
     */
    customComponents?: Partial<FieldComponentMap>;
}

/**
 * TR: Field render context'i.
 * EN: Field render context.
 */
export interface FieldRenderContext<T = unknown> {
    /**
     * TR: Render edilecek field.
     * EN: Field to render.
     */
    field: IField<T>;

    /**
     * TR: Field'ın reaktif state'i.
     * EN: Reactive state of the field.
     */
    state: FieldValue<T>;

    /**
     * TR: Ek CSS class'ları.
     * EN: Additional CSS classes.
     */
    cssClass?: string;

    /**
     * TR: Disabled durumu.
     * EN: Disabled state.
     */
    disabled?: boolean;

    /**
     * TR: Readonly durumu.
     * EN: Readonly state.
     */
    readonly?: boolean;

    /**
     * TR: Custom template (opsiyonel).
     * EN: Custom template (optional).
     */
    template?: TemplateRef<any>;

    /**
     * TR: Ek özellikler.
     * EN: Additional properties.
     */
    [key: string]: unknown;
}

/**
 * TR: UI Adaptör interface'i.
 * EN: UI Adapter interface.
 */
export interface IUIAdapter {
    /**
     * TR: Adaptör adı.
     * EN: Adapter name.
     */
    readonly name: UILibrary;

    /**
     * TR: Adaptör yapılandırması.
     * EN: Adapter configuration.
     */
    readonly config: UIAdapterConfig;

    /**
     * TR: Field tipi için component döner.
     * EN: Returns component for field type.
     */
    getComponent(fieldType: string): Type<any> | null;

    /**
     * TR: Field için CSS class'larını döner.
     * EN: Returns CSS classes for field.
     */
    getFieldClasses(context: FieldRenderContext): string[];

    /**
     * TR: Wrapper (container) için CSS class'larını döner.
     * EN: Returns CSS classes for wrapper (container).
     */
    getWrapperClasses(context: FieldRenderContext): string[];

    /**
     * TR: Hata için CSS class'larını döner.
     * EN: Returns CSS classes for error.
     */
    getErrorClasses(context: FieldRenderContext): string[];

    /**
     * TR: Label için CSS class'larını döner.
     * EN: Returns CSS classes for label.
     */
    getLabelClasses(context: FieldRenderContext): string[];

    /**
     * TR: Adaptör'ü initialize eder.
     * EN: Initializes the adapter.
     */
    initialize?(): void;

    /**
     * TR: Gerekli modüllerin yüklü olup olmadığını kontrol eder.
     * EN: Checks if required modules are loaded.
     */
    checkDependencies?(): boolean;
}

/**
 * TR: Form render yapılandırması.
 * EN: Form render configuration.
 */
export interface FormRenderConfig {
    /**
     * TR: Form layout'u.
     * EN: Form layout.
     */
    layout?: 'vertical' | 'horizontal' | 'inline' | 'grid';

    /**
     * TR: Grid için kolon sayısı.
     * EN: Number of columns for grid.
     */
    columns?: number;

    /**
     * TR: Field'lar arası boşluk.
     * EN: Gap between fields.
     */
    gap?: string;

    /**
     * TR: Submit button gösterilsin mi?
     * EN: Show submit button?
     */
    showSubmitButton?: boolean;

    /**
     * TR: Reset button gösterilsin mi?
     * EN: Show reset button?
     */
    showResetButton?: boolean;

    /**
     * TR: Submit button metni.
     * EN: Submit button text.
     */
    submitText?: string;

    /**
     * TR: Reset button metni.
     * EN: Reset button text.
     */
    resetText?: string;
}
