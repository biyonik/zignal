import {Directive, computed, input} from '@angular/core';
import {FieldRenderContext, MaterialAdapterConfig, MaterialUIAdapter} from '@biyonik/zignal';

/**
 * @fileoverview
 * TR: Material UI adaptörü için temel soyut sınıf.
 * EN: Base abstract class for Material UI adapter.
 */
@Directive()
export abstract class BaseMatField<T> {
    context = input.required<FieldRenderContext<T>>();

    get field() { return this.context().field; }
    get state() { return this.context().state; }
    get adapter() { return this.context().adapter as MaterialUIAdapter; }
    get matConfig() { return this.adapter.config as MaterialAdapterConfig; }

    // Reaktif hata sinyali
    readonly error = computed(() => this.state.error());

    /**
     * TR: Alan odağını kaybettiğinde (blur) 'touched' durumunu günceller.
     * Bu sayede validasyon hataları görünür hale gelir.
     */
    onBlur(): void {
        this.state.touched.set(true);
    }

    onChange(value: T): void {
        this.state.value.set(value);
    }

}