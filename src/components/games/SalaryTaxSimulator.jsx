import { useMemo, useState } from 'react';
import { clamp } from '../../lib/games/helpers';
import {
  calculateSalaryBreakdown,
  DEFAULT_MONTHLY_SALARY,
  formatPeso,
  SALARY_MAX,
  SALARY_MIN,
} from '../../lib/games/salary';

const salarySliderId = 'salary-tax-monthly-slider';
const salaryInputId = 'salary-tax-monthly-input';
const salaryCurrentValueId = 'salary-tax-current-value';

function formatRate(value) {
  return `${value.toFixed(1)}%`;
}

function BreakdownRow({ label, value, detail, isEmphasis = false }) {
  return (
    <div
      className={`grid gap-1 border-t border-white/10 py-3 text-[15px] sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4 ${
        isEmphasis ? 'bg-[var(--game-accent)]/10 px-3 ring-1 ring-[var(--game-accent)]/25' : ''
      }`}
    >
      <div className="min-w-0">
        <span className={isEmphasis ? 'font-semibold text-white' : 'text-white/62'}>{label}</span>
        {detail && <p className="mt-1 text-xs leading-relaxed text-white/42">{detail}</p>}
      </div>
      <span
        className={`min-w-0 break-words font-mono text-sm font-semibold sm:text-right ${
          isEmphasis ? 'text-[var(--game-accent)]' : 'text-white/82'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function SegmentLegendItem({ label, value, percent, color }) {
  return (
    <div className="album-game-inset min-w-0 p-3">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 flex-none rounded-[2px]" style={{ background: color }} aria-hidden="true" />
        <span className="min-w-0 truncate font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">
          {label}
        </span>
      </div>
      <div className="mt-3 grid gap-1">
        <span className="min-w-0 break-words font-mono text-sm font-semibold text-white">{formatPeso(value)}</span>
        <span className="font-mono text-[11px] text-white/45">{formatRate(percent)} of gross</span>
      </div>
    </div>
  );
}

export default function SalaryTaxSimulator() {
  const [salary, setSalary] = useState(DEFAULT_MONTHLY_SALARY);
  const breakdown = useMemo(() => calculateSalaryBreakdown(salary), [salary]);

  const setClampedSalary = (value) => {
    setSalary(Math.round(clamp(value, SALARY_MIN, SALARY_MAX)));
  };

  const resetSalary = () => setSalary(DEFAULT_MONTHLY_SALARY);

  const segments = [
    { key: 'net', label: 'Net Take-Home Pay', value: breakdown.netMonthlyPay, color: '#75d39a' },
    { key: 'sss', label: 'SSS', value: breakdown.sss, color: '#f0b95b' },
    { key: 'philHealth', label: 'PhilHealth', value: breakdown.philHealth, color: '#67c7ef' },
    { key: 'pagIbig', label: 'Pag-IBIG', value: breakdown.pagIbig, color: '#b99cff' },
    { key: 'tax', label: 'Withholding Tax', value: breakdown.monthlyWithholdingTax, color: '#f07167' },
  ].map((segment) => ({
    ...segment,
    percent: breakdown.monthlySalary > 0 ? (segment.value / breakdown.monthlySalary) * 100 : 0,
  }));

  return (
    <div className="space-y-5 text-base">
      <header className="album-game-card overflow-hidden p-4 sm:p-5" aria-labelledby="salary-tax-title">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] xl:items-stretch">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">2026 payroll model</p>
            <h4 id="salary-tax-title" className="mt-2 text-2xl font-semibold tracking-normal text-white">
              Philippine Salary & Tax Deduction Simulator
            </h4>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/62">
              See how gross monthly basic salary becomes net take-home pay through statutory contributions and TRAIN withholding.
            </p>

            <div className="mt-5 grid gap-4">
              <div className="grid gap-2">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <label
                    htmlFor={salarySliderId}
                    className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55"
                  >
                    Monthly Basic Salary
                  </label>
                  <output
                    id={salaryCurrentValueId}
                    htmlFor={`${salarySliderId} ${salaryInputId}`}
                    className="font-mono text-sm font-semibold text-white"
                  >
                    {formatPeso(breakdown.monthlySalary)}
                  </output>
                </div>
                <input
                  id={salarySliderId}
                  type="range"
                  min={SALARY_MIN}
                  max={SALARY_MAX}
                  step="1000"
                  value={salary}
                  onChange={(event) => setClampedSalary(event.target.value)}
                  className="album-game-range"
                  aria-describedby={salaryCurrentValueId}
                  aria-label="Monthly basic salary slider"
                />
                <div className="flex justify-between font-mono text-[10px] text-white/38">
                  <span>{formatPeso(SALARY_MIN)}</span>
                  <span>{formatPeso(SALARY_MAX)}</span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div className="grid min-w-0 gap-2">
                  <label htmlFor={salaryInputId} className="text-base font-medium text-white/78 sm:text-sm">
                    Salary amount
                  </label>
                  <input
                    id={salaryInputId}
                    type="number"
                    inputMode="numeric"
                    min={SALARY_MIN}
                    max={SALARY_MAX}
                    step="1000"
                    value={salary}
                    onChange={(event) => setClampedSalary(event.target.value)}
                    className="album-game-input font-mono"
                  />
                </div>
                <button type="button" onClick={resetSalary} className="album-game-button min-h-11 cursor-pointer px-4 py-3">
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="album-game-inset flex min-w-0 flex-col justify-between p-4 sm:p-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">Net Take-Home Pay</p>
              <p className="mt-3 min-w-0 break-words font-mono text-3xl font-semibold leading-tight text-white sm:text-4xl">
                {formatPeso(breakdown.netMonthlyPay)}
              </p>
              <p className="mt-3 text-base leading-relaxed text-white/55">
                {formatRate(100 - breakdown.deductionRate)} of gross remains after statutory deductions and monthly withholding.
              </p>
            </div>
            <div className="mt-5 grid gap-2 border-t border-white/10 pt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-white/48">
              <div className="flex justify-between gap-3">
                <span>Total Deductions</span>
                <span className="text-white/75">{formatPeso(breakdown.totalDeductions)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Deduction Rate</span>
                <span className="text-white/75">{formatRate(breakdown.deductionRate)}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="album-game-card p-5" aria-labelledby="salary-breakdown">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h5 id="salary-breakdown" className="font-mono text-[10px] uppercase tracking-[0.26em] text-white/45">
            Gross Salary Breakdown
          </h5>
          <p className="text-sm text-white/50">
            Gross salary: <span className="font-mono text-white/75">{formatPeso(breakdown.monthlySalary)}</span>
          </p>
        </div>

        <div
          className="album-game-inset mt-4 flex h-10 overflow-hidden"
          aria-label={`Gross salary breakdown: net take-home pay ${formatPeso(breakdown.netMonthlyPay)}, SSS ${formatPeso(
            breakdown.sss,
          )}, PhilHealth ${formatPeso(breakdown.philHealth)}, Pag-IBIG ${formatPeso(
            breakdown.pagIbig,
          )}, withholding tax ${formatPeso(breakdown.monthlyWithholdingTax)}.`}
          role="img"
        >
          {segments.map((segment) => (
            <div
              key={segment.key}
              title={`${segment.label}: ${formatPeso(segment.value)} (${formatRate(segment.percent)})`}
              className="min-w-[3px] transition-[width] duration-300"
              style={{
                width: `${Math.max(0, segment.percent)}%`,
                background: segment.color,
              }}
            />
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {segments.map((segment) => (
            <SegmentLegendItem
              key={segment.key}
              label={segment.label}
              value={segment.value}
              percent={segment.percent}
              color={segment.color}
            />
          ))}
        </div>
      </section>

      <section className="album-game-card p-5" aria-labelledby="salary-summary">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h5 id="salary-summary" className="font-mono text-[10px] uppercase tracking-[0.26em] text-white/45">
            Itemized Payroll Summary
          </h5>
          <p className="text-sm text-white/48">All values recalculate instantly from monthly basic salary.</p>
        </div>
        <div className="album-game-inset mt-3 px-4">
          <BreakdownRow label="Gross Monthly Salary" value={formatPeso(breakdown.monthlySalary)} />
          <BreakdownRow
            label="SSS employee share"
            value={formatPeso(breakdown.sss)}
            detail="5% of monthly salary credit, clamped to the statutory base."
          />
          <BreakdownRow
            label="PhilHealth employee share"
            value={formatPeso(breakdown.philHealth)}
            detail="2.5% employee share after statutory base limits."
          />
          <BreakdownRow
            label="Pag-IBIG employee share"
            value={formatPeso(breakdown.pagIbig)}
            detail="2% employee share on a salary base capped at ₱10,000.00."
          />
          <BreakdownRow label="Total Statutory Deductions" value={formatPeso(breakdown.totalStatutoryDeductions)} />
          <BreakdownRow label="Monthly Taxable Income" value={formatPeso(breakdown.monthlyTaxableIncome)} />
          <BreakdownRow label="Annual Taxable Income" value={formatPeso(breakdown.annualTaxableIncome)} />
          <BreakdownRow label="Annual Income Tax" value={formatPeso(breakdown.annualTax)} />
          <BreakdownRow label="Monthly Withholding Tax" value={formatPeso(breakdown.monthlyWithholdingTax)} />
          <BreakdownRow
            label="Total Deductions"
            value={`${formatPeso(breakdown.totalDeductions)} (${formatRate(breakdown.deductionRate)} of gross)`}
          />
          <BreakdownRow label="Final Net Take-Home Pay" value={formatPeso(breakdown.netMonthlyPay)} isEmphasis />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-white/48">
          This educational model reflects the supplied 2026 TRAIN/statutory contribution formulas and excludes variable
          company allowances, de minimis benefits, 13th-month tax exemptions, and other conditional modifiers.
        </p>
      </section>
    </div>
  );
}
