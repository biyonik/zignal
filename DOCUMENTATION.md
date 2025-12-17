# Zignal Documentation

> **TR:** Kapsamlı API referansı ve kullanım kılavuzu
> **EN:** Comprehensive API reference and usage guide

---

## Table of Contents | İçindekiler

1. [Installation | Kurulum](#installation--kurulum)
2. [Core Concepts | Temel Kavramlar](#core-concepts--temel-kavramlar)
3. [Field Types | Alan Tipleri](#field-types--alan-tipleri)
4. [Form Schema | Form Şeması](#form-schema--form-şeması)
5. [FormState API](#formstate-api)
6. [i18n - Internationalization | Çoklu Dil Desteği](#i18n---internationalization--çoklu-dil-desteği)
7. [Form Persistence](#form-persistence)
8. [Async Validation | Asenkron Validasyon](#async-validation--asenkron-validasyon)
9. [Conditional Fields | Koşullu Alanlar](#conditional-fields--koşullu-alanlar)
10. [Turkey Validators | Türkiye Validatorları](#turkey-validators--türkiye-validatorları)
11. [Custom Fields | Özel Alanlar](#custom-fields--özel-alanlar)
12. [Angular Integration | Angular Entegrasyonu](#angular-integration--angular-entegrasyonu)

---

## Installation | Kurulum

```bash
npm install @biyonik/zignal zod
```

**TR:** Peer dependency olarak `zod` gereklidir.
**EN:** `zod` is required as a peer dependency.

---

## Core Concepts | Temel Kavramlar

### TR: Mimari
Zignal üç temel kavram üzerine inşa edilmiştir:

1. **Field** - Tek bir form alanını temsil eder (StringField, NumberField, vb.)
2. **FormSchema** - Field'ların koleksiyonunu yönetir
3. **FormState** - Reaktif form durumunu (state) yönetir

### EN: Architecture
Zignal is built on three core concepts:

1. **Field** - Represents a single form field (StringField, NumberField, etc.)
2. **FormSchema** - Manages a collection of fields
3. **FormState** - Manages reactive form state

```typescript
import { StringField, FormSchema } from '@biyonik/zignal';

// 1. Field oluştur / Create Field
const nameField = new StringField('name', 'Ad Soyad', {
  required: true,
  minLength: 2
});

// 2. Schema oluştur / Create Schema
const schema = new FormSchema([nameField]);

// 3. Form state oluştur / Create Form State
const form = schema.createForm({ name: '' });

// 4. Reactive kullanım / Reactive usage
console.log(form.fields.name.value());   // Signal<string>
console.log(form.fields.name.error());   // Signal<string | null>
console.log(form.valid());               // Signal<boolean>
```

---

## Field Types | Alan Tipleri

### StringField

**TR:** Tek satır metin girişi için kullanılır.
**EN:** Used for single-line text input.

```typescript
import { StringField } from '@biyonik/zignal';

const field = new StringField('username', 'Kullanıcı Adı', {
  // TR: Zorunlu alan / EN: Required field
  required: true,

  // TR: Minimum karakter / EN: Minimum characters
  minLength: 3,

  // TR: Maksimum karakter / EN: Maximum characters
  maxLength: 20,

  // TR: Regex pattern / EN: Regex pattern
  pattern: /^[a-z0-9_]+$/,
  patternMessage: 'Sadece küçük harf, rakam ve alt çizgi kullanılabilir',

  // TR: E-posta formatı / EN: Email format
  email: true,

  // TR: URL formatı / EN: URL format
  url: true,

  // TR: UI yardımcıları / EN: UI helpers
  placeholder: 'Kullanıcı adınızı giriniz',
  hint: 'En az 3 karakter',
  disabled: false,
});
```

### NumberField

**TR:** Sayısal değer girişi için kullanılır.
**EN:** Used for numeric value input.

```typescript
import { NumberField } from '@biyonik/zignal';

const field = new NumberField('price', 'Fiyat', {
  required: true,

  // TR: Minimum değer / EN: Minimum value
  min: 0,

  // TR: Maksimum değer / EN: Maximum value
  max: 10000,

  // TR: Sadece tam sayı / EN: Integer only
  integer: true,

  // TR: Sadece pozitif / EN: Positive only
  positive: true,

  // TR: Sadece negatif / EN: Negative only
  negative: true,

  // TR: Ondalık basamak (gösterim) / EN: Decimal places (display)
  decimals: 2,

  // TR: Artış miktarı (step) / EN: Step amount
  step: 0.01,

  // TR: Locale (format için) / EN: Locale (for formatting)
  locale: 'tr-TR',
});

// TR: Kullanım / EN: Usage
const state = field.createValue(1500.50);
console.log(field.present(state.value())); // "1.500,50" (tr-TR formatında)
```

### BooleanField

**TR:** Evet/Hayır (true/false) değerler için kullanılır.
**EN:** Used for Yes/No (true/false) values.

```typescript
import { BooleanField } from '@biyonik/zignal';

const field = new BooleanField('acceptTerms', 'Şartları Kabul Ediyorum', {
  // TR: required: true olduğunda değer true olmalı
  // EN: When required: true, value must be true
  required: true,

  // TR: true/false için özel etiketler
  // EN: Custom labels for true/false
  trueLabel: 'Kabul Ediyorum',
  falseLabel: 'Kabul Etmiyorum',

  // TR: UI bileşen tipi
  // EN: UI component type
  displayAs: 'checkbox', // 'checkbox' | 'toggle' | 'radio'

  // TR: Varsayılan değer
  // EN: Default value
  defaultValue: false,
});
```

### DateField

**TR:** Tarih değerleri için kullanılır.
**EN:** Used for date values.

```typescript
import { DateField } from '@biyonik/zignal';

const field = new DateField('birthDate', 'Doğum Tarihi', {
  required: true,

  // TR: Minimum tarih / EN: Minimum date
  min: new Date('1900-01-01'),

  // TR: Maksimum tarih / EN: Maximum date
  max: new Date('2024-12-31'),

  // TR: Bugün minimum olsun / EN: Today as minimum
  minToday: true,

  // TR: Bugün maksimum olsun / EN: Today as maximum
  maxToday: true,

  // TR: Locale / EN: Locale
  locale: 'tr-TR',

  // TR: Gösterim formatı / EN: Display format
  format: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  },
});

// TR: Import/Export
// EN: Import/Export
const state = field.createValue(null);

// TR: String'den import (ISO ve TR formatı destekler)
// EN: Import from string (supports ISO and TR format)
const imported = field.fromImport('25.12.2024'); // DD.MM.YYYY
const imported2 = field.fromImport('2024-12-25'); // ISO

// TR: Export (ISO formatında)
// EN: Export (in ISO format)
const exported = field.toExport(new Date()); // "2024-12-17T..."
```

### PasswordField

**TR:** Şifre girişi için kullanılır. Güç göstergesi dahil.
**EN:** Used for password input. Includes strength indicator.

```typescript
import { PasswordField } from '@biyonik/zignal';

const field = new PasswordField('password', 'Şifre', {
  required: true,

  // TR: Minimum karakter (varsayılan: 8)
  // EN: Minimum characters (default: 8)
  minLength: 8,

  // TR: Maksimum karakter
  // EN: Maximum characters
  maxLength: 50,

  // TR: En az bir büyük harf
  // EN: At least one uppercase
  requireUppercase: true,

  // TR: En az bir küçük harf
  // EN: At least one lowercase
  requireLowercase: true,

  // TR: En az bir rakam
  // EN: At least one number
  requireNumber: true,

  // TR: En az bir özel karakter
  // EN: At least one special character
  requireSpecial: true,

  // TR: Özel karakter seti
  // EN: Special character set
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
});

// TR: Şifre gücü hesaplama
// EN: Calculate password strength
const strength = field.calculateStrength('MyP@ss123');
// Returns: 'weak' | 'fair' | 'good' | 'strong'

const percentage = field.getStrengthPercentage('MyP@ss123');
// Returns: 25 | 50 | 75 | 100
```

### SelectField

**TR:** Dropdown seçimi için kullanılır.
**EN:** Used for dropdown selection.

```typescript
import { SelectField } from '@biyonik/zignal';

const field = new SelectField<string>('country', 'Ülke', {
  required: true,

  options: [
    { value: 'TR', label: 'Türkiye' },
    { value: 'US', label: 'Amerika' },
    { value: 'DE', label: 'Almanya' },
    { value: 'KP', label: 'Kuzey Kore', disabled: true }, // Seçilemez
  ],

  // TR: Aranabilir / EN: Searchable
  searchable: true,

  // TR: Temizlenebilir / EN: Clearable
  clearable: true,

  // TR: Boş seçenek placeholder'ı
  // EN: Empty option placeholder
  emptyLabel: 'Seçiniz...',
});

// TR: Enum ile kullanım
// EN: Usage with Enum
enum UserRole { Admin = 1, Editor = 2, Viewer = 3 }

const roleField = new SelectField<UserRole>('role', 'Rol', {
  options: [
    { value: UserRole.Admin, label: 'Yönetici' },
    { value: UserRole.Editor, label: 'Editör' },
    { value: UserRole.Viewer, label: 'Görüntüleyici' },
  ],
});

// TR: Gruplu seçenekler
// EN: Grouped options
const cityField = new SelectField('city', 'Şehir', {
  options: [
    { value: 'ist', label: 'İstanbul', group: 'Marmara' },
    { value: 'ank', label: 'Ankara', group: 'İç Anadolu' },
    { value: 'izm', label: 'İzmir', group: 'Ege' },
  ],
});

// TR: Grupları al / EN: Get groups
const grouped = cityField.getGroupedOptions();
// Map<string, SelectOption[]>
```

### MultiselectField

**TR:** Çoklu seçim için kullanılır.
**EN:** Used for multiple selection.

```typescript
import { MultiselectField } from '@biyonik/zignal';

const field = new MultiselectField<string>('skills', 'Yetenekler', {
  required: true,

  options: [
    { value: 'js', label: 'JavaScript' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'angular', label: 'Angular' },
    { value: 'react', label: 'React' },
  ],

  // TR: Minimum seçim sayısı
  // EN: Minimum selection count
  minSelections: 1,

  // TR: Maksimum seçim sayısı
  // EN: Maximum selection count
  maxSelections: 3,

  // TR: Aranabilir / EN: Searchable
  searchable: true,

  // TR: Tümünü seç butonu / EN: Select all button
  showSelectAll: true,

  // TR: Chip olarak göster / EN: Show as chips
  showAsChips: true,
});

// TR: Kullanım / EN: Usage
const state = field.createValue(['js', 'ts']);
console.log(field.present(state.value())); // "JavaScript, TypeScript"
console.log(field.isMaxReached(state.value().length)); // false
```

### TextareaField

**TR:** Çok satırlı metin girişi için kullanılır.
**EN:** Used for multi-line text input.

```typescript
import { TextareaField } from '@biyonik/zignal';

const field = new TextareaField('description', 'Açıklama', {
  required: true,
  minLength: 10,
  maxLength: 500,

  // TR: Görünür satır sayısı
  // EN: Visible row count
  rows: 5,

  // TR: Otomatik boyutlandırma
  // EN: Auto-resize
  autoResize: true,

  // TR: Karakter sayacı göster
  // EN: Show character counter
  showCharacterCount: true,
});

// TR: Kalan karakter hesapla
// EN: Calculate remaining characters
const remaining = field.getRemainingCharacters(currentText.length);
// Returns: number | null (null if no maxLength)
```

### ArrayField

**TR:** Tekrarlayan kayıtlar (Repeater) için kullanılır.
**EN:** Used for repeatable records (Repeater).

```typescript
import { ArrayField, StringField, NumberField } from '@biyonik/zignal';

// TR: Fatura kalemleri örneği
// EN: Invoice items example
const lineItems = new ArrayField(
  'items',
  'Kalemler',
  [
    new StringField('description', 'Açıklama', { required: true }),
    new NumberField('quantity', 'Miktar', { required: true, min: 1 }),
    new NumberField('price', 'Birim Fiyat', { required: true, min: 0 }),
  ],
  {
    // TR: Minimum kayıt sayısı
    // EN: Minimum record count
    min: 1,

    // TR: Maksimum kayıt sayısı
    // EN: Maximum record count
    max: 10,

    // TR: Sürükle-bırak sıralama
    // EN: Drag-drop sorting
    sortable: true,

    // TR: Satır başlığı şablonu
    // EN: Row title template
    itemTitle: 'Kalem #{index}',

    // TR: Buton etiketleri
    // EN: Button labels
    addLabel: 'Kalem Ekle',
    removeLabel: 'Sil',
  }
);

// TR: State oluştur
// EN: Create state
const state = lineItems.createArrayState([
  { description: 'Ürün A', quantity: 2, price: 100 }
]);

// TR: Yeni satır ekle
// EN: Add new row
state.add({ description: '', quantity: 1, price: 0 });

// TR: Satır sil
// EN: Remove row
state.remove(state.items()[0].id);

// TR: Satır taşı
// EN: Move row
state.move(0, 2);

// TR: Form submit için değerleri al
// EN: Get values for form submit
const values = state.values(); // Record<string, unknown>[]
```

### FileField

**TR:** Dosya yükleme için kullanılır.
**EN:** Used for file upload.

```typescript
import { FileField, COMMON_MIME_TYPES } from '@biyonik/zignal';

const field = new FileField('avatar', 'Profil Fotoğrafı', {
  required: true,

  // TR: İzin verilen MIME tipleri
  // EN: Allowed MIME types
  accept: COMMON_MIME_TYPES.images, // ['image/jpeg', 'image/png', ...]

  // TR: Maksimum dosya boyutu (bytes)
  // EN: Maximum file size (bytes)
  maxSize: 5 * 1024 * 1024, // 5MB

  // TR: Minimum dosya boyutu
  // EN: Minimum file size
  minSize: 1024, // 1KB

  // TR: Çoklu dosya seçimi
  // EN: Multiple file selection
  multiple: true,

  // TR: Maksimum dosya sayısı
  // EN: Maximum file count
  maxFiles: 5,

  // TR: İzin verilen uzantılar
  // EN: Allowed extensions
  extensions: ['.jpg', '.png', '.gif'],
});

// TR: Predefined MIME type grupları
// EN: Predefined MIME type groups
COMMON_MIME_TYPES.images      // Resimler
COMMON_MIME_TYPES.documents   // Dökümanlar (PDF, Word)
COMMON_MIME_TYPES.spreadsheets // Excel, CSV
COMMON_MIME_TYPES.video       // Video
COMMON_MIME_TYPES.audio       // Audio
COMMON_MIME_TYPES.archives    // ZIP, RAR
```

### JsonField

**TR:** JSON/Object tipinde veriler için kullanılır.
**EN:** Used for JSON/Object type data.

```typescript
import { JsonField } from '@biyonik/zignal';
import { z } from 'zod';

const field = new JsonField('metadata', 'Metadata', {
  required: true,

  // TR: Özel Zod şeması
  // EN: Custom Zod schema
  schema: z.object({
    version: z.string(),
    tags: z.array(z.string()),
    settings: z.object({
      theme: z.enum(['light', 'dark']),
      notifications: z.boolean(),
    }),
  }),

  // TR: Okunabilir gösterim
  // EN: Pretty print display
  prettyPrint: true,

  // TR: Maksimum gösterim derinliği
  // EN: Maximum display depth
  maxDisplayDepth: 3,
});

// TR: Dot notation erişim
// EN: Dot notation access
const value = field.getValue(state.value(), 'settings.theme');

// TR: Immutable güncelleme
// EN: Immutable update
const updated = field.setValue(state.value(), 'settings.theme', 'dark');
```

---

## Form Schema | Form Şeması

```typescript
import { FormSchema, StringField, NumberField } from '@biyonik/zignal';

interface UserForm {
  name: string;
  email: string;
  age: number;
}

const schema = new FormSchema<UserForm>([
  new StringField('name', 'Ad', { required: true }),
  new StringField('email', 'E-posta', { required: true, email: true }),
  new NumberField('age', 'Yaş', { min: 18 }),
]);

// TR: Form state oluştur
// EN: Create form state
const form = schema.createForm({
  name: '',
  email: '',
  age: null,
});

// TR: Schema'ya erişim
// EN: Access schema
const fields = schema.getFields();
const emailField = schema.getField('email');
```

---

## FormState API

```typescript
const form = schema.createForm(initialValues);

// ═══════════════════════════════════════════════════════════════════
// SIGNALS (Reaktif / Reactive)
// ═══════════════════════════════════════════════════════════════════

form.values();           // Signal<T> - Tüm form değerleri
form.valid();            // Signal<boolean> - Form geçerli mi?
form.dirty();            // Signal<boolean> - Form değişti mi?
form.touched();          // Signal<boolean> - Herhangi bir alan touched mı?
form.errors();           // Signal<Record<string, string | null>>
form.submitting();       // Signal<boolean> - Submit durumunda mı?

// ═══════════════════════════════════════════════════════════════════
// FIELD ACCESS (Alan Erişimi)
// ═══════════════════════════════════════════════════════════════════

// TR: Her field için reactive state
// EN: Reactive state for each field
form.fields.email.value();     // Signal<string>
form.fields.email.error();     // Signal<string | null>
form.fields.email.touched();   // WritableSignal<boolean>
form.fields.email.dirty();     // Signal<boolean>
form.fields.email.valid();     // Signal<boolean>

// TR: Field instance'a erişim
// EN: Access field instance
form.fields.email.field;       // StringField

// ═══════════════════════════════════════════════════════════════════
// ACTIONS (Aksiyonlar)
// ═══════════════════════════════════════════════════════════════════

// TR: Tek değer güncelle
// EN: Update single value
form.setValue('email', 'test@example.com');

// TR: Birden fazla değer güncelle
// EN: Update multiple values
form.patchValues({
  email: 'test@example.com',
  age: 25,
});

// TR: Tüm alanları touched yap (submit öncesi)
// EN: Touch all fields (before submit)
form.touchAll();

// TR: Formu başlangıç değerlerine sıfırla
// EN: Reset form to initial values
form.reset();

// TR: Formu belirli değerlere sıfırla
// EN: Reset form to specific values
form.reset({
  name: 'Default Name',
  email: '',
  age: null,
});

// TR: Tüm alanları validate et (async)
// EN: Validate all fields (async)
const isValid = await form.validateAll();

// ═══════════════════════════════════════════════════════════════════
// GETTERS
// ═══════════════════════════════════════════════════════════════════

// TR: Type-safe değerleri al (Zod parsed)
// EN: Get type-safe values (Zod parsed)
const values = form.getValues(); // T

// TR: Sadece değişen alanları al
// EN: Get only changed fields
const dirtyValues = form.getDirtyValues(); // Partial<T>

// TR: Ham değerleri al (validation olmadan)
// EN: Get raw values (without validation)
const rawValues = form.getRawValues(); // T
```

---

## i18n - Internationalization | Çoklu Dil Desteği

### TR: Temel Kullanım | EN: Basic Usage

```typescript
import {
  I18nService,
  setLocale,
  getLocale,
  addMessages,
  t,
  detectBrowserLocale,
  useAutoLocale,
  TR_MESSAGES,
  EN_MESSAGES,
} from '@biyonik/zignal';

// TR: Browser diline göre otomatik ayarla
// EN: Auto-detect and set browser language
const locale = useAutoLocale(); // 'tr' veya 'en' döner

// TR: Manuel dil değiştir
// EN: Change language manually
setLocale('en');

// TR: Mevcut dili al
// EN: Get current language
const current = getLocale(); // 'en'

// TR: Validation mesajı al
// EN: Get validation message
const msg = t('required');
// TR: "Bu alan zorunludur"
// EN: "This field is required"

// TR: Parametreli mesaj
// EN: Message with parameters
const msg2 = t('string.min', { min: 3 });
// TR: "En az 3 karakter olmalıdır"
// EN: "Must be at least 3 characters"
```

### TR: Custom Mesajlar | EN: Custom Messages

```typescript
// TR: Mevcut dile mesaj ekle/override et
// EN: Add/override messages for current language
addMessages('tr', {
  // TR: Mevcut mesajı override et
  // EN: Override existing message
  required: 'Bu bilgi zorunludur',

  // TR: Custom mesaj ekle
  // EN: Add custom message
  'custom.validation': 'Özel validasyon hatası',
});

// TR: Yeni dil ekle
// EN: Add new language
addMessages('de', {
  required: 'Dieses Feld ist erforderlich',
  invalid: 'Ungültiger Wert',
  'string.min': 'Mindestens {min} Zeichen erforderlich',
  'string.max': 'Maximal {max} Zeichen erlaubt',
  'string.email': 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
  'number.min': 'Muss mindestens {min} sein',
  'number.max': 'Darf höchstens {max} sein',
  // ... diğer mesajlar
});

setLocale('de');
```

### TR: Mevcut Mesaj Anahtarları | EN: Available Message Keys

```typescript
// Common
'required'              // Bu alan zorunludur
'invalid'               // Geçersiz değer

// String
'string.min'            // En az {min} karakter olmalıdır
'string.max'            // En fazla {max} karakter olabilir
'string.email'          // Geçerli bir e-posta adresi giriniz
'string.url'            // Geçerli bir URL giriniz
'string.pattern'        // Geçersiz format

// Number
'number.min'            // En az {min} olmalıdır
'number.max'            // En fazla {max} olabilir
'number.integer'        // Tam sayı olmalıdır
'number.positive'       // Pozitif bir sayı olmalıdır
'number.negative'       // Negatif bir sayı olmalıdır

// Date
'date.min'              // Tarih {min} veya sonrası olmalıdır
'date.max'              // Tarih {max} veya öncesi olmalıdır
'date.invalid'          // Geçerli bir tarih giriniz

// Boolean
'boolean.required'      // Bu alanı onaylamanız gerekmektedir

// Password
'password.min'          // Şifre en az {min} karakter olmalıdır
'password.max'          // Şifre en fazla {max} karakter olabilir
'password.uppercase'    // En az bir büyük harf içermelidir
'password.lowercase'    // En az bir küçük harf içermelidir
'password.number'       // En az bir rakam içermelidir
'password.special'      // En az bir özel karakter içermelidir

// Select
'select.required'       // Lütfen bir seçenek seçiniz
'select.invalid'        // Geçersiz seçenek

// Multiselect
'multiselect.min'       // En az {min} seçenek seçmelisiniz
'multiselect.max'       // En fazla {max} seçenek seçebilirsiniz

// File
'file.required'         // Lütfen bir dosya seçiniz
'file.maxSize'          // Dosya boyutu en fazla {maxSize} olabilir
'file.type'             // Geçersiz dosya türü. İzin verilen: {types}

// Array
'array.min'             // En az {min} öğe eklemelisiniz
'array.max'             // En fazla {max} öğe ekleyebilirsiniz

// TR Validators
'tr.tckn'               // Geçerli bir T.C. Kimlik Numarası giriniz
'tr.vkn'                // Geçerli bir Vergi Kimlik Numarası giriniz
'tr.iban'               // Geçerli bir IBAN giriniz
'tr.phone'              // Geçerli bir telefon numarası giriniz
'tr.plate'              // Geçerli bir plaka giriniz
'tr.postalCode'         // Geçerli bir posta kodu giriniz
```

### TR: I18nService (Singleton) | EN: I18nService (Singleton)

```typescript
import { I18nService } from '@biyonik/zignal';

// TR: Singleton instance al
// EN: Get singleton instance
const i18n = I18nService.getInstance();

// TR: Locale signal (reaktif)
// EN: Locale signal (reactive)
const currentLocale = i18n.locale; // Signal<string>

// TR: Metodlar
// EN: Methods
i18n.setLocale('en');
i18n.getLocale();                        // 'en'
i18n.getSupportedLocales();              // ['tr', 'en', ...]
i18n.isLocaleSupported('de');            // false
i18n.hasKey('required');                 // true
i18n.t('string.min', { min: 3 });        // "Must be at least 3 characters"
i18n.translateFor('tr', 'required');     // "Bu alan zorunludur" (locale değişmez)
```

---

## Form Persistence

### TR: Temel Kullanım | EN: Basic Usage

```typescript
import { createFormPersistence, clearAllZignalPersistence } from '@biyonik/zignal';

interface UserForm {
  name: string;
  email: string;
  password: string;
}

// TR: Persistence oluştur
// EN: Create persistence
const persistence = createFormPersistence<UserForm>('registration-form', {
  // TR: Depolama tipi
  // EN: Storage type
  storage: 'local', // 'local' | 'session'

  // TR: Auto-save debounce (ms)
  // EN: Auto-save debounce (ms)
  debounceMs: 500,

  // TR: Hassas alanları hariç tut
  // EN: Exclude sensitive fields
  exclude: ['password'],

  // TR: Sadece belirli alanları dahil et
  // EN: Include only specific fields
  include: ['name', 'email'],

  // TR: Key prefix (namespace)
  // EN: Key prefix (namespace)
  prefix: 'myapp_',

  // TR: Expire süresi (ms)
  // EN: Expiry time (ms)
  ttl: 24 * 60 * 60 * 1000, // 24 saat
});
```

### TR: API Kullanımı | EN: API Usage

```typescript
// TR: Manuel kaydet
// EN: Manual save
persistence.save({
  name: 'John',
  email: 'john@example.com',
  password: '123456', // exclude'da olduğu için kaydedilmez
});

// TR: Veri yükle
// EN: Load data
const savedData = persistence.load();
// { name: 'John', email: 'john@example.com' }

// TR: Auto-save aktifleştir (form.values signal'i ile)
// EN: Enable auto-save (with form.values signal)
persistence.enableAutoSave(form.values);

// TR: Auto-save'i durdur
// EN: Stop auto-save
persistence.disableAutoSave();

// TR: Veriyi temizle
// EN: Clear data
persistence.clear();

// TR: Expire kontrolü
// EN: Check expiry
const isExpired = persistence.isExpired();

// TR: Storage key'ini al
// EN: Get storage key
const key = persistence.getKey(); // 'myapp_registration-form'

// TR: Tüm Zignal persistence verilerini temizle
// EN: Clear all Zignal persistence data
clearAllZignalPersistence(); // localStorage
clearAllZignalPersistence('session'); // sessionStorage
clearAllZignalPersistence('local', 'myapp_'); // specific prefix
```

### TR: Component'te Kullanım | EN: Usage in Component

```typescript
@Component({...})
export class RegistrationComponent implements OnInit, OnDestroy {
  form = schema.createForm({ name: '', email: '', password: '' });

  persistence = createFormPersistence<UserForm>('registration', {
    storage: 'local',
    exclude: ['password'],
    debounceMs: 1000,
  });

  ngOnInit() {
    // TR: Kaydedilmiş veriyi yükle
    // EN: Load saved data
    const saved = this.persistence.load();
    if (saved) {
      this.form.patchValues(saved);
    }

    // TR: Auto-save başlat
    // EN: Start auto-save
    this.persistence.enableAutoSave(this.form.values);
  }

  onSubmit() {
    if (this.form.valid()) {
      // TR: Başarılı submit sonrası temizle
      // EN: Clear after successful submit
      this.persistence.clear();
    }
  }

  ngOnDestroy() {
    this.persistence.disableAutoSave();
  }
}
```

---

## Async Validation | Asenkron Validasyon

### TR: Temel Kullanım | EN: Basic Usage

```typescript
import {
  AsyncValidator,
  createEmailValidator,
  createUsernameValidator,
  createUniquenessValidator,
} from '@biyonik/zignal';

// TR: E-posta benzersizlik kontrolü
// EN: Email uniqueness check
const emailValidator = createEmailValidator(
  async (email: string) => {
    const response = await fetch(`/api/check-email?email=${email}`);
    const { available } = await response.json();
    return available; // true = geçerli, false = zaten var
  },
  {
    debounceMs: 300,
    cacheSize: 50,
    errorMessage: 'Bu e-posta adresi zaten kullanımda',
  }
);

// TR: Kullanıcı adı benzersizlik kontrolü
// EN: Username uniqueness check
const usernameValidator = createUsernameValidator(
  async (username: string) => {
    const response = await fetch(`/api/check-username?username=${username}`);
    const { available } = await response.json();
    return available;
  },
  {
    debounceMs: 500,
    errorMessage: 'Bu kullanıcı adı zaten alınmış',
  }
);
```

### TR: Generic Validator | EN: Generic Validator

```typescript
// TR: Herhangi bir tip için validator
// EN: Validator for any type
const productCodeValidator = createUniquenessValidator<string>(
  async (code: string) => {
    const response = await fetch(`/api/check-product-code?code=${code}`);
    const { exists } = await response.json();
    return !exists;
  },
  'Bu ürün kodu zaten kullanımda',
  {
    debounceMs: 300,
    cacheSize: 100,
  }
);
```

### TR: AsyncValidator API | EN: AsyncValidator API

```typescript
// TR: Validate (async)
// EN: Validate (async)
const error = await emailValidator.validate('test@example.com');
// null = geçerli, string = hata mesajı

// TR: Debounced validate (Promise döner)
// EN: Debounced validate (returns Promise)
const error2 = await emailValidator.validateDebounced('test@example.com');

// TR: Reactive signals
// EN: Reactive signals
emailValidator.status;   // Signal<'idle' | 'pending' | 'valid' | 'invalid'>
emailValidator.pending;  // Signal<boolean>
emailValidator.valid;    // Signal<boolean>
emailValidator.error;    // Signal<string | null>

// TR: Reset
// EN: Reset
emailValidator.reset();

// TR: Abort
// EN: Abort
emailValidator.abort();
```

### TR: Component'te Kullanım | EN: Usage in Component

```typescript
@Component({
  template: `
    <input
      [value]="email()"
      (input)="onEmailChange($event.target.value)"
    />

    @if (emailValidator.pending()) {
      <span class="loading">Kontrol ediliyor...</span>
    }

    @if (emailValidator.error()) {
      <span class="error">{{ emailValidator.error() }}</span>
    }

    @if (emailValidator.valid() && email()) {
      <span class="success">E-posta kullanılabilir!</span>
    }
  `
})
export class RegisterComponent {
  email = signal('');
  emailValidator = createEmailValidator(async (email) => {
    const res = await fetch(`/api/check-email?email=${email}`);
    return (await res.json()).available;
  });

  async onEmailChange(value: string) {
    this.email.set(value);

    // TR: Debounced validation
    // EN: Debounced validation
    await this.emailValidator.validateDebounced(value);
  }

  async onSubmit() {
    // TR: Final validation
    // EN: Final validation
    const error = await this.emailValidator.validate(this.email());
    if (error) {
      return;
    }

    // Submit...
  }
}
```

---

## Conditional Fields | Koşullu Alanlar

```typescript
import { DependencyResolver, DependencyPatterns } from '@biyonik/zignal';

// TR: Dependency resolver oluştur
// EN: Create dependency resolver
const resolver = new DependencyResolver();

// TR: Koşullu görünürlük
// EN: Conditional visibility
resolver.addDependency({
  field: 'companyName',
  dependsOn: 'isCompany',
  condition: (isCompany) => isCompany === true,
  action: 'show', // 'show' | 'hide' | 'enable' | 'disable' | 'require'
});

// TR: Koşullu zorunluluk
// EN: Conditional requirement
resolver.addDependency({
  field: 'taxId',
  dependsOn: 'isCompany',
  condition: (isCompany) => isCompany === true,
  action: 'require',
});

// TR: Birden fazla bağımlılık
// EN: Multiple dependencies
resolver.addDependency({
  field: 'shippingAddress',
  dependsOn: ['sameAsBilling', 'hasShipping'],
  condition: (values) => !values.sameAsBilling && values.hasShipping,
  action: 'show',
});

// TR: Form state ile kullan
// EN: Use with form state
const dependencyState = resolver.createState(form.values);

// TR: Field durumunu al
// EN: Get field state
const companyNameState = dependencyState.getFieldState('companyName');
// { visible: Signal<boolean>, enabled: Signal<boolean>, required: Signal<boolean> }

// TR: Yaygın pattern'ler
// EN: Common patterns
DependencyPatterns.showWhenEquals('field', 'dependsOn', 'value');
DependencyPatterns.hideWhenEmpty('field', 'dependsOn');
DependencyPatterns.requireWhenChecked('field', 'checkbox');
```

---

## Turkey Validators | Türkiye Validatorları

### TCKN (T.C. Kimlik Numarası)

```typescript
import { isValidTCKN, tcknSchema } from '@biyonik/zignal';

// TR: Fonksiyon kullanımı
// EN: Function usage
if (isValidTCKN('12345678901')) {
  console.log('TCKN geçerli');
}

// TR: Zod schema kullanımı
// EN: Zod schema usage
const result = tcknSchema.safeParse('12345678901');
if (!result.success) {
  console.log('Hata:', result.error.message);
}
```

### VKN (Vergi Kimlik Numarası)

```typescript
import { isValidVKN, vknSchema } from '@biyonik/zignal';

if (isValidVKN('1234567890')) {
  console.log('VKN geçerli');
}
```

### Turkish IBAN

```typescript
import { isValidTurkishIBAN, turkishIbanSchema } from '@biyonik/zignal';

if (isValidTurkishIBAN('TR330006100519786457841326')) {
  console.log('IBAN geçerli');
}
```

### Turkish Phone

```typescript
import {
  isValidTurkishPhone,
  normalizeTurkishPhone,
  turkishPhoneSchema
} from '@biyonik/zignal';

// TR: Validasyon
// EN: Validation
isValidTurkishPhone('5321234567');      // true
isValidTurkishPhone('+905321234567');   // true
isValidTurkishPhone('05321234567');     // true

// TR: Normalizasyon
// EN: Normalization
normalizeTurkishPhone('+905321234567'); // '5321234567'
```

### Turkish Plate (Plaka)

```typescript
import { isValidTurkishPlate, turkishPlateSchema } from '@biyonik/zignal';

isValidTurkishPlate('34ABC123');   // true
isValidTurkishPlate('06A1234');    // true
```

### Turkish Postal Code

```typescript
import { isValidTurkishPostalCode, turkishPostalCodeSchema } from '@biyonik/zignal';

isValidTurkishPostalCode('34000'); // true
```

### TR: Toplu Kullanım | EN: Bulk Usage

```typescript
import { TRValidators } from '@biyonik/zignal';

TRValidators.tckn.isValid('...');
TRValidators.vkn.isValid('...');
TRValidators.iban.isValid('...');
TRValidators.phone.isValid('...');
TRValidators.plate.isValid('...');
TRValidators.postalCode.isValid('...');
```

---

## Custom Fields | Özel Alanlar

```typescript
import { BaseField, FieldConfig } from '@biyonik/zignal';
import { z } from 'zod';

// TR: Config interface
// EN: Config interface
interface CreditCardFieldConfig extends FieldConfig {
  acceptedCards?: ('visa' | 'mastercard' | 'amex')[];
}

// TR: Custom field class
// EN: Custom field class
export class CreditCardField extends BaseField<string> {
  constructor(
    name: string,
    label: string,
    public override config: CreditCardFieldConfig = {}
  ) {
    super(name, label, config);
  }

  schema(): z.ZodType<string> {
    let base = z.string()
      .regex(/^[\d\s-]+$/, 'Sadece rakam giriniz')
      .transform(v => v.replace(/[\s-]/g, '')) // Boşluk ve tire temizle
      .refine(v => this.isValidLuhn(v), 'Geçersiz kart numarası');

    if (this.config.acceptedCards?.length) {
      base = base.refine(
        v => this.isAcceptedCard(v),
        `Kabul edilen kartlar: ${this.config.acceptedCards.join(', ')}`
      );
    }

    return this.applyRequired(base);
  }

  private isValidLuhn(number: string): boolean {
    let sum = 0;
    let isEven = false;

    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  private isAcceptedCard(number: string): boolean {
    const accepted = this.config.acceptedCards ?? [];

    if (number.startsWith('4') && accepted.includes('visa')) return true;
    if (number.startsWith('5') && accepted.includes('mastercard')) return true;
    if (number.startsWith('3') && accepted.includes('amex')) return true;

    return false;
  }

  override present(value: string | null): string {
    if (!value) return '-';
    // TR: Maskeli gösterim
    // EN: Masked display
    return `**** **** **** ${value.slice(-4)}`;
  }
}

// TR: Kullanım
// EN: Usage
const cardField = new CreditCardField('card', 'Kredi Kartı', {
  required: true,
  acceptedCards: ['visa', 'mastercard'],
});
```

---

## Angular Integration | Angular Entegrasyonu

### TR: Directive Kullanımı | EN: Directive Usage

```typescript
import { ZgFormDirective, ZgFieldDirective, ZgErrorsComponent } from '@biyonik/zignal';

@Component({
  imports: [ZgFormDirective, ZgFieldDirective, ZgErrorsComponent],
  template: `
    <form [zgForm]="form" (zgSubmit)="onSubmit($event)">
      <div>
        <label>E-posta</label>
        <input zgField="email" />
        <zg-errors field="email" />
      </div>

      <div>
        <label>Şifre</label>
        <input zgField="password" type="password" />
        <zg-errors field="password" />
      </div>

      <button type="submit" [disabled]="!form.valid()">
        Kaydet
      </button>
    </form>
  `
})
export class MyFormComponent {
  form = schema.createForm({ email: '', password: '' });

  onSubmit(values: UserForm) {
    console.log('Submitted:', values);
  }
}
```

### TR: Reactive Forms Entegrasyonu | EN: Reactive Forms Integration

```typescript
import { createFormGroup, zodValidator } from '@biyonik/zignal';

@Component({...})
export class HybridFormComponent {
  // TR: Zignal schema'dan Angular FormGroup oluştur
  // EN: Create Angular FormGroup from Zignal schema
  formGroup = createFormGroup(schema);

  // TR: Veya manuel FormGroup ile Zod validator kullan
  // EN: Or use Zod validator with manual FormGroup
  form = new FormGroup({
    email: new FormControl('', zodValidator(z.string().email())),
    age: new FormControl(null, zodValidator(z.number().min(18))),
  });
}
```

### TR: Auto Field Component | EN: Auto Field Component

```typescript
import { ZgAutoFieldComponent } from '@biyonik/zignal';

@Component({
  imports: [ZgAutoFieldComponent],
  template: `
    <form [zgForm]="form">
      @for (field of schema.getFields(); track field.name) {
        <zg-auto-field [field]="field" [form]="form" />
      }

      <button type="submit">Kaydet</button>
    </form>
  `
})
export class AutoFormComponent {
  schema = new FormSchema([...]);
  form = this.schema.createForm({...});
}
```

---

## TR: Lisans | EN: License

MIT License - Ahmet ALTUN

---

## TR: Destek | EN: Support

- [GitHub Issues](https://github.com/biyonik/zignal/issues)
- [Discussions](https://github.com/biyonik/zignal/discussions)