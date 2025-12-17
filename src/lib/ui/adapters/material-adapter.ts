import { Type } from '@angular/core';
import { BaseUIAdapter } from './base-adapter';
import { UIAdapterConfig, UILibrary, FieldRenderContext } from './ui-adapter.interface';

/**
 * @fileoverview
 * TR: Angular Material için UI adaptörü.
 * @angular/material kurulumu gerektirir.
 *
 * EN: UI adapter for Angular Material.
 * Requires @angular/material installation.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: Angular Material tema renkleri.
 * EN: Angular Material theme colors.
 */
export type MaterialColor = 'primary' | 'accent' | 'warn';

/**
 * TR: Material input appearance.
 * EN: Material input appearance.
 */
export type MaterialAppearance = 'fill' | 'outline';

/**
 * TR: Material adaptör yapılandırması.
 * EN: Material adapter configuration.
 */
export interface MaterialAdapterConfig extends UIAdapterConfig {
    appearance?: MaterialAppearance;
    color?: MaterialColor;
    floatLabel?: 'always' | 'auto' | 'never';
    subscriptSizing?: 'fixed' | 'dynamic';
}

/**
 * TR: Angular Material adaptörü.
 * EN: Angular Material adapter.
 *
 * @example
 * ```typescript
 * // Material adaptör oluştur
 * const materialAdapter = new MaterialUIAdapter({
 *   appearance: 'outline',
 *   color: 'primary',
 *   floatLabel: 'auto'
 * });
 *
 * // Provider olarak kullan
 * providers: [
 *   { provide: UI_ADAPTER, useValue: materialAdapter }
 * ]
 * ```
 */
export class MaterialUIAdapter extends BaseUIAdapter {
    readonly name: UILibrary = 'material';

    constructor(config: Partial<MaterialAdapterConfig> = {}) {
        super({
            library: 'material',
            classPrefix: 'mat',
            labelPosition: 'floating',
            errorDisplay: 'below',
            animations: true,
            ...config
        });
    }

    /**
     * TR: Material için field class'ları.
     * EN: Field classes for Material.
     */
    override getFieldClasses(context: FieldRenderContext): string[] {
        const classes = super.getFieldClasses(context);
        const matConfig = this.config as MaterialAdapterConfig;

        classes.push('mat-mdc-form-field');

        if (matConfig.appearance) {
            classes.push(`mat-mdc-form-field-appearance-${matConfig.appearance}`);
        }

        return classes;
    }

    /**
     * TR: Material bağımlılıklarını kontrol eder.
     * EN: Checks Material dependencies.
     */
    override checkDependencies(): boolean {
        try {
            require('@angular/material/form-field');
            return true;
        } catch {
            console.warn(
                'Zignal: @angular/material paketi bulunamadı. ' +
                'Material adaptörünü kullanmak için: npm install @angular/material'
            );
            return false;
        }
    }

    /**
     * TR: Material-specific wrapper classes.
     * EN: Material-specific wrapper classes.
     */
    override getWrapperClasses(context: FieldRenderContext): string[] {
        const classes = super.getWrapperClasses(context);
        classes.push('mat-mdc-form-field-wrapper');
        return classes;
    }
}

/**
 * TR: Material adaptör placeholder component.
 * Gerçek Material component'ler lazy-loaded olacak.
 * EN: Material adapter placeholder component.
 * Real Material components will be lazy-loaded.
 */
export interface MaterialFieldComponents {
    matInput: Type<any>;
    matSelect: Type<any>;
    matCheckbox: Type<any>;
    matDatepicker: Type<any>;
    matSlideToggle: Type<any>;
    matChips: Type<any>;
}

/**
 * TR: Material component'leri register eder.
 * EN: Registers Material components.
 *
 * @example
 * ```typescript
 * import { MatInputModule } from '@angular/material/input';
 * import { MatSelectModule } from '@angular/material/select';
 *
 * registerMaterialComponents({
 *   matInput: MatInputComponent,
 *   matSelect: MatSelectComponent,
 *   // ...
 * });
 * ```
 */
export function registerMaterialComponents(
    adapter: MaterialUIAdapter,
    components: Partial<MaterialFieldComponents>
): void {
    if (components.matInput) {
        adapter['componentMap']['string'] = components.matInput;
        adapter['componentMap']['email'] = components.matInput;
        adapter['componentMap']['url'] = components.matInput;
        adapter['componentMap']['phone'] = components.matInput;
        adapter['componentMap']['password'] = components.matInput;
        adapter['componentMap']['number'] = components.matInput;
        adapter['componentMap']['textarea'] = components.matInput;
    }

    if (components.matSelect) {
        adapter['componentMap']['select'] = components.matSelect;
    }

    if (components.matCheckbox) {
        adapter['componentMap']['boolean'] = components.matCheckbox;
    }

    if (components.matDatepicker) {
        adapter['componentMap']['date'] = components.matDatepicker;
    }

    if (components.matChips) {
        adapter['componentMap']['multiselect'] = components.matChips;
    }
}
