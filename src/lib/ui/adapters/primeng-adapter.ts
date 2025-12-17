import { Type } from '@angular/core';
import { BaseUIAdapter } from './base-adapter';
import { UIAdapterConfig, UILibrary, FieldRenderContext } from './ui-adapter.interface';

/**
 * @fileoverview
 * TR: PrimeNG için UI adaptörü.
 * primeng kurulumu gerektirir.
 *
 * EN: UI adapter for PrimeNG.
 * Requires primeng installation.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: PrimeNG adaptör yapılandırması.
 * EN: PrimeNG adapter configuration.
 */
export interface PrimeNGAdapterConfig extends UIAdapterConfig {
    /**
     * TR: PrimeNG float label kullanılsın mı?
     * EN: Use PrimeNG float label?
     */
    floatLabel?: boolean;

    /**
     * TR: Input boyutu.
     * EN: Input size.
     */
    size?: 'small' | 'large';

    /**
     * TR: Filled style kullanılsın mı?
     * EN: Use filled style?
     */
    filled?: boolean;
}

/**
 * TR: PrimeNG adaptörü.
 * EN: PrimeNG adapter.
 *
 * @example
 * ```typescript
 * const primeAdapter = new PrimeNGUIAdapter({
 *   floatLabel: true,
 *   size: 'large'
 * });
 * ```
 */
export class PrimeNGUIAdapter extends BaseUIAdapter {
    readonly name: UILibrary = 'primeng';

    constructor(config: Partial<PrimeNGAdapterConfig> = {}) {
        super({
            library: 'primeng',
            classPrefix: 'p',
            labelPosition: config.floatLabel ? 'floating' : 'top',
            errorDisplay: 'below',
            animations: true,
            ...config
        });
    }

    /**
     * TR: PrimeNG için field class'ları.
     * EN: Field classes for PrimeNG.
     */
    override getFieldClasses(context: FieldRenderContext): string[] {
        const classes = super.getFieldClasses(context);
        const primeConfig = this.config as PrimeNGAdapterConfig;

        classes.push('p-inputtext');

        if (primeConfig.size) {
            classes.push(`p-inputtext-${primeConfig.size}`);
        }

        if (primeConfig.filled) {
            classes.push('p-filled');
        }

        if (context.state.error()) {
            classes.push('ng-invalid', 'ng-dirty');
        }

        return classes;
    }

    /**
     * TR: PrimeNG wrapper class'ları.
     * EN: PrimeNG wrapper classes.
     */
    override getWrapperClasses(context: FieldRenderContext): string[] {
        const classes = super.getWrapperClasses(context);
        const primeConfig = this.config as PrimeNGAdapterConfig;

        classes.push('p-field');

        if (primeConfig.floatLabel) {
            classes.push('p-float-label');
        }

        return classes;
    }

    /**
     * TR: PrimeNG bağımlılıklarını kontrol eder.
     * EN: Checks PrimeNG dependencies.
     */
    override checkDependencies(): boolean {
        try {
            require('primeng/inputtext');
            return true;
        } catch {
            console.warn(
                'Zignal: primeng paketi bulunamadı. ' +
                'PrimeNG adaptörünü kullanmak için: npm install primeng'
            );
            return false;
        }
    }
}

/**
 * TR: PrimeNG component'leri.
 * EN: PrimeNG components.
 */
export interface PrimeNGFieldComponents {
    inputText: Type<any>;
    inputNumber: Type<any>;
    inputTextarea: Type<any>;
    dropdown: Type<any>;
    multiSelect: Type<any>;
    checkbox: Type<any>;
    calendar: Type<any>;
    password: Type<any>;
    colorPicker: Type<any>;
    fileUpload: Type<any>;
}

/**
 * TR: PrimeNG component'leri register eder.
 * EN: Registers PrimeNG components.
 */
export function registerPrimeNGComponents(
    adapter: PrimeNGUIAdapter,
    components: Partial<PrimeNGFieldComponents>
): void {
    if (components.inputText) {
        adapter['componentMap']['string'] = components.inputText;
        adapter['componentMap']['email'] = components.inputText;
        adapter['componentMap']['url'] = components.inputText;
        adapter['componentMap']['phone'] = components.inputText;
    }

    if (components.inputNumber) {
        adapter['componentMap']['number'] = components.inputNumber;
    }

    if (components.inputTextarea) {
        adapter['componentMap']['textarea'] = components.inputTextarea;
    }

    if (components.password) {
        adapter['componentMap']['password'] = components.password;
    }

    if (components.dropdown) {
        adapter['componentMap']['select'] = components.dropdown;
    }

    if (components.multiSelect) {
        adapter['componentMap']['multiselect'] = components.multiSelect;
    }

    if (components.checkbox) {
        adapter['componentMap']['boolean'] = components.checkbox;
    }

    if (components.calendar) {
        adapter['componentMap']['date'] = components.calendar;
    }

    if (components.colorPicker) {
        adapter['componentMap']['color'] = components.colorPicker;
    }

    if (components.fileUpload) {
        adapter['componentMap']['file'] = components.fileUpload;
    }
}
