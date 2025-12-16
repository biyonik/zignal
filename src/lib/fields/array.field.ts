import { signal, computed, Signal, WritableSignal } from '@angular/core';
import { z } from 'zod';
import { BaseField } from './base-field';
import { FieldConfig, FieldValue, IField } from '../core/interfaces';

/**
 * @fileoverview
 * TR: Tekrarlayan veri yapılarını (Repeater/Collection) yöneten alan sınıfı.
 * Fatura kalemleri, telefon numaraları listesi, adres koleksiyonları gibi
 * dinamik form satırları için kullanılır. Her satır kendi alt alanlarına sahiptir.
 *
 * EN: Field class for managing repeating data structures (Repeater/Collection).
 * Used for dynamic form rows like invoice items, phone number lists, address collections.
 * Each row has its own sub-fields.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: ArrayField için genişletilmiş yapılandırma arayüzü.
 * Minimum/maksimum kayıt sayısı, UI etiketleri ve sıralama özelliklerini tanımlar.
 *
 * EN: Extended configuration interface for ArrayField.
 * Defines minimum/maximum record counts, UI labels, and sorting features.
 */
export interface ArrayFieldConfig extends FieldConfig {
  /**
   * TR: Dizide bulunması gereken minimum öğe sayısı.
   *
   * EN: Minimum number of items required in the array.
   *
   * @default 0
   */
  min?: number;

  /**
   * TR: Diziye eklenebilecek maksimum öğe sayısı.
   *
   * EN: Maximum number of items allowed in the array.
   *
   * @default undefined (sınırsız)
   */
  max?: number;

  /**
   * TR: "Ekle" butonu için özel etiket.
   *
   * EN: Custom label for the "Add" button.
   *
   * @default 'Ekle'
   */
  addLabel?: string;

  /**
   * TR: "Sil" butonu için özel etiket.
   *
   * EN: Custom label for the "Remove" button.
   *
   * @default 'Sil'
   */
  removeLabel?: string;

  /**
   * TR: Kayıtların sürükle-bırak ile yeniden sıralanabilir olup olmadığı.
   *
   * EN: Whether records can be reordered via drag-and-drop.
   *
   * @default false
   */
  sortable?: boolean;

  /**
   * TR: Her satır için başlık şablonu. `{index}` placeholder'ı satır numarası ile değiştirilir.
   *
   * EN: Title template for each row. `{index}` placeholder is replaced with row number.
   *
   * @example 'Kalem #{index}' → 'Kalem #1', 'Kalem #2'
   */
  itemTitle?: string;
}

/**
 * TR: Dizi içindeki tek bir satırın (Item) durumunu temsil eder.
 * Her satırın benzersiz ID'si, alt alan değerleri ve kendi validasyon durumu vardır.
 *
 * EN: Represents the state of a single row (Item) within the array.
 * Each row has a unique ID, sub-field values, and its own validation status.
 */
export interface ArrayItemState {
  /**
   * TR: Satırın benzersiz kimliği (UI döngüleri ve trackBy için).
   *
   * EN: Unique identifier of the row (for UI loops and trackBy).
   */
  id: string;

  /**
   * TR: Satır içindeki alt alanların değer nesneleri.
   *
   * EN: Value objects of the sub-fields within the row.
   */
  fields: Record<string, FieldValue<unknown>>;

  /**
   * TR: Satırın geçerlilik durumu (Tüm alt alanlar geçerliyse true).
   *
   * EN: Validity status of the row (True if all sub-fields are valid).
   */
  valid: Signal<boolean>;

  /**
   * TR: Satır içindeki alanlara ait hata mesajları.
   *
   * EN: Error messages belonging to the fields within the row.
   */
  errors: Signal<Record<string, string | null>>;
}

/**
 * TR: Tüm dizi alanının reaktif durumunu ve yönetim fonksiyonlarını içeren arayüz.
 * UI bileşenleri bu arayüz üzerinden diziye ekleme, çıkarma ve okuma yapar.
 *
 * EN: Interface containing the reactive state and management functions of the entire array field.
 * UI components add, remove, and read from the array via this interface.
 */
export interface ArrayFieldState {
  /**
   * TR: Mevcut satırların listesini tutan sinyal.
   *
   * EN: Signal holding the list of current rows.
   */
  items: WritableSignal<ArrayItemState[]>;

  /**
   * TR: Tüm satırların saf veri (JSON) hallerini içeren hesaplanmış sinyal.
   * Form submit edilirken bu değer kullanılır.
   *
   * EN: Computed signal containing the raw data (JSON) of all rows.
   * This value is used when the form is submitted.
   */
  values: Signal<Record<string, unknown>[]>;

  /**
   * TR: Tüm dizinin genel geçerlilik durumu.
   *
   * EN: Overall validity status of the entire array.
   */
  valid: Signal<boolean>;

  /**
   * TR: Mevcut kayıt sayısı.
   *
   * EN: Current record count.
   */
  count: Signal<number>;

  /**
   * TR: Yeni kayıt eklenip eklenemeyeceği (Max limit kontrolü).
   *
   * EN: Whether a new record can be added (Max limit check).
   */
  canAdd: Signal<boolean>;

  /**
   * TR: Kayıt silinip silinemeyeceği (Min limit kontrolü).
   *
   * EN: Whether a record can be removed (Min limit check).
   */
  canRemove: Signal<boolean>;

  /**
   * TR: Diziye yeni bir satır ekler.
   *
   * EN: Adds a new row to the array.
   *
   * @param initial - TR: Opsiyonel başlangıç verisi / EN: Optional initial data
   */
  add: (initial?: Record<string, unknown>) => void;

  /**
   * TR: Belirtilen ID'ye sahip satırı siler.
   *
   * EN: Removes the row with the specified ID.
   *
   * @param id - TR: Silinecek satırın ID'si / EN: ID of the row to remove
   */
  remove: (id: string) => void;

  /**
   * TR: Satırların sırasını değiştirir.
   *
   * EN: Changes the order of the rows.
   *
   * @param fromIndex - TR: Kaynak indeks / EN: Source index
   * @param toIndex - TR: Hedef indeks / EN: Target index
   */
  move: (fromIndex: number, toIndex: number) => void;

  /**
   * TR: Diziyi temizler veya minimum sayıya sıfırlar.
   *
   * EN: Clears the array or resets to the minimum count.
   */
  clear: () => void;

  /**
   * TR: Tüm satırları touched olarak işaretler (form submit öncesi).
   *
   * EN: Marks all rows as touched (before form submit).
   */
  touchAll: () => void;
}

/**
 * TR: Tekrarlayan veri yapılarını (Repeater/Collection) yöneten alan sınıfı.
 *
 * Bu sınıf şu özellikleri sağlar:
 * - **Dinamik Satırlar**: Kullanıcı satır ekleyip silebilir
 * - **Alt Alan Yönetimi**: Her satırda tanımlı field'lar bulunur
 * - **Reaktif State**: Angular Signals ile tüm satırlar reaktif
 * - **Validasyon**: Satır bazlı ve dizi bazlı validasyon
 * - **Sıralama**: Opsiyonel drag-drop sıralama desteği
 *
 * EN: Field class for managing repeating data structures (Repeater/Collection).
 *
 * This class provides:
 * - **Dynamic Rows**: User can add and remove rows
 * - **Sub-field Management**: Each row contains defined fields
 * - **Reactive State**: All rows reactive with Angular Signals
 * - **Validation**: Row-level and array-level validation
 * - **Sorting**: Optional drag-drop sorting support
 *
 * @example
 * ```typescript
 * // Fatura kalemleri için array field
 * const lineItems = new ArrayField(
 *   'items',
 *   'Kalemler',
 *   [
 *     new StringField('description', 'Açıklama', { required: true }),
 *     new NumberField('quantity', 'Miktar', { min: 1, required: true }),
 *     new NumberField('price', 'Birim Fiyat', { min: 0, required: true })
 *   ],
 *   { min: 1, max: 10, sortable: true }
 * );
 *
 * // State oluştur
 * const state = lineItems.createArrayState([
 *   { description: 'Ürün A', quantity: 2, price: 100 }
 * ]);
 *
 * // Yeni satır ekle
 * state.add({ description: '', quantity: 1, price: 0 });
 *
 * // Satır sil
 * state.remove(state.items()[0].id);
 *
 * // Form submit için değerleri al
 * const data = state.values();
 * ```
 */
export class ArrayField extends BaseField<Record<string, unknown>[]> {
  /**
   * TR: ArrayField constructor. Alt alanlar ve yapılandırma ile dizi alanı oluşturur.
   *
   * EN: ArrayField constructor. Creates array field with sub-fields and configuration.
   *
   * @param name - TR: Alanın benzersiz tanımlayıcısı / EN: Unique field identifier
   * @param label - TR: UI'da gösterilecek etiket / EN: Label to display in UI
   * @param itemFields - TR: Her satırda bulunacak alan tanımları / EN: Field definitions for each row
   * @param config - TR: Dizi alan yapılandırması / EN: Array field configuration
   */
  constructor(
    name: string,
    label: string,
    public readonly itemFields: IField<unknown>[],
    public override config: ArrayFieldConfig = {}
  ) {
    super(name, label, config);
  }

  /**
   * TR: Dizi ve içeriği için dinamik Zod şeması oluşturur.
   * Her satırın şemasını birleştirerek bir dizi şeması türetir.
   *
   * EN: Creates a dynamic Zod schema for the array and its content.
   * Derives an array schema by combining each row's schema.
   *
   * @returns TR: Array tipi Zod şeması / EN: Array type Zod schema
   */
  schema(): z.ZodType<Record<string, unknown>[]> {
    // TR: Her item için schema oluştur
    // EN: Create schema for each item
    const itemShape: z.ZodRawShape = {};
    for (const field of this.itemFields) {
      itemShape[field.name] = field.schema();
    }
    const itemSchema = z.object(itemShape);

    let arraySchema = z.array(itemSchema);

    // TR: Min/Max limitleri uygula
    // EN: Apply Min/Max limits
    if (this.config.min != null) {
      arraySchema = arraySchema.min(this.config.min, `En az ${this.config.min} kayıt olmalı`);
    }
    if (this.config.max != null) {
      arraySchema = arraySchema.max(this.config.max, `En fazla ${this.config.max} kayıt olabilir`);
    }
    if (this.config.required) {
      arraySchema = arraySchema.min(1, `${this.label} zorunludur`);
    }

    return arraySchema as unknown as z.ZodType<Record<string, unknown>[]>;
  }

  /**
   * TR: UI'da özet gösterimi sağlar. Kayıt sayısını döner.
   *
   * EN: Provides summary display in UI. Returns record count.
   *
   * @param value - TR: Gösterilecek dizi değeri / EN: Array value to display
   * @returns TR: Özet string / EN: Summary string
   */
  override present(value: Record<string, unknown>[] | null): string {
    if (!value || value.length === 0) return '-';
    return `${value.length} kayıt`;
  }

  /**
   * TR: Dışa aktarım için veriyi JSON string'e çevirir.
   *
   * EN: Converts data to JSON string for export.
   *
   * @param value - TR: Export edilecek değer / EN: Value to export
   * @returns TR: JSON string veya null / EN: JSON string or null
   */
  override toExport(value: Record<string, unknown>[] | null): string | null {
    if (!value) return null;
    return JSON.stringify(value);
  }

  /**
   * TR: Dış kaynaktan gelen veriyi (Import) işler.
   * JSON string veya doğrudan Array nesnesi kabul eder.
   *
   * EN: Processes data from an external source (Import).
   * Accepts JSON string or direct Array object.
   *
   * @param raw - TR: Ham import verisi / EN: Raw import data
   * @returns TR: Parse edilmiş dizi veya null / EN: Parsed array or null
   */
  override fromImport(raw: unknown): Record<string, unknown>[] | null {
    if (raw == null || raw === '') return null;

    // TR: JSON string
    // EN: JSON string
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return null;
      }
    }

    // TR: Array
    // EN: Array
    if (Array.isArray(raw)) return raw as Record<string, unknown>[];

    return null;
  }

  // ===========================================================================
  // TR: Array State Yönetimi
  // EN: Array State Management
  // ===========================================================================

  /**
   * TR: Dizinin reaktif durum yönetimini (State Management) başlatır.
   * Angular Signals kullanarak listeyi, validasyonu ve CRUD işlemlerini yöneten bir API döndürür.
   *
   * EN: Initializes the reactive state management of the array.
   * Returns an API managing the list, validation, and CRUD operations using Angular Signals.
   *
   * @param initial - TR: Başlangıç verisi / EN: Initial data
   * @returns TR: Dizi durum nesnesi / EN: Array state object
   *
   * @example
   * ```typescript
   * const state = arrayField.createArrayState([
   *   { name: 'Item 1', price: 100 },
   *   { name: 'Item 2', price: 200 }
   * ]);
   *
   * // Template'de kullanım
   * @for (item of state.items(); track item.id) {
   *   <div>
   *     <input [value]="item.fields['name'].value()" />
   *     <button (click)="state.remove(item.id)">Sil</button>
   *   </div>
   * }
   * ```
   */
  createArrayState(initial: Record<string, unknown>[] = []): ArrayFieldState {
    const items = signal<ArrayItemState[]>(
      initial.map((data) => this.createItem(data))
    );

    // TR: Item'ların anlık değerlerini toplayıp tek bir dizi olarak sunar
    // EN: Aggregates instant values of items and presents as a single array
    const values = computed(() =>
      items().map((item) => {
        const result: Record<string, unknown> = {};
        for (const [name, fv] of Object.entries(item.fields)) {
          result[name] = fv.value();
        }
        return result;
      })
    );

    // TR: Tüm item'lar geçerliyse dizi geçerlidir
    // EN: Array is valid if all items are valid
    const valid = computed(() => items().every((item) => item.valid()));

    const count = computed(() => items().length);

    // TR: Max sınır kontrolü
    // EN: Max limit check
    const canAdd = computed(() => {
      if (this.config.max == null) return true;
      return count() < this.config.max;
    });

    // TR: Min sınır kontrolü
    // EN: Min limit check
    const canRemove = computed(() => {
      const min = this.config.min ?? 0;
      return count() > min;
    });

    // TR: Ekleme fonksiyonu
    // EN: Add function
    const add = (initial: Record<string, unknown> = {}): void => {
      if (!canAdd()) return;
      items.update((arr) => [...arr, this.createItem(initial)]);
    };

    // TR: Silme fonksiyonu
    // EN: Remove function
    const remove = (id: string): void => {
      if (!canRemove()) return;
      items.update((arr) => arr.filter((item) => item.id !== id));
    };

    // TR: Sıralama fonksiyonu
    // EN: Reorder function
    const move = (fromIndex: number, toIndex: number): void => {
      items.update((arr) => {
        const result = [...arr];
        const [removed] = result.splice(fromIndex, 1);
        result.splice(toIndex, 0, removed);
        return result;
      });
    };

    // TR: Temizleme fonksiyonu
    // EN: Clear function
    const clear = (): void => {
      const min = this.config.min ?? 0;
      if (min > 0) {
        // TR: Min kadar boş item bırak
        // EN: Leave empty items up to min
        items.set(Array.from({ length: min }, () => this.createItem()));
      } else {
        items.set([]);
      }
    };

    // TR: Tüm satırları touched yap
    // EN: Touch all rows
    const touchAll = (): void => {
      for (const item of items()) {
        for (const fv of Object.values(item.fields)) {
          fv.touched.set(true);
        }
      }
    };

    return { items, values, valid, count, canAdd, canRemove, add, remove, move, clear, touchAll };
  }

  /**
   * TR: Yeni bir satır (Item) oluşturur ve içindeki alanları başlatır.
   * Her satıra benzersiz bir ID atar.
   *
   * EN: Creates a new row (Item) and initializes the fields within it.
   * Assigns a unique ID to each row.
   *
   * @param data - TR: Satırın başlangıç verisi / EN: Initial data for the row
   * @returns TR: Oluşturulan satır state'i / EN: Created row state
   */
  private createItem(data: Record<string, unknown> = {}): ArrayItemState {
    const id = this.generateId();

    const fields: Record<string, FieldValue<unknown>> = {};
    for (const field of this.itemFields) {
      const initial = data[field.name] ?? null;
      fields[field.name] = field.createValue(initial);
    }

    const valid = computed(() =>
      Object.values(fields).every((fv) => fv.valid())
    );

    const errors = computed(() => {
      const result: Record<string, string | null> = {};
      for (const [name, fv] of Object.entries(fields)) {
        result[name] = fv.error();
      }
      return result;
    });

    return { id, fields, valid, errors };
  }

  /**
   * TR: Benzersiz satır ID'si üretir.
   *
   * EN: Generates unique row ID.
   *
   * @returns TR: Benzersiz ID / EN: Unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // ===========================================================================
  // TR: Yardımcı Metodlar
  // EN: Helper Methods
  // ===========================================================================

  /**
   * TR: Dizi içinde kullanılan alt alan tanımlarını döndürür.
   *
   * EN: Returns the sub-field definitions used in the array.
   *
   * @returns TR: Alt alan listesi / EN: List of sub-fields
   */
  getItemFields(): IField<unknown>[] {
    return this.itemFields;
  }

  /**
   * TR: Belirli bir alanı ismine göre bulur.
   *
   * EN: Finds a specific field by its name.
   *
   * @param name - TR: Alan adı / EN: Field name
   * @returns TR: Bulunan alan veya undefined / EN: Found field or undefined
   */
  getItemField(name: string): IField<unknown> | undefined {
    return this.itemFields.find(f => f.name === name);
  }

  /**
   * TR: Satır için başlık oluşturur. Config'deki itemTitle şablonunu kullanır.
   *
   * EN: Generates title for a row. Uses itemTitle template from config.
   *
   * @param index - TR: Satır indeksi (0-based) / EN: Row index (0-based)
   * @returns TR: Oluşturulan başlık / EN: Generated title
   */
  getItemTitle(index: number): string {
    if (this.config.itemTitle) {
      return this.config.itemTitle.replace('{index}', String(index + 1));
    }
    return `${this.label} #${index + 1}`;
  }
}
