/**
 * Responsive sizing helpers.
 *
 * Every layout is authored against a 390pt reference width (iPhone 15 class)
 * and scaled from the real viewport so the app keeps identical proportions on
 * a 360pt Android handset, a 430pt Pro Max, and tablets in either orientation.
 * Height scaling is deliberately clamped so landscape phones and tablets do
 * not blow text up beyond legibility.
 */

import { Dimensions, PixelRatio, useWindowDimensions } from 'react-native';

export const REFERENCE_WIDTH = 390;
export const REFERENCE_HEIGHT = 844;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function scaleWidth(width: number): number {
  const { width: viewportWidth } = Dimensions.get('window');
  return PixelRatio.roundToNearestPixel((width / REFERENCE_WIDTH) * viewportWidth);
}

export function scaleHeight(height: number): number {
  const { height: viewportHeight } = Dimensions.get('window');
  const raw = (height / REFERENCE_HEIGHT) * viewportHeight;
  return PixelRatio.roundToNearestPixel(clamp(raw, height * 0.85, height * 1.25));
}

export function scaleFont(size: number): number {
  const { width: viewportWidth } = Dimensions.get('window');
  const raw = (size / REFERENCE_WIDTH) * viewportWidth;
  return PixelRatio.roundToNearestPixel(clamp(raw, size * 0.9, size * 1.15));
}

/**
 * Grid columns for the current viewport. Cards keep a readable minimum width
 * instead of stretching edge to edge on a tablet.
 */
export function columnsForWidth(width: number, minCardWidth = 160, gap = 12): number {
  return clamp(Math.floor((width + gap) / (minCardWidth + gap)), 1, 4);
}

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  return {
    width,
    height,
    isSmallPhone: width < 380,
    isPhone: width < 600,
    isTablet: width >= 600 && width < 1024,
    isLargeTablet: width >= 1024,
    isLandscape: width > height,
    /** Side padding that grows with the viewport on wide screens. */
    gutter: clamp(Math.round(width * 0.05), 16, 48),
    /** Caps the content width on tablets so lines never get uncomfortably long. */
    maxContentWidth: 720,
    columns: columnsForWidth(width),
  };
}

export type Responsive = ReturnType<typeof useResponsive>;
