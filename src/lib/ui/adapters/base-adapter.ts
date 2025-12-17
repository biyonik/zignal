import { Type } from '@angular/core';
import { IUIAdapter, UIAdapterConfig, FieldRenderContext, FieldComponentMap, UILibrary } from './ui-adapter.interface';

/**
 * @fileoverview
 * TR: Tüm UI adaptörleri için temel soyut sınıf.
 * EN: Base abstract class for all UI adapters.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: UI adaptörlerinin temel sınıfı.
 * EN: Base class for UI adapters.
 */
export abstract class BaseUIAdapter implements IUIAdapter {
    abstract readonly name: UILibrary;
    protected componentMap: Partial<FieldComponentMap> = {};

    protected constructor(public readonly config: UIAdapterConfig) {
        // Merge custom components
        if (config.customComponents) {
            this.componentMap = {
                ...this.componentMap,
                ...config.customComponents
            };
        }
    }

    /**
     * TR: Field tipi için component döner.
     * EN: Returns component for field type.
     */
    getComponent(fieldType: string): Type<any> | null {
        return this.componentMap[fieldType] ?? null;
    }

    /**
     * TR: Field için CSS class'larını döner.
     * EN: Returns CSS classes for field.
     */
    getFieldClasses(context: FieldRenderContext): string[] {
        const prefix = this.config.classPrefix ?? 'zg';
        const classes: string[] = [
            `${prefix}-field`,
            `${prefix}-field--${this.getFieldTypeName(context.field)}`
        ];

        if (context.state.error()) {
            classes.push(`${prefix}-field--error`);
        }

        if (context.state.valid()) {
            classes.push(`${prefix}-field--valid`);
        }

        if (context.disabled) {
            classes.push(`${prefix}-field--disabled`);
        }

        if (context.readonly) {
            classes.push(`${prefix}-field--readonly`);
        }

        if (context.cssClass) {
            classes.push(context.cssClass);
        }

        return classes;
    }

    /**
     * TR: Wrapper için CSS class'larını döner.
     * EN: Returns CSS classes for wrapper.
     */
    getWrapperClasses(context: FieldRenderContext): string[] {
        const prefix = this.config.classPrefix ?? 'zg';
        const classes: string[] = [
            `${prefix}-field-wrapper`,
            `${prefix}-label-${this.config.labelPosition ?? 'top'}`
        ];

        if (context.field.config.required) {
            classes.push(`${prefix}-field-wrapper--required`);
        }

        return classes;
    }

    /**
     * TR: Hata için CSS class'larını döner.
     * EN: Returns CSS classes for error.
     */
    getErrorClasses(_context: FieldRenderContext): string[] {
        const prefix = this.config.classPrefix ?? 'zg';
        return [
            `${prefix}-error`,
            `${prefix}-error--${this.config.errorDisplay ?? 'below'}`
        ];
    }

    /**
     * TR: Label için CSS class'larını döner.
     * EN: Returns CSS classes for label.
     */
    getLabelClasses(context: FieldRenderContext): string[] {
        const prefix = this.config.classPrefix ?? 'zg';
        const classes: string[] = [
            `${prefix}-label`
        ];

        if (context.field.config.required) {
            classes.push(`${prefix}-label--required`);
        }

        return classes;
    }

    /**
     * TR: Field tipinin adını döner.
     * EN: Returns field type name.
     */
    protected getFieldTypeName(field: any): string {
        const className = field.constructor.name;
        return className.replace('Field', '').toLowerCase();
    }

    /**
     * TR: Adaptör'ü initialize eder.
     * EN: Initializes the adapter.
     */
    initialize(): void {
        // Override in subclasses if needed
    }

    /**
     * TR: Bağımlılıkları kontrol eder.
     * EN: Checks dependencies.
     */
    checkDependencies(): boolean {
        return true; // Override in subclasses
    }
}
