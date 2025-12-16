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

  </div>
</div>

---

## 🌍 Introduction / Tanıtım

**🇬🇧 English**
Zignal is a next-generation form management library designed for the modern Angular ecosystem. It leverages **Angular Signals** for fine-grained reactivity and **Zod** for robust schema validation. Unlike traditional methods, Zignal is **Zoneless-ready**, meaning it doesn't rely on `zone.js` for change detection, offering superior performance.

**🇹🇷 Türkçe**
Zignal, modern Angular ekosistemi için tasarlanmış yeni nesil bir form yönetim kütüphanesidir. İnce ayarlı reaktivite için **Angular Signals** ve sağlam şema doğrulaması için **Zod** kullanır. Geleneksel yöntemlerin aksine Zignal **Zoneless** uyumludur; yani değişiklik algılama için `zone.js`'e ihtiyaç duymaz ve üstün performans sunar.

## ✨ Features / Özellikler

- 🚀 **Signal-First Architecture:** Built entirely on Angular Signals. No RxJS subscriptions required for state management.
- 🛡️ **Type-Safe:** Powered by Zod. Full type safety from schema definition to form values.
- ⚡ **Zoneless Ready:** Perfect for Angular 18+ zoneless applications.
- 🇹🇷 **TR Validators:** Built-in validators for Turkey (TCKN, VKN, IBAN, Plate, Phone).
- 🧩 **Schema-Driven:** Create forms from JSON or TypeScript classes easily.
- 🔌 **UI Agnostic:** Logic is separated from UI. Use it with Material, PrimeNG, or native HTML.

## 📦 Installation / Kurulum

```bash
npm install @biyonik/zignal zod
```

## 🚀 Quick Start / Hızlı Başlangıç

### 1. Define Fields / Alanları Tanımla

**🇬🇧** Create field instances with their configurations. Zignal provides ready-to-use fields like `StringField`, `NumberField`, etc.
**🇹🇷** Konfigürasyonlarıyla birlikte alan örneklerini oluşturun. Zignal, `StringField`, `NumberField` gibi kullanıma hazır alanlar sunar.

```typescript
import { StringField, NumberField, BooleanField } from '@biyonik/zignal';

// Simple text field / Basit metin alanı
const emailField = new StringField('email', 'E-mail', {
  required: true,
  email: true,
  placeholder: 'user@example.com'
});

// Number field with constraints / Kısıtlamalı sayı alanı
const ageField = new NumberField('age', 'Age / Yaş', {
  required: true,
  min: 18,
  max: 100
});

// Boolean field (Checkbox) / Mantıksal alan
const termsField = new BooleanField('terms', 'I accept terms / Şartları kabul ediyorum', {
  required: true
});
```

### 2. Create Schema / Şema Oluştur

**🇬🇧** Combine fields into a schema. This schema manages the state and validation of the entire form.
**🇹🇷** Alanları bir şemada birleştirin. Bu şema, tüm formun durumunu ve validasyonunu yönetir.

```typescript
import { FormSchema } from '@biyonik/zignal';

interface UserForm {
  email: string;
  age: number;
  terms: boolean;
}

// Create the schema instance
// Şema örneğini oluştur
export const userSchema = new FormSchema<UserForm>([
  emailField,
  ageField,
  termsField
]);
```

### 3. Use in Component / Bileşende Kullan

**🇬🇧** Initialize the form in your component and bind it to the template. Notice usage of Signals: `value()`, `error()`.
**🇹🇷** Formu bileşeninizde başlatın ve şablona bağlayın. Signal kullanımına dikkat edin: `value()`, `error()`.

```typescript
import { Component } from '@angular/core';
import { userSchema } from './user.schema';

@Component({
  selector: 'app-user-form',
  standalone: true,
  template: `
    <form (ngSubmit)="onSubmit()">
      <div class="field">
        <label>{{ form.fields.email.label }}</label>
        <input
          [value]="form.fields.email.value()"
          (input)="form.setValue('email', $event.target.value)"
          (blur)="form.fields.email.touched.set(true)"
        />
        @if (form.fields.email.error()) {
          <span class="error">{{ form.fields.email.error() }}</span>
        }
      </div>

      <button type="submit" [disabled]="!form.valid()">
        Submit / Gönder
      </button>
    </form>
  `
})
export class UserFormComponent {
  // Initialize form with default values
  // Formu varsayılan değerlerle başlat
  form = userSchema.createForm({
    email: '',
    age: null,
    terms: false
  });

  async onSubmit() {
    // Trigger validation / Validasyonu tetikle
    if (await this.form.validateAll()) {
      // Get type-safe data (parsed by Zod)
      // Tip güvenli veriyi al (Zod tarafından işlenmiş)
      const data = this.form.getValues();
      console.log('Form Data:', data);
    }
  }
}
```

## 🇹🇷 Turkey-Specific Validators / Türkiye'ye Özgü Validasyonlar

**🇬🇧** Zignal comes with built-in validators for Turkish specific data formats. These are strictly validated using official algorithms (Modulus algorithms for TCKN/IBAN etc.).

**🇹🇷** Zignal, Türkiye'ye özgü veri formatları için yerleşik doğrulayıcılarla gelir. Bunlar resmi algoritmalar (TCKN/IBAN için Modül hesaplamaları vb.) kullanılarak sıkı bir şekilde doğrulanır.

```typescript
import { StringField } from '@biyonik/zignal';
import { tcknSchema, turkishIbanSchema } from '@biyonik/zignal/validators';

// Custom Field implementing TR Validation
// TR Validasyonu uygulayan özel alan
export class TCKNField extends StringField {
  constructor(name: string, label: string) {
    super(name, label, { required: true });
  }

  // Override schema to use built-in TCKN validator
  // Yerleşik TCKN doğrulayıcısını kullanmak için şemayı ezin
  override schema() {
    return tcknSchema;
  }
}

// Usage / Kullanım
const tcknField = new TCKNField('identityNo', 'T.C. Kimlik No');
```

### Available Validators / Mevcut Doğrulayıcılar

| Validator | Description (TR) |
|-----------|------------------|
| `tcknSchema` | T.C. Kimlik Numarası (Algoritmik Doğrulama) |
| `vknSchema` | Vergi Kimlik Numarası |
| `turkishIbanSchema` | TR IBAN (Mod97 Kontrolü) |
| `turkishPhoneSchema` | Cep Telefonu (5XXXXXXXXX formatına normalize eder) |
| `turkishPlateSchema` | Araç Plakası (İl kodu ve harf grubu kontrolü) |

## 🧩 Dynamic Forms (JSON) / Dinamik Formlar

**🇬🇧** You can create forms dynamically using JSON data, perfect for backend-driven UIs.
**🇹🇷** Backend tabanlı arayüzler için mükemmel olan JSON verilerini kullanarak dinamik formlar oluşturabilirsiniz.

```typescript
import { inject } from '@angular/core';
import { SchemaFactory } from '@biyonik/zignal';

export class DynamicComponent {
  private factory = inject(SchemaFactory);

  // Create form from JSON config
  // JSON konfigürasyonundan form oluştur
  form = this.factory.parse([
    {
      type: 'string',
      name: 'fullName',
      label: 'Full Name',
      config: { required: true, minLength: 2 }
    },
    {
      type: 'date',
      name: 'birthDate',
      label: 'Birth Date'
    }
  ]);
}
```

## 🏗️ Architecture / Mimari

### FormState
Manages the state of the form using Angular Signals.
* `values()`: Signal containing current form data.
* `valid()`: Computed signal for overall validity.
* `dirty()`: Tracks if the form has been modified.

### DependencyResolver
Handles complex inter-field dependencies without RxJS subscriptions.
* **Show When:** Visibility based on other fields.
* **Enable When:** Enable/Disable logic.
* **Compute:** Calculate values (e.g., `Price * Quantity`).
* **Circular Check:** Automatically detects infinite dependency loops.

## 🤝 Contributing / Katkıda Bulunma

**🇬🇧** Contributions are welcome! Please check `CONTRIBUTING.md` for details on code standards and testing.
**🇹🇷** Katkılarınızı bekliyoruz! Kod standartları ve test süreçleri için lütfen `CONTRIBUTING.md` dosyasına göz atın.

## 📄 License

MIT License - Copyright (c) 2025 Biyonik