import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import type { ApiTransaction, TransactionCategory } from '../services/api';

function formatDate(dateStr: string): string {
  return String(dateStr).split('T')[0] ?? dateStr;
}

function getCategoryName(tx: ApiTransaction): string {
  if (typeof tx.category === 'object' && tx.category !== null && 'name' in tx.category) {
    return (tx.category as TransactionCategory).name;
  }
  return '';
}

function escapeXml(str: string): string {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export async function exportToCSV(data: ApiTransaction[], filename: string): Promise<void> {
  const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Currency'];
  const rows = data.map((item) => [
    formatDate(item.date),
    `"${item.description.replaceAll('"', '""')}"`,
    item.amount,
    item.type,
    `"${getCategoryName(item).replaceAll('"', '""')}"`,
    item.currency,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const path = `${FileSystem.cacheDirectory}${filename}.csv`;
  await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
  await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Export CSV' });
}

export async function exportToXML(data: ApiTransaction[], filename: string): Promise<void> {
  const rows = data
    .map(
      (item) =>
        `  <transaction>\n` +
        `    <date>${formatDate(item.date)}</date>\n` +
        `    <description>${escapeXml(item.description)}</description>\n` +
        `    <amount>${item.amount}</amount>\n` +
        `    <type>${item.type}</type>\n` +
        `    <category>${escapeXml(getCategoryName(item))}</category>\n` +
        `    <currency>${item.currency}</currency>\n` +
        `  </transaction>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<transactions>\n${rows}\n</transactions>`;
  const path = `${FileSystem.cacheDirectory}${filename}.xml`;
  await FileSystem.writeAsStringAsync(path, xml, { encoding: FileSystem.EncodingType.UTF8 });
  await Sharing.shareAsync(path, { mimeType: 'text/xml', dialogTitle: 'Export XML' });
}

export async function exportToPDF(data: ApiTransaction[], filename: string): Promise<void> {
  const rows = data
    .map(
      (item) =>
        `<tr>` +
        `<td>${formatDate(item.date)}</td>` +
        `<td>${escapeXml(item.description)}</td>` +
        `<td>${item.currency} ${item.amount.toFixed(2)}</td>` +
        `<td>${item.type}</td>` +
        `<td>${escapeXml(getCategoryName(item))}</td>` +
        `</tr>`
    )
    .join('');

  const html = `
<html>
  <head>
    <meta charset="UTF-8"/>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
      h1 { color: #6366f1; font-size: 18px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #6366f1; color: #fff; padding: 8px; text-align: left; font-size: 11px; }
      td { padding: 7px 8px; border-bottom: 1px solid #e5e7eb; }
      tr:nth-child(even) td { background: #f9fafb; }
    </style>
  </head>
  <body>
    <h1>Transactions</h1>
    <table>
      <tr>
        <th>Date</th><th>Description</th><th>Amount</th><th>Type</th><th>Category</th>
      </tr>
      ${rows}
    </table>
  </body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const dest = `${FileSystem.cacheDirectory}${filename}.pdf`;
  await FileSystem.moveAsync({ from: uri, to: dest });
  await Sharing.shareAsync(dest, { mimeType: 'application/pdf', dialogTitle: 'Export PDF' });
}
