# Contributing to Zignal / Zignal'e Katkıda Bulunma

👋 **Welcome! / Hoş Geldiniz!**

Thank you for your interest in contributing to Zignal! Whether you're fixing a bug, improving documentation, or adding a new feature, we appreciate your help.

Zignal'e katkıda bulunmak istediğiniz için teşekkürler! İster bir hata düzeltin, ister dokümantasyonu iyileştirin, her türlü katkınız bizim için değerlidir.

---

## 🇬🇧 English

### 1. Development Setup

1.  **Fork & Clone:**
    ```bash
    git clone [https://github.com/biyonik/zignal.git](https://github.com/biyonik/zignal.git)
    cd zignal
    npm install
    ```

2.  **Run Tests:**
    Before making changes, ensure existing tests pass. We use **Jest**.
    ```bash
    npm test
    ```

### 2. Code Structure & Standards

* **Core Logic:** Found in `src/lib/core`. This includes `DependencyResolver` and `SchemaFactory`.
* **Fields:** Extend `BaseField` in `src/lib/fields` when adding new UI elements.
* **Validators:** Turkey-specific validators (TCKN, VKN, etc.) are in `src/lib/validators/tr-validators.ts`. Ensure you export the Zod schema for any new validator.
* **Commits:** Please follow [Conventional Commits](https://www.conventionalcommits.org/).
    * ✅ `feat: add password strength meter`
    * ❌ `fixed bug`

### 3. Pull Request Process

1.  Create a branch based on your work: `feat/new-feature` or `fix/bug-fix`.
2.  Provide a clear description of changes.
3.  **Important:** If you add a new feature, you must add a corresponding test file (`.spec.ts`).

---

## 🇹🇷 Türkçe

### 1. Geliştirme Ortamı

1.  **Forklayın ve Klonlayın:**
    ```bash
    git clone [https://github.com/biyonik/zignal.git](https://github.com/biyonik/zignal.git)
    cd zignal
    npm install
    ```

2.  **Testleri Çalıştırın:**
    Değişiklik yapmadan önce testlerin geçtiğinden emin olun. Test runner olarak **Jest** kullanıyoruz.
    ```bash
    npm test
    ```

### 2. Kod Yapısı ve Standartlar

* **Çekirdek Mantık:** `src/lib/core` altındadır. `DependencyResolver` ve `SchemaFactory` buradadır.
* **Alanlar (Fields):** Yeni bir form elemanı eklerken `src/lib/fields` altındaki `BaseField` sınıfını extend etmelisiniz.
* **Validasyonlar:** `tr-validators.ts` dosyasında TCKN, IBAN gibi yerel kontroller bulunur. Yeni bir kural eklerken Zod şemasını da dışarı açmayı unutmayın.
* **Commit Mesajları:** [Conventional Commits](https://www.conventionalcommits.org/) standardını takip edin.
    * ✅ `fix(validators): correct iban mod97 algorithm`
    * ❌ `yeni özellik ekledim`

### 3. Pull Request Süreci

1.  İşinize uygun bir dal (branch) oluşturun: `feat/yeni-ozellik` veya `fix/hata-duzeltme`.
2.  Değişikliklerinizi açıklayan net bir tanım yazın.
3.  **Önemli:** Yeni bir özellik eklediyseniz, mutlaka testini (`.spec.ts`) de eklemelisiniz.