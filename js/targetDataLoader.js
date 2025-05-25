import { fetchExcelData } from './firebase.js';
import { processExcelData } from './main.js'; // Asumsi processExcelData diekspor dari main.js

// Fungsi untuk memuat dan memproses data Target 3Kiosk
export async function loadTarget3KioskData() {
    console.log('DEBUG: Loading Target 3Kiosk data using targetDataLoader.js');
    try {
        const targetData = await fetchExcelData('target3Kiosk');
        if (targetData && targetData.content) {
            console.log('Target 3Kiosk data fetched successfully by targetDataLoader.');
            const processedTarget = await processExcelData(targetData.content);
            console.log('Target 3Kiosk Data Processed by targetDataLoader:', { headers1: processedTarget.header1, headers2: processedTarget.header2, dataCount: processedTarget.dataRows.length });
            return processedTarget; // Mengembalikan objek yang berisi header1, header2, dan dataRows
        } else {
            console.log('No Target 3Kiosk data found in Firestore by targetDataLoader.');
            return { header1: [], header2: [], dataRows: [] };
        }
    } catch (error) {
        console.error('Error loading Target 3Kiosk data in targetDataLoader:', error);
        return { header1: [], header2: [], dataRows: [] };
    }
} 