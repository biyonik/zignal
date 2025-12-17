<div align="center">
  <img src="logo.svg" alt="Zignal Logo" width="120" height="120" />
  <h1>Zignal</h1>

  <p>
    <strong>Signal-first, schema-driven form library for Angular 17+</strong>
    <br />
    Angular 17+ için Signal tabanlı, şema güdümlü form kütüphanesi
  </p>

  <div align="center">

[![npm version](https://img.shields.io/npm/v/@biyonik/zignal.svg)](https://www.npmjs.com/package/@biyonik/zignal)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Angular](https://img.shields.io/badge/Angular-17%2B-DD0031.svg?logo=angular&logoColor=white)](https://angular.io/)
[![Zod](https://img.shields.io/badge/Zod-Schema-3068B7.svg)](https://zod.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
<a href="https://github.com/biyonik/zignal/actions"><img src="https://github.com/biyonik/zignal/workflows/CI/badge.svg" alt="CI Status"></a>

  </div>
</div>

---

## TR: Hakkında | EN: About

**TR:** Zignal, Angular Signals kullanarak reaktif form yönetimi sağlayan, Zod validasyonu ile type-safe bir form kütüphanesidir. Türkiye'ye özgü validatorlar (TCKN, VKN, IBAN) ve çoklu dil desteği içerir.

**EN:** Zignal is a type-safe form library that provides reactive form management using Angular Signals with Zod validation. It includes Turkey-specific validators (TCKN, VKN, IBAN) and multi-language support.

---

## TR: Özellikler | EN: Features

| TR | EN |
|----|----|
| **Signal-first** - Angular Signals ile fine-grained reactivity | **Signal-first** - Fine-grained reactivity with Angular Signals |
| **Schema-driven** - JSON'dan dinamik form oluşturma | **Schema-driven** - Dynamic form generation from JSON |
| **Type-safe** - Zod entegrasyonu ile runtime + compile-time güvenlik | **Type-safe** - Runtime + compile-time safety with Zod integration |
| **Zoneless ready** - Angular 18+ zoneless mode uyumlu | **Zoneless ready** - Compatible with Angular 18+ zoneless mode |
| **i18n** - Çoklu dil desteği (TR, EN ve custom) | **i18n** - Multi-language support (TR, EN and custom) |
| **Form Persistence** - localStorage/sessionStorage desteği | **Form Persistence** - localStorage/sessionStorage support |
| **Async Validation** - API-based asenkron validasyon | **Async Validation** - API-based asynchronous validation |
| **TR Validators** - TCKN, VKN, IBAN, Plaka validasyonu | **TR Validators** - Turkish ID, Tax ID, IBAN, License plate validation |

---

## TR: Kurulum | EN: Installation

```bash
npm install @biyonik/zignal zod
```

---

## TR: Hızlı Başlangıç | EN: Quick Start

### 1. Field Tanımlama | Define Fields

```typescript
import { StringField, NumberField, BooleanField, PasswordField } from '@biyonik/zignal';

// TR: E-posta alanı
// EN: Email field
const emailField = new StringField('email', 'E-posta', {
  required: true,
  email: true
});

// TR: Yaş alanı
// EN: Age field
const ageField = new NumberField('age', 'Yaş', {
  required: true,
  min: 18,
  max: 100,
  integer: true
});

// TR: Şifre alanı (güçlü şifre kuralları)
// EN: Password field (strong password rules)
const passwordField = new PasswordField('password', 'Şifre', {
  required: true,
  minLength: 8,
  requireUppercase: true,
  requireNumber: true,
  requireSpecial: true
});

// TR: Şartları kabul checkbox
// EN: Terms acceptance checkbox
const acceptTerms = new BooleanField('acceptTerms', 'Şartları kabul ediyorum', {
  required: true  // true olması zorunlu
});
```

### 2. Form Schema Oluşturma | Create Form Schema

```typescript
import { FormSchema } from '@biyonik/zignal';

interface UserForm {
  email: string;
  age: number;
  password: string;
  acceptTerms: boolean;
}

const userSchema = new FormSchema<UserForm>([
  emailField,
  ageField,
  passwordField,
  acceptTerms
]);
```

### 3. Component'te Kullanım | Use in Component

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-user-form',
  template: `
    <form (ngSubmit)="onSubmit()">
      <!-- Email -->
      <div class="field">
        <label>{{ form.fields.email.label }}</label>
        <input
          type="email"
          [value]="form.fields.email.value()"
          (input)="form.setValue('email', $event.target.value)"
          (blur)="form.fields.email.touched.set(true)"
        />
        @if (form.fields.email.error()) {
          <span class="error">{{ form.fields.email.error() }}</span>
        }
      </div>

      <!-- Password -->
      <div class="field">
        <label>{{ form.fields.password.label }}</label>
        <input
          type="password"
          [value]="form.fields.password.value()"
          (input)="form.setValue('password', $event.target.value)"
        />
        @if (form.fields.password.error()) {
          <span class="error">{{ form.fields.password.error() }}</span>
        }
      </div>

      <button type="submit" [disabled]="!form.valid()">
        Kaydet / Save
      </button>
    </form>
  `
})
export class UserFormComponent {
  form = userSchema.createForm({
    email: '',
    age: null,
    password: '',
    acceptTerms: false
  });

  async onSubmit() {
    if (await this.form.validateAll()) {
      const data = this.form.getValues();
      console.log('Form data:', data);
    }
  }
}
```

---

## TR: Dil Desteği (i18n) | EN: Language Support (i18n)

```typescript
import { setLocale, addMessages, t, detectBrowserLocale, useAutoLocale } from '@biyonik/zignal';

// TR: Browser diline göre otomatik ayarla
// EN: Auto-detect browser language
const locale = useAutoLocale(); // Returns 'tr' or 'en'

// TR: Manuel dil değiştir
// EN: Change language manually
setLocale('en');

// TR: Custom mesajlar ekle (firma özel)
// EN: Add custom messages (company specific)
addMessages('tr', {
  required: 'Bu bilgi zorunludur',
  'string.email': 'Lütfen kurumsal e-posta adresinizi giriniz',
});

// TR: Yeni dil ekle (örn: Almanca)
// EN: Add new language (e.g., German)
addMessages('de', {
  required: 'Dieses Feld ist erforderlich',
  'string.min': 'Mindestens {min} Zeichen erforderlich',
});
setLocale('de');

// TR: Validation mesajını al
// EN: Get validation message
const msg = t('password.min', { min: 8 });
// TR: "Şifre en az 8 karakter olmalıdır"
// EN: "Password must be at least 8 characters"
```

---

## TR: Form Persistence | EN: Form Persistence

```typescript
import { createFormPersistence } from '@biyonik/zignal';

// TR: Form verilerini localStorage'a kaydet
// EN: Save form data to localStorage
const persistence = createFormPersistence<UserForm>('user-form', {
  storage: 'local',           // 'local' | 'session'
  debounceMs: 500,            // Auto-save debounce
  exclude: ['password'],      // Hassas alanları hariç tut
  ttl: 24 * 60 * 60 * 1000,   // 24 saat sonra expire
});

// TR: Form verilerini yükle
// EN: Load form data
const savedData = persistence.load();
if (savedData) {
  form.patchValues(savedData);
}

// TR: Auto-save aktifleştir
// EN: Enable auto-save
persistence.enableAutoSave(form.values);

// TR: Manuel kaydet
// EN: Manual save
persistence.save(form.getValues());

// TR: Temizle
// EN: Clear
persistence.clear();
```

---

## TR: Asenkron Validasyon | EN: Async Validation

```typescript
import { createEmailValidator, createUsernameValidator } from '@biyonik/zignal';

// TR: E-posta benzersizlik kontrolü
// EN: Email uniqueness check
const emailValidator = createEmailValidator(
  async (email) => {
    const response = await fetch(`/api/check-email?email=${email}`);
    const { exists } = await response.json();
    return !exists; // true = geçerli, false = zaten var
  },
  {
    debounceMs: 300,
    cacheSize: 50,
    errorMessage: 'Bu e-posta adresi zaten kullanımda'
  }
);

// TR: Component'te kullan
// EN: Use in component
@Component({...})
export class RegisterComponent {
  emailValidator = emailValidator;

  async checkEmail(email: string) {
    const error = await this.emailValidator.validate(email);
    if (error) {
      console.log('Validation error:', error);
    }
  }

  // TR: Reactive state
  isPending = this.emailValidator.pending;   // Signal<boolean>
  isValid = this.emailValidator.valid;       // Signal<boolean>
  errorMsg = this.emailValidator.error;      // Signal<string | null>
}
```

---

## TR: Türkiye Validatorları | EN: Turkey Validators

```typescript
import {
  tcknSchema,
  vknSchema,
  turkishIbanSchema,
  turkishPhoneSchema,
  turkishPlateSchema,
  isValidTCKN,
  isValidVKN
} from '@biyonik/zignal';

// TR: TCKN validasyonu
// EN: Turkish ID validation
const tckn = tcknSchema.safeParse('12345678901');
if (!tckn.success) {
  console.log('Geçersiz TCKN');
}

// TR: Direkt fonksiyon kullanımı
// EN: Direct function usage
if (isValidTCKN('12345678901')) {
  console.log('TCKN geçerli');
}

// TR: Form field olarak
// EN: As form field
const tcknField = new StringField('tckn', 'T.C. Kimlik No', {
  required: true,
  pattern: /^\d{11}$/,
  customValidator: (value) => isValidTCKN(value) ? null : 'Geçersiz TCKN'
});
```

---

## TR: Field Tipleri | EN: Field Types

| Field | Type | TR: Açıklama | EN: Description |
|-------|------|--------------|-----------------|
| `StringField` | `string` | Tek satır metin | Single line text |
| `NumberField` | `number` | Sayısal değer | Numeric value |
| `BooleanField` | `boolean` | Evet/Hayır | Yes/No |
| `DateField` | `Date` | Tarih seçici | Date picker |
| `PasswordField` | `string` | Şifre (güç göstergeli) | Password (with strength) |
| `EmailField` | `string` | E-posta | Email |
| `UrlField` | `string` | URL | URL |
| `TextareaField` | `string` | Çok satırlı metin | Multi-line text |
| `SelectField<T>` | `T` | Dropdown seçimi | Dropdown selection |
| `MultiselectField<T>` | `T[]` | Çoklu seçim | Multiple selection |
| `ArrayField` | `object[]` | Tekrarlayan kayıtlar | Repeatable records |
| `JsonField` | `object` | JSON/Object | JSON/Object |
| `FileField` | `FileInfo` | Dosya yükleme | File upload |

---

## TR: FormState API | EN: FormState API

```typescript
const form = schema.createForm(initialValues);

// ===============================================
// TR: Signals (Reaktif)
// EN: Signals (Reactive)
// ===============================================
form.values();           // Signal<T> - Tüm değerler / All values
form.valid();            // Signal<boolean> - Geçerlilik / Validity
form.dirty();            // Signal<boolean> - Değişiklik var mı? / Has changes?
form.errors();           // Signal<Record<string, string | null>>

// ===============================================
// TR: Field Erişimi
// EN: Field Access
// ===============================================
form.fields.email.value();     // Signal<string>
form.fields.email.error();     // Signal<string | null>
form.fields.email.touched();   // Signal<boolean>
form.fields.email.valid();     // Signal<boolean>
form.fields.email.dirty();     // Signal<boolean>

// ===============================================
// TR: Aksiyonlar
// EN: Actions
// ===============================================
form.setValue('email', 'test@example.com');
form.patchValues({ email: 'a@b.com', age: 25 });
form.touchAll();               // Tüm hataları göster / Show all errors
form.reset();                  // Başlangıç değerlerine dön / Reset to initial
form.validateAll();            // Async validation

// ===============================================
// TR: Getter'lar
// EN: Getters
// ===============================================
form.getValues();              // Type-safe data (Zod parsed)
form.getDirtyValues();         // Sadece değişenler / Only changed fields
```

---

## TR: JSON'dan Dinamik Form | EN: Dynamic Form from JSON

```typescript
import { SchemaFactory } from '@biyonik/zignal';

@Component({...})
export class DynamicFormComponent {
  private factory = inject(SchemaFactory);

  form = this.factory.parse([
    {
      type: 'string',
      name: 'email',
      label: 'E-posta',
      config: { required: true, email: true }
    },
    {
      type: 'number',
      name: 'age',
      label: 'Yaş',
      config: { min: 18, max: 100 }
    },
    {
      type: 'select',
      name: 'country',
      label: 'Ülke',
      config: {
        required: true,
        options: [
          { value: 'TR', label: 'Türkiye' },
          { value: 'US', label: 'USA' }
        ]
      }
    }
  ]);
}
```

---

## TR: Karşılaştırma | EN: Comparison

| TR: Özellik / EN: Feature | ngx-formly | Reactive Forms | **Zignal** |
|---------------------------|------------|----------------|------------|
| Reactivity | RxJS | RxJS | **Angular Signals** |
| Zoneless Support | ❌ | ⚠️ | **✅** |
| Type Safety | Limited | Limited | **Full (Zod)** |
| i18n Support | Plugin | Manual | **Built-in** |
| Form Persistence | ❌ | Manual | **Built-in** |
| Async Validation | ✅ | ✅ | **✅ + Cache** |
| Bundle Size | ~50KB | ~0KB (Angular) | **<20KB** |
| Learning Curve | High | Medium | **Low** |

---

## TR: Gereksinimler | EN: Requirements

- Angular 17.0.0+
- Zod 3.22.0+
- TypeScript 5.0+

---

## TR: Lisans | EN: License

MIT License - Ahmet ALTUN

---

## TR: Katkıda Bulunma | EN: Contributing

1. Fork edin / Fork
2. Feature branch oluşturun / Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit edin / Commit (`git commit -m 'feat: add amazing feature'`)
4. Push edin / Push (`git push origin feature/amazing-feature`)
5. Pull Request açın / Open Pull Request

---

## TR: Destek | EN: Support

- [GitHub Issues](https://github.com/biyonik/zignal/issues)
- [Discussions](https://github.com/biyonik/zignal/discussions)
- [Documentation](./DOCUMENTATION.md)