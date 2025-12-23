import { Component, computed, signal, ElementRef, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BaseMatField } from '../base-mat-field';
import {FileField, FileFieldConfig, FileInfo} from '@biyonik/zignal';

@Component({
    selector: 'zg-mat-file',
    standalone: true,
    imports: [MatButtonModule, MatIconModule, MatProgressBarModule],
    template: `
    <div class="zg-mat-file-container">
      <label class="zg-mat-file-label">{{ field.label }}</label>
      
      <input
        #fileInput
        type="file"
        [accept]="fileAccept()"
        [multiple]="fileConfig()?.multiple ?? false"
        [disabled]="context().disabled ?? false"
        (change)="onFileChange($event)"
        style="display: none"
      />
      
      <div 
        class="zg-mat-file-dropzone"
        [class.zg-mat-file-dropzone--dragover]="isDragover()"
        [class.zg-mat-file-dropzone--disabled]="context().disabled"
        (click)="openFilePicker()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)">
        
        <mat-icon class="zg-mat-file-icon">cloud_upload</mat-icon>
        <span class="zg-mat-file-text">
          Dosya seçmek için tıklayın veya sürükleyip bırakın
        </span>
        <span class="zg-mat-file-hint">
          {{ fileHint() }}
        </span>
      </div>
      
      @if (files().length > 0) {
        <div class="zg-mat-file-list">
          @for (file of files(); track file.name) {
            <div class="zg-mat-file-item">
              <mat-icon>{{ getFileIcon(file) }}</mat-icon>
              <span class="zg-mat-file-name">{{ file.name }}</span>
              <span class="zg-mat-file-size">{{ formatSize(file.size) }}</span>
              <button mat-icon-button 
                      (click)="removeFile(file)"
                      [disabled]="context().disabled">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }
        </div>
      }

      @if (error()) {
        <div class="zg-mat-error" style="font-size: 12px; color: #f44336; margin-top: 8px;">
          {{ error() }}
        </div>
      }
    </div>
  `,
    styles: [`
    .zg-mat-file-container {
      margin-bottom: 1rem;
    }
    .zg-mat-file-label {
      display: block;
      font-size: 12px;
      color: rgba(0,0,0,.6);
      margin-bottom: 8px;
    }
    .zg-mat-file-dropzone {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 32px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .zg-mat-file-dropzone:hover {
      border-color: #3f51b5;
      background: #f5f5f5;
    }
    .zg-mat-file-dropzone--dragover {
      border-color: #3f51b5;
      background: #e8eaf6;
    }
    .zg-mat-file-dropzone--disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .zg-mat-file-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #9e9e9e;
    }
    .zg-mat-file-text {
      display: block;
      margin-top: 8px;
      color: #666;
    }
    .zg-mat-file-hint {
      display: block;
      margin-top: 4px;
      font-size: 12px;
      color: #999;
    }
    .zg-mat-file-list {
      margin-top: 16px;
    }
    .zg-mat-file-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: #fafafa;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .zg-mat-file-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .zg-mat-file-size {
      color: #666;
      font-size: 12px;
    }
  `]
})
export class ZgMatFileComponent extends BaseMatField<FileInfo | FileInfo[] | null> {
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    readonly isDragover = signal(false);

    readonly fileConfig = computed((): FileFieldConfig | null => {
        return this.field.config as FileFieldConfig;
    });

    readonly fileAccept = computed((): string => {
        if (this.field instanceof FileField) {
            return this.field.getAcceptAttribute();
        }
        return '';
    });

    readonly fileHint = computed((): string => {
        const config = this.fileConfig();
        const parts: string[] = [];

        if (config?.maxSize) {
            parts.push(`Max: ${this.formatSize(config.maxSize)}`);
        }
        if (config?.accept?.length) {
            parts.push(config.accept.join(', '));
        }

        return parts.join(' • ');
    });

    readonly files = computed((): FileInfo[] => {
        const val = this.state.value();
        if (!val) return [];
        return Array.isArray(val) ? val : [val];
    });

    openFilePicker(): void {
        if (!this.context().disabled) {
            this.fileInput.nativeElement.click();
        }
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragover.set(true);
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragover.set(false);
    }

    async onDrop(event: DragEvent): Promise<void> {
        event.preventDefault();
        event.stopPropagation();
        this.isDragover.set(false);

        const files = event.dataTransfer?.files;
        if (files) {
            await this.processFiles(files);
        }
    }

    async onFileChange(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            await this.processFiles(input.files);
            input.value = ''; // Reset
        }
    }

    private async processFiles(fileList: FileList): Promise<void> {
        const config = this.fileConfig();
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
                preview
            });
        }

        if (config?.multiple) {
            const current = this.files();
            this.onChange([...current, ...fileInfos]);
        } else {
            this.onChange(fileInfos[0] ?? null);
        }
    }

    private createPreview(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    removeFile(file: FileInfo): void {
        const config = this.fileConfig();
        if (config?.multiple) {
            const updated = this.files().filter(f => f.name !== file.name);
            this.onChange(updated.length > 0 ? updated : null);
        } else {
            this.onChange(null);
        }
    }

    getFileIcon(file: FileInfo): string {
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('video/')) return 'videocam';
        if (file.type.startsWith('audio/')) return 'audiotrack';
        if (file.type.includes('pdf')) return 'picture_as_pdf';
        if (file.type.includes('word') || file.type.includes('document')) return 'description';
        if (file.type.includes('excel') || file.type.includes('spreadsheet')) return 'grid_on';
        return 'insert_drive_file';
    }

    formatSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}
