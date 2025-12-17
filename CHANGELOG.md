# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-12-17

### Added

#### Core
- `FormSchema` - Signal-based reactive form state management
- `FormState` - Reactive form state with Angular Signals
- `SchemaFactory` - Dynamic form generation from JSON configuration
- `DependencyResolver` - Inter-field dependencies without RxJS
- `FieldRegistry` - Custom field type registration system

#### Fields
- `StringField` - Text input with minLength, maxLength, pattern, email, url validation
- `NumberField` - Numeric input with min, max, integer, positive, negative constraints
- `BooleanField` - Checkbox/switch with required=true means "must be checked"
- `DateField` - Date picker with min, max, minToday, maxToday support
- `SelectField<T>` - Single selection dropdown
- `MultiselectField<T>` - Multi-selection with minSelected, maxSelected
- `TextareaField` - Multi-line text input
- `PasswordField` - Password with strength meter and complexity rules
- `EmailField` - Email-specific validation
- `PhoneField` - Turkish phone number support
- `UrlField` - URL validation
- `ColorField` - Color picker with HEX, RGB, HSL support
- `FileField` - File upload with accept, maxSize, multiple
- `JsonField` - JSON data validation
- `ArrayField` - Repeatable field groups
- `GroupField` - Nested object structure

#### Validators (Turkey-Specific)
- `tcknSchema` - Turkish ID number (TCKN) with Mod10 algorithm
- `vknSchema` - Tax ID (VKN) validation
- `turkishIbanSchema` - Turkish IBAN with Mod97 checksum
- `turkishPhoneSchema` - Mobile phone validation (5XX format)
- `turkishPlateSchema` - Vehicle plate validation
- `turkishPostalCodeSchema` - Postal code validation

#### Forms & UI
- `ZgFormDirective` - Form directive for template binding
- `ZgFieldDirective` - Field directive for input binding
- `ZgErrorsComponent` - Error message display component
- `ZgAutoFieldComponent` - Auto-render based on field type

### Fixed
- Regex escape bug in `PasswordField` special character validation (dash character was creating unintended range)
- Date overflow handling in `DateField.fromImport()` for Turkish date format (32.01.2024 etc.)

### Security
- All validators use algorithmic verification (no simple regex patterns)
- Password field supports complexity requirements and strength calculation

---

## [Unreleased]

### Added
- `FormPersistence` - localStorage/sessionStorage form state persistence
    - Auto-save with debounce support
    - Field filtering (include/exclude for sensitive data)
    - TTL/expiry support
    - Namespace prefix support
    - `createFormPersistence()` factory function
    - `clearAllZignalPersistence()` utility

### Planned
- Angular Material UI adapter
- PrimeNG UI adapter
- Cross-field validation improvements
- Async validation support
- File upload progress tracking