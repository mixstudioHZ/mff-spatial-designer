/**
 * Presentation-level branding configuration (plan §3.7).
 *
 * Branding is a display concern only: it must never leak into domain logic,
 * persisted schemas, or storage namespaces. Changing the product name later
 * means changing this file — nothing else.
 */

export interface BrandingConfig {
  productName: string;
  shortName: string;
  logoAsset?: string;
  website?: string;
}

export const BRANDING: BrandingConfig = {
  productName: 'MFF Spatial Designer',
  shortName: 'MFF SD',
  website: 'https://github.com/koosoli/OpenShotDesigner',
};
