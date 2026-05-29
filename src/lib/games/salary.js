import { clamp } from './helpers';

export const SALARY_MIN = 10000;
export const SALARY_MAX = 1500000;
export const DEFAULT_MONTHLY_SALARY = 45000;

export const SSS_MIN_BASE = 5000;
export const SSS_MAX_BASE = 35000;
export const SSS_EMPLOYEE_RATE = 0.05;
export const SSS_MIN_DEDUCTION = 250;
export const SSS_MAX_DEDUCTION = 1750;

export const PHILHEALTH_MIN_BASE = 10000;
export const PHILHEALTH_MAX_BASE = 100000;
export const PHILHEALTH_EMPLOYEE_RATE = 0.025;
export const PHILHEALTH_MIN_DEDUCTION = 250;
export const PHILHEALTH_MAX_DEDUCTION = 2500;

export const PAGIBIG_EMPLOYEE_RATE = 0.02;
export const PAGIBIG_MAX_BASE = 10000;
export const PAGIBIG_MAX_DEDUCTION = 200;

export const TRAIN_TAX_BRACKETS = [
  { ceiling: 250000, baseTax: 0, floor: 0, rate: 0 },
  { ceiling: 400000, baseTax: 0, floor: 250000, rate: 0.15 },
  { ceiling: 800000, baseTax: 22500, floor: 400000, rate: 0.2 },
  { ceiling: 2000000, baseTax: 102500, floor: 800000, rate: 0.25 },
  { ceiling: 8000000, baseTax: 402500, floor: 2000000, rate: 0.3 },
  { ceiling: Number.POSITIVE_INFINITY, baseTax: 2202500, floor: 8000000, rate: 0.35 },
];

export function formatPeso(value) {
  return `₱${Number(value).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function calculateAnnualTrainTax(annualTaxableIncome) {
  const bracket = TRAIN_TAX_BRACKETS.find((item) => annualTaxableIncome <= item.ceiling);
  if (!bracket || bracket.rate === 0) return 0;
  return bracket.baseTax + (annualTaxableIncome - bracket.floor) * bracket.rate;
}

export function calculateSalaryBreakdown(monthlySalaryInput) {
  const monthlySalary = clamp(monthlySalaryInput, SALARY_MIN, SALARY_MAX);
  const sss = clamp(
    clamp(monthlySalary, SSS_MIN_BASE, SSS_MAX_BASE) * SSS_EMPLOYEE_RATE,
    SSS_MIN_DEDUCTION,
    SSS_MAX_DEDUCTION,
  );
  const philHealth = clamp(
    clamp(monthlySalary, PHILHEALTH_MIN_BASE, PHILHEALTH_MAX_BASE) * PHILHEALTH_EMPLOYEE_RATE,
    PHILHEALTH_MIN_DEDUCTION,
    PHILHEALTH_MAX_DEDUCTION,
  );
  const pagIbig = Math.min(Math.min(monthlySalary, PAGIBIG_MAX_BASE) * PAGIBIG_EMPLOYEE_RATE, PAGIBIG_MAX_DEDUCTION);
  const totalStatutoryDeductions = sss + philHealth + pagIbig;
  const monthlyTaxableIncome = monthlySalary - totalStatutoryDeductions;
  const annualTaxableIncome = monthlyTaxableIncome * 12;
  const annualTax = calculateAnnualTrainTax(annualTaxableIncome);
  const monthlyWithholdingTax = annualTax / 12;
  const totalDeductions = totalStatutoryDeductions + monthlyWithholdingTax;
  const netMonthlyPay = monthlySalary - totalDeductions;

  return {
    monthlySalary,
    sss,
    philHealth,
    pagIbig,
    totalStatutoryDeductions,
    monthlyTaxableIncome,
    annualTaxableIncome,
    annualTax,
    monthlyWithholdingTax,
    totalDeductions,
    netMonthlyPay,
    deductionRate: monthlySalary > 0 ? (totalDeductions / monthlySalary) * 100 : 0,
  };
}
