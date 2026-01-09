# Zignal Library Analysis

## Overview

Zignal is a **Signal-first, schema-driven form library** for Angular 17+ applications. It provides a type-safe, reactive approach to form management using Angular Signals and Zod validation.

**Author:** Ahmet ALTUN (ahmet.altun60@gmail.com)
**Version:** 0.1.2
**Repository:** https://github.com/biyonik/zignal
**NPM:** https://www.npmjs.com/package/@biyonik/zignal

---

## Architecture

### Core Design Principles

1. **Signal-First Reactivity**: All form state is managed through Angular Signals, providing fine-grained reactivity without zone.js overhead
2. **Schema-Driven Validation**: Uses Zod for type-safe runtime validation with automatic TypeScript type inference
3. **Pluggable UI Adapters**: Supports multiple UI frameworks (Native HTML, Angular Material, PrimeNG) through an adapter system
4. **Bilingual Documentation**: All code is documented in both Turkish and English

### Module Structure

```
src/lib/
├── core/                    # Core functionality
│   ├── form-state.ts        # FormSchema & FormState classes
│   ├── interfaces/          # TypeScript interfaces
│   ├── cross-field-validators.ts
│   ├── form-persistence.ts  # localStorage/sessionStorage
│   ├── i18n.ts              # Multi-language support
│   ├── expression-parser.ts # Dynamic expressions
│   └── field-dependency.ts  # Conditional field logic
├── fields/                  # Field implementations
│   ├── base.field.ts        # Abstract base class
│   ├── string.field.ts
│   ├── number.field.ts
│   ├── boolean.field.ts
│   ├── date.field.ts
│   ├── select.field.ts
│   ├── multiselect.field.ts
│   ├── email.field.ts
│   ├── password.field.ts
│   ├── phone.field.ts
│   ├── file.field.ts
│   ├── group.field.ts       # Nested field groups
│   ├── array.field.ts       # Repeatable fields
│   └── ... (20+ field types)
├── forms/                   # Angular directives
│   ├── zg-form.directive.ts
│   ├── zg-field.directive.ts
│   └── zg-errors.component.ts
├── ui/                      # UI rendering
│   ├── adapters/            # UI framework adapters
│   └── native/              # Native HTML components
└── testing/                 # Test helpers
```

---

## Core Components

### 1. FormSchema

The central class that defines form structure and creates reactive form state.

```typescript
import { FormSchema } from '@biyonik/zignal';
import { StringField, NumberField, EmailField } from '@biyonik/zignal/fields';

// Define form data type
interface UserForm {
  name: string;
  email: string;
  age: number;
}

// Create schema with fields
const schema = new FormSchema<UserForm>([
  new StringField('name', 'Full Name', { required: true, minLength: 2 }),
  new EmailField('email', 'Email Address', { required: true }),
  new NumberField('age', 'Age', { min: 18, max: 120 })
]);

// Create reactive form state
const form = schema.createForm({
  name: '',
  email: '',
  age: 18
});
```

### 2. FormState

Reactive form state management with Signals:

```typescript
interface FormState<T> {
  // Reactive state for each field
  fields: { [K in keyof T]: FieldValue<T[K]> };

  // Computed signals
  values: Signal<T>;           // All form values
  valid: Signal<boolean>;      // Form validity
  errors: Signal<...>;         // Field errors
  dirty: Signal<boolean>;      // Changed from initial
  pristine: Signal<boolean>;   // Never touched
  crossErrors: Signal<...>;    // Cross-field errors
  dirtyFields: Signal<...>;    // List of dirty fields

  // Methods
  setValue(name, value): void;
  patchValues(values): void;
  getValues(): T;
  getDirtyValues(): Partial<T>;
  validateAll(): Promise<boolean>;
  touchAll(): void;
  reset(newInitial?): void;
  resetField(name): void;
  validateFields(names): boolean;
  toJSON(options): Record<string, unknown>;
}
```

### 3. FieldValue

Each field has a FieldValue object with reactive properties:

```typescript
interface FieldValue<T> {
  value: WritableSignal<T>;    // Current value (read/write)
  touched: WritableSignal<boolean>;
  error: Signal<string | null>;  // Only shown if touched
  valid: Signal<boolean>;
  hidden?: Signal<boolean>;      // For conditional visibility
  disabled?: Signal<boolean>;    // For conditional disable
}
```

---

## Field Types

### Available Fields

| Field Type | Class | Description |
|------------|-------|-------------|
| string | `StringField` | Single-line text with min/max length, pattern, email, url validation |
| number | `NumberField` | Numeric with min/max, integer, positive/negative |
| boolean | `BooleanField` | Checkbox/toggle |
| date | `DateField` | Date picker with min/max dates |
| select | `SelectField<T>` | Single-select dropdown with type-safe options |
| multiselect | `MultiselectField<T>` | Multi-select with min/max selections |
| textarea | `TextareaField` | Multi-line text with rows config |
| password | `PasswordField` | Password with strength rules (uppercase, number, special) |
| email | `EmailField` | Email with domain restrictions, disposable blocking |
| url | `UrlField` | URL with protocol validation |
| phone | `PhoneField` | Phone number validation |
| file | `FileField` | File upload with type/size/dimension validation |
| color | `ColorField` | Color picker |
| json | `JsonField` | JSON object/array |
| group | `GroupField` | Nested field group |
| array | `ArrayField` | Repeatable field collection |
| money | `MoneyField` | Currency with formatting |
| percent | `PercentField` | Percentage values |
| rating | `RatingField` | Star rating |
| tags | `TagsField` | Tag input |
| time | `TimeField` | Time picker |
| slug | `SlugField` | URL-friendly slugs |
| masked | `MaskedField` | Input masks |

### Field Configuration

All fields extend `FieldConfig`:

```typescript
interface FieldConfig {
  required?: boolean;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  defaultValue?: unknown;

  // Conditional logic (supports string expressions!)
  requiredWhen?: Expression<boolean>;
  hideExpression?: Expression<boolean>;
  disableExpression?: Expression<boolean>;

  // Validation
  pattern?: RegExp | string;
  customValidator?: string | ((value, formValues) => string | null);
  validationDebounce?: number;

  // Transformations
  transformOnBlur?: Expression<unknown>;
  transformOnChange?: Expression<unknown>;
  trim?: boolean;

  // Hooks
  hooks?: FieldHooks;

  // UI
  props?: FieldProps;
}
```

### Expression System

Expressions can be functions or strings (JSON-serializable!):

```typescript
// Function expression
hideExpression: (values) => values.type !== 'individual'

// String expression (can be stored in JSON!)
hideExpression: "type !== 'individual'"
hideExpression: "!country"
hideExpression: "status === 'active'"
```

---

## Cross-Field Validation

Built-in cross-field validators:

```typescript
import { CrossValidators, FormSchema } from '@biyonik/zignal';

const schema = new FormSchema<RegistrationForm>(fields, {
  crossValidators: [
    // Password confirmation
    CrossValidators.passwordMatch('password', 'confirmPassword'),

    // Email confirmation
    CrossValidators.emailMatch('email', 'confirmEmail'),

    // Date range
    CrossValidators.dateRange('startDate', 'endDate'),

    // Number range
    CrossValidators.numberRange('minPrice', 'maxPrice'),

    // At least one required
    CrossValidators.atLeastOne(['phone', 'email'], 'Provide phone or email'),

    // Mutually exclusive
    CrossValidators.mutuallyExclusive(['option1', 'option2']),

    // Conditional required
    CrossValidators.requiredIf('hasCompany', true, 'companyName'),

    // Sum validation
    CrossValidators.sumEquals(['share1', 'share2', 'share3'], 100),

    // All different values
    CrossValidators.allDifferent(['color1', 'color2', 'color3']),

    // Custom validator
    CrossValidators.custom('ageCheck', ['birthDate', 'licenseDate'], (values) => {
      const age = calculateAge(values.birthDate, values.licenseDate);
      return age < 18 ? 'Must be at least 18' : null;
    })
  ]
});
```

---

## i18n (Internationalization)

Signal-based reactive locale management:

```typescript
import { setLocale, t, addMessages, getI18n } from '@biyonik/zignal';

// Set locale
setLocale('tr');  // Turkish
setLocale('en');  // English

// Get translation
const msg = t('string.min', { min: 3 });
// TR: "En az 3 karakter olmalıdır"
// EN: "Must be at least 3 characters"

// Add custom messages
addMessages('tr', {
  'custom.myValidation': 'Özel hata mesajı',
});

// Add new locale
addMessages('de', {
  required: 'Dieses Feld ist erforderlich',
  'string.min': 'Mindestens {min} Zeichen erforderlich'
});
```

### Built-in Message Keys

- Common: `required`, `invalid`
- String: `string.min`, `string.max`, `string.email`, `string.url`, `string.pattern`
- Number: `number.min`, `number.max`, `number.integer`, `number.positive`, `number.negative`
- Date: `date.min`, `date.max`, `date.invalid`
- Password: `password.min`, `password.uppercase`, `password.lowercase`, `password.number`, `password.special`
- File: `file.required`, `file.maxSize`, `file.type`, `file.maxFiles`
- Turkish validators: `tr.tckn`, `tr.vkn`, `tr.iban`, `tr.phone`, `tr.plate`, `tr.postalCode`
- And many more...

---

## Form Persistence

Auto-save form state to localStorage/sessionStorage:

```typescript
import { createFormPersistence } from '@biyonik/zignal';

// Create persistence instance
const persistence = createFormPersistence<MyForm>('checkout-form', {
  storage: 'local',           // 'local' or 'session'
  debounce: 500,              // Auto-save debounce (ms)
  expiry: 30 * 60 * 1000,     // TTL: 30 minutes
  exclude: ['password', 'cvv'], // Don't persist sensitive data
  include: ['email', 'name'],   // Only persist specific fields
  prefix: 'myapp_'            // Custom key prefix
});

// Manual save
persistence.save(form.values());

// Load saved data
const saved = persistence.load();
if (saved) {
  form.patchValues(saved);
}

// Enable auto-save with Angular Signals
persistence.enableAutoSave(form.values, destroyRef);

// Clear saved data
persistence.clear();

// Check data age
const ageMs = persistence.getAge();
```

---

## UI Adapters

### Adapter System

Zignal supports multiple UI frameworks through adapters:

```typescript
interface IUIAdapter {
  name: UILibrary;  // 'native' | 'material' | 'primeng' | 'bootstrap' | 'custom'
  config: UIAdapterConfig;

  getComponent(fieldType: string): Type<any> | null;
  getFieldClasses(context): string[];
  getWrapperClasses(context): string[];
  getErrorClasses(context): string[];
  getLabelClasses(context): string[];
}
```

### Available Adapters

1. **Native Adapter** (default)
   - Uses vanilla HTML elements
   - No external dependencies
   - Fully customizable via CSS

2. **Material Adapter**
   - Angular Material integration
   - Uses mat-form-field, mat-input, mat-select, etc.

3. **PrimeNG Adapter**
   - PrimeNG component integration

### Adapter Configuration

```typescript
interface UIAdapterConfig {
  library: UILibrary;
  classPrefix?: string;      // CSS prefix (e.g., 'zg')
  theme?: {
    primaryColor?: string;
    errorColor?: string;
    successColor?: string;
    borderRadius?: string;
  };
  labelPosition?: 'top' | 'left' | 'floating' | 'none';
  errorDisplay?: 'below' | 'tooltip' | 'inline' | 'none';
  animations?: boolean;
  customComponents?: Partial<FieldComponentMap>;
}
```

---

## Field Hooks

Lifecycle hooks for field events:

```typescript
interface FieldHooks {
  onChange?: (context: OnChangeContext) => void;
  onTouched?: (context: FieldHookContext) => void;
  onReset?: (context: FieldHookContext) => void;
}

// Usage
const field = new StringField('email', 'Email', {
  hooks: {
    onChange: ({ fieldName, value, previousValue, formValues }) => {
      console.log(`${fieldName} changed from ${previousValue} to ${value}`);
    },
    onTouched: ({ fieldName, value }) => {
      console.log(`${fieldName} was touched`);
    }
  }
});
```

---

## Angular Integration

### Component Usage

```typescript
import { Component, inject } from '@angular/core';
import { FormSchema, StringField, EmailField } from '@biyonik/zignal';

@Component({
  selector: 'app-login',
  template: `
    <form (ngSubmit)="onSubmit()">
      @for (field of schema.getFields(); track field.name) {
        <div class="field-group">
          <label>{{ field.label }}</label>
          <input
            [value]="form.fields[field.name].value()"
            (input)="form.setValue(field.name, $event.target.value)"
            (blur)="form.fields[field.name].touched.set(true)"
          >
          @if (form.fields[field.name].error()) {
            <span class="error">{{ form.fields[field.name].error() }}</span>
          }
        </div>
      }
      <button type="submit" [disabled]="!form.valid()">Submit</button>
    </form>
  `
})
export class LoginComponent {
  schema = new FormSchema([
    new EmailField('email', 'Email', { required: true }),
    new StringField('password', 'Password', { required: true, minLength: 8 })
  ]);

  form = this.schema.createForm({ email: '', password: '' });

  async onSubmit() {
    if (await this.form.validateAll()) {
      const data = this.form.getValues();
      // Submit to API
    }
  }
}
```

### Directives

```typescript
import { ZgFormDirective, ZgFieldDirective, ZgErrorsComponent } from '@biyonik/zignal/forms';

@Component({
  imports: [ZgFormDirective, ZgFieldDirective, ZgErrorsComponent],
  template: `
    <form [zgForm]="form" (zgSubmit)="onSubmit($event)">
      <div zgField="email">
        <input zgInput>
        <zg-errors></zg-errors>
      </div>
      <button type="submit">Submit</button>
    </form>
  `
})
```

---

## Testing

### Test Helpers

```typescript
import { createTestField, createTestForm, fillForm } from '@biyonik/zignal/testing';

describe('Login Form', () => {
  it('should validate email', () => {
    const field = createTestField(new EmailField('email', 'Email', { required: true }));

    field.setValue('invalid');
    expect(field.state.valid()).toBe(false);

    field.setValue('valid@email.com');
    expect(field.state.valid()).toBe(true);
  });

  it('should validate entire form', async () => {
    const form = createTestForm(loginSchema, { email: '', password: '' });

    fillForm(form, {
      email: 'test@example.com',
      password: 'StrongPass123!'
    });

    expect(await form.validateAll()).toBe(true);
  });
});
```

---

## Key Features Summary

1. **Type Safety**: Full TypeScript support with Zod schema inference
2. **Reactive**: Angular Signals for optimal performance without zone.js
3. **Flexible Validation**: Built-in validators, cross-field validation, async validation
4. **i18n Ready**: Built-in Turkish and English messages, extensible
5. **Persistence**: Auto-save to browser storage with TTL
6. **UI Agnostic**: Works with any UI framework through adapters
7. **Expression System**: JSON-serializable expressions for dynamic forms
8. **Extensible**: Easy to create custom fields and validators
9. **Well Documented**: Comprehensive TSDoc in both Turkish and English

---

## Example: Complete KYC Form

```typescript
import {
  FormSchema,
  StringField,
  EmailField,
  NumberField,
  DateField,
  SelectField,
  BooleanField,
  FileField,
  CrossValidators,
  createFormPersistence
} from '@biyonik/zignal';

interface KYCForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: Date;
  nationality: string;
  idNumber: string;
  idDocument: File;
  termsAccepted: boolean;
}

const kycSchema = new FormSchema<KYCForm>([
  new StringField('firstName', 'First Name', {
    required: true,
    minLength: 2,
    maxLength: 50
  }),
  new StringField('lastName', 'Last Name', {
    required: true,
    minLength: 2
  }),
  new EmailField('email', 'Email', {
    required: true,
    blockDisposable: true
  }),
  new StringField('phone', 'Phone', {
    required: true,
    pattern: /^\+?[0-9]{10,15}$/
  }),
  new DateField('birthDate', 'Birth Date', {
    required: true,
    max: new Date() // Must be in the past
  }),
  new SelectField('nationality', 'Nationality', {
    required: true,
    options: [
      { value: 'TR', label: 'Turkish' },
      { value: 'US', label: 'American' },
      // ...
    ],
    searchable: true
  }),
  new StringField('idNumber', 'ID Number', {
    required: true,
    minLength: 11,
    maxLength: 11,
    pattern: /^[0-9]+$/
  }),
  new FileField('idDocument', 'ID Document', {
    required: true,
    accept: ['image/*', 'application/pdf'],
    maxSize: 5 * 1024 * 1024, // 5MB
    maxWidth: 2000,
    maxHeight: 2000
  }),
  new BooleanField('termsAccepted', 'I accept the terms', {
    required: true
  })
], {
  crossValidators: [
    CrossValidators.custom('ageCheck', ['birthDate'], (values) => {
      const age = new Date().getFullYear() - values.birthDate?.getFullYear();
      return age < 18 ? 'Must be at least 18 years old' : null;
    })
  ]
});

// Create form with persistence
const form = kycSchema.createForm();
const persistence = createFormPersistence<KYCForm>('kyc-form', {
  exclude: ['idDocument'],
  expiry: 24 * 60 * 60 * 1000 // 24 hours
});

// Load saved progress
const saved = persistence.load();
if (saved) {
  form.patchValues(saved);
}

// Enable auto-save
persistence.enableAutoSave(form.values, destroyRef);
```

---

## Conclusion

Zignal is a well-architected, feature-rich form library that leverages Angular's Signal system for optimal reactivity. Its schema-driven approach with Zod validation provides excellent type safety, while the pluggable adapter system ensures flexibility across different UI frameworks. The comprehensive i18n support and form persistence features make it production-ready for complex form scenarios.
