# 📚 Zignal Documentation

## 🏗️ Fields API Reference

Zignal, form alanlarını `BaseField` sınıfından türetilen tip güvenli sınıflarla yönetir.

### 🧬 Core: BaseField `<T>`
Tüm form alanlarının atasıdır.
* **Kaynak:** `src/lib/fields/base.field.ts`

#### Ortak Konfigürasyon (`FieldConfig`)
Aşağıdaki özellikler **tüm** field tiplerinde `config` parametresi içinde kullanılabilir.

| Özellik | Tip | Varsayılan | Açıklama |
|---------|-----|------------|----------|
| `required` | `boolean` | `false` | `true` ise alan zorunlu olur (boş bırakılamaz). |
| `readonly` | `boolean` | `false` | `true` ise değer görüntülenir ancak düzenlenemez. |
| `disabled` | `boolean` | `false` | `true` ise alan pasif olur, veri girişi engellenir. |
| `placeholder`| `string` | `undefined` | Alan boşken görünecek yer tutucu metin. |
| `hint` | `string` | `undefined` | Alanın altında gösterilecek yardımcı açıklama metni. |
| `defaultValue`| `unknown` | `undefined` | Form oluşturulurken kullanılacak varsayılan değer. |
| `requiredWhen`| `(val) => boolean` | `undefined` | Dinamik zorunluluk koşulu belirleyen fonksiyon. |

---

### 📝 Primitives (Temel Alanlar)

#### 1. StringField
Metin girişi için kullanılır.
* **Kaynak:** `src/lib/fields/string.field.ts`

**Konfigürasyon (`StringFieldConfig`):**
* `minLength` (number): Minimum karakter sayısı.
* `maxLength` (number): Maksimum karakter sayısı.
* `pattern` (RegExp): Regex desen kontrolü.
* `email` (boolean): E-posta format kontrolü.
* `url` (boolean): URL format kontrolü.

```typescript
new StringField('username', 'Kullanıcı Adı', {
  required: true,
  minLength: 3
});
```

#### 2. NumberField
Sayısal girişler için kullanılır.
* **Kaynak:** `src/lib/fields/number.field.ts`

**Konfigürasyon (`NumberFieldConfig`):**
* `min` (number): Minimum değer.
* `max` (number): Maksimum değer.
* `integer` (boolean): `true` ise sadece tam sayı kabul eder.
* `positive` (boolean): `true` ise sadece pozitif sayı kabul eder.
* `negative` (boolean): `true` ise sadece negatif sayı kabul eder.
* `decimals` (number): Görüntüleme için ondalık basamak sayısı (Varsayılan: 2).
* `step` (number): Input elemanındaki artış miktarı.
* `locale` (string): Formatlama için bölge kodu (Varsayılan: 'tr-TR').

```typescript
new NumberField('age', 'Yaş', {
  min: 18,
  integer: true
});
```

#### 3. BooleanField
Checkbox veya Switch mantığı için kullanılır.
* **Kaynak:** `src/lib/fields/boolean.field.ts`

*Ekstra bir konfigürasyon almaz.*

```typescript
new BooleanField('terms', 'Kullanım koşullarını onaylıyorum', {
  required: true
});
```

#### 4. DateField
Tarih seçimi için kullanılır.
* **Kaynak:** `src/lib/fields/date.field.ts`

**Konfigürasyon (`DateFieldConfig`):**
* `min` (Date): Seçilebilecek en erken tarih.
* `max` (Date): Seçilebilecek en geç tarih.
* `maxToday` (boolean): `true` ise bugünden sonraki tarihler seçilemez.

```typescript
new DateField('birthDate', 'Doğum Tarihi', {
  maxToday: true
});
```

---

### 🔽 Selection (Seçim Alanları)

#### 5. SelectField `<T>`
Tekli seçim (Dropdown) için kullanılır.
* **Kaynak:** `src/lib/fields/select.field.ts`

**Konfigürasyon (`SelectFieldConfig`):**
* `options` (Zorunlu): `{ label: string, value: T }[]` dizisi.

```typescript
new SelectField<string>('city', 'Şehir', {
  options: [
    { label: 'Ankara', value: '06' },
    { label: 'İstanbul', value: '34' }
  ]
});
```

#### 6. MultiSelectField `<T>`
Çoklu seçim için kullanılır.
* **Kaynak:** `src/lib/fields/multiselect.field.ts`

**Konfigürasyon (`MultiSelectFieldConfig`):**
* `options` (Zorunlu): Seçenek listesi.
* `minSelected` (number): En az kaç seçenek seçilmeli.
* `maxSelected` (number): En fazla kaç seçenek seçilebilir.

```typescript
new MultiSelectField<string>('tags', 'Etiketler', {
  options: [
    { label: 'Yazılım', value: 'dev' },
    { label: 'Tasarım', value: 'design' }
  ],
  maxSelected: 3
});
```

---

### 🎨 Specialized Fields (Özelleşmiş Alanlar)

Bu alanlar temel tiplerden (genellikle `StringField`) türetilmiş, belirli kullanım senaryoları için özelleştirilmiş alanlardır.

#### 7. PasswordField
Şifre girişi için kullanılır. UI tarafında maskelenmiş input (`type="password"`) render eder.
* **Kaynak:** `src/lib/fields/password.field.ts`
* **Taban:** `StringField`

```typescript
new PasswordField('password', 'Şifre', {
  required: true,
  minLength: 6
});
```

#### 8. EmailField
E-posta girişi için kullanılır. Varsayılan olarak e-posta validasyonu aktiftir.
* **Kaynak:** `src/lib/fields/email.field.ts`
* **Taban:** `StringField`

```typescript
new EmailField('email', 'E-posta Adresi', {
  required: true,
  placeholder: 'ornek@site.com'
});
```

#### 9. PhoneField
Telefon numarası girişi için kullanılır. Türkiye telefon formatı (`turkishPhoneSchema`) validasyonu ile gelir.
* **Kaynak:** `src/lib/fields/phone.field.ts`
* **Taban:** `StringField`

```typescript
new PhoneField('mobile', 'Cep Telefonu', {
  required: true,
  hint: 'Başında 0 olmadan giriniz (5XX...)'
});
```

#### 10. UrlField
Web sitesi adresi girişi için kullanılır. URL format validasyonu ile gelir.
* **Kaynak:** `src/lib/fields/url.field.ts`
* **Taban:** `StringField`

```typescript
new UrlField('website', 'Web Sitesi', {
  placeholder: 'https://...'
});
```

#### 11. TextareaField
Çok satırlı metin girişi için kullanılır.
* **Kaynak:** `src/lib/fields/textarea.field.ts`
* **Taban:** `StringField`

**Konfigürasyon (`TextareaFieldConfig`):**
* `rows` (number): Gösterilecek satır sayısı (Varsayılan: 3).

```typescript
new TextareaField('description', 'Açıklama', {
  maxLength: 500,
  rows: 5
});
```

#### 12. FileField
Dosya yükleme işlemleri için kullanılır.
* **Kaynak:** `src/lib/fields/file.field.ts`
* **Taban:** `BaseField<File | File[] | null>`

**Konfigürasyon (`FileFieldConfig`):**
* `accept` (string): Kabul edilen dosya türleri (Örn: `.pdf,.jpg`).
* `maxSize` (number): Maksimum dosya boyutu (Byte).
* `multiple` (boolean): Birden fazla dosya seçimine izin verir.

```typescript
new FileField('attachment', 'Döküman Yükle', {
  accept: '.pdf,.docx',
  maxSize: 5 * 1024 * 1024 // 5MB
});
```

#### 13. ColorField
Renk seçimi için kullanılır. Genellikle HEX kodu (`#RRGGBB`) döner.
* **Kaynak:** `src/lib/fields/color.field.ts`
* **Taban:** `StringField` (veya BaseField)

```typescript
new ColorField('themeColor', 'Tema Rengi', {
  defaultValue: '#3f51b5'
});
```

#### 14. JsonField
JSON verisi girişi için kullanılır. Girilen metnin geçerli bir JSON olup olmadığını doğrular (`JSON.parse` kontrolü).
* **Kaynak:** `src/lib/fields/json.field.ts`
* **Taban:** `BaseField<unknown>`

```typescript
new JsonField('config', 'Konfigürasyon (JSON)', {
  required: true
});
```

---

### 🧩 Complex Structures (Karmaşık Yapılar)

#### 15. ArrayField
Tekrarlayan veri satırları (Repeater/Collection) oluşturmak için kullanılır.
* **Kaynak:** `src/lib/fields/array.field.ts`

**Konfigürasyon (`ArrayFieldConfig`):**
* `min` (number): Minimum satır sayısı.
* `max` (number): Maksimum satır sayısı.
* `sortable` (boolean): Sürükle-bırak sıralama yapılabilir mi?
* `addLabel` (string): Ekleme butonu metni.
* `removeLabel` (string): Silme butonu metni.
* `itemTitle` (string): Satır başlığı şablonu (Örn: `'Kayıt #{index}'`).

**Kullanım:**
Constructor, tekrarlanacak alanların listesini (`itemFields`) parametre olarak alır.

```typescript
const orderItems = new ArrayField(
  'items',       // Alan adı
  'Siparişler',  // Etiket
  // Her satırda yer alacak alanlar:
  [
    new StringField('productName', 'Ürün Adı', { required: true }),
    new NumberField('quantity', 'Adet', { min: 1 }),
    new NumberField('price', 'Birim Fiyat', { min: 0 })
  ],
  // Konfigürasyon:
  {
    min: 1,
    addLabel: 'Yeni Ürün Ekle',
    itemTitle: 'Ürün #{index}'
  }
);
```

#### 16. GroupField
Alanları mantıksal olarak gruplamak (Nested Object) için kullanılır. Form verisinde iç içe bir obje oluşturur.
* **Kaynak:** `src/lib/fields/group.field.ts`

**Konfigürasyon (`GroupFieldConfig`):**
* `fields` (Zorunlu): Grup içindeki alanların listesi (`IField[]`).

```typescript
const addressInfo = new GroupField('address', 'Adres Bilgileri', {
  fields: [
    new StringField('street', 'Sokak'),
    new StringField('city', 'Şehir'),
    new StringField('zipCode', 'Posta Kodu')
  ]
});
// Çıktı: { address: { street: '...', city: '...', zipCode: '...' } }
```

---

## 🛡️ Validation & Zod Integration

Zignal, validasyon motoru olarak **Zod** kütüphanesini kullanır.

### 🇹🇷 Built-in Validators (TRValidators)
Zignal, Türkiye standartlarına uygun, algoritma tabanlı doğrulayıcılar sunar.
* **Kaynak:** `src/lib/validators/tr-validators.ts`

| Validator | Şema Adı | Algoritma / Kural | Transform |
|-----------|----------|-------------------|-----------|
| **TCKN** | `tcknSchema` | Mod 10 algoritması. | - |
| **VKN** | `vknSchema` | Vergi No Mod 10 algoritması. | - |
| **IBAN** | `turkishIbanSchema` | ISO 7064 Mod 97-10. | Boşluk siler, büyütür. |
| **Plaka** | `turkishPlateSchema` | İl kodu + Harf + Sayı. | Boşluk siler, büyütür. |
| **Telefon** | `turkishPhoneSchema` | TR Mobil (5XX...). | - |
| **Telefon (Norm)** | `normalizedTurkishPhoneSchema` | TR Mobil. | 5XXXXXXXXX formatına çevirir. |

**Kullanım:**
Özel bir alan oluşturarak `schema()` metodunu override edebilirsiniz.

```typescript
import { StringField } from '@biyonik/zignal';
import { tcknSchema } from '@biyonik/zignal/validators';

export class TCKNField extends StringField {
  override schema() {
    return tcknSchema;
  }
}
```

---

## 🧠 Core Concepts & Architecture

### ⚡ FormState API
Formun çalışma zamanındaki durumunu yöneten sınıftır.
* **Kaynak:** `src/lib/core/form-state.ts`

* `values`: `Signal<T>` - Form verisi.
* `valid`: `Signal<boolean>` - Geçerlilik durumu.
* `dirty`: `Signal<boolean>` - Değişiklik durumu.
* `touched`: `Signal<boolean>` - Etkileşim durumu.
* `errors`: `Signal<Record<string, string>>` - Hata mesajları.

### 🔗 Dependency System (Bağımlılıklar)
RxJS kullanmadan `effect` ile bağımlılıkları yönetir. `DependencyResolver` servisi ile çalışır.
* **Kaynak:** `src/lib/core/field-dependency.ts`

Alanlar arası etkileşimler (bir alanın diğerine göre görünür olması veya değerinin hesaplanması) `FieldDependency` arayüzü ile tanımlanır.

---

## 🎨 UI Integration

### Directives
* **Kaynak:** `src/lib/forms/zg-form.directive.ts`, `src/lib/forms/zg-field.directive.ts`

```html
<form [zgForm]="form" (ngSubmit)="onSubmit()">
  <input type="text" [zgField]="'email'">
</form>
```

### Components
* `<zg-errors [control]="field">`: Hata mesajlarını gösterir.
* `<zg-auto-field [field]="field">`: Alan tipine göre otomatik input render eder.

---

## 🛠️ Advanced Customization

### Creating Custom Fields (Özel Alan Oluşturma)

Kütüphanenin sunduğu alanlar yetersiz kaldığında `BaseField` sınıfını genişleterek kendi alanlarınızı oluşturabilirsiniz.

**Adımlar:**
1. `BaseField` sınıfından türetin.
2. `schema()` metodunu implemente edin.
3. (Opsiyonel) JSON desteği için `FieldRegistry`'ye kaydedin.

```typescript
import { BaseField, FieldConfig, FieldRegistry } from '@biyonik/zignal';
import { z } from 'zod';

// 1. Config Arayüzü
interface RichTextConfig extends FieldConfig {
  toolbar?: string[];
}

// 2. Sınıf Tanımı
export class RichTextField extends BaseField<string> {
  constructor(name: string, label: string, public override config: RichTextConfig = {}) {
    super(name, label, config);
  }

  // 3. Validasyon Şeması
  override schema(): z.ZodType<string> {
    return z.string().min(1, 'İçerik boş olamaz');
  }
}

// 4. Registry Kaydı (Dinamik formlar için)
FieldRegistry.register('rich-text', RichTextField);
```