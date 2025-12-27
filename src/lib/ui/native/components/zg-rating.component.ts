import {ChangeDetectionStrategy, Component, forwardRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import { BaseNativeComponent } from './base-native.component';
import { RatingField } from '../../../fields/rating.field';

@Component({
    selector: 'zg-rating',
    standalone: true,
    imports: [CommonModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ZgRatingComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => ZgRatingComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="zg-field zg-rating-field" [class]="wrapperClass">
            <label *ngIf="field().label" class="zg-label" [class]="labelCssClass">
                {{ field().label }}
                <span *ngIf="field().config.required" class="zg-required">*</span>
            </label>

            <div
                    class="zg-stars"
                    [class.zg-readonly]="readonly() || field().config.readOnly"
                    [style.--star-size]="starSize + 'px'"
                    [style.--active-color]="activeColor"
                    [style.--inactive-color]="inactiveColor"
            >
                <button
                        *ngFor="let _star of stars; let i = index"
                        type="button"
                        class="zg-star"
                        [class.zg-active]="(value ?? 0) > i"
                        [class.zg-half]="allowHalf && (value ?? 0) - i === 0.5"
                        [disabled]="disabledStatus || readonly() || field().config.readOnly"
                        [attr.tabindex]="tabIndex"
                        (click)="onStarClick(i + 1)"
                        (mouseenter)="onStarHover(i + 1)"
                        (mouseleave)="onStarLeave()"
                        [attr.aria-label]="(i + 1) + ' yıldız'"
                >
                    <span class="zg-star-icon">★</span>
                </button>

                <span class="zg-rating-value" *ngIf="value != null">
                {{ value }}/{{ maxStars }}
            </span>
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
        .zg-stars {
            display: flex;
            align-items: center;
            gap: 2px;
        }
        .zg-star {
            background: none;
            border: none;
            cursor: pointer;
            font-size: var(--star-size, 24px);
            color: var(--inactive-color, #d1d5db);
            transition: color 0.15s, transform 0.15s;
            padding: 0;
            line-height: 1;
        }
        .zg-star:hover:not(:disabled) {
            transform: scale(1.1);
        }
        .zg-star.zg-active {
            color: var(--active-color, #fbbf24);
        }
        .zg-star:disabled {
            cursor: default;
        }
        .zg-readonly .zg-star {
            cursor: default;
        }
        .zg-rating-value {
            margin-left: 8px;
            font-size: 14px;
            color: #6b7280;
        }
        .zg-hint { color: #6b7280; font-size: 12px; }
        .zg-error { color: #ef4444; font-size: 12px; }
    `],
})
export class ZgRatingComponent extends BaseNativeComponent<RatingField, number> {
    hoverValue: number | null = null;

    get maxStars(): number {
        return this.field().getMaxStars();
    }

    get stars(): number[] {
        return Array.from({ length: this.maxStars }, (_, i) => i);
    }

    get allowHalf(): boolean {
        return this.field().config.allowHalf ?? false;
    }

    get starSize(): number {
        return this.field().config.size ?? 24;
    }

    get activeColor(): string {
        return this.field().config.activeColor ?? '#fbbf24';
    }

    get inactiveColor(): string {
        return this.field().config.inactiveColor ?? '#d1d5db';
    }

    onStarClick(rating: number): void {
        if (this.disabledStatus || this.readonly() || this.field().config.readOnly) return;
        this.updateValue(rating);
        this.handleBlur();
    }

    onStarHover(rating: number): void {
        if (this.disabledStatus || this.readonly() || this.field().config.readOnly) return;
        this.hoverValue = rating;
    }

    onStarLeave(): void {
        this.hoverValue = null;
    }
}
