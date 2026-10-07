/**
 * Charts, built on `react-native-svg` so they theme cleanly and animate without
 * pulling a canvas dependency. Amounts arrive as integer minor units and are
 * divided for display only.
 */

import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { Text } from '../ui/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { formatMoneyCompact } from '../../utils/format';
import { useResponsive } from '../../utils/responsive';

export type Point = { label: string; value: number };

/* ------------------------------------------------------------- line / area */

type LineChartProps = {
  data: Point[];
  height?: number;
  color?: string;
  /** Gradient fill under the curve. */
  fill?: boolean;
  showDots?: boolean;
  showValues?: boolean;
  currency?: string;
  /** Draws a dashed reference line, e.g. the previous period. */
  reference?: number;
  maxValue?: number;
};

export function LineChart({
  data,
  height = 180,
  color,
  fill = true,
  showDots = true,
  showValues = false,
  currency = 'USD',
  reference,
  maxValue,
}: LineChartProps) {
  const { colors } = useTheme();
  const { width: viewportWidth } = useResponsive();
  const stroke = color ?? colors.primary;

  const chartWidth = Math.max(240, viewportWidth - 40);
  const padding = { top: showValues ? 22 : 14, right: 10, bottom: 20, left: 10 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const geometry = useMemo(() => {
    if (data.length === 0) return null;

    const values = data.map((point) => point.value);
    const candidates = maxValue ?? Math.max(...values, reference ?? 0, 1);
    const min = Math.min(0, ...values);
    const span = Math.max(candidates - min, 1);

    const xFor = (index: number) =>
      padding.left + (data.length === 1 ? innerWidth / 2 : (index / (data.length - 1)) * innerWidth);
    const yFor = (value: number) =>
      padding.top + innerHeight - ((value - min) / span) * innerHeight;

    const line = data
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${xFor(index)},${yFor(point.value)}`)
      .join(' ');

    // Smooth the polyline with midpoint quadratics for a softer curve.
    let smooth = '';
    if (data.length > 1) {
      const points = data.map((point, index) => ({
        x: xFor(index),
        y: yFor(point.value),
      }));
      smooth = `M${points[0].x},${points[0].y}`;
      for (let i = 1; i < points.length; i += 1) {
        const previous = points[i - 1];
        const current = points[i];
        const midX = (previous.x + current.x) / 2;
        smooth += ` C${midX},${previous.y} ${midX},${current.y} ${current.x},${current.y}`;
      }
    }

    const areaPath = `${smooth} L${xFor(data.length - 1)},${padding.top + innerHeight} L${xFor(0)},${padding.top + innerHeight} Z`;

    return {
      xFor,
      yFor,
      smooth: smooth || line,
      line,
      areaPath,
      min,
      span,
      max: candidates,
    };
  }, [data, innerHeight, innerWidth, maxValue, padding.bottom, padding.left, padding.top, reference]);

  if (!geometry) {
    return (
      <View style={{ height }} className="items-center justify-center">
        <Text variant="caption" tone="muted">
          No data yet
        </Text>
      </View>
    );
  }

  const gradientId = `line-${stroke.replace('#', '')}`;

  // Label only a handful of x positions so the axis never overlaps.
  const labelStride = Math.max(1, Math.ceil(data.length / 6));

  return (
    <Svg width={chartWidth} height={height}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={stroke} stopOpacity={0.28} />
          <Stop offset="1" stopColor={stroke} stopOpacity={0.02} />
        </LinearGradient>
      </Defs>

      {reference !== undefined && reference > 0 ? (
        <Line
          x1={padding.left}
          y1={geometry.yFor(reference)}
          x2={chartWidth - padding.right}
          y2={geometry.yFor(reference)}
          stroke={colors.borderStrong}
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      ) : null}

      {fill ? <Path d={geometry.areaPath} fill={`url(#${gradientId})`} /> : null}

      <Path
        d={geometry.smooth}
        stroke={stroke}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {showDots
        ? data.map((point, index) => (
            <Circle
              key={`${point.label}-${index}`}
              cx={geometry.xFor(index)}
              cy={geometry.yFor(point.value)}
              r={3}
              fill={colors.surface}
              stroke={stroke}
              strokeWidth={2}
            />
          ))
        : null}

      {showValues
        ? data.map((point, index) => (
            <SvgText
              key={`v-${index}`}
              x={geometry.xFor(index)}
              y={Math.max(10, geometry.yFor(point.value) - 10)}
              fontSize={10}
              fontWeight="600"
              fill={colors.contentSecondary}
              textAnchor="middle"
            >
              {formatMoneyCompact(point.value, currency)}
            </SvgText>
          ))
        : null}

      {data.map((point, index) =>
        index % labelStride === 0 || index === data.length - 1 ? (
          <SvgText
            key={`x-${index}`}
            x={geometry.xFor(index)}
            y={height - 5}
            fontSize={10}
            fill={colors.contentMuted}
            textAnchor="middle"
          >
            {point.label}
          </SvgText>
        ) : null,
      )}
    </Svg>
  );
}

/* ------------------------------------------------------------------- bars */

type BarChartProps = {
  data: Point[];
  height?: number;
  color?: string;
  currency?: string;
  showValues?: boolean;
  /** Highlights one bar, e.g. the current day. */
  activeIndex?: number;
};

export function BarChart({
  data,
  height = 180,
  color,
  currency = 'USD',
  showValues = false,
  activeIndex,
}: BarChartProps) {
  const { colors } = useTheme();
  const { width: viewportWidth } = useResponsive();
  const fill = color ?? colors.primary;

  const chartWidth = Math.max(240, viewportWidth - 40);
  const padding = { top: showValues ? 22 : 14, right: 6, bottom: 20, left: 6 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  if (data.length === 0) {
    return (
      <View style={{ height }} className="items-center justify-center">
        <Text variant="caption" tone="muted">
          No data yet
        </Text>
      </View>
    );
  }

  const max = Math.max(...data.map((point) => point.value), 1);
  const slot = innerWidth / data.length;
  const barWidth = Math.max(3, Math.min(28, slot * 0.62));
  const labelStride = Math.max(1, Math.ceil(data.length / 7));

  return (
    <Svg width={chartWidth} height={height}>
      {data.map((point, index) => {
        const barHeight = Math.max(point.value > 0 ? 2 : 0, (point.value / max) * innerHeight);
        const x = padding.left + index * slot + (slot - barWidth) / 2;
        const y = padding.top + innerHeight - barHeight;
        const active = activeIndex === index;

        return (
          <G key={`${point.label}-${index}`}>
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={Math.min(barWidth / 2, 4)}
              fill={fill}
              opacity={activeIndex === undefined || active ? 1 : 0.42}
            />
            {showValues && barHeight > 0 ? (
              <SvgText
                x={x + barWidth / 2}
                y={Math.max(10, y - 6)}
                fontSize={9}
                fontWeight="600"
                fill={active ? colors.content : colors.contentMuted}
                textAnchor="middle"
              >
                {formatMoneyCompact(point.value, currency)}
              </SvgText>
            ) : null}
          </G>
        );
      })}

      {data.map((point, index) =>
        index % labelStride === 0 || index === data.length - 1 ? (
          <SvgText
            key={`l-${index}`}
            x={padding.left + index * slot + slot / 2}
            y={height - 5}
            fontSize={10}
            fill={activeIndex === index ? colors.content : colors.contentMuted}
            fontWeight={activeIndex === index ? '700' : '400'}
            textAnchor="middle"
          >
            {point.label}
          </SvgText>
        ) : null,
      )}
    </Svg>
  );
}

/* ---------------------------------------------------------- stacked / pie */

export type Slice = { label: string; value: number; color: string };

type DonutChartProps = {
  slices: Slice[];
  size?: number;
  thickness?: number;
  currency?: string;
  centerLabel?: string;
  centerValue?: string;
};

export function DonutChart({
  slices,
  size = 180,
  thickness = 26,
  currency = 'USD',
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const { colors } = useTheme();
  const total = slices.reduce((sum, slice) => sum + Math.max(slice.value, 0), 0);

  if (total <= 0) {
    return (
      <View
        style={{ width: size, height: size }}
        className="items-center justify-center rounded-pill border-[26px] border-surfaceSunken"
      >
        <Text variant="caption" tone="muted">
          No data
        </Text>
      </View>
    );
  }

  const radiusOuter = size / 2;
  const radiusInner = radiusOuter - thickness;
  const gapDegrees = slices.length > 1 ? 2 : 0;

  let angle = -90;
  const arcs = slices.map((slice) => {
    const sweep = (Math.max(slice.value, 0) / total) * 360;
    const start = angle + gapDegrees / 2;
    const end = angle + sweep - gapDegrees / 2;
    angle += sweep;
    return { ...slice, start, end: Math.max(end, start + 0.5) };
  });

  function polar(radiusValue: number, degrees: number) {
    const radians = (degrees * Math.PI) / 180;
    return {
      x: radiusOuter + radiusValue * Math.cos(radians),
      y: radiusOuter + radiusValue * Math.sin(radians),
    };
  }

  function arcPath(start: number, end: number) {
    const outerStart = polar(radiusOuter, start);
    const outerEnd = polar(radiusOuter, end);
    const innerEnd = polar(radiusInner, end);
    const innerStart = polar(radiusInner, start);
    const largeArc = end - start > 180 ? 1 : 0;

    return [
      `M${outerStart.x},${outerStart.y}`,
      `A${radiusOuter},${radiusOuter} 0 ${largeArc} 1 ${outerEnd.x},${outerEnd.y}`,
      `L${innerEnd.x},${innerEnd.y}`,
      `A${radiusInner},${radiusInner} 0 ${largeArc} 0 ${innerStart.x},${innerStart.y}`,
      'Z',
    ].join(' ');
  }

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size}>
        {arcs.map((arc) => (
          <Path key={arc.label} d={arcPath(arc.start, arc.end)} fill={arc.color} />
        ))}
      </Svg>
      <View className="absolute items-center">
        <Text variant="title3" tabular>
          {centerValue ?? formatMoneyCompact(total, currency)}
        </Text>
        {centerLabel ? (
          <Text variant="caption" tone="muted">
            {centerLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/** Legend that mirrors the donut slices. */
export function ChartLegend({
  slices,
  currency = 'USD',
  total,
}: {
  slices: Slice[];
  currency?: string;
  total?: number;
}) {
  const sum = total ?? slices.reduce((acc, slice) => acc + Math.max(slice.value, 0), 0);

  return (
    <View className="w-full gap-2.5">
      {slices.map((slice) => {
        const percentage = sum > 0 ? (Math.max(slice.value, 0) / sum) * 100 : 0;
        return (
          <View key={slice.label} className="flex-row items-center">
            <View
              className="h-2.5 w-2.5 rounded-pill"
              style={{ backgroundColor: slice.color }}
            />
            <Text variant="callout" className="ml-2 flex-1" numberOfLines={1}>
              {slice.label}
            </Text>
            <Text variant="callout" tone="secondary" tabular>
              {formatMoneyCompact(slice.value, currency)}
            </Text>
            <Text variant="caption" tone="muted" tabular className="ml-2 w-10 text-right">
              {Math.round(percentage)}%
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/* ----------------------------------------------------------------- spark */

export function Sparkline({
  data,
  color,
  height = 36,
  width = 88,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}) {
  const { colors } = useTheme();
  const stroke = color ?? colors.primary;

  if (data.length < 2) return <View style={{ width, height }} />;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = Math.max(max - min, 1);
  const step = width / (data.length - 1);

  const path = data
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / span) * (height - 4) - 2;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <Svg width={width} height={height}>
      <Path d={path} stroke={stroke} strokeWidth={2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}
