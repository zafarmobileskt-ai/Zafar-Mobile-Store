import { ShopBackupData } from '../types/mobile';

const EMERGENCY_SNAPSHOT_KEY = 'zafar_mobile_emergency_snapshot_v1';

/**
 * Validates whether the given parsed JSON conforms to a valid ShopBackupData format.
 */
export const validateBackupData = (data: any): { isValid: boolean; reason?: string } => {
  if (!data || typeof data !== 'object') {
    return { isValid: false, reason: 'The file does not contain valid JSON data.' };
  }

  if (!Array.isArray(data.inventory)) {
    return { isValid: false, reason: 'Missing inventory records array in backup file.' };
  }

  if (!Array.isArray(data.sales)) {
    return { isValid: false, reason: 'Missing sales invoices array in backup file.' };
  }

  if (!Array.isArray(data.customers)) {
    return { isValid: false, reason: 'Missing customer/khata records array in backup file.' };
  }

  if (!data.settings || typeof data.settings !== 'object') {
    return { isValid: false, reason: 'Missing store settings configuration in backup file.' };
  }

  return { isValid: true };
};

/**
 * Triggers a direct download of the backup file to the user's phone or computer.
 */
export const exportLocalBackupFile = (data: ShopBackupData, customName?: string) => {
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = customName || `Zafar_Mobile_Shop_Backup_${dateStr}.json`;

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
};

/**
 * Reads a user-selected file from their phone/computer and parses it into ShopBackupData.
 */
export const parseBackupFile = (file: File): Promise<ShopBackupData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const validation = validateBackupData(parsed);

        if (!validation.isValid) {
          reject(new Error(validation.reason || 'Invalid backup structure'));
          return;
        }

        resolve(parsed as ShopBackupData);
      } catch (err: any) {
        reject(new Error(`Failed to parse backup file: ${err.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read backup file from device.'));
    };

    reader.readAsText(file);
  });
};

/**
 * Keeps an automatic safety snapshot in localStorage so unexpected alterations can be rolled back.
 */
export const storeLocalEmergencySnapshot = (data: ShopBackupData) => {
  try {
    localStorage.setItem(EMERGENCY_SNAPSHOT_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Could not store local emergency snapshot:', err);
  }
};

/**
 * Retrieves the last emergency snapshot if available.
 */
export const getLocalEmergencySnapshot = (): ShopBackupData | null => {
  try {
    const raw = localStorage.getItem(EMERGENCY_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const validation = validateBackupData(parsed);
    return validation.isValid ? (parsed as ShopBackupData) : null;
  } catch {
    return null;
  }
};
