/**
 * @fileoverview
 * TR: Zignal kütüphanesinin ana export dosyası.
 * Tüm public API'ler buradan dışa aktarılır.
 *
 * EN: Main export file for Zignal library.
 * All public APIs are exported from here.
 *
 * @packageDocumentation
 * @module @biyonik/zignal
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 * @license MIT
 */

// =============================================================================
// TR: Core - Temel yapılar
// EN: Core - Base structures
// =============================================================================

export {
    // Interfaces
    IField,
    FieldConfig,
    FieldValue,
    FieldType,
    FieldJsonSchema,
    ImportResult,

    // Registry
    FIELD_REGISTRY,
    FieldConstructor,
    registerFieldType,
    isFieldTypeRegistered,
    getRegisteredFieldTypes,

    // Factory
    SchemaFactory,

    // Form State
    FormState,
    FormSchema,
    createFormSchema,

    // Field Dependencies (Conditional Fields)
    DependencyResolver,
    DependencyPatterns,
    FieldDependency,
    FieldDependencyState,
    DependencyContext,

    // Form Persistence (localStorage/sessionStorage)
    FormPersistence,
    FormPersistenceOptions,
    StorageType,
    createFormPersistence,
    clearAllZignalPersistence,

    // Async Validator (API-based validation)
    AsyncValidator,
    AsyncValidatorFn,
    AsyncValidatorOptions,
    AsyncValidationStatus,
    createEmailValidator,
    createUsernameValidator,
    createUniquenessValidator,
    createAsyncValidator,

    // i18n (Internationalization)
    I18nService,
    LocaleCode,
    ValidationMessageKey,
    MessageParams,
    MessageDictionary,
    TR_MESSAGES,
    EN_MESSAGES,
    t,
    setLocale,
    getLocale,
    addMessages,
    getI18n,
    detectBrowserLocale,
    useAutoLocale,
} from './lib/core';

// =============================================================================
// TR: Fields - Alan implementasyonları
// EN: Fields - Field implementations
// =============================================================================

export {
    // Base
    BaseField,

    // String
    StringField,
    StringFieldConfig,

    // Number
    NumberField,
    NumberFieldConfig,

    // Boolean
    BooleanField,
    BooleanFieldConfig,

    // Date
    DateField,
    DateFieldConfig,

    // Select
    SelectField,
    SelectFieldConfig,
    SelectOption,

    // Textarea
    TextareaField,
    TextareaFieldConfig,

    // Multiselect
    MultiselectField,
    MultiselectFieldConfig,

    // Json
    JsonField,
    JsonFieldConfig,

    // Array
    ArrayField,
    ArrayFieldConfig,
    ArrayFieldState,
    ArrayItemState,

    PhoneField,
    PhoneFieldConfig,

    PasswordField,
    PasswordFieldConfig,

    EmailField,
    EmailFieldConfig,

    UrlField,
    UrlFieldConfig,

    ColorField,
    ColorFieldConfig,

    FileField,
    FileFieldConfig,
    FileInfo,

    GroupField,
    GroupFieldConfig,

    MaskedField,
    MaskedFieldConfig,

    MoneyField,
    MoneyFieldConfig,

    PercentField,
    PercentFieldConfig,

    RatingField,
    RatingFieldConfig,

    SlugField,
    SlugFieldConfig,

    TagsField,
    TagsFieldConfig,

    TimeField,
    TimeFieldConfig,
} from './lib/fields';

// =============================================================================
// TR: Validators - Türkiye'ye özgü validatorlar
// EN: Validators - Turkey-specific validators
// =============================================================================

export {
    // TCKN
    isValidTCKN,
    tcknSchema,

    // VKN
    isValidVKN,
    vknSchema,

    // IBAN
    isValidTurkishIBAN,
    turkishIbanSchema,

    // Phone
    isValidTurkishPhone,
    normalizeTurkishPhone,
    turkishPhoneSchema,
    normalizedTurkishPhoneSchema,

    // Plate
    isValidTurkishPlate,
    turkishPlateSchema,

    // Postal Code
    isValidTurkishPostalCode,
    turkishPostalCodeSchema,

    // Bulk export
    TRValidators,
} from './lib/validators';

// =============================================================================
// TR: Forms - Form yapıları ve direktifleri
// EN: Forms - Form structures and directives
// =============================================================================

export {
    // ZgForm Directive
    ZgFormDirective,
    ZgFieldDirective,
    ZgErrorsComponent,
    createFormGroup,
    zodValidator,
} from './lib/forms';

export {
    ZgAutoFieldComponent,
    ZgNativeGroupComponent,
    ZgNativeArrayComponent,
    ZgFormRendererComponent,
    FormRendererConfig,
} from './lib/ui/native';


// =============================================================================
// TR: UI Adapters - UI Adaptörleri
// EN: UI Adapters
// =============================================================================

export {
    // Interfaces
    IUIAdapter,
    UILibrary,
    UIAdapterConfig,
    FieldRenderContext,
    FieldComponentMap,
    FormRenderConfig,

    // Base
    BaseUIAdapter,

    // Native
    NativeUIAdapter,
    nativeAdapter,

    // Material
    MaterialUIAdapter,
    MaterialAdapterConfig,
    MaterialColor,
    MaterialAppearance,
    MaterialFieldComponents,
    registerMaterialComponents,

    // PrimeNG
    PrimeNGUIAdapter,
    PrimeNGAdapterConfig,
    PrimeNGFieldComponents,
    registerPrimeNGComponents,

    // Registry & DI
    UI_ADAPTER,
    UIAdapterRegistry,
    provideUIAdapter,
    provideUIAdapterFactory,
    injectUIAdapter,
} from './lib/ui/adapters';

// =============================================================================
// TR: Cross-Field Validators
// EN: Cross-Field Validators
// =============================================================================

export {
    CrossValidators,
    CrossValidationRunner,
    CrossFieldValidatorDef,
    CrossValidatorFn,
    CrossValidationResult,
} from './lib/core/cross-field-validators';

export { FormDataType } from './lib/core/form-state';
