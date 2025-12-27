import {Injectable} from '@angular/core';
import {IField, FieldJsonSchema, FieldConfig} from './interfaces';
import {FIELD_REGISTRY, isFieldTypeRegistered} from './registry';
import {StringField} from '../fields';

/**
 * @fileoverview
 * TR: JSON şemasından dinamik olarak field instance'ları oluşturan factory servisi.
 * Backend-driven form yapılandırmalarını destekler.
 *
 * EN: Factory service that dynamically creates field instances from JSON schema.
 * Supports backend-driven form configurations.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: JSON şemasından Field nesneleri oluşturan Angular servisi.
 *
 * Bu servis, backend'den veya JSON dosyalarından gelen form tanımlarını
 * parse ederek ilgili Field sınıflarının instance'larını oluşturur.
 *
 * Temel kullanım senaryoları:
 * - Backend-driven dinamik formlar
 * - JSON configuration ile form oluşturma
 * - Runtime'da form şeması yükleme
 *
 * EN: Angular service that creates Field objects from JSON schema.
 *
 * This service parses form definitions coming from backend or JSON files
 * and creates instances of corresponding Field classes.
 *
 * Main use cases:
 * - Backend-driven dynamic forms
 * - Form creation with JSON configuration
 * - Runtime form schema loading
 *
 * @example
 * ```typescript
 * @Component({...})
 * class MyComponent {
 *   private factory = inject(SchemaFactory);
 *
 *   ngOnInit() {
 *     // Backend'den gelen JSON
 *     const jsonSchema: FieldJsonSchema[] = [
 *       { type: 'string', name: 'email', label: 'E-posta', config: { required: true, email: true } },
 *       { type: 'date', name: 'birthDate', label: 'Doğum Tarihi' }
 *     ];
 *
 *     // Field instance'ları oluştur
 *     const fields = this.factory.parse(jsonSchema);
 *     // fields = [StringField, DateField]
 *   }
 * }
 * ```
 */
@Injectable({providedIn: 'root'})
export class SchemaFactory {
    /**
     * TR: JSON şema dizisini parse ederek Field instance'ları oluşturur.
     *
     * Her şema objesi için:
     * 1. Registry'den ilgili Field sınıfını bulur
     * 2. Sınıfın instance'ını config ile oluşturur
     * 3. Bulunamazsa fallback olarak StringField kullanır
     *
     * EN: Parses JSON schema array and creates Field instances.
     *
     * For each schema object:
     * 1. Finds the corresponding Field class from registry
     * 2. Creates class instance with config
     * 3. Uses StringField as fallback if not found
     *
     * @param schemas - TR: Parse edilecek JSON şema dizisi
     *                  EN: JSON schema array to parse
     * @returns TR: Oluşturulan Field instance'ları dizisi
     *          EN: Array of created Field instances
     *
     * @example
     * ```typescript
     * const fields = factory.parse([
     *   { type: 'string', name: 'name', label: 'Ad' },
     *   { type: 'number', name: 'age', label: 'Yaş', config: { min: 0 } }
     * ]);
     * ```
     */
    parse(schemas: FieldJsonSchema[]): IField<any>[] {
        return schemas.map((schema) => this.createField(schema));
    }

    /**
     * TR: Tek bir JSON şemasından Field instance'ı oluşturur.
     *
     * EN: Creates a Field instance from a single JSON schema.
     *
     * @param schema - TR: Field şeması
     *                 EN: Field schema
     * @returns TR: Oluşturulan Field instance'ı
     *          EN: Created Field instance
     *
     * @example
     * ```typescript
     * const emailField = factory.createField({
     *   type: 'string',
     *   name: 'email',
     *   label: 'E-posta',
     *   config: { required: true, email: true }
     * });
     * ```
     */
    createField(schema: FieldJsonSchema): IField<any> {
        const {type, name, label, config, defaultValue} = schema;

        // TR: Registry'den field sınıfını al
        // EN: Get field class from registry
        if (!isFieldTypeRegistered(type)) {
            console.warn(
                `Zignal: Bilinmeyen alan tipi "${type}". StringField kullanılıyor.`,
                `Zignal: Unknown field type "${type}". Using StringField as fallback.`
            );
            return new StringField(name, label ?? name, config as any);
        }

        const FieldClass = FIELD_REGISTRY[type];

        // TR: Field instance'ı oluştur
        // EN: Create field instance
        try {
            const fieldConfig = {
                ...config,
                defaultValue,
            };

            return new FieldClass(name, label ?? name, fieldConfig);
        } catch (error) {
            console.error(
                `Zignal: "${name}" alanı oluşturulurken hata.`,
                `Zignal: Error creating field "${name}".`,
                error
            );
            // TR: Hata durumunda fallback
            // EN: Fallback on error
            return new StringField(name, label ?? name, {});
        }
    }

    /**
     * TR: Birden fazla şemayı gruplar halinde parse eder.
     * Form section'ları veya tab'ları için kullanışlıdır.
     *
     * EN: Parses multiple schemas in groups.
     * Useful for form sections or tabs.
     *
     * @param groups - TR: Grup adı -> şemalar map'i
     *                 EN: Group name -> schemas map
     * @returns TR: Grup adı -> field'lar map'i
     *          EN: Group name -> fields map
     *
     * @example
     * ```typescript
     * const groupedFields = factory.parseGroups({
     *   personal: [
     *     { type: 'string', name: 'name', label: 'Ad' },
     *     { type: 'date', name: 'birthDate', label: 'Doğum Tarihi' }
     *   ],
     *   contact: [
     *     { type: 'string', name: 'email', label: 'E-posta' },
     *     { type: 'string', name: 'phone', label: 'Telefon' }
     *   ]
     * });
     * ```
     */
    parseGroups(
        groups: Record<string, FieldJsonSchema[]>
    ): Record<string, IField<any>[]> {
        const result: Record<string, IField<any>[]> = {};

        for (const [groupName, schemas] of Object.entries(groups)) {
            result[groupName] = this.parse(schemas);
        }

        return result;
    }

    /**
     * TR: Field dizisini JSON şemasına dönüştürür.
     * EN: Converts field array to JSON schema.
     */
    toSchema(fields: IField<any>[]): FieldJsonSchema[] {
        return fields.map(field => this.fieldToSchema(field));
    }

    /**
     * TR: Tek bir Field'ı JSON şemasına dönüştürür.
     * Fonksiyonları filtreler, sadece JSON-safe değerleri saklar.
     *
     * EN: Converts single Field to JSON schema.
     * Filters out functions, keeps only JSON-safe values.
     */
    fieldToSchema(field: IField<any>): FieldJsonSchema {
        const config = { ...field.config };

        // 1. RegExp'i string'e çevir
        if (config.pattern instanceof RegExp) {
            config.pattern = config.pattern.source;
        }

        // 2. Hooks - fonksiyonları filtrele, string expression'ları koru
        if (config.hooks) {
            const serializedHooks: Record<string, string> = {};

            Object.entries(config.hooks).forEach(([key, value]) => {
                if (typeof value === 'string') {
                    // String expression - JSON'a çevrilebilir
                    serializedHooks[key] = value;
                }
                // Fonksiyon ise - atla (JSON'a çevrilemez)
            });

            // Sadece string hook'lar varsa config'e ekle
            if (Object.keys(serializedHooks).length > 0) {
                config.hooks = serializedHooks as any;
            } else {
                delete config.hooks;
            }
        }

        // 3. Expression-based config'ler - fonksiyonları filtrele
        const expressionFields: Array<keyof FieldConfig> = [
            'requiredWhen',
            'hideExpression',
            'disableExpression',
            'transformOnBlur',
            'transformOnChange',
            'customValidator'
        ];

        expressionFields.forEach(fieldName => {
            const value = config[fieldName];

            if (value !== undefined) {
                if (typeof value === 'string') {
                    // String expression - sakla
                    // (zaten config'te var, dokunma)
                } else if (typeof value === 'function') {
                    // Fonksiyon - JSON'a çevrilemez, sil
                    delete config[fieldName];
                }
            }
        });

        // 4. Props - kontrol et (şu an statik ama gelecekte fonksiyon olabilir)
        if (config.props) {
            // Props içinde fonksiyon var mı kontrol et
            const sanitizedProps: Record<string, unknown> = {};

            Object.entries(config.props).forEach(([key, value]) => {
                if (typeof value === 'function') {
                    // Fonksiyon - atla
                    console.warn(
                        `[Zignal] Field "${field.name}" has function-based prop "${key}" which cannot be serialized to JSON. Skipping.`
                    );
                } else {
                    sanitizedProps[key] = value;
                }
            });

            config.props = sanitizedProps as any;
        }

        return {
            type: field.type,
            name: field.name,
            label: field.label,
            config,
        };
    }
}
