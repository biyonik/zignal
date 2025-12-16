# Zignal

> **Signal-first, schema-driven form library for Angular 17+**

[![npm version](https://img.shields.io/npm/v/@biyonik/zignal.svg)](https://www.npmjs.com/package/@biyonik/zignal)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Zignal, Angular Signals kullanarak reaktif form yönetimi sağlayan, Zod validasyonu ile type-safe bir form kütüphanesidir.

## Özellikler

- **Signal-first** - Angular Signals ile fine-grained reactivity
- **Schema-driven** - JSON'dan dinamik form oluşturma
- **Type-safe** - Zod entegrasyonu ile runtime + compile-time güvenlik
- **Zoneless ready** - Angular 18+ zoneless mode uyumlu
- **UI-agnostic** - Material, PrimeNG veya custom UI ile kullanılabilir
- **Minimal API** - 5 dakikada öğren, hemen kullan

## Kurulum

```bash
npm install @biyonik/zignal zod
```

## Hızlı Başlangıç

### 1. Field'ları Tanımla

```typescript
import { StringField, NumberField, BooleanField } from '@biyonik/zignal';

const emailField = new StringField('email', 'E-posta', {
  required: true,
  email: true
});

const ageField = new NumberField('age', 'Yaş', {
  required: true,
  min: 18,
  max: 100
});

const acceptTerms = new BooleanField('acceptTerms', 'Şartları kabul ediyorum', {
  required: true
});
```

### 2. Form Schema Oluştur

```typescript
import { FormSchema } from '@biyonik/zignal';

interface UserForm {
  email: string;
  age: number;
  acceptTerms: boolean;
}

const userSchema = new FormSchema<UserForm>([
  emailField,
  ageField,
  acceptTerms
]);
```

### 3. Component'te Kullan

```typescript
import { Component, inject } from '@angular/core';

@Component({
  selector: 'app-user-form',
  template: `
    <form (ngSubmit)="onSubmit()">
      <div>
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

      <button type="submit" [disabled]="!form.valid()">Kaydet</button>
    </form>
  `
})
export class UserFormComponent {
  form = userSchema.createForm({
    email: '',
    age: null,
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

## Field Tipleri

| Field | Tip | Açıklama |
|-------|-----|----------|
| `StringField` | `string` | Tek satır metin |
| `NumberField` | `number` | Sayısal değer |
| `BooleanField` | `boolean` | Evet/Hayır |
| `DateField` | `Date` | Tarih |
| `SelectField<T>` | `T` | Dropdown seçimi |

## Field Config Seçenekleri

### StringField

```typescript
new StringField('name', 'Ad', {
  required: true,      // Zorunlu alan
  minLength: 2,        // Min karakter
  maxLength: 50,       // Max karakter
  pattern: /^[A-Z]/,   // Regex pattern
  email: true,         // E-posta formatı
  url: true,           // URL formatı
  placeholder: 'Adınızı giriniz',
  hint: 'En az 2 karakter'
});
```

### NumberField

```typescript
new NumberField('price', 'Fiyat', {
  required: true,
  min: 0,
  max: 10000,
  integer: true,       // Sadece tam sayı
  positive: true,      // Sadece pozitif
  decimals: 2          // Ondalık basamak
});
```

### DateField

```typescript
new DateField('birthDate', 'Doğum Tarihi', {
  required: true,
  maxToday: true,      // Bugün veya öncesi
  min: new Date('1900-01-01'),
  locale: 'tr-TR'
});
```

### SelectField

```typescript
new SelectField('country', 'Ülke', {
  required: true,
  options: [
    { value: 'TR', label: 'Türkiye' },
    { value: 'US', label: 'Amerika' },
    { value: 'DE', label: 'Almanya' }
  ],
  searchable: true,
  clearable: true
});
```

## FormState API

```typescript
const form = schema.createForm(initialValues);

// Signals (Reactive)
form.values();           // Signal<T> - Tüm değerler
form.valid();            // Signal<boolean> - Geçerlilik
form.dirty();            // Signal<boolean> - Değişiklik var mı?
form.errors();           // Signal<Record<string, string | null>>

// Field Access
form.fields.email.value();     // Signal<string>
form.fields.email.error();     // Signal<string | null>
form.fields.email.touched();   // Signal<boolean>
form.fields.email.valid();     // Signal<boolean>

// Actions
form.setValue('email', 'test@example.com');
form.patchValues({ email: 'a', age: 25 });
form.touchAll();               // Tüm hataları göster
form.reset();                  // Başlangıç değerlerine dön
form.validateAll();            // Async validation

// Getters
form.getValues();              // Type-safe data (Zod parsed)
form.getDirtyValues();         // Sadece değişenler
```

## JSON'dan Dinamik Form

```typescript
import { SchemaFactory } from '@biyonik/zignal';

@Component({...})
export class DynamicFormComponent {
  private factory = inject(SchemaFactory);

  form = this.factory.parse([
    { type: 'string', name: 'email', label: 'E-posta', config: { required: true, email: true } },
    { type: 'number', name: 'age', label: 'Yaş', config: { min: 18 } },
    { type: 'date', name: 'birthDate', label: 'Doğum Tarihi' }
  ]);
}
```

## Özel Field Oluşturma

```typescript
import { BaseField, FieldConfig } from '@biyonik/zignal';
import { z } from 'zod';

interface PhoneFieldConfig extends FieldConfig {
  countryCode?: string;
}

export class PhoneField extends BaseField<string> {
  constructor(
    name: string,
    label: string,
    public override config: PhoneFieldConfig = {}
  ) {
    super(name, label, config);
  }

  schema(): z.ZodType<string> {
    const base = z.string().regex(
      /^[0-9]{10}$/,
      'Geçerli bir telefon numarası giriniz'
    );
    return this.applyRequired(base);
  }

  override present(value: string | null): string {
    if (!value) return '-';
    return `${this.config.countryCode || '+90'} ${value}`;
  }
}
```

## Karşılaştırma

| Özellik | ngx-formly | Zignal |
|---------|------------|--------|
| Reactivity | RxJS/Observable | Angular Signals |
| Zoneless | ❌ | ✅ |
| Type Safety | Kısıtlı | Zod ile tam |
| Bundle Size | ~50KB | <20KB |
| Learning Curve | Yüksek | Düşük |

## Gereksinimler

- Angular 17.0.0 veya üstü
- Zod 3.22.0 veya üstü
- TypeScript 5.0 veya üstü

## Lisans

MIT License - Ahmet ALTUN

## Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'feat: add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## Destek

- [GitHub Issues](https://github.com/biyonik/zignal/issues)
- [Discussions](https://github.com/biyonik/zignal/discussions)
