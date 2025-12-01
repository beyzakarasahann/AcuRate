/**
 * Export utilities for reports and data
 */

export interface ExportOptions {
  format: 'json' | 'csv' | 'excel';
  filename?: string;
}

/**
 * Export data as JSON
 */
export function exportToJSON(data: any, filename: string = 'export.json') {
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data as CSV
 */
export function exportToCSV(data: any[], filename: string = 'export.csv') {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Handle values that contain commas, quotes, or newlines
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    ),
  ];

  const csvContent = csvRows.join('\n');
  const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data as Excel (using CSV format for now)
 * For full Excel support, install xlsx library
 */
export function exportToExcel(data: any[], filename: string = 'export.xlsx') {
  // For now, export as CSV with .xlsx extension
  // In production, use xlsx library for proper Excel format
  exportToCSV(data, filename.replace('.xlsx', '.csv'));
}

/**
 * Export dashboard report
 */
export function exportDashboardReport(
  stats: any[],
  departments: any[],
  programOutcomes: any[],
  format: 'json' | 'csv' = 'json'
) {
  const reportData = {
    title: 'Institution Dashboard Report',
    date: new Date().toISOString(),
    stats,
    departments,
    programOutcomes,
  };

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `institution-dashboard-report-${timestamp}`;

  if (format === 'csv') {
    // Export as multiple CSV files or combined
    exportToCSV(departments, `${filename}-departments.csv`);
    exportToCSV(programOutcomes, `${filename}-program-outcomes.csv`);
  } else {
    exportToJSON(reportData, `${filename}.json`);
  }
}

/**
 * Export analytics data
 */
export function exportAnalyticsData(
  departments: any[],
  poTrends: any[],
  performance: any,
  courseSuccess: any[],
  format: 'json' | 'csv' = 'json'
) {
  const reportData = {
    title: 'Analytics Report',
    date: new Date().toISOString(),
    departments,
    programOutcomes: poTrends,
    performance,
    courseSuccess,
  };

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `analytics-report-${timestamp}`;

  if (format === 'csv') {
    exportToCSV(departments, `${filename}-departments.csv`);
    exportToCSV(poTrends, `${filename}-po-trends.csv`);
    exportToCSV(courseSuccess, `${filename}-course-success.csv`);
  } else {
    exportToJSON(reportData, `${filename}.json`);
  }
}

