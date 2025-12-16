import { Type } from '@angular/core';
import { IField } from './interfaces';
import {
  StringField,
  NumberField,
  BooleanField,
  DateField,
  SelectField,
} from '../fields';

/**
 * @fileoverview
 * TR: Field tiplerini ilgili sınıflarla eşleştiren registry.
 * Dinamik form oluşturmada hangi tipin hangi sınıfa karşılık geldiğini belirler.
 *
 * EN: Registry mapping field types to their corresponding classes.
 * Determines which type maps to which class in dynamic form creation.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: Field constructor tip tanımı.
 * Registry'de saklanacak field sınıflarının tip tanımını sağlar.
 *
 * EN: Field constructor type definition.
 * Provides type definition for field classes to be stored in registry.
 *
 * @template T - TR: Field'ın değer tipi
 *               EN: Value type of the field
 */
export type FieldConstructor<T = unknown> = Type<IField<T>>;

/**
 * TR: Field tipleri ile sınıflarını eşleştiren registry.
 *
 * Bu registry, JSON schema'dan dinamik form oluşturulurken
 * hangi tip için hangi Field sınıfının kullanılacağını belirler.
 *
 * Yeni field tipi eklemek için:
 * 1. Field sınıfını oluştur (BaseField'dan türet)
 * 2. Bu registry'ye kaydet
 *
 * EN: Registry mapping field types to their classes.
 *
 * This registry determines which Field class to use for which type
 * when creating dynamic forms from JSON schema.
 *
 * To add new field type:
 * 1. Create field class (derive from BaseField)
 * 2. Register in this registry
 *
 * @example
 * ```typescript
 * // Registry'ye yeni tip ekleme
 * FIELD_REGISTRY['custom'] = CustomField;
 *
 * // Factory'de kullanımı
 * const FieldClass = FIELD_REGISTRY['string']; // StringField
 * const field = new FieldClass('name', 'İsim', config);
 * ```
 */
export const FIELD_REGISTRY: Record<string, FieldConstructor<any>> = {
  // TR: Metin alanları
  // EN: Text fields
  string: StringField,
  text: StringField, // TR: textarea alias / EN: textarea alias

  // TR: Sayısal alanlar
  // EN: Numeric fields
  number: NumberField,
  integer: NumberField,
  decimal: NumberField,

  // TR: Boolean alanlar
  // EN: Boolean fields
  boolean: BooleanField,
  checkbox: BooleanField,
  toggle: BooleanField,

  // TR: Tarih alanları
  // EN: Date fields
  date: DateField,

  // TR: Seçim alanları
  // EN: Selection fields
  select: SelectField,
  enum: SelectField,
};

/**
 * TR: Registry'ye yeni bir field tipi kaydeder.
 * Runtime'da dinamik olarak yeni field tipleri eklemek için kullanılır.
 *
 * EN: Registers a new field type to registry.
 * Used to dynamically add new field types at runtime.
 *
 * @param type - TR: Field tipi (string identifier)
 *               EN: Field type (string identifier)
 * @param fieldClass - TR: Field sınıfı (BaseField'dan türemiş)
 *                     EN: Field class (derived from BaseField)
 *
 * @example
 * ```typescript
 * // Özel field tipi kaydetme
 * registerFieldType('phone', PhoneField);
 * registerFieldType('currency', CurrencyField);
 * ```
 */
export function registerFieldType<T>(
  type: string,
  fieldClass: FieldConstructor<T>
): void {
  if (FIELD_REGISTRY[type]) {
    console.warn(
      `Zignal: "${type}" tipi zaten kayıtlı. Üzerine yazılıyor.`,
      `Zignal: Type "${type}" is already registered. Overwriting.`
    );
  }
  FIELD_REGISTRY[type] = fieldClass;
}

/**
 * TR: Belirtilen tipin registry'de kayıtlı olup olmadığını kontrol eder.
 *
 * EN: Checks if the specified type is registered in the registry.
 *
 * @param type - TR: Kontrol edilecek tip
 *               EN: Type to check
 * @returns TR: Kayıtlı ise true
 *          EN: True if registered
 */
export function isFieldTypeRegistered(type: string): boolean {
  return type in FIELD_REGISTRY;
}

/**
 * TR: Registry'deki tüm kayıtlı tipleri döndürür.
 *
 * EN: Returns all registered types in registry.
 *
 * @returns TR: Kayıtlı tip listesi
 *          EN: List of registered types
 */
export function getRegisteredFieldTypes(): string[] {
  return Object.keys(FIELD_REGISTRY);
}
