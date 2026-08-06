---
name: Inverted Neon
colors:
  surface: '#fbf9f8'
  surface-dim: '#dbdad9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e4e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#3b4b3b'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
  outline: '#6b7b69'
  outline-variant: '#bacbb7'
  surface-tint: '#006e2a'
  primary: '#006e2a'
  on-primary: '#ffffff'
  primary-container: '#0fee65'
  on-primary-container: '#006626'
  inverse-primary: '#00e560'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e5e2e1'
  on-secondary-container: '#656464'
  tertiary: '#5d5f5f'
  on-tertiary: '#ffffff'
  tertiary-container: '#cecfcf'
  on-tertiary-container: '#565859'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6aff87'
  primary-fixed-dim: '#00e560'
  on-primary-fixed: '#002107'
  on-primary-fixed-variant: '#00531e'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e2'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  numeric-display:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  page-margin: 24px
  container-gap: 20px
  element-gap: 12px
  stack-padding: 24px
  card-padding: 20px
---

## Brand & Style
The design system establishes a high-contrast, "Inverted Dark" aesthetic where the canvas is a stark, clean white, but core functional containers utilize a deep, obsidian palette. This creates a hyper-modern, sophisticated look that balances the professional clarity of Light Mode with the focused intensity of Dark Mode components.

The personality is technical and energetic, utilizing the #0fee65 neon green as a high-frequency accent against dark surfaces. It targets a tech-literate audience that values precision and visual flair. The aesthetic blends **Modern Corporate** reliability with **Neon-Minimalism**, using generous whitespace on the page level while maintaining dense, feature-rich information architecture within dark containers.

## Colors
The palette is built on a "Flash-and-Void" philosophy. 

- **Canvas:** The primary background is pure white (#FFFFFF), providing a clean, accessible foundation.
- **Vessels:** Major cards and dashboards use deep black (#121212), creating immediate visual depth and focus.
- **Accents:** Neon Green (#0FEE65) is reserved for high-importance signals: progress bars, call-to-action buttons, and positive growth indicators.
- **Secondary Accents:** Use soft purples and oranges only for categorical differentiation (e.g., spending categories), ensuring they are muted relative to the primary Neon Green.

## Typography
The system uses **Manrope** for its geometric yet approachable structure, ensuring legibility on both light and dark backgrounds. **Hanken Grotesk** is used for labels and technical data to provide a sharp, contemporary feel.

- **Contrast:** Typography on white surfaces uses #121212. Typography within dark containers uses #FFFFFF for primary text and #0FEE65 for emphasis.
- **Numerics:** Financial figures should use the `numeric-display` style with tight letter spacing to emphasize the "data-heavy" nature of the interface.
- **Hierachy:** Use `label-caps` for section headers (e.g., "OVERVIEW") to create clear semantic breaks without using heavy weights.

## Layout & Spacing
This design system utilizes a **Fluid Grid** with fixed outer margins. The layout relies on "vessel-based" grouping where related content is encapsulated within high-contrast containers.

- **Grid:** 12-column system for desktop, 4-column for mobile.
- **Rhythm:** An 8px base unit drives all spacing. 
- **Density:** Elements within dark containers (the "Vessels") should have higher density (12-16px spacing) to feel technical, while the white space between these vessels should be generous (24-32px) to provide "breathing room" for the user.
- **Mobile:** On mobile devices, cards should stretch to the full width of the safe area minus the 24px page margin.

## Elevation & Depth
Depth is created through color contrast rather than complex shadows. 

- **Surface Layers:** The white background is Level 0. Dark containers sit at Level 1.
- **Shadows:** Use extremely soft, high-spread shadows for white elements on white surfaces (e.g., secondary info cards). Dark containers do not use shadows; instead, they rely on their stark contrast against the white canvas.
- **Glow Effects:** The Neon Green accent uses a subtle "outer glow" (soft 8-12px blur) when placed inside dark containers to simulate a light-emissive hardware feel.
- **Backdrop:** Use a soft blur (20px) for bottom navigation bars or overlays to maintain a sense of layered space.

## Shapes
The shape language is consistently **Rounded**, softening the "aggressive" nature of the high-contrast palette. 

- **Standard Containers:** Use a 1.5rem (24px) radius for all main dashboard cards and dark containers.
- **Interactive Elements:** Buttons and input fields should follow the `rounded-lg` (16px) standard.
- **Icons:** Icons are housed within circular or highly rounded "soft-square" containers to maintain a friendly, approachable aesthetic.

## Components
- **Primary Action Button:** Use the Neon Green (#0FEE65) background with Black (#121212) text. Add a slight glow effect on hover/active states.
- **Vessel Cards:** Deep black (#121212) backgrounds. Internal elements should use white or light-grey borders (1px, 10% opacity) for separation.
- **Status Chips:** Small, pill-shaped indicators. For positive status, use a 10% opacity green fill with a solid #0FEE65 text.
- **Charts/Graphs:** Line charts use the Neon Green for the primary data path with a subtle gradient fill underneath.
- **Bottom Navigation:** A floating "dock" style with a dark backdrop blur, keeping the primary "Add" or "Center" action in a high-contrast Neon Green circle that breaks the plane of the dock.
- **Input Fields:** On white surfaces, use a subtle 1px border. Inside dark containers, use a dark-grey fill with white text and a Neon Green focus ring.