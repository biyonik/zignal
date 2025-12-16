import { z } from 'zod';
import { BaseField } from './base-field';
import { FieldConfig } from '../core';

/**
 * @fileoverview
 * TR: Renk seçimi için kullanılan ColorField sınıfı.
 * HEX, RGB ve HSL formatlarını destekler.
 *
 * EN: ColorField class used for color selection.
 * Supports HEX, RGB, and HSL formats.
 *
 * @author Ahmet ALTUN <ahmet.altun60@gmail.com>
 * @see https://github.com/biyonik/zignal
 */

/**
 * TR: Desteklenen renk formatları.
 * EN: Supported color formats.
 */
export type ColorFormat = 'hex' | 'rgb' | 'hsl';

/**
 * TR: ColorField için genişletilmiş yapılandırma seçenekleri.
 * EN: Extended configuration options for ColorField.
 */
export interface ColorFieldConfig extends FieldConfig {
  /**
   * TR: Renk formatı.
   * EN: Color format.
   * @default 'hex'
   */
  format?: ColorFormat;

  /**
   * TR: Alfa (transparency) desteği.
   * EN: Alpha (transparency) support.
   * @default false
   */
  alpha?: boolean;

  /**
   * TR: Önceden tanımlı renk seçenekleri.
   * EN: Predefined color presets.
   */
  presets?: string[];

  /**
   * TR: Özel renk seçimine izin ver.
   * EN: Allow custom color selection.
   * @default true
   */
  allowCustom?: boolean;

  /**
   * TR: Swatches gösterilsin mi?
   * EN: Should swatches be shown?
   * @default true
   */
  showSwatches?: boolean;
}

/**
 * TR: Renk regex pattern'leri.
 * EN: Color regex patterns.
 */
const COLOR_PATTERNS = {
  hex: /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/,
  hexAlpha: /^#([0-9A-Fa-f]{4}|[0-9A-Fa-f]{8})$/,
  rgb: /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/,
  rgba: /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|1|0?\.\d+)\s*\)$/,
  hsl: /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/,
  hsla: /^hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(0|1|0?\.\d+)\s*\)$/,
};

/**
 * TR: Renk seçimi için Zignal alan implementasyonu.
 *
 * Desteklenen formatlar:
 * - HEX: #RGB, #RRGGBB, #RGBA, #RRGGBBAA
 * - RGB: rgb(r, g, b), rgba(r, g, b, a)
 * - HSL: hsl(h, s%, l%), hsla(h, s%, l%, a)
 *
 * EN: Zignal field implementation for color selection.
 *
 * Supported formats:
 * - HEX: #RGB, #RRGGBB, #RGBA, #RRGGBBAA
 * - RGB: rgb(r, g, b), rgba(r, g, b, a)
 * - HSL: hsl(h, s%, l%), hsla(h, s%, l%, a)
 *
 * @example
 * ```typescript
 * // HEX renk seçimi
 * const brandColor = new ColorField('brandColor', 'Marka Rengi', {
 *   required: true,
 *   format: 'hex',
 *   presets: ['#FF0000', '#00FF00', '#0000FF']
 * });
 *
 * // Alfa destekli RGB
 * const bgColor = new ColorField('bgColor', 'Arkaplan Rengi', {
 *   format: 'rgb',
 *   alpha: true
 * });
 * ```
 */
export class ColorField extends BaseField<string> {
  constructor(
    name: string,
    label: string,
    public override readonly config: ColorFieldConfig = {}
  ) {
    super(name, label, config);
  }

  /**
   * TR: Kullanılan formatı döndürür.
   * EN: Returns the format being used.
   */
  get format(): ColorFormat {
    return this.config.format ?? 'hex';
  }

  /**
   * TR: Renk validasyonu için Zod şemasını oluşturur.
   * EN: Creates Zod schema for color validation.
   */
  schema(): z.ZodType<string> {
    const patterns = this.getValidPatterns();
    const formatName = this.getFormatName();

    const base = z.string().refine(
      (value) => patterns.some(pattern => pattern.test(value)),
      { message: `Geçerli bir ${formatName} renk değeri giriniz` }
    );

    // TR: Preset kontrolü (allowCustom false ise)
    // EN: Preset check (if allowCustom is false)
    if (this.config.allowCustom === false && this.config.presets?.length) {
      return this.applyRequired(
        base.refine(
          (value) => this.config.presets!.includes(value.toLowerCase()) ||
                     this.config.presets!.includes(value.toUpperCase()),
          { message: 'Lütfen önceden tanımlı renklerden birini seçin' }
        )
      );
    }

    return this.applyRequired(base);
  }

  /**
   * TR: Geçerli pattern'leri döndürür.
   * EN: Returns valid patterns.
   */
  private getValidPatterns(): RegExp[] {
    const alpha = this.config.alpha;

    switch (this.format) {
      case 'hex':
        return alpha
          ? [COLOR_PATTERNS.hex, COLOR_PATTERNS.hexAlpha]
          : [COLOR_PATTERNS.hex];
      case 'rgb':
        return alpha
          ? [COLOR_PATTERNS.rgb, COLOR_PATTERNS.rgba]
          : [COLOR_PATTERNS.rgb];
      case 'hsl':
        return alpha
          ? [COLOR_PATTERNS.hsl, COLOR_PATTERNS.hsla]
          : [COLOR_PATTERNS.hsl];
      default:
        return [COLOR_PATTERNS.hex];
    }
  }

  /**
   * TR: Format adını döndürür.
   * EN: Returns format name.
   */
  private getFormatName(): string {
    const names: Record<ColorFormat, string> = {
      hex: 'HEX',
      rgb: 'RGB',
      hsl: 'HSL',
    };
    return names[this.format];
  }

  /**
   * TR: Rengi belirtilen formata dönüştürür.
   * EN: Converts color to specified format.
   */
  convert(value: string, toFormat: ColorFormat): string | null {
    const rgb = this.toRgb(value);
    if (!rgb) return null;

    switch (toFormat) {
      case 'hex':
        return this.rgbToHex(rgb.r, rgb.g, rgb.b, rgb.a);
      case 'rgb':
        return rgb.a !== undefined
          ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a})`
          : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      case 'hsl':
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        return rgb.a !== undefined
          ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${rgb.a})`
          : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
      default:
        return null;
    }
  }

  /**
   * TR: Herhangi bir renk formatını RGB'ye dönüştürür.
   * EN: Converts any color format to RGB.
   */
  private toRgb(value: string): { r: number; g: number; b: number; a?: number } | null {
    // HEX
    let match = value.match(COLOR_PATTERNS.hex);
    if (match) {
      const hex = match[1];
      if (hex.length === 3) {
        return {
          r: parseInt(hex[0] + hex[0], 16),
          g: parseInt(hex[1] + hex[1], 16),
          b: parseInt(hex[2] + hex[2], 16),
        };
      }
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }

    match = value.match(COLOR_PATTERNS.hexAlpha);
    if (match) {
      const hex = match[1];
      if (hex.length === 4) {
        return {
          r: parseInt(hex[0] + hex[0], 16),
          g: parseInt(hex[1] + hex[1], 16),
          b: parseInt(hex[2] + hex[2], 16),
          a: parseInt(hex[3] + hex[3], 16) / 255,
        };
      }
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16) / 255,
      };
    }

    // RGB
    match = value.match(COLOR_PATTERNS.rgb);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
      };
    }

    match = value.match(COLOR_PATTERNS.rgba);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        a: parseFloat(match[4]),
      };
    }

    // HSL
    match = value.match(COLOR_PATTERNS.hsl);
    if (match) {
      return this.hslToRgb(
        parseInt(match[1]),
        parseInt(match[2]),
        parseInt(match[3])
      );
    }

    match = value.match(COLOR_PATTERNS.hsla);
    if (match) {
      const rgb = this.hslToRgb(
        parseInt(match[1]),
        parseInt(match[2]),
        parseInt(match[3])
      );
      return { ...rgb, a: parseFloat(match[4]) };
    }

    return null;
  }

  /**
   * TR: RGB'yi HEX'e dönüştürür.
   * EN: Converts RGB to HEX.
   */
  private rgbToHex(r: number, g: number, b: number, a?: number): string {
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    if (a !== undefined) {
      return hex + toHex(Math.round(a * 255));
    }
    return hex;
  }

  /**
   * TR: RGB'yi HSL'e dönüştürür.
   * EN: Converts RGB to HSL.
   */
  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  /**
   * TR: HSL'i RGB'ye dönüştürür.
   * EN: Converts HSL to RGB.
   */
  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  /**
   * TR: Rengi görüntüler.
   * EN: Displays color.
   */
  override present(value: string | null): string {
    if (!value) return '-';
    return value.toUpperCase();
  }

  /**
   * TR: Rengi HEX formatında export eder.
   * EN: Exports color in HEX format.
   */
  override toExport(value: string | null): string | null {
    if (!value) return null;
    // TR: Her zaman HEX olarak export et
    // EN: Always export as HEX
    return this.convert(value, 'hex')?.toUpperCase() ?? value;
  }

  /**
   * TR: Rengi import eder ve normalize eder.
   * EN: Imports and normalizes color.
   */
  override fromImport(raw: unknown): string | null {
    if (raw == null) return null;
    if (typeof raw !== 'string') return null;

    const value = raw.trim();

    // TR: Geçerli bir renk mi kontrol et
    // EN: Check if it's a valid color
    const allPatterns = [
      COLOR_PATTERNS.hex,
      COLOR_PATTERNS.hexAlpha,
      COLOR_PATTERNS.rgb,
      COLOR_PATTERNS.rgba,
      COLOR_PATTERNS.hsl,
      COLOR_PATTERNS.hsla,
    ];

    if (allPatterns.some(p => p.test(value))) {
      // TR: Hedef formata dönüştür
      // EN: Convert to target format
      return this.convert(value, this.format) ?? value;
    }

    return null;
  }

  /**
   * TR: Preset renkleri döndürür.
   * EN: Returns preset colors.
   */
  getPresets(): string[] {
    return this.config.presets ?? [];
  }
}
