import { useEffect, useMemo, useRef, useState } from 'react';
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
const SALARY_TUTORIAL_STEPS = [
  {
    title: 'Welcome',
    marker: 'PAY',
    copy: 'This simulator shows how gross monthly salary becomes estimated net take-home pay using the supplied 2026 Philippine payroll rules.',
  },
  {
    title: 'Salary Input',
    marker: 'RANGE',
    copy: 'Use the Monthly Basic Salary slider or number input. The range is ₱10,000 to ₱1,500,000, and both inputs stay synced.',
  },
  {
    title: 'Government Contributions',
    marker: 'SSS',
    copy: 'SSS, PhilHealth, and Pag-IBIG are deducted first. Each contribution follows statutory bases, caps, and ceilings.',
  },
  {
    title: 'Taxable Income',
    marker: 'BASE',
    copy: 'Monthly taxable income is gross salary minus SSS, PhilHealth, and Pag-IBIG. Annual taxable income is monthly taxable income × 12.',
  },
  {
    title: 'Withholding Tax',
    marker: 'TRAIN',
    copy: 'TRAIN income tax is calculated annually first, then divided by 12. Higher salaries move into higher tax brackets.',
  },
  {
    title: 'Visual Breakdown Bar',
    marker: 'BAR',
    copy: 'The stacked bar splits gross salary into net pay, SSS, PhilHealth, Pag-IBIG, and withholding tax percentages.',
  },
  {
    title: 'Net Take-Home Pay',
    marker: 'NET',
    copy: 'The hero metric is the estimated monthly pay left after statutory deductions and monthly withholding tax.',
  },
  {
    title: 'Legal Context',
    marker: 'NOTE',
    copy: 'This is an educational standard-rule model. It excludes company allowances, de minimis benefits, 13th-month exemptions, and other conditional modifiers.',
  },
];

function formatRate(value) {
  return `${value.toFixed(1)}%`;
}

function BreakdownRow({ label, value, detail, isEmphasis = false }) {
  return (
    <div
      className={`salary-summary-row ${
        isEmphasis ? 'salary-summary-row--emphasis' : ''
      }`}
    >
      <div className="min-w-0">
        <span>{label}</span>
        {detail && <p>{detail}</p>}
      </div>
      <strong>
        {value}
      </strong>
    </div>
  );
}

function SegmentLegendItem({ label, value, percent, color }) {
  return (
    <div className="album-game-inset salary-segment-tile">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 flex-none rounded-[2px]" style={{ background: color }} aria-hidden="true" />
        <span className="min-w-0 truncate font-mono text-[9px] font-semibold uppercase tracking-[0.13em] text-white/55">
          {label}
        </span>
      </div>
      <div className="mt-1.5 grid gap-0.5">
        <span className="min-w-0 break-words font-mono text-xs font-semibold text-white">{formatPeso(value)}</span>
        <span className="font-mono text-[11px] text-white/45">{formatRate(percent)} of gross</span>
      </div>
    </div>
  );
}

export default function SalaryTaxSimulator() {
  const tutorialCardRef = useRef(null);
  const [salary, setSalary] = useState(DEFAULT_MONTHLY_SALARY);
  const [tutorialOpen, setTutorialOpen] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);
  const breakdown = useMemo(() => calculateSalaryBreakdown(salary), [salary]);
  const currentTutorialStep = SALARY_TUTORIAL_STEPS[tutorialStep];

  const setClampedSalary = (value) => {
    setSalary(Math.round(clamp(value, SALARY_MIN, SALARY_MAX)));
  };

  const resetSalary = () => setSalary(DEFAULT_MONTHLY_SALARY);

  const finishTutorial = () => {
    setTutorialOpen(false);
    setTutorialStep(0);
  };

  const replayTutorial = () => {
    setTutorialStep(0);
    setTutorialOpen(true);
  };

  const goToNextTutorialStep = () => {
    if (tutorialStep >= SALARY_TUTORIAL_STEPS.length - 1) {
      finishTutorial();
      return;
    }
    setTutorialStep((step) => step + 1);
  };

  const goToPreviousTutorialStep = () => {
    setTutorialStep((step) => Math.max(0, step - 1));
  };

  useEffect(() => {
    if (!tutorialOpen) return undefined;
    const focusTimer = window.setTimeout(() => {
      tutorialCardRef.current?.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(focusTimer);
  }, [tutorialOpen, tutorialStep]);

  useEffect(() => {
    if (!tutorialOpen) return undefined;
    const stopTutorialEscape = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    };
    window.addEventListener('keydown', stopTutorialEscape, true);
    return () => window.removeEventListener('keydown', stopTutorialEscape, true);
  }, [tutorialOpen]);

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

  const summaryRows = [
    { label: 'Gross Monthly Salary', value: formatPeso(breakdown.monthlySalary) },
    { label: 'SSS employee share', value: formatPeso(breakdown.sss), detail: '5% employee share of clamped monthly salary credit.' },
    { label: 'PhilHealth employee share', value: formatPeso(breakdown.philHealth), detail: '2.5% employee share after statutory base limits.' },
    { label: 'Pag-IBIG employee share', value: formatPeso(breakdown.pagIbig), detail: '2% on a salary base capped at ₱10,000.00.' },
    { label: 'Total Statutory Deductions', value: formatPeso(breakdown.totalStatutoryDeductions) },
    { label: 'Monthly Taxable Income', value: formatPeso(breakdown.monthlyTaxableIncome) },
    { label: 'Annual Taxable Income', value: formatPeso(breakdown.annualTaxableIncome) },
    { label: 'Annual Income Tax', value: formatPeso(breakdown.annualTax) },
    { label: 'Monthly Withholding Tax', value: formatPeso(breakdown.monthlyWithholdingTax) },
    {
      label: 'Total Deductions',
      value: `${formatPeso(breakdown.totalDeductions)} (${formatRate(breakdown.deductionRate)} of gross)`,
    },
    { label: 'Final Net Take-Home Pay', value: formatPeso(breakdown.netMonthlyPay), isEmphasis: true },
  ];

  return (
    <div className="album-game-fit salary-fit relative text-base">
      <header className="album-game-card album-game-panel-tight salary-control-panel" aria-labelledby="salary-tax-title">
        <div className="salary-control-grid">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">2026 payroll model</p>
            <h4 id="salary-tax-title" className="mt-1 text-xl font-semibold tracking-normal text-white sm:text-2xl">
              Philippine Salary & Tax Deduction Simulator
            </h4>
            <p className="salary-subcopy mt-2 max-w-2xl text-sm leading-relaxed text-white/62">
              See how gross monthly basic salary becomes net take-home pay through statutory contributions and TRAIN withholding.
            </p>

            <div className="mt-3 grid gap-3">
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
                  disabled={tutorialOpen}
                />
                <div className="flex justify-between font-mono text-[10px] text-white/38">
                  <span>{formatPeso(SALARY_MIN)}</span>
                  <span>{formatPeso(SALARY_MAX)}</span>
                </div>
              </div>

              <div className="salary-input-row">
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
                    disabled={tutorialOpen}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {!tutorialOpen && (
                    <button type="button" onClick={replayTutorial} className="album-game-button min-h-10 cursor-pointer px-4 py-2.5">
                      Replay Tutorial
                    </button>
                  )}
                  <button type="button" onClick={resetSalary} disabled={tutorialOpen} className="album-game-button min-h-10 cursor-pointer px-4 py-2.5 disabled:cursor-not-allowed disabled:opacity-35">
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="album-game-inset salary-net-hero">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">Net Take-Home Pay</p>
              <p className="mt-2 min-w-0 break-words font-mono text-2xl font-semibold leading-tight text-white sm:text-3xl">
                {formatPeso(breakdown.netMonthlyPay)}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                {formatRate(100 - breakdown.deductionRate)} of gross remains after statutory deductions and monthly withholding.
              </p>
            </div>
            <div className="mt-3 grid gap-1.5 border-t border-white/10 pt-3 font-mono text-[10px] uppercase tracking-[0.13em] text-white/48">
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

      <section className="album-game-card album-game-panel-tight salary-breakdown-panel" aria-labelledby="salary-breakdown">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h5 id="salary-breakdown" className="font-mono text-[10px] uppercase tracking-[0.26em] text-white/45">
            Gross Salary Breakdown
          </h5>
          <p className="text-sm text-white/50">
            Gross salary: <span className="font-mono text-white/75">{formatPeso(breakdown.monthlySalary)}</span>
          </p>
        </div>

        <div
          className="album-game-inset mt-3 flex h-7 overflow-hidden sm:h-9"
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

        <div className="salary-segment-grid">
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

      <section className="album-game-card album-game-panel-tight salary-summary-panel" aria-labelledby="salary-summary">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h5 id="salary-summary" className="font-mono text-[10px] uppercase tracking-[0.26em] text-white/45">
            Itemized Payroll Summary
          </h5>
          <p className="salary-summary-hint text-sm text-white/48">All values recalculate instantly from monthly basic salary.</p>
        </div>
        <div className="salary-summary-grid">
          {summaryRows.map((row) => (
            <BreakdownRow
              key={row.label}
              label={row.label}
              value={row.value}
              detail={row.detail}
              isEmphasis={row.isEmphasis}
            />
          ))}
        </div>
        <p className="salary-note">
          This reflects the standard 2026 TRAIN tax schedule and mandatory contribution ceilings, but excludes
          conditional modifiers such as variable company allowances, de minimis benefits, and 13th-month tax exemptions.
        </p>
      </section>

      {tutorialOpen && (
        <div
          className="salary-tutorial-overlay"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <article
            ref={tutorialCardRef}
            role="dialog"
            aria-labelledby="salary-tutorial-title"
            aria-describedby="salary-tutorial-copy"
            tabIndex={-1}
            className="salary-tutorial-card"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                event.nativeEvent.stopImmediatePropagation?.();
              }
            }}
          >
            <div className="salary-tutorial-top">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
                Step {tutorialStep + 1} of {SALARY_TUTORIAL_STEPS.length}
              </p>
              <div className="salary-tutorial-dots" aria-hidden="true">
                {SALARY_TUTORIAL_STEPS.map((step, index) => (
                  <span
                    key={step.title}
                    className={`salary-tutorial-dot ${
                      index === tutorialStep ? 'salary-tutorial-dot--active' : ''
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="salary-tutorial-main">
              <div className="salary-tutorial-marker" aria-hidden="true">
                {currentTutorialStep.marker}
              </div>
              <div className="min-w-0">
                <h5 id="salary-tutorial-title" className="text-lg font-semibold tracking-normal text-white">
                  {currentTutorialStep.title}
                </h5>
                <p id="salary-tutorial-copy" className="mt-2 text-sm leading-relaxed text-white/68">
                  {currentTutorialStep.copy}
                </p>
              </div>
            </div>

            <div className="salary-tutorial-actions">
              <button
                type="button"
                onClick={goToPreviousTutorialStep}
                disabled={tutorialStep === 0}
                className="album-game-button min-h-11 px-4 py-2.5 disabled:cursor-not-allowed disabled:opacity-35"
              >
                Back
              </button>
              <button type="button" onClick={finishTutorial} className="album-game-button min-h-11 px-4 py-2.5">
                Skip Tutorial
              </button>
              <button type="button" onClick={goToNextTutorialStep} className="album-game-button salary-tutorial-primary min-h-11 px-4 py-2.5">
                {tutorialStep === SALARY_TUTORIAL_STEPS.length - 1 ? 'Start Simulator' : 'Next'}
              </button>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
