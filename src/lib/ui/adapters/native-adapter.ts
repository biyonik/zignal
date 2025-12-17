import { BaseUIAdapter } from './base-adapter';
import { UIAdapterConfig, UILibrary } from './ui-adapter.interface';
import { ZgAutoFieldComponent } from '../native/zg-auto-field.component';

/**
 * @fileoverview
 * TR: Native HTML için UI adaptörü.
 * Herhangi bir UI kütüphanesi gerektirmez.
 *
 * EN: UI adapter for native HTML.
 * Does not require any UI library.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: Native HTML adaptörü.
 * EN: Native HTML adapter.
 */
export class NativeUIAdapter extends BaseUIAdapter {
    readonly name: UILibrary = 'native';

    constructor(config: Partial<UIAdapterConfig> = {}) {
        super({
            library: 'native',
            classPrefix: 'zg',
            labelPosition: 'top',
            errorDisplay: 'below',
            animations: true,
            ...config
        });

        // All field types use the same auto-field component
        this.componentMap = {
            string: ZgAutoFieldComponent,
            number: ZgAutoFieldComponent,
            boolean: ZgAutoFieldComponent,
            date: ZgAutoFieldComponent,
            select: ZgAutoFieldComponent,
            multiselect: ZgAutoFieldComponent,
            textarea: ZgAutoFieldComponent,
            password: ZgAutoFieldComponent,
            email: ZgAutoFieldComponent,
            url: ZgAutoFieldComponent,
            phone: ZgAutoFieldComponent,
            color: ZgAutoFieldComponent,
            file: ZgAutoFieldComponent
        };
    }

    /**
     * TR: Native adaptör her zaman kullanılabilir.
     * EN: Native adapter is always available.
     */
    override checkDependencies(): boolean {
        return true;
    }
}

/**
 * TR: Varsayılan native adaptör instance'ı.
 * EN: Default native adapter instance.
 */
export const nativeAdapter = new NativeUIAdapter();
