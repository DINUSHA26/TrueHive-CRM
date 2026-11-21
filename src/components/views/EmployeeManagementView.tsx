"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import {
  Users,
  CalendarCheck,
  Banknote,
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  FileSpreadsheet,
  FileText,
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  ChevronRight,
  TrendingDown,
  Building2,
  Phone,
  Calendar,
  Save,
  Check,
  Receipt,
  UserCheck,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export type HrmTab = "DIRECTORY" | "ATTENDANCE" | "PAYROLL";

export interface EmployeeItem {
  id: string;
  empId: string;
  name: string;
  phone?: string;
  email?: string;
  department?: string;
  designation?: string;
  salaryType: "MONTHLY" | "DAILY";
  basicSalary: number;
  mealCost: number;
  epfEtf: number;
  status: "ACTIVE" | "INACTIVE";
  joinedDate: string;
}

export interface AttendanceItem {
  id: string;
  employeeId: string;
  empId: string;
  employeeName: string;
  date: string;
  status: "PRESENT" | "HALF_DAY" | "ABSENT" | "LEAVE";
  notes: string;
}

export interface AdvanceItem {
  id: string;
  date: string;
  empId: string;
  employeeId: string;
  employeeName: string;
  advanceAmount: number;
  note: string;
  status: string;
}

export interface SalarySheetRow {
  id: string;
  employeeId: string;
  empId: string;
  employeeName: string;
  phone?: string;
  type: "Monthly" | "Daily";
  rate: number;
  workingDays: number;
  baseSalary: number;
  serviceCharges: number;
  bonus: number;
  mealCost: number;
  epfEtf: number;
  advanced: number;
  totalSalaryForMonth: number;
  status: "OPEN" | "APPROVED" | "PAID";
}

interface Props {
  defaultTab?: HrmTab;
  onRefresh?: () => void;
}

export function EmployeeManagementView({
  defaultTab = "DIRECTORY",
  onRefresh,
}: Props) {
  // Active Tab
  const [activeTab, setActiveTab] = useState<HrmTab>(defaultTab);

  // Synchronize prop tab
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // 1. Employee Directory State
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Employee Add/Edit Modal
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeItem | null>(null);
  const [empForm, setEmpForm] = useState({
    empId: "",
    name: "",
    phone: "",
    email: "",
    salaryType: "MONTHLY" as "MONTHLY" | "DAILY",
    basicSalary: "",
    mealCost: "0",
    epfEtf: "0",
    department: "Operations",
    designation: "Staff",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    joinedDate: new Date().toISOString().split("T")[0],
  });

  // 2. Daily Attendance State
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceItem[]>([]);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceSaveSuccess, setAttendanceSaveSuccess] = useState(false);

  // Month-end report selectors
  const currentMonthIdx = new Date().getMonth() + 1; // 1-12
  const currentYear = new Date().getFullYear();
  const [reportMonth, setReportMonth] = useState<number>(currentMonthIdx);
  const [reportYear, setReportYear] = useState<number>(currentYear);

  // Monthly Attendance Report Preview Modal
  const [showAttendanceReportModal, setShowAttendanceReportModal] = useState(false);
  const [attendanceReportData, setAttendanceReportData] = useState<any[]>([]);

  // 3. Salary & Advances State
  const [salaryMonth, setSalaryMonth] = useState<number>(currentMonthIdx);
  const [salaryYear, setSalaryYear] = useState<number>(currentYear);
  const [salarySheet, setSalarySheet] = useState<SalarySheetRow[]>([]);
  const [salaryTotals, setSalaryTotals] = useState({
    totalBaseSalaries: 0,
    totalAdvances: 0,
    totalNetSalaries: 0,
  });

  // Advances Log State
  const [advances, setAdvances] = useState<AdvanceItem[]>([]);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    employeeId: "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
    note: "",
  });

  // Monthly Salary Sheet Printable Report Modal
  const [showSalaryReportModal, setShowSalaryReportModal] = useState(false);

  // Individual Payslip Modal
  const [payslipEmployee, setPayslipEmployee] = useState<SalarySheetRow | null>(null);

  // Lock body scroll when any modal is open
  const isAnyModalOpen = Boolean(
    showEmployeeModal ||
    showAdvanceModal ||
    showAttendanceReportModal ||
    showSalaryReportModal ||
    payslipEmployee
  );
  useBodyScrollLock(isAnyModalOpen);

  // Print ref
  const reportPrintRef = useRef<HTMLDivElement | null>(null);

  // ==========================================
  // INITIAL DATA LOADING & SYNC
  // ==========================================
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    let loadedEmployees: EmployeeItem[] = [];

    // 1. Fetch Employees
    try {
      const res = await fetch("/api/hrm/employees");
      if (res.ok) {
        const d = await res.json();
        if (d.employees && Array.isArray(d.employees)) {
          loadedEmployees = d.employees;
        }
      }
    } catch {}

    // Fallback Mock Employees if DB empty or starting fresh
    if (loadedEmployees.length === 0) {
      try {
        const cached = localStorage.getItem("truehive_employees_cache");
        if (cached) {
          loadedEmployees = JSON.parse(cached);
        }
      } catch {}

      if (loadedEmployees.length === 0) {
        loadedEmployees = [
          {
            id: "emp-001",
            empId: "001",
            name: "Manidu Dinusha",
            phone: "07957612348",
            salaryType: "MONTHLY",
            basicSalary: 12000,
            mealCost: 0,
            epfEtf: 0,
            status: "ACTIVE",
            department: "Executive",
            designation: "Managing Director",
            joinedDate: "2026-11-19",
          },
          {
            id: "emp-002",
            empId: "002",
            name: "kasun",
            phone: "07845193",
            salaryType: "MONTHLY",
            basicSalary: 50000,
            mealCost: 0,
            epfEtf: 0,
            status: "ACTIVE",
            department: "Operations",
            designation: "Operations Lead",
            joinedDate: "2026-11-19",
          },
        ];
      }
    }

    setEmployees(loadedEmployees);
    try {
      localStorage.setItem("truehive_employees_cache", JSON.stringify(loadedEmployees));
    } catch {}

    // 2. Fetch Attendance for selected attendanceDate
    await loadAttendanceForDate(attendanceDate, loadedEmployees);

    // 3. Fetch Advances & Salary Sheet
    await loadPayrollData(salaryMonth, salaryYear, loadedEmployees);

    setIsLoading(false);
  }, [attendanceDate, salaryMonth, salaryYear]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load attendance for date
  const loadAttendanceForDate = async (targetDate: string, currentEmps = employees) => {
    let list: AttendanceItem[] = [];
    try {
      const res = await fetch(`/api/hrm/attendance?date=${targetDate}`);
      if (res.ok) {
        const d = await res.json();
        if (d.attendance && Array.isArray(d.attendance)) {
          list = d.attendance;
        }
      }
    } catch {}

    if (list.length === 0) {
      // Local fallback
      try {
        const saved = localStorage.getItem(`truehive_attendance_${targetDate}`);
        if (saved) list = JSON.parse(saved);
      } catch {}

      if (list.length === 0) {
        list = currentEmps.map((emp) => ({
          id: `draft-${emp.id}-${targetDate}`,
          employeeId: emp.id,
          empId: emp.empId,
          employeeName: emp.name,
          date: targetDate,
          status: "PRESENT",
          notes: "",
        }));
      }
    }

    setAttendanceRecords(list);
  };

  // Load payroll sheet and advances
  const loadPayrollData = async (m: number, y: number, currentEmps = employees) => {
    let sheetList: SalarySheetRow[] = [];
    let advanceList: AdvanceItem[] = [];
    const monthKey = `${y}-${String(m).padStart(2, "0")}`;

    try {
      const [sheetRes, advRes] = await Promise.allSettled([
        fetch(`/api/hrm/payroll/sheet?month=${m}&year=${y}`),
        fetch(`/api/hrm/advances?month=${monthKey}`),
      ]);

      if (sheetRes.status === "fulfilled" && sheetRes.value.ok) {
        const d = await sheetRes.value.json();
        if (d.sheet && Array.isArray(d.sheet)) {
          sheetList = d.sheet;
          if (d.totals) setSalaryTotals(d.totals);
        }
      }

      if (advRes.status === "fulfilled" && advRes.value.ok) {
        const d = await advRes.value.json();
        if (d.advances && Array.isArray(d.advances)) {
          advanceList = d.advances;
        }
      }
    } catch {}

    // Local fallback for advances & calculation if offline
    if (advanceList.length === 0) {
      try {
        const savedAdv = localStorage.getItem("truehive_advances_cache");
        if (savedAdv) {
          const parsed = JSON.parse(savedAdv);
          if (Array.isArray(parsed)) {
            advanceList = parsed.filter((a) => a.date?.startsWith(monthKey));
          }
        }
      } catch {}
    }
    setAdvances(advanceList);

    if (sheetList.length === 0) {
      let bTotal = 0;
      let aTotal = 0;
      let nTotal = 0;

      sheetList = currentEmps.map((emp) => {
        const empAdvTotal = advanceList
          .filter((a) => a.employeeId === emp.id || a.empId === emp.empId)
          .reduce((sum, a) => sum + Number(a.advanceAmount), 0);

        const base = emp.basicSalary;
        const total = Math.max(0, base - emp.mealCost - emp.epfEtf - empAdvTotal);

        bTotal += base;
        aTotal += empAdvTotal;
        nTotal += total;

        return {
          id: `sheet-${emp.id}-${monthKey}`,
          employeeId: emp.id,
          empId: emp.empId,
          employeeName: emp.name,
          phone: emp.phone,
          type: emp.salaryType === "MONTHLY" ? "Monthly" : "Daily",
          rate: emp.basicSalary,
          workingDays: 1,
          baseSalary: base,
          serviceCharges: 0,
          bonus: 0,
          mealCost: emp.mealCost,
          epfEtf: emp.epfEtf,
          advanced: empAdvTotal,
          totalSalaryForMonth: total,
          status: "OPEN",
        };
      });

      setSalaryTotals({
        totalBaseSalaries: bTotal,
        totalAdvances: aTotal,
        totalNetSalaries: nTotal,
      });
    }

    setSalarySheet(sheetList);
  };

  // ==========================================
  // EMPLOYEE DIRECTORY HANDLERS
  // ==========================================
  const handleOpenAddEmployee = () => {
    // Generate next empId e.g. "003"
    let nextId = "001";
    if (employees.length > 0) {
      const numbers = employees
        .map((e) => parseInt(e.empId, 10))
        .filter((n) => !isNaN(n));
      if (numbers.length > 0) {
        nextId = String(Math.max(...numbers) + 1).padStart(3, "0");
      }
    }

    setEditingEmployee(null);
    setEmpForm({
      empId: nextId,
      name: "",
      phone: "",
      email: "",
      salaryType: "MONTHLY",
      basicSalary: "",
      mealCost: "0",
      epfEtf: "0",
      department: "Operations",
      designation: "Staff",
      status: "ACTIVE",
      joinedDate: new Date().toISOString().split("T")[0],
    });
    setShowEmployeeModal(true);
  };

  const handleOpenEditEmployee = (emp: EmployeeItem) => {
    setEditingEmployee(emp);
    setEmpForm({
      empId: emp.empId,
      name: emp.name,
      phone: emp.phone || "",
      email: emp.email || "",
      salaryType: emp.salaryType,
      basicSalary: String(emp.basicSalary),
      mealCost: String(emp.mealCost),
      epfEtf: String(emp.epfEtf),
      department: emp.department || "Operations",
      designation: emp.designation || "Staff",
      status: emp.status,
      joinedDate: emp.joinedDate ? emp.joinedDate.split("T")[0] : new Date().toISOString().split("T")[0],
    });
    setShowEmployeeModal(true);
  };

  const handleSaveEmployee = async () => {
    if (!empForm.name.trim() || !empForm.basicSalary) {
      alert("Please fill in Employee Name and Basic Salary.");
      return;
    }

    const payload = {
      empId: empForm.empId.trim(),
      name: empForm.name.trim(),
      phone: empForm.phone.trim() || null,
      email: empForm.email.trim() || null,
      salaryType: empForm.salaryType,
      basicSalary: Number(empForm.basicSalary) || 0,
      mealCost: Number(empForm.mealCost) || 0,
      epfEtf: Number(empForm.epfEtf) || 0,
      department: empForm.department.trim(),
      designation: empForm.designation.trim(),
      status: empForm.status,
      joinedDate: empForm.joinedDate,
    };

    try {
      if (editingEmployee) {
        await fetch(`/api/hrm/employees/${editingEmployee.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/hrm/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
    } catch {}

    // Update local state
    if (editingEmployee) {
      const updated = employees.map((e) =>
        e.id === editingEmployee.id
          ? {
              ...e,
              ...payload,
              phone: payload.phone || undefined,
              email: payload.email || undefined,
            }
          : e
      );
      setEmployees(updated);
      try {
        localStorage.setItem("truehive_employees_cache", JSON.stringify(updated));
      } catch {}
    } else {
      const newEmp: EmployeeItem = {
        id: `emp-${Date.now()}`,
        ...payload,
        phone: payload.phone || undefined,
        email: payload.email || undefined,
      };
      const updated = [...employees, newEmp];
      setEmployees(updated);
      try {
        localStorage.setItem("truehive_employees_cache", JSON.stringify(updated));
      } catch {}
    }

    setShowEmployeeModal(false);
    // Refresh payroll sheet with new employee
    loadPayrollData(salaryMonth, salaryYear);
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Are you sure you want to remove this employee record?")) return;

    try {
      await fetch(`/api/hrm/employees/${id}`, { method: "DELETE" });
    } catch {}

    const updated = employees.filter((e) => e.id !== id);
    setEmployees(updated);
    try {
      localStorage.setItem("truehive_employees_cache", JSON.stringify(updated));
    } catch {}
  };

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (statusFilter !== "ALL" && emp.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mId = emp.empId.toLowerCase().includes(q);
        const mName = emp.name.toLowerCase().includes(q);
        const mPhone = emp.phone?.toLowerCase().includes(q) ?? false;
        if (!mId && !mName && !mPhone) return false;
      }
      return true;
    });
  }, [employees, searchQuery, statusFilter]);

  // ==========================================
  // DAILY ATTENDANCE HANDLERS
  // ==========================================
  const handleStatusChange = (
    employeeId: string,
    newStatus: "PRESENT" | "HALF_DAY" | "ABSENT" | "LEAVE"
  ) => {
    setAttendanceRecords((prev) =>
      prev.map((r) => (r.employeeId === employeeId ? { ...r, status: newStatus } : r))
    );
  };

  const handleNoteChange = (employeeId: string, note: string) => {
    setAttendanceRecords((prev) =>
      prev.map((r) => (r.employeeId === employeeId ? { ...r, notes: note } : r))
    );
  };

  const handleSaveAttendance = async () => {
    setIsSavingAttendance(true);
    try {
      await fetch("/api/hrm/attendance/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: attendanceDate,
          records: attendanceRecords.map((r) => ({
            employeeId: r.employeeId,
            status: r.status,
            notes: r.notes,
          })),
        }),
      });
    } catch {}

    try {
      localStorage.setItem(
        `truehive_attendance_${attendanceDate}`,
        JSON.stringify(attendanceRecords)
      );
    } catch {}

    setIsSavingAttendance(false);
    setAttendanceSaveSuccess(true);
    setTimeout(() => setAttendanceSaveSuccess(false), 2500);

    // Recompute salary sheet to reflect new attendance units
    loadPayrollData(salaryMonth, salaryYear);
  };

  const handleOpenMonthlyAttendanceReport = async () => {
    try {
      const res = await fetch(
        `/api/hrm/attendance/monthly-report?month=${reportMonth}&year=${reportYear}`
      );
      if (res.ok) {
        const d = await res.json();
        if (d.report) {
          setAttendanceReportData(d.report);
          setShowAttendanceReportModal(true);
          return;
        }
      }
    } catch {}

    // Fallback simulation for report
    const fallback = employees.map((emp) => ({
      employeeId: emp.id,
      empId: emp.empId,
      employeeName: emp.name,
      presentDays: 1,
      halfDays: 0,
      leaves: 0,
      absents: 0,
      totalWorkingDays: 1,
    }));
    setAttendanceReportData(fallback);
    setShowAttendanceReportModal(true);
  };

  // Export Attendance CSV
  const handleExportAttendanceCsv = () => {
    const headers = ["Date", "EMP ID", "Employee Name", "Attendance Status", "Notes"];
    const rows = attendanceRecords.map((r) => [
      attendanceDate,
      r.empId,
      `"${r.employeeName.replace(/"/g, '""')}"`,
      r.status,
      `"${(r.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_${attendanceDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // SALARY & ADVANCES HANDLERS
  // ==========================================
  const handleOpenLogAdvance = (empId?: string) => {
    setAdvanceForm({
      employeeId: empId || (employees[0]?.id || ""),
      date: new Date().toISOString().split("T")[0],
      amount: "",
      note: "",
    });
    setShowAdvanceModal(true);
  };

  const handleSaveAdvance = async () => {
    const amt = Number(advanceForm.amount);
    if (!advanceForm.employeeId || isNaN(amt) || amt <= 0) {
      alert("Please select an employee and enter a valid advance amount.");
      return;
    }

    const targetEmp = employees.find((e) => e.id === advanceForm.employeeId);
    if (!targetEmp) return;

    try {
      await fetch("/api/hrm/advances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: targetEmp.id,
          amount: amt,
          date: advanceForm.date,
          notes: advanceForm.note,
        }),
      });
    } catch {}

    const newAdv: AdvanceItem = {
      id: `adv-${Date.now()}`,
      date: advanceForm.date,
      empId: targetEmp.empId,
      employeeId: targetEmp.id,
      employeeName: targetEmp.name,
      advanceAmount: amt,
      note: advanceForm.note || "Salary Advance",
      status: "PAID",
    };

    const updatedAdvances = [newAdv, ...advances];
    setAdvances(updatedAdvances);
    try {
      localStorage.setItem("truehive_advances_cache", JSON.stringify(updatedAdvances));
    } catch {}

    // Deduct advance immediately from monthly salary sheet
    setSalarySheet((prev) =>
      prev.map((row) => {
        if (row.employeeId === targetEmp.id) {
          const newAdvSum = row.advanced + amt;
          const newTotal = Math.max(
            0,
            row.baseSalary + row.serviceCharges + row.bonus - row.mealCost - row.epfEtf - newAdvSum
          );
          return {
            ...row,
            advanced: newAdvSum,
            totalSalaryForMonth: newTotal,
          };
        }
        return row;
      })
    );

    // Update totals
    setSalaryTotals((prev) => ({
      ...prev,
      totalAdvances: prev.totalAdvances + amt,
      totalNetSalaries: Math.max(0, prev.totalNetSalaries - amt),
    }));

    setShowAdvanceModal(false);
  };

  const handleDeleteAdvance = async (advId: string) => {
    if (!confirm("Are you sure you want to delete this salary advance?")) return;

    const target = advances.find((a) => a.id === advId);
    if (!target) return;

    try {
      await fetch(`/api/hrm/advances/${advId}`, { method: "DELETE" });
    } catch {}

    const updated = advances.filter((a) => a.id !== advId);
    setAdvances(updated);
    try {
      localStorage.setItem("truehive_advances_cache", JSON.stringify(updated));
    } catch {}

    // Recompute salary sheet to add back deducted advance
    setSalarySheet((prev) =>
      prev.map((row) => {
        if (row.employeeId === target.employeeId) {
          const newAdvSum = Math.max(0, row.advanced - target.advanceAmount);
          const newTotal = Math.max(
            0,
            row.baseSalary + row.serviceCharges + row.bonus - row.mealCost - row.epfEtf - newAdvSum
          );
          return {
            ...row,
            advanced: newAdvSum,
            totalSalaryForMonth: newTotal,
          };
        }
        return row;
      })
    );

    setSalaryTotals((prev) => ({
      ...prev,
      totalAdvances: Math.max(0, prev.totalAdvances - target.advanceAmount),
      totalNetSalaries: prev.totalNetSalaries + target.advanceAmount,
    }));
  };

  const handleUpdatePayrollStatus = async (
    employeeId: string,
    newStatus: "OPEN" | "APPROVED" | "PAID"
  ) => {
    try {
      await fetch("/api/hrm/payroll/sheet/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          month: salaryMonth,
          year: salaryYear,
          status: newStatus,
        }),
      });
    } catch {}

    setSalarySheet((prev) =>
      prev.map((r) => (r.employeeId === employeeId ? { ...r, status: newStatus } : r))
    );
  };

  // Export Salary Sheet CSV
  const handleExportSalarySheetCsv = () => {
    const headers = [
      "EMP ID",
      "Employee Name",
      "Type",
      "Rate (LKR)",
      "Working Days",
      "Base Salary",
      "Service Charges",
      "Bonus",
      "Meal Cost",
      "EPF/ETF",
      "Advanced Deducted",
      "Total Net Salary",
      "Status",
    ];

    const rows = salarySheet.map((r) => [
      r.empId,
      `"${r.employeeName.replace(/"/g, '""')}"`,
      r.type,
      r.rate.toFixed(2),
      r.workingDays,
      r.baseSalary.toFixed(2),
      r.serviceCharges.toFixed(2),
      r.bonus.toFixed(2),
      r.mealCost.toFixed(2),
      r.epfEtf.toFixed(2),
      r.advanced.toFixed(2),
      r.totalSalaryForMonth.toFixed(2),
      r.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Salary_Sheet_${salaryYear}_${salaryMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Employee Management & Payroll
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Centralized HR master directory, daily attendance tracking, salary advances, and monthly payroll sheets.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadInitialData}
            disabled={isLoading}
            className="border-slate-700 hover:bg-slate-800 text-slate-300"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleOpenAddEmployee}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/25"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Main 3 LKpos Tabs (Page 2, 4, 6 in Report) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar whitespace-nowrap">
        <button
          onClick={() => setActiveTab("DIRECTORY")}
          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "DIRECTORY"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Users className="w-4 h-4" />
          Employee Directory
        </button>

        <button
          onClick={() => setActiveTab("ATTENDANCE")}
          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "ATTENDANCE"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          Daily Attendance
        </button>

        <button
          onClick={() => setActiveTab("PAYROLL")}
          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "PAYROLL"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Banknote className="w-4 h-4" />
          Salary & Advances
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EMPLOYEE DIRECTORY (LKpos UI Reference Page 2) */}
      {/* ========================================================================= */}
      {activeTab === "DIRECTORY" && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-slate-400">Status:</span>
              {["ALL", "ACTIVE", "INACTIVE"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    statusFilter === st
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Employee Directory Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="w-full overflow-x-auto no-scrollbar">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 font-bold text-slate-300">EMP ID</th>
                    <th className="py-3.5 px-4">Employee Name</th>
                    <th className="py-3.5 px-4">Phone Number</th>
                    <th className="py-3.5 px-4 font-bold text-slate-300 text-right">
                      Basic / Daily Salary
                    </th>
                    <th className="py-3.5 px-3 text-right">Meal Cost</th>
                    <th className="py-3.5 px-3 text-right">ETF/EPF</th>
                    <th className="py-3.5 px-3 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Joined Date</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                        <Users className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
                        No employees found. Click "+ Add Employee" to create your first employee record.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* EMP ID */}
                        <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                          {emp.empId}
                        </td>

                        {/* Name */}
                        <td className="py-3.5 px-4 font-sans font-semibold text-white whitespace-nowrap">
                          <div>{emp.name}</div>
                          {emp.designation && (
                            <div className="text-[11px] font-mono text-slate-500 font-normal">
                              {emp.designation} • {emp.department}
                            </div>
                          )}
                        </td>

                        {/* Phone */}
                        <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                          {emp.phone || "—"}
                        </td>

                        {/* Basic / Daily Salary */}
                        <td className="py-3.5 px-4 font-bold text-white text-right whitespace-nowrap">
                          Rs. {emp.basicSalary.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>

                        {/* Meal Cost */}
                        <td className="py-3.5 px-3 text-rose-400 text-right whitespace-nowrap">
                          Rs. {emp.mealCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>

                        {/* ETF/EPF */}
                        <td className="py-3.5 px-3 text-rose-400 text-right whitespace-nowrap">
                          Rs. {emp.epfEtf.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap font-sans">
                          {emp.status === "ACTIVE" ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Joined Date */}
                        <td className="py-3.5 px-4 text-center text-slate-400 whitespace-nowrap">
                          {emp.joinedDate ? emp.joinedDate.split("T")[0] : "—"}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap font-sans">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              title="Edit Employee"
                              onClick={() => handleOpenEditEmployee(emp)}
                              className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              title="Delete Employee"
                              onClick={() => handleDeleteEmployee(emp.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DAILY ATTENDANCE (LKpos UI Reference Page 4) */}
      {/* ========================================================================= */}
      {activeTab === "ATTENDANCE" && (
        <div className="space-y-4">
          {/* Top Control Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Date selector & Save button */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300">Select Date:</span>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => {
                    const newD = e.target.value;
                    setAttendanceDate(newD);
                    loadAttendanceForDate(newD);
                  }}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <Button
                size="sm"
                onClick={handleSaveAttendance}
                disabled={isSavingAttendance}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md"
              >
                {isSavingAttendance ? (
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : attendanceSaveSuccess ? (
                  <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-300" />
                ) : (
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                )}
                {attendanceSaveSuccess ? "Saved!" : "Save Attendance"}
              </Button>
            </div>

            {/* Right: Month End Report controls (Excel / PDF) */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-400">Month End Report:</span>
              <select
                value={reportMonth}
                onChange={(e) => setReportMonth(Number(e.target.value))}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {monthNames.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={reportYear}
                onChange={(e) => setReportYear(Number(e.target.value))}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAttendanceCsv}
                className="border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> Excel
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenMonthlyAttendanceReport}
                className="border-rose-500/30 hover:bg-rose-500/10 text-rose-400"
              >
                <FileText className="w-3.5 h-3.5 mr-1" /> PDF
              </Button>
            </div>
          </div>

          {/* Daily Attendance Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="w-full overflow-x-auto no-scrollbar">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 font-bold text-slate-300 w-24">EMP ID</th>
                    <th className="py-3.5 px-4 w-60">Employee Name</th>
                    <th className="py-3.5 px-4 text-center">Attendance Status</th>
                    <th className="py-3.5 px-4">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-500 font-sans">
                        No employees found for this date.
                      </td>
                    </tr>
                  ) : (
                    attendanceRecords.map((item) => (
                      <tr key={item.employeeId} className="hover:bg-slate-800/40 transition-colors">
                        {/* EMP ID */}
                        <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                          {item.empId}
                        </td>

                        {/* Name */}
                        <td className="py-3 px-4 font-sans font-semibold text-white whitespace-nowrap">
                          {item.employeeName}
                        </td>

                        {/* Status Buttons */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                            {/* Present */}
                            <button
                              onClick={() => handleStatusChange(item.employeeId, "PRESENT")}
                              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                                item.status === "PRESENT"
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              Present
                            </button>

                            {/* Half Day */}
                            <button
                              onClick={() => handleStatusChange(item.employeeId, "HALF_DAY")}
                              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                                item.status === "HALF_DAY"
                                  ? "bg-amber-600 text-white shadow-sm"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              Half Day
                            </button>

                            {/* Absent */}
                            <button
                              onClick={() => handleStatusChange(item.employeeId, "ABSENT")}
                              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                                item.status === "ABSENT"
                                  ? "bg-rose-600 text-white shadow-sm"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              Absent
                            </button>

                            {/* Leave */}
                            <button
                              onClick={() => handleStatusChange(item.employeeId, "LEAVE")}
                              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                                item.status === "LEAVE"
                                  ? "bg-cyan-600 text-white shadow-sm"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              Leave
                            </button>
                          </div>
                        </td>

                        {/* Notes Input */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) => handleNoteChange(item.employeeId, e.target.value)}
                            placeholder="Add note..."
                            className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-sans"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SALARY & ADVANCES (LKpos UI Reference Pages 6, 7 & 8) */}
      {/* ========================================================================= */}
      {activeTab === "PAYROLL" && (
        <div className="space-y-6">
          {/* SECTION A: Monthly Salary Sheet */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Monthly Salary Sheet
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={salaryMonth}
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    setSalaryMonth(m);
                    loadPayrollData(m, salaryYear);
                  }}
                  className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {monthNames.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>

                <select
                  value={salaryYear}
                  onChange={(e) => {
                    const y = Number(e.target.value);
                    setSalaryYear(y);
                    loadPayrollData(salaryMonth, y);
                  }}
                  className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {[2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportSalarySheetCsv}
                  className="border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> Excel
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSalaryReportModal(true)}
                  className="border-rose-500/30 hover:bg-rose-500/10 text-rose-400"
                >
                  <FileText className="w-3.5 h-3.5 mr-1" /> PDF
                </Button>
              </div>
            </div>

            {/* Salary Sheet Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="w-full overflow-x-auto no-scrollbar">
                <table className="w-full min-w-[950px] text-left text-sm">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3 font-bold text-slate-300">EMP ID</th>
                      <th className="py-3 px-3">Employee Name</th>
                      <th className="py-3 px-2">Type</th>
                      <th className="py-3 px-3 text-right">Rate (Basic/Daily)</th>
                      <th className="py-3 px-2 text-center">Working Days</th>
                      <th className="py-3 px-3 text-right">Base Salary</th>
                      <th className="py-3 px-2 text-right">Service Charges</th>
                      <th className="py-3 px-2 text-right">Bonus</th>
                      <th className="py-3 px-2 text-right">Meal Cost</th>
                      <th className="py-3 px-2 text-right">ETF/EPF</th>
                      <th className="py-3 px-3 text-right text-rose-400 font-bold">Advanced</th>
                      <th className="py-3 px-3 text-right font-bold text-blue-400">
                        Total Salary for Month
                      </th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    {salarySheet.length === 0 ? (
                      <tr>
                        <td colSpan={14} className="py-12 text-center text-slate-500 font-sans">
                          No payroll data available for this month.
                        </td>
                      </tr>
                    ) : (
                      salarySheet.map((row) => (
                        <tr key={row.employeeId} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                            {row.empId}
                          </td>
                          <td className="py-3 px-3 font-sans font-semibold text-white whitespace-nowrap">
                            {row.employeeName}
                          </td>
                          <td className="py-3 px-2 text-slate-400 whitespace-nowrap">
                            {row.type}
                          </td>
                          <td className="py-3 px-3 text-slate-300 text-right whitespace-nowrap">
                            Rs. {row.rate.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-2 text-center text-slate-300 whitespace-nowrap">
                            {row.workingDays} days
                          </td>
                          <td className="py-3 px-3 text-white text-right whitespace-nowrap">
                            Rs. {row.baseSalary.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-2 text-slate-400 text-right whitespace-nowrap">
                            Rs. {row.serviceCharges.toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-slate-400 text-right whitespace-nowrap">
                            Rs. {row.bonus.toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-rose-400 text-right whitespace-nowrap">
                            Rs. {row.mealCost.toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-rose-400 text-right whitespace-nowrap">
                            Rs. {row.epfEtf.toFixed(2)}
                          </td>
                          {/* Advanced Deducted */}
                          <td className="py-3 px-3 text-rose-400 font-bold text-right whitespace-nowrap">
                            Rs. {row.advanced.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          {/* Total Salary for Month */}
                          <td className="py-3 px-3 text-blue-400 font-black text-right whitespace-nowrap">
                            Rs. {row.totalSalaryForMonth.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          {/* Status */}
                          <td className="py-3 px-3 text-center whitespace-nowrap font-sans">
                            {row.status === "PAID" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Paid
                              </span>
                            )}
                            {row.status === "APPROVED" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                Approved
                              </span>
                            )}
                            {row.status === "OPEN" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Open
                              </span>
                            )}
                          </td>
                          {/* Actions: Payslip & Status toggle */}
                          <td className="py-3 px-3 text-center whitespace-nowrap font-sans">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                title="View Legal Payslip"
                                onClick={() => setPayslipEmployee(row)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-colors"
                              >
                                Payslip
                              </button>
                              {row.status !== "PAID" && (
                                <button
                                  title="Mark as Paid"
                                  onClick={() => handleUpdatePayrollStatus(row.employeeId, "PAID")}
                                  className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition-colors"
                                >
                                  Pay
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SECTION B: Individual Salary Advances Log (Page 6 & 7) */}
          <div className="space-y-3 pt-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  Individual Salary Advances Log
                </h3>
              </div>

              <Button
                size="sm"
                onClick={() => handleOpenLogAdvance()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Log Salary Advance
              </Button>
            </div>

            {/* Advances Log Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">DATE</th>
                      <th className="py-3 px-4">EMP ID</th>
                      <th className="py-3 px-4">EMPLOYEE NAME</th>
                      <th className="py-3 px-4 text-right">ADVANCE AMOUNT</th>
                      <th className="py-3 px-4">NOTE</th>
                      <th className="py-3 px-4 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    {advances.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                          No advances logged for this month.
                        </td>
                      </tr>
                    ) : (
                      advances.map((adv) => (
                        <tr key={adv.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                            {adv.date}
                          </td>
                          <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                            {adv.empId}
                          </td>
                          <td className="py-3 px-4 font-sans font-semibold text-white whitespace-nowrap">
                            {adv.employeeName}
                          </td>
                          <td className="py-3 px-4 font-bold text-rose-400 text-right whitespace-nowrap">
                            Rs. {adv.advanceAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-sans whitespace-nowrap">
                            {adv.note || "—"}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap font-sans">
                            <button
                              onClick={() => handleDeleteAdvance(adv.id)}
                              className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. ADD / EDIT EMPLOYEE MODAL (LKpos Reference Page 3) */}
      {/* ========================================================================= */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingEmployee ? "Edit Employee" : "Add New Employee"}
              </h3>
              <button
                onClick={() => setShowEmployeeModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Employee ID */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Employee ID (Emp ID) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={empForm.empId}
                  onChange={(e) => setEmpForm({ ...empForm, empId: e.target.value })}
                  placeholder="e.g. W04 or 001"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Employee Name */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Employee Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={empForm.name}
                  onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                  placeholder="Full Name"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={empForm.phone}
                  onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                  placeholder="Contact number"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Salary Type */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Salary Type <span className="text-rose-400">*</span>
                </label>
                <select
                  value={empForm.salaryType}
                  onChange={(e) =>
                    setEmpForm({
                      ...empForm,
                      salaryType: e.target.value as "MONTHLY" | "DAILY",
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="MONTHLY">Monthly Basis</option>
                  <option value="DAILY">Daily Basis</option>
                </select>
              </div>

              {/* Basic Salary */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Basic Salary (LKR) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  value={empForm.basicSalary}
                  onChange={(e) => setEmpForm({ ...empForm, basicSalary: e.target.value })}
                  placeholder="e.g. 20000"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Default Meal Cost & ETF/EPF */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Default Meal Cost (LKR)
                  </label>
                  <input
                    type="number"
                    value={empForm.mealCost}
                    onChange={(e) => setEmpForm({ ...empForm, mealCost: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Default ETF/EPF (LKR)
                  </label>
                  <input
                    type="number"
                    value={empForm.epfEtf}
                    onChange={(e) => setEmpForm({ ...empForm, epfEtf: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Department & Designation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Department</label>
                  <input
                    type="text"
                    value={empForm.department}
                    onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
                    placeholder="e.g. Operations"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Designation</label>
                  <input
                    type="text"
                    value={empForm.designation}
                    onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })}
                    placeholder="e.g. Assistant"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Status & Joined Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Status <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={empForm.status}
                    onChange={(e) =>
                      setEmpForm({
                        ...empForm,
                        status: e.target.value as "ACTIVE" | "INACTIVE",
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Joined Date</label>
                  <input
                    type="date"
                    value={empForm.joinedDate}
                    onChange={(e) => setEmpForm({ ...empForm, joinedDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmployeeModal(false)}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEmployee}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
              >
                Save Employee
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. LOG SALARY ADVANCE MODAL (LKpos Reference Page 8) */}
      {/* ========================================================================= */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Log Salary Advance</h3>
              <button
                onClick={() => setShowAdvanceModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Select Employee */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Select Employee <span className="text-rose-400">*</span>
                </label>
                <select
                  value={advanceForm.employeeId}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Select Employee --</option>
                  {employees
                    .filter((e) => e.status === "ACTIVE")
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.empId} - {emp.name} (Basic: Rs. {emp.basicSalary.toLocaleString()})
                      </option>
                    ))}
                </select>
              </div>

              {/* Advance Date */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Advance Date <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={advanceForm.date}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Advance Amount */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Advance Amount (LKR) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  value={advanceForm.amount}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Note / Reference */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Note / Reference</label>
                <input
                  type="text"
                  value={advanceForm.note}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, note: e.target.value })}
                  placeholder="e.g. Festival Advance, Mid-month loan"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanceModal(false)}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAdvance}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
              >
                Log Advance
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MONTHLY ATTENDANCE REPORT PREVIEW MODAL (LKpos Page 5) */}
      {/* ========================================================================= */}
      {showAttendanceReportModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-4 sm:p-6 space-y-4 shadow-2xl my-4 sm:my-8 overscroll-contain">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-400" /> Attendance Report Preview
              </h3>
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
                <Button
                  size="sm"
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" /> Print / Save as PDF
                </Button>
                <button
                  onClick={() => setShowAttendanceReportModal(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Sheet */}
            <div
              ref={reportPrintRef}
              className="bg-white text-slate-950 p-4 sm:p-8 rounded-xl shadow-inner font-sans space-y-5"
            >
              {/* Header */}
              <div className="text-center space-y-1 border-b border-slate-200 pb-4">
                <h2 className="text-2xl font-black tracking-tight">TrueHive</h2>
                <p className="text-xs text-slate-600">Bandaranayake Mawatha | Phone: +94765731249</p>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 mt-2">
                  MONTHLY ATTENDANCE REPORT
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Month: {monthNames[reportMonth - 1]} {reportYear} | Generated:{" "}
                  {new Date().toLocaleDateString("en-GB")}
                </p>
              </div>

              {/* Report Table */}
              <div className="w-full overflow-x-auto no-scrollbar">
                <table className="w-full min-w-[650px] text-xs text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300">EMP ID</th>
                    <th className="p-2 border-r border-slate-300">EMPLOYEE NAME</th>
                    <th className="p-2 border-r border-slate-300 text-center">PRESENT DAYS</th>
                    <th className="p-2 border-r border-slate-300 text-center">HALF DAYS</th>
                    <th className="p-2 border-r border-slate-300 text-center">LEAVES</th>
                    <th className="p-2 border-r border-slate-300 text-center">ABSENTS</th>
                    <th className="p-2 text-center font-black">TOTAL WORKING DAYS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {attendanceReportData.map((row) => (
                    <tr key={row.employeeId} className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200 font-bold">{row.empId}</td>
                      <td className="p-2 border-r border-slate-200 font-sans font-semibold">
                        {row.employeeName}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center">{row.presentDays}</td>
                      <td className="p-2 border-r border-slate-200 text-center">{row.halfDays}</td>
                      <td className="p-2 border-r border-slate-200 text-center">{row.leaves}</td>
                      <td className="p-2 border-r border-slate-200 text-center">{row.absents}</td>
                      <td className="p-2 text-center font-bold">{row.totalWorkingDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

              <div className="pt-8 flex justify-between text-xs text-slate-500">
                <div>Authorized Signature: ________________________</div>
                <div>Date: {new Date().toISOString().split("T")[0]}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MONTHLY SALARY SHEET REPORT PREVIEW MODAL (LKpos Page 9) */}
      {/* ========================================================================= */}
      {showSalaryReportModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full p-4 sm:p-6 space-y-4 shadow-2xl my-4 sm:my-8 overscroll-contain">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-400" /> Monthly Salary Sheet Report
              </h3>
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
                <Button
                  size="sm"
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" /> Print / Save as PDF
                </Button>
                <button
                  onClick={() => setShowSalaryReportModal(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Sheet */}
            <div className="bg-white text-slate-950 p-4 sm:p-8 rounded-xl shadow-inner font-sans space-y-5 text-xs">
              {/* Header */}
              <div className="text-center space-y-1 border-b border-slate-200 pb-4">
                <h2 className="text-2xl font-black tracking-tight">TrueHive</h2>
                <p className="text-xs text-slate-600">Bandaranayake Mawatha | Phone: +94765731249</p>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 mt-2">
                  MONTHLY SALARY SHEET REPORT
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Month: {monthNames[salaryMonth - 1]} {salaryYear} | Generated:{" "}
                  {new Date().toLocaleDateString("en-GB")} {new Date().toLocaleTimeString()}
                </p>
              </div>

              {/* Table */}
              <div className="w-full overflow-x-auto no-scrollbar">
                <table className="w-full min-w-[950px] text-[11px] text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[9px] border-b border-slate-300">
                    <th className="p-1.5 border-r border-slate-300">EMP ID</th>
                    <th className="p-1.5 border-r border-slate-300">EMPLOYEE NAME</th>
                    <th className="p-1.5 border-r border-slate-300">TYPE</th>
                    <th className="p-1.5 border-r border-slate-300 text-right">RATE</th>
                    <th className="p-1.5 border-r border-slate-300 text-center">DAYS</th>
                    <th className="p-1.5 border-r border-slate-300 text-right">BASE SALARY</th>
                    <th className="p-1.5 border-r border-slate-300 text-right">SERV. CHARGE</th>
                    <th className="p-1.5 border-r border-slate-300 text-right">BONUS</th>
                    <th className="p-1.5 border-r border-slate-300 text-right">MEAL COST</th>
                    <th className="p-1.5 border-r border-slate-300 text-right">EPF/ETF</th>
                    <th className="p-1.5 border-r border-slate-300 text-right font-bold text-rose-700">ADVANCES</th>
                    <th className="p-1.5 border-r border-slate-300 text-right font-bold text-blue-800">NET SALARY</th>
                    <th className="p-1.5 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {salarySheet.map((r) => (
                    <tr key={r.employeeId} className="hover:bg-slate-50">
                      <td className="p-1.5 border-r border-slate-200 font-bold">{r.empId}</td>
                      <td className="p-1.5 border-r border-slate-200 font-sans font-semibold">
                        {r.employeeName}
                      </td>
                      <td className="p-1.5 border-r border-slate-200">{r.type}</td>
                      <td className="p-1.5 border-r border-slate-200 text-right">
                        Rs.{r.rate.toFixed(2)}
                      </td>
                      <td className="p-1.5 border-r border-slate-200 text-center">{r.workingDays}</td>
                      <td className="p-1.5 border-r border-slate-200 text-right">
                        Rs.{r.baseSalary.toFixed(2)}
                      </td>
                      <td className="p-1.5 border-r border-slate-200 text-right">
                        Rs.{r.serviceCharges.toFixed(2)}
                      </td>
                      <td className="p-1.5 border-r border-slate-200 text-right">
                        Rs.{r.bonus.toFixed(2)}
                      </td>
                      <td className="p-1.5 border-r border-slate-200 text-right text-rose-700">
                        Rs.{r.mealCost.toFixed(2)}
                      </td>
                      <td className="p-1.5 border-r border-slate-200 text-right text-rose-700">
                        Rs.{r.epfEtf.toFixed(2)}
                      </td>
                      <td className="p-1.5 border-r border-slate-200 text-right font-bold text-rose-700">
                        Rs.{r.advanced.toFixed(2)}
                      </td>
                      <td className="p-1.5 border-r border-slate-200 text-right font-bold text-blue-800">
                        Rs.{r.totalSalaryForMonth.toFixed(2)}
                      </td>
                      <td className="p-1.5 text-center font-sans font-bold text-[10px]">
                        {r.status}
                      </td>
                    </tr>
                  ))}
                  {/* TOTALS Row (Figure 9 in Report) */}
                  <tr className="bg-slate-100 font-black border-t-2 border-slate-400">
                    <td colSpan={5} className="p-2 text-right uppercase tracking-wider font-sans">
                      TOTALS:
                    </td>
                    <td className="p-2 text-right border-r border-slate-300">
                      Rs.{salaryTotals.totalBaseSalaries.toFixed(2)}
                    </td>
                    <td className="p-2 text-right border-r border-slate-300">Rs.0.00</td>
                    <td className="p-2 text-right border-r border-slate-300">Rs.0.00</td>
                    <td className="p-2 text-right border-r border-slate-300">Rs.0.00</td>
                    <td className="p-2 text-right border-r border-slate-300">Rs.0.00</td>
                    <td className="p-2 text-right border-r border-slate-300 text-rose-700">
                      Rs.{salaryTotals.totalAdvances.toFixed(2)}
                    </td>
                    <td className="p-2 text-right border-r border-slate-300 text-blue-800">
                      Rs.{salaryTotals.totalNetSalaries.toFixed(2)}
                    </td>
                    <td className="p-2 text-center text-slate-600">ALL</td>
                  </tr>
                </tbody>
              </table>
            </div>

              <div className="pt-8 flex justify-between text-xs text-slate-500">
                <div>Prepared by: ________________________</div>
                <div>Approved by: ________________________</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. INDIVIDUAL EMPLOYEE PAYSLIP MODAL (Report Page 14 Statutory Standard) */}
      {/* ========================================================================= */}
      {payslipEmployee && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" /> Employee Payslip
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" /> Print Payslip
                </Button>
                <button
                  onClick={() => setPayslipEmployee(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Payslip Card Layout */}
            <div className="bg-white text-slate-950 p-6 rounded-xl shadow-inner font-sans space-y-4 text-xs">
              {/* Header */}
              <div className="text-center border-b border-slate-200 pb-3 space-y-1">
                <h3 className="text-xl font-black">TrueHive (Pvt) Ltd</h3>
                <p className="text-[11px] text-slate-600">Bandaranayake Mawatha, Colombo, Sri Lanka</p>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 pt-1">
                  OFFICIAL CONFIDENTIAL PAYSLIP
                </h4>
                <p className="text-[11px] text-slate-500 font-mono">
                  Period: {monthNames[salaryMonth - 1]} {salaryYear}
                </p>
              </div>

              {/* Employee Meta */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Employee</span>
                  <span className="font-bold text-slate-900">{payslipEmployee.employeeName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Emp ID</span>
                  <span className="font-mono font-bold text-slate-900">{payslipEmployee.empId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Pay Basis</span>
                  <span className="font-semibold">{payslipEmployee.type} Basis</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Days Worked</span>
                  <span className="font-semibold">{payslipEmployee.workingDays} Days</span>
                </div>
              </div>

              {/* Breakdown */}
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <div className="bg-slate-100 px-3 py-1.5 font-bold uppercase text-[10px] text-slate-700">
                  Earnings & Deductions Summary
                </div>
                <div className="divide-y divide-slate-100 p-2 font-mono">
                  <div className="flex justify-between py-1">
                    <span className="font-sans">Gross Basic Rate:</span>
                    <span>Rs. {payslipEmployee.rate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-sans">Earned Base Salary:</span>
                    <span>Rs. {payslipEmployee.baseSalary.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600">
                    <span className="font-sans">Employee EPF (8%):</span>
                    <span className="text-rose-600">- Rs. {(payslipEmployee.baseSalary * 0.08).toFixed(2)}</span>
                  </div>
                  {payslipEmployee.advanced > 0 && (
                    <div className="flex justify-between py-1 text-rose-700 font-bold">
                      <span className="font-sans">Advance Already Disbursed / Recovered:</span>
                      <span>- Rs. {payslipEmployee.advanced.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5 font-black text-blue-900 text-sm bg-blue-50 px-2 rounded mt-1">
                    <span className="font-sans">Net Payable Now:</span>
                    <span>Rs. {payslipEmployee.totalSalaryForMonth.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Employer Statutory Contributions */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-[11px] font-mono text-slate-700 space-y-1">
                <div className="font-bold uppercase text-[10px] text-slate-500 font-sans">
                  Employer Statutory Contributions (Not Deducted From Pay)
                </div>
                <div className="flex justify-between">
                  <span>Employer EPF (12%):</span>
                  <span>Rs. {(payslipEmployee.baseSalary * 0.12).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Employer ETF (3%):</span>
                  <span>Rs. {(payslipEmployee.baseSalary * 0.03).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-slate-200">
                  <span>Total Employer Cost:</span>
                  <span>
                    Rs. {(payslipEmployee.baseSalary * 1.15).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
