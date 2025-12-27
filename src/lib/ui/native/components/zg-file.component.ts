import {Component, forwardRef, ElementRef, ViewChild, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import { BaseNativeComponent } from './base-native.component';
import { FileField, FileInfo } from '../../../fields/file.field';

@Component({
    selector: 'zg-file',
    standalone: true,
    imports: [CommonModule, NgOptimizedImage],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ZgFileComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => ZgFileComponent),
            multi: true,
        },
    ],
    template: `
        <div class="zg-field zg-file-field" [class]="wrapperClass">
            <label *ngIf="field().label" class="zg-label" [class]="labelCssClass">
                {{ field().label }}
                <span *ngIf="field().config.required" class="zg-required">*</span>
            </label>

            <div
                    class="zg-file-dropzone"
                    [class.zg-invalid]="showError"
                    [class.zg-dragover]="isDragover"
                    (dragover)="onDragOver($event)"
                    (dragleave)="onDragLeave($event)"
                    (drop)="onDrop($event)"
                    (click)="fileInput.click()"
            >
                <input
                        #fileInput
                        type="file"
                        [id]="field().name"
                        [accept]="acceptTypes"
                        [multiple]="field().config.multiple ?? false"
                        [disabled]="disabledStatus"
                        [attr.tabindex]="tabIndex"
                        [attr.autofocus]="shouldAutofocus ? true : null"
                        class="zg-file-input"
                        (change)="onFileChange($event)"
                />
                <div class="zg-file-placeholder">
                    <span class="zg-file-icon">📁</span>
                    <span>{{ placeholderText }}</span>
                </div>
            </div>

            <div *ngIf="files.length > 0" class="zg-file-list">
                <div *ngFor="let file of files; let i = index" class="zg-file-item">
                    <img *ngIf="isImage(file)" [ngSrc]="file.preview!" class="zg-file-thumb" [alt]="file.name" fill/>
                    <span *ngIf="!isImage(file)" class="zg-file-icon-small">{{ getIcon(file) }}</span>
                    <span class="zg-file-name">{{ file.name }}</span>
                    <span class="zg-file-size">{{ formatSize(file.size) }}</span>
                    <button
                            type="button"
                            class="zg-file-remove"
                            [disabled]="disabledStatus"
                            (click)="removeFile(i, $event)"
                    >×
                    </button>
                </div>
            </div>

            <small *ngIf="field().config.hint && !showError" class="zg-hint">
                {{ field().config.hint }}
            </small>

            <small *ngIf="showError" class="zg-error">
                {{ error }}
            </small>
        </div>
    `,
    styles: [`
        .zg-field {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-bottom: 16px;
        }
        .zg-label { font-weight: 500; font-size: 14px; }
        .zg-required { color: #ef4444; }
        .zg-file-dropzone {
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            padding: 24px;
            text-align: center;
            cursor: pointer;
            transition: border-color 0.2s, background-color 0.2s;
        }
        .zg-file-dropzone:hover { border-color: #3b82f6; background: #f0f9ff; }
        .zg-file-dropzone.zg-dragover { border-color: #3b82f6; background: #dbeafe; }
        .zg-file-dropzone.zg-invalid { border-color: #ef4444; }
        .zg-file-input { display: none; }
        .zg-file-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            color: #6b7280;
        }
        .zg-file-icon { font-size: 32px; }
        .zg-file-list { margin-top: 8px; }
        .zg-file-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            background: #f9fafb;
            border-radius: 6px;
            margin-bottom: 4px;
        }
        .zg-file-thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; }
        .zg-file-icon-small { font-size: 24px; width: 40px; text-align: center; }
        .zg-file-name { flex: 1; font-size: 14px; overflow: hidden; text-overflow: ellipsis; }
        .zg-file-size { color: #9ca3af; font-size: 12px; }
        .zg-file-remove {
            background: none;
            border: none;
            font-size: 18px;
            color: #ef4444;
            cursor: pointer;
        }
        .zg-file-remove:disabled { opacity: 0.5; cursor: not-allowed; }
        .zg-hint { color: #6b7280; font-size: 12px; }
        .zg-error { color: #ef4444; font-size: 12px; }
    `],
})
export class ZgFileComponent extends BaseNativeComponent<FileField, FileInfo | FileInfo[] | null> {
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
    isDragover = false;

    get files(): FileInfo[] {
        if (!this.value) return [];
        return Array.isArray(this.value) ? this.value : [this.value];
    }

    get acceptTypes(): string {
        return this.field().config.accept?.join(',') ?? '*/*';
    }

    get placeholderText(): string {
        return this.field().config.multiple
            ? 'Dosyaları seçin veya sürükleyin'
            : 'Dosya seçin veya sürükleyin';
    }

    isImage(file: FileInfo): boolean {
        return file.type.startsWith('image/');
    }

    getIcon(file: FileInfo): string {
        if (file.type.includes('pdf')) return '📄';
        if (file.type.includes('word')) return '📝';
        if (file.type.includes('excel') || file.type.includes('spreadsheet')) return '📊';
        if (file.type.includes('video')) return '🎬';
        if (file.type.includes('audio')) return '🎵';
        return '📎';
    }

    formatSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.isDragover = true;
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        this.isDragover = false;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.isDragover = false;
        if (event.dataTransfer?.files) {
            this.processFiles(event.dataTransfer.files);
        }
    }

    onFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            this.processFiles(input.files);
        }
    }

    async processFiles(fileList: FileList): Promise<void> {
        const fileInfos: FileInfo[] = [];

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            const preview = file.type.startsWith('image/')
                ? await this.createPreview(file)
                : undefined;

            fileInfos.push({
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified,
                preview,
            });
        }

        if (this.field().config.multiple) {
            const current = this.files;
            this.updateValue([...current, ...fileInfos]);
        } else {
            this.updateValue(fileInfos[0] ?? null);
        }
    }

    private createPreview(file: File): Promise<string> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
        });
    }

    removeFile(index: number, event: Event): void {
        event.stopPropagation();
        if (this.field().config.multiple) {
            const newFiles = this.files.filter((_, i) => i !== index);
            this.updateValue(newFiles.length > 0 ? newFiles : null);
        } else {
            this.updateValue(null);
        }
    }
}
