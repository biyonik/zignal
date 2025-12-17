import { InjectionToken, inject, Injectable } from '@angular/core';
import { IUIAdapter, UILibrary } from './ui-adapter.interface';
import { nativeAdapter } from './native-adapter';

/**
 * @fileoverview
 * TR: UI adaptör registry ve dependency injection token'ları.
 * EN: UI adapter registry and dependency injection tokens.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: UI adaptör injection token.
 * EN: UI adapter injection token.
 *
 * @example
 * ```typescript
 * // app.config.ts
 * import { provideUIAdapter, MaterialUIAdapter } from '@biyonik/zignal';
 *
 * export const appConfig = {
 *   providers: [
 *     provideUIAdapter(new MaterialUIAdapter({ appearance: 'outline' }))
 *   ]
 * };
 * ```
 */
export const UI_ADAPTER = new InjectionToken<IUIAdapter>('ZIGNAL_UI_ADAPTER', {
    providedIn: 'root',
    factory: () => nativeAdapter
});

/**
 * TR: UI adaptör provider fonksiyonu.
 * EN: UI adapter provider function.
 */
export function provideUIAdapter(adapter: IUIAdapter) {
    return {
        provide: UI_ADAPTER,
        useValue: adapter
    };
}

/**
 * TR: UI adaptör factory fonksiyonu.
 * EN: UI adapter factory function.
 */
export function provideUIAdapterFactory(factory: () => IUIAdapter) {
    return {
        provide: UI_ADAPTER,
        useFactory: factory
    };
}

/**
 * TR: UI adaptör registry servisi.
 * EN: UI adapter registry service.
 */
@Injectable({ providedIn: 'root' })
export class UIAdapterRegistry {
    private readonly adapters = new Map<UILibrary, IUIAdapter>();
    private currentAdapter: IUIAdapter;

    constructor() {
        // Register native adapter by default
        this.registerAdapter(nativeAdapter);
        this.currentAdapter = nativeAdapter;
    }

    /**
     * TR: Adaptör kaydet.
     * EN: Register adapter.
     */
    registerAdapter(adapter: IUIAdapter): void {
        this.adapters.set(adapter.name, adapter);
    }

    /**
     * TR: Aktif adaptörü değiştir.
     * EN: Change active adapter.
     */
    useAdapter(library: UILibrary): boolean {
        const adapter = this.adapters.get(library);
        if (adapter) {
            if (adapter.checkDependencies?.() ?? true) {
                this.currentAdapter = adapter;
                adapter.initialize?.();
                return true;
            }
        }
        return false;
    }

    /**
     * TR: Aktif adaptörü döner.
     * EN: Returns active adapter.
     */
    getAdapter(): IUIAdapter {
        return this.currentAdapter;
    }

    /**
     * TR: Belirli bir adaptörü döner.
     * EN: Returns specific adapter.
     */
    getAdapterByName(library: UILibrary): IUIAdapter | undefined {
        return this.adapters.get(library);
    }

    /**
     * TR: Kayıtlı tüm adaptörleri döner.
     * EN: Returns all registered adapters.
     */
    getRegisteredAdapters(): UILibrary[] {
        return Array.from(this.adapters.keys());
    }

    /**
     * TR: Adaptörün kullanılabilir olup olmadığını kontrol eder.
     * EN: Checks if adapter is available.
     */
    isAdapterAvailable(library: UILibrary): boolean {
        const adapter = this.adapters.get(library);
        return adapter ? (adapter.checkDependencies?.() ?? true) : false;
    }
}

/**
 * TR: Aktif UI adaptörünü inject eder.
 * EN: Injects active UI adapter.
 *
 * @example
 * ```typescript
 * @Component({...})
 * class MyComponent {
 *   private adapter = injectUIAdapter();
 *
 *   getClasses(field: IField, state: FieldValue) {
 *     return this.adapter.getFieldClasses({ field, state });
 *   }
 * }
 * ```
 */
export function injectUIAdapter(): IUIAdapter {
    return inject(UI_ADAPTER);
}
