import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  useReactionTimeByAttributeQuery,
  type ReactionTimeAttributeType,
} from '@features/admin-stats';

const ATTRIBUTE_OPTIONS: {
  value: ReactionTimeAttributeType;
  label: string;
}[] = [
  { value: 'CLASSIFICATION', label: '이수구분' },
  { value: 'COLLEGE', label: '단과대학' },
  { value: 'DEPARTMENT', label: '학과' },
  { value: 'ACADEMIC_COURSE', label: '학문의 기초' },
  { value: 'ACADEMIC_YEAR', label: '학년' },
  { value: 'CREDIT', label: '학점' },
  { value: 'COURSE_NUMBER', label: '교과목번호' },
];

export default function ReactionTimeByAttribute() {
  const [type, setType] = useState<ReactionTimeAttributeType>('CLASSIFICATION');
  const { data, isLoading, isError } =
    useReactionTimeByAttributeQuery(type);

  const chartData = useMemo(() => {
    if (!data) return [];
    return [...data]
      .sort((a, b) => b.count - a.count)
      .map((item) => ({
        label:
          type === 'COURSE_NUMBER' && item.courseName
            ? `${item.attribute} ${item.courseName}`
            : item.attribute,
        avgMs: Math.round(item.avgReactionTime),
        minMs: item.minReactionTime,
        maxMs: item.maxReactionTime,
        count: item.count,
        successCount: item.successCount,
      }));
  }, [data, type]);

  const barSize = 20;
  const chartHeight = Math.max(chartData.length * (barSize + 12), 200);

  return (
    <div className="chart-section">
      <div className="chart-section-header">
        <h3>속성별 반응 시간</h3>
        <select
          className="date-range-input"
          value={type}
          onChange={(e) =>
            setType(e.target.value as ReactionTimeAttributeType)
          }
        >
          {ATTRIBUTE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="notice-loading">데이터를 불러오는 중...</div>
      )}

      {!isLoading && (isError || !data) && (
        <div className="notice-empty">데이터를 불러올 수 없습니다.</div>
      )}

      {data && chartData.length > 0 && (
        <div className="chart-scroll-container">
          <BarChart
            width={700}
            height={chartHeight}
            data={chartData}
            layout="vertical"
            margin={{ left: 120, right: 20, top: 5, bottom: 5 }}
            barSize={barSize}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              fontSize={11}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${v}ms`
              }
            />
            <YAxis
              type="category"
              dataKey="label"
              width={110}
              fontSize={11}
              tick={{ fill: '#374151' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload as (typeof chartData)[number];
                return (
                  <div className="chart-tooltip">
                    <div>{d.label}</div>
                    <div>
                      평균: {d.avgMs.toLocaleString()}ms / 최소: {d.minMs.toLocaleString()}ms / 최대: {d.maxMs.toLocaleString()}ms
                    </div>
                    <div>
                      시도: {d.count.toLocaleString()}건 / 성공: {d.successCount.toLocaleString()}건
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="avgMs" fill="#6366f1" radius={[0, 4, 4, 0]} />
          </BarChart>
        </div>
      )}

      {data && chartData.length === 0 && (
        <div className="notice-empty">데이터가 없습니다.</div>
      )}
    </div>
  );
}
