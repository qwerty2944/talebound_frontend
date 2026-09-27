"use client";

import { useState, type CSSProperties } from 'react';

export interface NamedPartOption { index: number; name: string; disabled?: boolean; restriction?: string }

/** Names stay separate from the stable Unity indices used as option values. */
export function NamedPartSelect({label, value, options, onChange, required = false, disabled = false, style}: {
  label: string; value: number; options: NamedPartOption[]; onChange: (index: number) => void;
  required?: boolean; disabled?: boolean; style?: CSSProperties;
}) {
  const [query, setQuery] = useState('');
  const matches = options.filter(option => option.name.includes(query.trim()) || option.index === value);
  return <div className="space-y-1">
    {options.length > 25 && <input type="search" aria-label={`${label} 검색`} placeholder={`${label} 이름 검색`}
      value={query} onChange={e => setQuery(e.target.value)} disabled={disabled}
      className="w-full min-w-0 rounded border px-2 py-1 text-xs" style={style} />}
    <select aria-label={`${label} 선택`} value={value} onChange={e => onChange(Number(e.target.value))}
      disabled={disabled} className="w-full min-w-0 rounded border px-2 py-1.5 text-xs" style={style}>
      {(!required || value < 0 || !options.length) && <option value={-1}>{disabled ? '불러오는 중…' : '없음'}</option>}
      {matches.map(option => <option key={option.index} value={option.index} disabled={option.disabled}>
        {option.name}{option.restriction ? ' · 엘프 전용' : ''}
      </option>)}
    </select>
    {query && matches.filter(option => option.name.includes(query.trim())).length === 0 && <p className="text-xs" role="status">검색 결과가 없습니다.</p>}
    {options.some(option => option.restriction) && <p className="text-xs opacity-80">엘프 전용: 귀 부분을 비운 재단 · 다른 종족은 착용 불가</p>}
  </div>;
}
