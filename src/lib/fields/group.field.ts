import { signal, computed, Signal, WritableSignal } from '@angular/core';
import { z } from 'zod';
import { BaseField } from './base-field';
import { FieldConfig, FieldValue, IField } from '../core/interfaces';

/**
 * @fileoverview
 * TR: İç içe form grupları için kullanılan GroupField sınıfı.
 * Adres, kişi bilgileri gibi birden fazla alanı gruplayarak yönetir.
 *
 * EN: GroupField class used for nested form groups.
 * Manages multiple fields grouped together like address, contact info.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: GroupField için genişletilmiş yapılandırma seçenekleri.
 * EN: Extended configuration options for GroupField.
 */
export interface GroupFieldConfig extends FieldConfig {
  /**
   * TR: Grup başlığı gösterilsin mi?
   * EN: Should group title be shown?
   * @default true
   */
  showTitle?: boolean;

  /**
   * TR: Grup daraltılabilir mi?
   * EN: Is group collapsible?
   * @default false
   */
  collapsible?: boolean;

  /**
   * TR: Başlangıçta daraltılmış mı?
   * EN: Is collapsed initially?
   * @default false
   */
  collapsed?: boolean;

  /**
   * TR: Grup layout'u.
   * EN: Group layout.
   * @default 'vertical'
   */
  layout?: 'vertical' | 'horizontal' | 'grid';

  /**
   * TR: Grid sütun sayısı (layout='grid' ise).
   * EN: Grid column count (if layout='grid').
   * @default 2
   */
  columns?: number;
}

/**
 * TR: Grup içindeki alanların state'ini tutan interface.
 * EN: Interface holding state of fields within the group.
 */
export interface GroupFieldState {
  /**
   * TR: Alt alanların FieldValue'ları.
   * EN: FieldValues of sub-fields.
   */
  fields: Record<string, FieldValue<unknown>>;

  /**
   * TR: Tüm grup değerlerini tek nesne olarak döndürür.
   * EN: Returns all group values as single object.
   */
  values: Signal<Record<string, unknown>>;

  /**
   * TR: Grubun geçerlilik durumu.
   * EN: Validity status of the group.
   */
  valid: Signal<boolean>;

  /**
   * TR: Grup hataları.
   * EN: Group errors.
   */
  errors: Signal<Record<string, string | null>>;

  /**
   * TR: Tüm alanları touched yap.
   * EN: Mark all fields as touched.
   */
  touchAll: () => void;

  /**
   * TR: Tüm alanları sıfırla.
   * EN: Reset all fields.
   */
  reset: (values?: Record<string, unknown>) => void;

  /**
   * TR: Tek alan değeri güncelle.
   * EN: Update single field value.
   */
  setValue: (name: string, value: unknown) => void;

  /**
   * TR: Birden fazla alan değeri güncelle.
   * EN: Update multiple field values.
   */
  patchValues: (values: Record<string, unknown>) => void;
}

/**
 * TR: İç içe form grupları için Zignal alan implementasyonu.
 *
 * Bu sınıf şu özellikleri sağlar:
 * - **Nested Forms**: Alt alanları gruplayarak yönetir
 * - **Tek Nesne Output**: Tüm alt alanlar tek bir nesne olarak döner
 * - **Cascade Validation**: Alt alan validasyonları otomatik çalışır
 * - **Layout Desteği**: vertical, horizontal, grid layout seçenekleri
 *
 * EN: Zignal field implementation for nested form groups.
 *
 * This class provides:
 * - **Nested Forms**: Manages sub-fields grouped together
 * - **Single Object Output**: All sub-fields return as single object
 * - **Cascade Validation**: Sub-field validations run automatically
 * - **Layout Support**: vertical, horizontal, grid layout options
 *
 * @example
 * ```typescript
 * // Adres grubu
 * const address = new GroupField('address', 'Adres Bilgileri', [
 *   new StringField('street', 'Sokak', { required: true }),
 *   new StringField('city', 'Şehir', { required: true }),
 *   new StringField('zipCode', 'Posta Kodu'),
 *   new SelectField('country', 'Ülke', {
 *     options: [
 *       { value: 'TR', label: 'Türkiye' },
 *       { value: 'US', label: 'Amerika' }
 *     ]
 *   })
 * ], {
 *   layout: 'grid',
 *   columns: 2
 * });
 *
 * // Kullanım
 * const state = address.createGroupState({
 *   street: 'Atatürk Cad. No: 123',
 *   city: 'İstanbul',
 *   country: 'TR'
 * });
 *
 * // Tüm değerleri al
 * const values = state.values();
 * // { street: '...', city: 'İstanbul', zipCode: null, country: 'TR' }
 * ```
 */
export class GroupField extends BaseField<Record<string, unknown>> {
  constructor(
    name: string,
    label: string,
    public readonly groupFields: IField<unknown>[],
    public override readonly config: GroupFieldConfig = {}
  ) {
    super(name, label, config);
  }

  /**
   * TR: Grup için birleşik Zod şeması oluşturur.
   * EN: Creates combined Zod schema for the group.
   */
  schema(): z.ZodType<Record<string, unknown>> {
    const shape: z.ZodRawShape = {};

    for (const field of this.groupFields) {
      shape[field.name] = field.schema();
    }

    const objectSchema = z.object(shape);
    return this.applyRequired(objectSchema) as z.ZodType<Record<string, unknown>>;
  }

  /**
   * TR: Grup değerlerini özet olarak gösterir.
   * EN: Displays group values as summary.
   */
  override present(value: Record<string, unknown> | null): string {
    if (!value) return '-';

    // TR: İlk 2-3 alanı göster
    // EN: Show first 2-3 fields
    const entries = Object.entries(value)
      .filter(([, v]) => v != null && v !== '')
      .slice(0, 3);

    if (entries.length === 0) return '-';

    return entries.map(([, v]) => String(v)).join(', ');
  }

  /**
   * TR: Grup state'ini oluşturur.
   * EN: Creates group state.
   */
  createGroupState(initial: Record<string, unknown> = {}): GroupFieldState {
    // TR: Her alan için FieldValue oluştur
    // EN: Create FieldValue for each field
    const fields: Record<string, FieldValue<unknown>> = {};
    const initialFieldValues = new Map<string, unknown>();

    for (const field of this.groupFields) {
      const initValue = initial[field.name] ?? null;
      fields[field.name] = field.createValue(initValue);
      initialFieldValues.set(field.name, initValue);
    }

    // TR: Computed values
    // EN: Computed values
    const values = computed(() => {
      const result: Record<string, unknown> = {};
      for (const [name, fv] of Object.entries(fields)) {
        result[name] = fv.value();
      }
      return result;
    });

    const valid = computed(() =>
      Object.values(fields).every(fv => fv.valid())
    );

    const errors = computed(() => {
      const result: Record<string, string | null> = {};
      for (const [name, fv] of Object.entries(fields)) {
        result[name] = fv.error();
      }
      return result;
    });

    // TR: Actions
    // EN: Actions
    const touchAll = (): void => {
      for (const fv of Object.values(fields)) {
        fv.touched.set(true);
      }
    };

    const reset = (newValues?: Record<string, unknown>): void => {
      const resetValues = newValues ?? Object.fromEntries(initialFieldValues);
      for (const [name, fv] of Object.entries(fields)) {
        const val = resetValues[name] ?? null;
        fv.value.set(val);
        fv.touched.set(false);
      }
    };

    const setValue = (name: string, value: unknown): void => {
      const fv = fields[name];
      if (fv) {
        fv.value.set(value);
      }
    };

    const patchValues = (vals: Record<string, unknown>): void => {
      for (const [name, value] of Object.entries(vals)) {
        setValue(name, value);
      }
    };

    return {
      fields,
      values,
      valid,
      errors,
      touchAll,
      reset,
      setValue,
      patchValues,
    };
  }

  /**
   * TR: BaseField.createValue override - GroupFieldState döndürür.
   * EN: BaseField.createValue override - returns GroupFieldState.
   */
  override createValue(initial?: Record<string, unknown>): FieldValue<Record<string, unknown>> {
    const groupState = this.createGroupState(initial);

    return {
      value: groupState.values as unknown as WritableSignal<Record<string, unknown>>,
      touched: signal(false),
      error: computed(() => {
        const errs = Object.values(groupState.errors()).filter(Boolean);
        return errs.length > 0 ? errs[0] : null;
      }),
      valid: groupState.valid,
    };
  }

  /**
   * TR: Dışa aktarım için grup değerleri.
   * EN: Group values for export.
   */
  override toExport(value: Record<string, unknown> | null): Record<string, unknown> | null {
    if (!value) return null;

    const result: Record<string, unknown> = {};

    for (const field of this.groupFields) {
      const fieldValue = value[field.name];
      result[field.name] = field.toExport(fieldValue);
    }

    return result;
  }

  /**
   * TR: İçe aktarım için grup değerleri.
   * EN: Group values for import.
   */
  override fromImport(raw: unknown): Record<string, unknown> | null {
    if (raw == null) return null;
    if (typeof raw !== 'object') return null;

    const input = raw as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const field of this.groupFields) {
      const rawValue = input[field.name];
      result[field.name] = field.fromImport(rawValue);
    }

    return result;
  }

  // ===========================================================================
  // TR: Yardımcı Metodlar
  // EN: Helper Methods
  // ===========================================================================

  /**
   * TR: Grup içindeki alanları döndürür.
   * EN: Returns fields within the group.
   */
  getFields(): IField<unknown>[] {
    return this.groupFields;
  }

  /**
   * TR: İsme göre alan bulur.
   * EN: Finds field by name.
   */
  getField(name: string): IField<unknown> | undefined {
    return this.groupFields.find(f => f.name === name);
  }

  /**
   * TR: Alan isimlerini döndürür.
   * EN: Returns field names.
   */
  getFieldNames(): string[] {
    return this.groupFields.map(f => f.name);
  }

  /**
   * TR: Layout ayarını döndürür.
   * EN: Returns layout setting.
   */
  get layout(): 'vertical' | 'horizontal' | 'grid' {
    return this.config.layout ?? 'vertical';
  }

  /**
   * TR: Grid sütun sayısını döndürür.
   * EN: Returns grid column count.
   */
  get columns(): number {
    return this.config.columns ?? 2;
  }

  /**
   * TR: Grup daraltılabilir mi?
   * EN: Is group collapsible?
   */
  get collapsible(): boolean {
    return this.config.collapsible ?? false;
  }
}
