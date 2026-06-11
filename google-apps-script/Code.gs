const SHEET_NAME = 'portal_snapshots';
const HEADERS = [
  'saved_at',
  'payload_type',
  'source',
  'client_timestamp',
  'vendor_count',
  'request_count',
  'vendors_json',
  'requests_json'
];

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, message: 'SPMS backup endpoint is running.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  let hasLock = false;

  try {
    lock.waitLock(30000);
    hasLock = true;

    const payload = JSON.parse((e.postData && e.postData.contents) || '{}');
    const sheet = getOrCreateSheet_();
    ensureHeaders_(sheet);

    const vendors = Array.isArray(payload.vendors) ? payload.vendors : [];
    const requests = Array.isArray(payload.requests) ? payload.requests : [];

    sheet.appendRow([
      new Date(),
      payload.type || 'portal_snapshot',
      payload.source || '',
      payload.timestamp || '',
      vendors.length,
      requests.length,
      JSON.stringify(vendors),
      JSON.stringify(requests)
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    if (hasLock) {
      lock.releaseLock();
    }
  }
}

function getOrCreateSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeaders_(sheet) {
  const currentHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeaders = currentHeaders.some(Boolean);

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}
