import {z} from 'zod';
import {BaseField} from './base.field';
import {FieldConfig, t} from '../core';

/**
 * @fileoverview
 * TR: Dosya yükleme için kullanılan FileField sınıfı.
 * MIME tipi, boyut ve çoklu dosya kontrolü sağlar.
 *
 * EN: FileField class used for file upload.
 * Provides MIME type, size, and multiple file control.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: Dosya bilgisi interface'i.
 * EN: File info interface.
 */
export interface FileInfo {
    name: string;
    size: number;
    type: string;
    lastModified?: number;
    // TR: Sunucuya yüklendikten sonraki URL
    // EN: URL after uploaded to server
    url?: string;
    // TR: Base64 veya blob URL (preview için)
    // EN: Base64 or blob URL (for preview)
    preview?: string;
}

/**
 * TR: FileField için genişletilmiş yapılandırma seçenekleri.
 * EN: Extended configuration options for FileField.
 */
export interface FileFieldConfig extends FieldConfig {
    /**
     * TR: İzin verilen MIME tipleri.
     * EN: Allowed MIME types.
     * @example ['image/jpeg', 'image/png', 'application/pdf']
     */
    accept?: string[];

    /**
     * TR: Maksimum dosya boyutu (byte cinsinden).
     * EN: Maximum file size (in bytes).
     * @example 5 * 1024 * 1024 // 5MB
     */
    maxSize?: number;

    /**
     * TR: Minimum dosya boyutu (byte cinsinden).
     * EN: Minimum file size (in bytes).
     */
    minSize?: number;

    /**
     * TR: Çoklu dosya seçimine izin ver.
     * EN: Allow multiple file selection.
     * @default false
     */
    multiple?: boolean;

    /**
     * TR: Maksimum dosya sayısı (multiple=true ise).
     * EN: Maximum file count (if multiple=true).
     */
    maxFiles?: number;

    /**
     * TR: İzin verilen dosya uzantıları (MIME yerine kullanılabilir).
     * EN: Allowed file extensions (can be used instead of MIME).
     * @example ['.jpg', '.png', '.pdf']
     */
    extensions?: string[];

    /**
     * TR: Resim için maksimum genişlik (px).
     * EN: Maximum width for images (px).
     */
    maxWidth?: number;

    /**
     * TR: Resim için maksimum yükseklik (px).
     * EN: Maximum height for images (px).
     */
    maxHeight?: number;

    /**
     * TR: Resim için minimum genişlik (px).
     * EN: Minimum width for images (px).
     */
    minWidth?: number;

    /**
     * TR: Resim için minimum yükseklik (px).
     * EN: Minimum height for images (px).
     */
    minHeight?: number;
}

/**
 * TR: Yaygın MIME tipleri.
 * EN: Common MIME types.
 */
export const COMMON_MIME_TYPES = {
    // Images
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    // Documents
    documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    // Spreadsheets
    spreadsheets: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
    // Archives
    archives: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
    // Video
    video: ['video/mp4', 'video/webm', 'video/ogg'],
    // Audio
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
};

/**
 * TR: Dosya yükleme için Zignal alan implementasyonu.
 *
 * Desteklenen validasyon kuralları:
 * - `required`: Zorunlu alan kontrolü
 * - `accept`: İzin verilen MIME tipleri
 * - `maxSize`: Maksimum dosya boyutu
 * - `minSize`: Minimum dosya boyutu
 * - `multiple`: Çoklu dosya seçimi
 * - `maxFiles`: Maksimum dosya sayısı
 * - `extensions`: İzin verilen uzantılar
 *
 * EN: Zignal field implementation for file upload.
 *
 * Supported validation rules:
 * - `required`: Required field check
 * - `accept`: Allowed MIME types
 * - `maxSize`: Maximum file size
 * - `minSize`: Minimum file size
 * - `multiple`: Multiple file selection
 * - `maxFiles`: Maximum file count
 * - `extensions`: Allowed extensions
 *
 * @example
 * ```typescript
 * // Tek resim yükleme
 * const avatar = new FileField('avatar', 'Profil Fotoğrafı', {
 *   required: true,
 *   accept: COMMON_MIME_TYPES.images,
 *   maxSize: 5 * 1024 * 1024, // 5MB
 * });
 *
 * // Çoklu dosya yükleme
 * const attachments = new FileField('attachments', 'Ekler', {
 *   multiple: true,
 *   maxFiles: 5,
 *   maxSize: 10 * 1024 * 1024, // 10MB
 * });
 *
 * // PDF dosyası
 * const document = new FileField('document', 'Döküman', {
 *   accept: ['application/pdf'],
 *   extensions: ['.pdf'],
 * });
 * ```
 */
export class FileField extends BaseField<FileInfo | FileInfo[] | null> {
    readonly type = 'file';
    constructor(
        name: string,
        label: string,
        public override readonly config: FileFieldConfig = {}
    ) {
        super(name, label, config);
    }

    /**
     * TR: Dosya validasyonu için Zod şemasını oluşturur.
     * EN: Creates Zod schema for file validation.
     */
    schema(): z.ZodType<FileInfo | FileInfo[] | null> {
        const fileInfoSchema = z.object({
            name: z.string(),
            size: z.number(),
            type: z.string(),
            lastModified: z.number().optional(),
            url: z.string().optional(),
            preview: z.string().optional(),
        }) as z.ZodType<FileInfo>;

        // TR: Tek dosya için validasyon (tip olarak ZodType kullan)
        // EN: Validation for single file (use ZodType for type)
        let singleFileSchema: z.ZodType<FileInfo> = fileInfoSchema;

        // TR: MIME tipi kontrolü
        // EN: MIME type check
        if (this.config.accept?.length) {
            const acceptedTypes = this.config.accept;
            singleFileSchema = singleFileSchema.refine(
                (file) => this.isAcceptedType(file.type, acceptedTypes),
                {message: t('file.acceptedTypes', {types: this.getAcceptDescription()})}
            );
        }

        // TR: Uzantı kontrolü
        // EN: Extension check
        if (this.config.extensions?.length) {
            const extensions = this.config.extensions;
            singleFileSchema = singleFileSchema.refine(
                (file) => extensions.some(ext =>
                    file.name.toLowerCase().endsWith(ext.toLowerCase())
                ),
                {message: t('file.acceptedExtensions', {extensions: this.config.extensions.join(', ')})}
            );
        }

        // TR: Boyut kontrolü
        // EN: Size check
        if (this.config.maxSize !== undefined) {
            const maxSize = this.config.maxSize;
            singleFileSchema = singleFileSchema.refine(
                (file) => file.size <= maxSize,
                {message: t('file.maxSize', {maxSize: this.formatSize(maxSize)})}
            );
        }

        if (this.config.minSize !== undefined) {
            const minSize = this.config.minSize;
            singleFileSchema = singleFileSchema.refine(
                (file) => file.size >= minSize,
                {message: t('file.maxSize', {maxSize: this.formatSize(minSize)})}
            );
        }

        // TR: Çoklu dosya mı?
        // EN: Multiple files?
        if (this.config.multiple) {
            let arraySchema: z.ZodType<FileInfo[]> = z.array(singleFileSchema);

            if (this.config.maxFiles !== undefined) {
                arraySchema = z.array(singleFileSchema).max(
                    this.config.maxFiles,
                    t('file.maxFiles', {maxFiles: this.config.maxFiles}),
                );
            }

            return this.applyRequired(arraySchema) as z.ZodType<FileInfo | FileInfo[] | null>;
        }

        return this.applyRequired(singleFileSchema) as z.ZodType<FileInfo | FileInfo[] | null>;
    }

    /**
     * TR: MIME tipi kontrolü yapar.
     * EN: Checks MIME type.
     */
    private isAcceptedType(fileType: string, acceptedTypes: string[]): boolean {
        return acceptedTypes.some(accepted => {
            // TR: Wildcard desteği (image/*)
            // EN: Wildcard support (image/*)
            if (accepted.endsWith('/*')) {
                const prefix = accepted.slice(0, -1);
                return fileType.startsWith(prefix);
            }
            return fileType === accepted;
        });
    }

    /**
     * TR: Kabul edilen tiplerin açıklamasını döndürür.
     * EN: Returns description of accepted types.
     */
    private getAcceptDescription(): string {
        const accept = this.config.accept ?? [];
        const descriptions: string[] = [];

        if (accept.some(a => a.startsWith('image/'))) {
            descriptions.push(t('file.acceptDescriptionImage'));
        }
        if (accept.includes('application/pdf')) {
            descriptions.push(t('file.acceptDescriptionPdf'));
        }
        if (accept.some(a => a.includes('word') || a.includes('document'))) {
            descriptions.push(t('file.acceptDescriptionWord'));
        }
        if (accept.some(a => a.includes('excel') || a.includes('spreadsheet') || a === 'text/csv')) {
            descriptions.push(t('file.acceptDescriptionExcel'));
        }

        return descriptions.length > 0
            ? descriptions.join(', ')
            : accept.join(', ');
    }

    /**
     * TR: Boyutu okunabilir formata dönüştürür.
     * EN: Converts size to readable format.
     */
    formatSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * TR: Dosya bilgisini gösterir.
     * EN: Displays file info.
     */
    override present(value: FileInfo | FileInfo[] | null): string {
        if (!value) return '-';

        if (Array.isArray(value)) {
            if (value.length === 0) return '-';
            return `${value.length} ${t('file.dictionaryMeaning')}`;
        }

        return value.name;
    }

    /**
     * TR: Dışa aktarım için dosya bilgisi.
     * EN: File info for export.
     */
    override toExport(value: FileInfo | FileInfo[] | null): unknown {
        if (!value) return null;

        if (Array.isArray(value)) {
            return value.map(f => ({
                name: f.name,
                size: f.size,
                type: f.type,
                url: f.url,
            }));
        }

        return {
            name: value.name,
            size: value.size,
            type: value.type,
            url: value.url,
        };
    }

    /**
     * TR: İçe aktarım için dosya bilgisi.
     * EN: File info for import.
     */
    override fromImport(raw: unknown): FileInfo | FileInfo[] | null {
        if (raw == null) return null;

        if (Array.isArray(raw) && this.config.multiple) {
            const files = raw
                .filter(item => this.isValidFileInfo(item))
                .map(item => item as FileInfo);
            return files.length > 0 ? files : null;
        }

        if (this.isValidFileInfo(raw)) {
            return raw as FileInfo;
        }

        return null;
    }

    /**
     * TR: Geçerli FileInfo nesnesi mi kontrol eder.
     * EN: Checks if valid FileInfo object.
     */
    private isValidFileInfo(obj: unknown): obj is FileInfo {
        if (typeof obj !== 'object' || obj === null) return false;
        const file = obj as Record<string, unknown>;
        return (
            typeof file.name === 'string' &&
            typeof file.size === 'number' &&
            typeof file.type === 'string'
        );
    }

    /**
     * TR: File nesnesinden FileInfo oluşturur.
     * EN: Creates FileInfo from File object.
     */
    createFileInfo(file: File, preview?: string): FileInfo {
        return {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            preview,
        };
    }

    /**
     * TR: HTML input için accept attribute değeri.
     * EN: Accept attribute value for HTML input.
     */
    getAcceptAttribute(): string {
        const parts: string[] = [];

        if (this.config.accept?.length) {
            parts.push(...this.config.accept);
        }

        if (this.config.extensions?.length) {
            parts.push(...this.config.extensions);
        }

        return parts.join(',');
    }

    /**
     * TR: Dosyanın resim olup olmadığını kontrol eder.
     * EN: Checks if file is an image.
     */
    isImage(file: FileInfo): boolean {
        return file.type.startsWith('image/');
    }

    /**
     * TR: Dosya için ikon adı döndürür.
     * EN: Returns icon name for file.
     */
    getFileIcon(file: FileInfo): string {
        const type = file.type;

        if (type.startsWith('image/')) return 'image';
        if (type.startsWith('video/')) return 'video';
        if (type.startsWith('audio/')) return 'audio';
        if (type === 'application/pdf') return 'pdf';
        if (type.includes('word') || type.includes('document')) return 'document';
        if (type.includes('excel') || type.includes('spreadsheet')) return 'spreadsheet';
        if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return 'archive';

        return 'file';
    }
}