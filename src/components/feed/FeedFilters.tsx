'use client';

import React from 'react';
import { Search, X, Filter, Building2 } from 'lucide-react';
import { AnnouncementCategory, AnnouncementPriority, Department } from '@/lib/types';

interface FeedFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedPriority: string;
  setSelectedPriority: (priority: string) => void;
  categoryCounts: Record<string, number>;
  selectedDepartment?: string;
  setSelectedDepartment?: (dept: string) => void;
  departments?: Department[];
}

export const FeedFilters: React.FC<FeedFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedPriority,
  setSelectedPriority,
  categoryCounts,
  selectedDepartment,
  setSelectedDepartment,
  departments
}) => {
  const categories: { label: string; value: string }[] = [
    { label: 'All Updates', value: 'ALL' },
    { label: 'HR Policies', value: 'HR' },
    { label: 'IT & Security', value: 'IT_SECURITY' },
    { label: 'Town Hall', value: 'TOWN_HALL' },
    { label: 'Events', value: 'EVENTS' },
    { label: 'General', value: 'GENERAL' }
  ];

  const priorities: { label: string; value: string; color?: string }[] = [
    { label: 'All Priorities', value: 'ALL' },
    { label: '🔴 Urgent', value: 'URGENT' },
    { label: '🟡 Important', value: 'IMPORTANT' },
    { label: '🟢 General', value: 'GENERAL' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
      {/* Search Input */}
      <div style={{ position: 'relative', width: '100%' }}>
        <Search
          size={18}
          color="var(--text-muted)"
          style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search announcements by title, department, topic, or keyword..."
          style={{
            width: '100%',
            height: 46,
            padding: '0 40px 0 46px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            fontSize: 14,
            outline: 'none',
            transition: 'border-color var(--transition-fast)'
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              padding: 4
            }}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter Row: Category Chips, Department Dropdown & Priority Selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap'
        }}
      >
        {/* Category Scrollable Chips */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 4,
            maxWidth: '100%'
          }}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            const count = cat.value === 'ALL' ? Object.values(categoryCounts).reduce((a, b) => a + b, 0) : categoryCounts[cat.value] || 0;

            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 500,
                  background: isSelected ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
                  color: isSelected ? '#fff' : 'var(--text-secondary)',
                  border: isSelected ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <span>{cat.label}</span>
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 6px',
                    borderRadius: 10,
                    background: isSelected ? 'var(--brand-primary)' : 'rgba(255, 255, 255, 0.08)',
                    color: isSelected ? '#fff' : 'var(--text-muted)'
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right side filters: Department & Priority */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Department Selector */}
          {departments && setSelectedDepartment && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <select
                value={selectedDepartment || 'ALL'}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: selectedDepartment && selectedDepartment !== 'ALL' ? 'var(--brand-primary)' : 'var(--bg-surface)',
                  color: selectedDepartment && selectedDepartment !== 'ALL' ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="ALL">🏢 All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    🏢 {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Priority Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {priorities.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Active Department Filter Tag */}
      {selectedDepartment && selectedDepartment !== 'ALL' && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 20,
            background: 'var(--brand-glow)',
            color: 'var(--brand-primary)',
            fontSize: 13,
            fontWeight: 700,
            alignSelf: 'flex-start'
          }}
        >
          <Building2 size={15} />
          <span>Department Filter: {selectedDepartment}</span>
          <button
            onClick={() => setSelectedDepartment && setSelectedDepartment('ALL')}
            title="Clear department filter"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--brand-primary)',
              display: 'flex',
              padding: 0
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
};
