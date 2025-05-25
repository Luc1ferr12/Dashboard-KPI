// Fungsi untuk memproses data dari file RAW ke DASHBOARD
function processRawToDashboard(rawData, dashboardData) {
    // Membuat map untuk menyimpan data dari kolom 37 (RAW) berdasarkan acuan kolom 1
    const rawDataMap = new Map();
    
    // Mengambil data dari kolom 1 dan 37 dari file RAW mulai row 3
    for (let i = 2; i < rawData.length; i++) {
        const acuan = rawData[i][0]; // Kolom 1 sebagai acuan
        const nilai = rawData[i][36]; // Kolom 37 (index 36)
        
        if (acuan && nilai !== undefined) {
            if (!rawDataMap.has(acuan)) {
                rawDataMap.set(acuan, 0);
            }
            rawDataMap.set(acuan, rawDataMap.get(acuan) + Number(nilai));
        }
    }
    
    // Mengisi data ke kolom 11 di DASHBOARD berdasarkan acuan
    for (let i = 2; i < dashboardData.length; i++) {
        const acuan = dashboardData[i][0]; // Kolom 1 sebagai acuan
        if (acuan && rawDataMap.has(acuan)) {
            dashboardData[i][10] = rawDataMap.get(acuan); // Kolom 11 (index 10)
        }
    }
    
    return dashboardData;
}

// Fungsi untuk memastikan elemen ada sebelum menambahkan event listener
function addEventListenerIfExists(elementId, eventType, handler) {
    const element = document.getElementById(elementId);
    if (element) {
        element.addEventListener(eventType, handler);
    } else {
        console.warn(`Element with id '${elementId}' not found`);
    }
}

// Fungsi untuk menangani upload file
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const pageId = getPageId();
        if (!pageId) {
            console.error('Page ID tidak ditemukan');
            return;
        }

        const result = await uploadExcelFile(file, pageId);
        if (result) {
            alert('File berhasil diupload');
            // Refresh data setelah upload
            await loadExcelData();
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('Gagal mengupload file: ' + error.message);
    }
}

// Fungsi untuk menangani download file
async function handleFileDownload() {
    try {
        const pageId = getPageId();
        if (!pageId) {
            console.error('Page ID tidak ditemukan');
            return;
        }

        const data = await fetchExcelData(pageId);
        if (data) {
            await downloadExcelFile(data);
        } else {
            alert('Tidak ada data yang tersedia untuk diunduh');
        }
    } catch (error) {
        console.error('Error downloading file:', error);
        alert('Gagal mengunduh file: ' + error.message);
    }
}

// Inisialisasi event listeners saat DOM sudah dimuat
document.addEventListener('DOMContentLoaded', () => {
    // Event listener untuk upload file
    addEventListenerIfExists('fileUpload', 'change', handleFileUpload);
    
    // Event listener untuk download file
    addEventListenerIfExists('downloadExcel', 'click', handleFileDownload);
});

// Export fungsi yang diperlukan
export { handleFileUpload, handleFileDownload }; 