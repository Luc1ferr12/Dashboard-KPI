import { uploadExcelFile, fetchExcelData, downloadExcelFile, db } from './firebase.js';
import { loadTarget3KioskData } from './targetDataLoader.js'; // Import fungsi baru

// Variabel global untuk menyimpan semua data, data yang ditampilkan, dan header
let allTableData = [];
let currentDisplayedData = [];
let currentFilters = {};
let currentViewEntries = 10; // Default view entries
let allFilterOptions = {}; // Menyimpan semua opsi unik untuk filter dropdown

// Variabel global untuk menyimpan header Excel
let globalHeaderRow1 = [];
let globalHeaderRow2 = [];

// Variabel global untuk menyimpan data Target 3Kiosk mentah (digunakan di Dashboard)
let target3KioskRawData = [];
let target3KioskHeaders1 = []; // Header Target 3Kiosk Row 1
let target3KioskHeaders2 = []; // Header Target 3Kiosk Row 2

// Variabel global untuk menyimpan data File RAW mentah (digunakan di Dashboard untuk Achv)
let fileRawActualData = [];
let fileRawActualHeaders1 = [];
let fileRawActualHeaders2 = [];
let rawTradeDemandMtdIndex = -1; // Deklarasi global
let fileRawIdIndex = -1; // Deklarasi global untuk indeks ID File RAW

// Data statis untuk kolom 1, 2, 3 (indeks 0, 1, 2) di halaman dashboard, mulai dari row 3 (indeks 2)
const staticColumn1Data = [
    '1-164182681423',
    '1-181039605590',
    '1-174965311632',
    '1-179435818383',
    '1-187843898779',
    '1-189507518329',
    '1-165030800482',
    '1-189507518230',
    '1-187969367238',
    '1-187969367271',
    '1-181039569030',
    '1-186703155163',
    '1-179432558781',
    '1-174965312210',
    '1-170542349334',
    '1-184203749491',
    '1-168821337284',
    '1-179391411203',
    '1-176576923032'
];

const staticColumn2Data = [
    'KIOSK_DWIYAN HAMKA_ATAMBUA_SELATAN_TIMOR',
    'KIOSK VERONIKA CHERLY LEO MALAKA BARAT TIMOR',
    'KIOSK_DANIEL NDUN_MALAKA_TENGAH_TIMOR',
    'KIOSK YANAURIUS GABRIEL DULI KOTA ATAMBUA TIMOR',
    'KIOSK ELPIS ARDI NGEFAK SEMAU NEW TIMOR',
    'KIOSK NANANG KASIM MUSAJAR TAEBENU KUPANG',
    'KIOSK_IDRIS_KUPANG_TIMOR',
    'KIOSK CHARMING LTHS KEFFI ATPH KUPANG BARAT KUPANG',
    'KIOSK DANIEL NDUN TAKARI TIMOR',
    'KIOSK FALEN CHRISTIANTO FU AMARASI BARAT NEW TIMOR',
    'KIOSK IDRIS KUPANG TENGAH TIMOR',
    'KIOSK ANNA YULIANTI AMARASI NEW TIMOR',
    'KIOSK HAMID GUNTUR ABDULMANAN ALAK TIMOR',
    'KIOSK_RONI FRANSIUS FU_MAULAFA_TIMOR',
    'KIOSK_CV PANCA JAYA MULTIGUNA_LOBALAIN_TIMOR',
    'KIOSK CV BABE CELL GROUP KOTA RAJA NEW TIMOR',
    'KIOSK_NANANG KASIM MUSAJAR_KOTA_SOE_TIMOR',
    'KIOSK WAHYU HIDAYAT AMANUBAN TENGAH TIMOR',
    'KIOSK RIFALDY PUTRA MESSAH KEFAMENANU TIMOR'
];

const staticColumn3Data = [
    'CS BELU MALAKA',
    'CS BELU MALAKA',
    'CS BELU MALAKA',
    'CS BELU MALAKA',
    'CS KABUPATEN KUPANG',
    'CS KABUPATEN KUPANG',
    'CS KABUPATEN KUPANG',
    'CS KABUPATEN KUPANG',
    'CS KABUPATEN KUPANG',
    'CS KABUPATEN KUPANG',
    'CS KABUPATEN KUPANG',
    'CS KABUPATEN KUPANG',
    'CS KUPANG',
    'CS KUPANG',
    'CS KUPANG',
    'CS KUPANG',
    'CS TIMOR TENGAH SELATAN',
    'CS TIMOR TENGAH SELATAN',
    'CS TIMOR TENGAH UTARA'
];

// Fungsi untuk menghitung dan menampilkan tanggal Today()-2
export function updateDateDisplay() {
    const today = new Date();
    const reportDate = new Date(today);
    reportDate.setDate(today.getDate() - 2); // Kurangi 2 hari

    const dayElement = document.querySelector('.report-day');
    const monthYearElement = document.querySelector('.report-month-year');

    if (dayElement && monthYearElement) {
        // Format tanggal sesuai gambar referensi (Hari, Bulan Tahun)
        const options = { month: 'long', year: 'numeric' };
        monthYearElement.textContent = reportDate.toLocaleDateString('id-ID', options).toUpperCase();
        dayElement.textContent = reportDate.getDate();
    }
}

// Fungsi untuk toggle menu hamburger (untuk mobile)
export function toggleMenu() {
    const nav = document.querySelector('.nav');
    if (nav) {
        nav.classList.toggle('active');
    }
}

// Fungsi untuk mendapatkan pageId berdasarkan URL halaman
function getPageId() {
    const pathname = window.location.pathname;
    if (pathname.includes('index.html')) {
        return 'dashboard';
    } else if (pathname.includes('target-3kiosk.html')) {
        return 'target3Kiosk';
    } else if (pathname.includes('file-raw.html')) {
        return 'fileRaw';
    }
    return 'unknown'; // Fallback jika nama file tidak sesuai
}

// Fungsi helper untuk memformat angka dengan titik sebagai pemisah ribuan
function formatNumberWithThousandsSeparator(number) {
    if (typeof number !== 'number') {
        // Coba konversi string ke angka, jika gagal kembalikan nilai asli
        const parsedNumber = parseFloat(number);
        if (isNaN(parsedNumber)) {
            return number; // Bukan angka, kembalikan nilai asli
        }
        number = parsedNumber;
    }

    // Hapus desimal (jika ada) dan format dengan titik sebagai pemisah ribuan
    return Math.floor(number).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Fungsi untuk membaca dan memproses data dari file Excel (dari Base64)
export async function processExcelData(base64Content) {
    try {
        // Konversi Base64 kembali menjadi ArrayBuffer atau Binary String
        const binaryString = atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const arrayBuffer = bytes.buffer;

        // Baca workbook dari ArrayBuffer
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        // Ambil data dari sheet pertama
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Baca seluruh data sheet sebagai array of arrays tanpa menginterpretasikan header otomatis
        const rawSheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true }); // Use raw: true to get raw values, header: 1 for array of arrays

        // Log total baris yang dibaca SheetJS
        console.log('DEBUG PROCESS: Total rows read by SheetJS (rawSheetData):', rawSheetData.length);
        console.log('DEBUG PROCESS: First row data:', rawSheetData[0]);
        console.log('DEBUG PROCESS: Second row data:', rawSheetData[1]);
        console.log('DEBUG PROCESS: Third row data:', rawSheetData[2]);
        console.log('DEBUG PROCESS: Number of columns in first row:', rawSheetData[0]?.length);
        console.log('DEBUG PROCESS: Number of columns in second row:', rawSheetData[1]?.length);
        console.log('DEBUG PROCESS: Number of columns in third row:', rawSheetData[2]?.length);

        // Tentukan headerRow1, headerRow2, dan dataRows secara manual
        let headerRow1 = [];
        let headerRow2 = [];
        let dataRows = [];

        if (rawSheetData.length > 0) {
            headerRow1 = rawSheetData[0] || []; // Baris pertama sebagai headerRow1
            if (rawSheetData.length > 1) {
                headerRow2 = rawSheetData[1] || []; // Baris kedua sebagai headerRow2
                dataRows = rawSheetData.slice(2); // Data dimulai dari baris ketiga
            } else {
                 // Hanya ada 1 baris (header1), tidak ada header2 atau data
                 dataRows = [];
            }
            } else {
             // File kosong
             headerRow1 = [];
                    headerRow2 = [];
             dataRows = [];
        }

        // Log untuk debugging setelah penentuan header dan data
         console.log('DEBUG PROCESS - After manual header split (new logic):', {
             header1Length: headerRow1.length,
             header2Length: headerRow2.length,
             dataRowsCount: dataRows.length,
             header1Content: headerRow1.slice(0, 10), // Log beberapa item pertama
             header2Content: headerRow2.slice(0, 10)  // Log beberapa item pertama
         });

        // Mengembalikan header dan data secara terpisah
        return { header1: headerRow1, header2: headerRow2, dataRows: dataRows };

    } catch (error) {
        console.error('Error processing Excel data:', error);
        return { header1: [], header2: [], dataRows: [] };
    }
}

// Fungsi untuk memuat data dari Firestore saat halaman dimuat atau setelah upload
async function loadExcelData() {
    console.log('DEBUG: loadExcelData called');
    const pageId = getPageId();
    if (pageId === 'unknown') {
        console.error('Unknown page, cannot load data.');
        return;
    }

    try {
        // Panggil fetchExcelData dengan pageId yang sesuai untuk data utama halaman ini
        const latestData = await fetchExcelData(pageId);

        if (latestData && latestData.content) {
            console.log('Data fetched successfully for', pageId);
            
            if (pageId === 'dashboard') {
                // Proses data dashboard
                const processedDashboard = await processExcelData(latestData.content);
                globalHeaderRow1 = processedDashboard.header1;
                globalHeaderRow2 = processedDashboard.header2;
                allTableData = processedDashboard.dataRows;
                console.log('Dashboard data loaded:', {
                    headers1: globalHeaderRow1,
                    headers2: globalHeaderRow2,
                    dataCount: allTableData.length,
                    sampleData: allTableData.slice(0, 3) // Log 3 baris pertama untuk debugging
                });

                // Update filter options dengan data dashboard
                updateFilters(allTableData, globalHeaderRow1, globalHeaderRow2);
                
                // Load data Target 3Kiosk dan File RAW untuk perhitungan
                await Promise.all([
                    fetchExcelData('target3Kiosk').then(async targetData => {
                        if (targetData && targetData.content) {
                            const processedTarget = await processExcelData(targetData.content);
                            target3KioskHeaders1 = processedTarget.header1;
                            target3KioskHeaders2 = processedTarget.header2;
                            target3KioskRawData = processedTarget.dataRows;
                        }
                    }),
                    fetchExcelData('fileRaw').then(async rawData => {
                        if (rawData && rawData.content) {
                            const processedRaw = await processExcelData(rawData.content);
                            fileRawActualHeaders1 = processedRaw.header1;
                            fileRawActualHeaders2 = processedRaw.header2;
                            fileRawActualData = processedRaw.dataRows;
                            // Assign ke window object
                            window.fileRawActualHeaders1 = fileRawActualHeaders1;
                            window.fileRawActualHeaders2 = fileRawActualHeaders2;
                            window.fileRawActualData = fileRawActualData;
                        }
                    })
                ]);

                // Update tampilan dashboard
                filterTable();
            } else {
                // Untuk halaman lain (target-3kiosk dan file-raw)
                const processed = await processExcelData(latestData.content);
                globalHeaderRow1 = processed.header1;
                globalHeaderRow2 = processed.header2;
                allTableData = processed.dataRows;

                // Update filter options dengan data baru
                updateFilters(allTableData, globalHeaderRow1, globalHeaderRow2);
                
                // Update tampilan tabel
                updateTable(allTableData);
            }
            
            console.log('Data loaded successfully');
        } else {
            console.log('No data found in Firestore for', pageId);
            // Reset data
            globalHeaderRow1 = [];
            globalHeaderRow2 = [];
            allTableData = [];
            if (pageId === 'dashboard') {
                target3KioskRawData = [];
                target3KioskHeaders1 = [];
                target3KioskHeaders2 = [];
                fileRawActualData = [];
                fileRawActualHeaders1 = [];
                fileRawActualHeaders2 = [];
            }
            updateFilters([], [], []);
            updateTable([]);
        }
    } catch (error) {
        console.error('Error loading Excel data:', error);
    }
}

// --- Tambahkan fungsi baru untuk memperbarui bagian spesifik data dashboard ---
async function updateDashboardDataSection(sourcePageId) {
    console.log(`Updating dashboard data section for ${sourcePageId}...`);
    try {
        const latestData = await fetchExcelData(sourcePageId);
        if (latestData && latestData.content) {
            // Gunakan processExcelData yang sudah dimodifikasi (atau loadTarget3KioskData/loadFileRawData jika sudah dipisah)
            if (sourcePageId === 'target3Kiosk') {
                console.log('Updating Target 3Kiosk data via listener using targetDataLoader...');
                const processedTarget = await loadTarget3KioskData(); // Gunakan fungsi dari file baru
                target3KioskHeaders1 = processedTarget.header1;
                target3KioskHeaders2 = processedTarget.header2;
                target3KioskRawData = processedTarget.dataRows;
                console.log('Target 3Kiosk Data Updated by listener (via targetDataLoader):', { headers1: target3KioskHeaders1, headers2: target3KioskHeaders2, dataCount: target3KioskRawData.length });
            } else if (sourcePageId === 'fileRaw') {
                const processedRaw = await processExcelData(latestData.content);
                fileRawActualHeaders1 = processedRaw.header1;
                fileRawActualHeaders2 = processedRaw.header2;
                fileRawActualData = processedRaw.dataRows;
                // Assign ke window object
                window.fileRawActualHeaders1 = fileRawActualHeaders1;
                window.fileRawActualHeaders2 = fileRawActualHeaders2;
                window.fileRawActualData = fileRawActualData;
                console.log('File RAW Data Updated by listener:', { headers1: fileRawActualHeaders1, headers2: fileRawActualHeaders2, dataCount: fileRawActualData.length });
            }
            filterTable(); // Perbarui tampilan tabel dengan data baru
        } else {
            console.log(`No data found in Firestore for ${sourcePageId} during update.`);
            // Opsional: reset data global yang relevan jika dokumen dihapus
            if (sourcePageId === 'target3Kiosk') {
                target3KioskRawData = [];
                target3KioskHeaders1 = [];
                target3KioskHeaders2 = [];
            } else if (sourcePageId === 'fileRaw') {
                fileRawActualData = [];
                fileRawActualHeaders1 = [];
                fileRawActualHeaders2 = [];
            }
            filterTable(); // Perbarui tampilan tabel (kemungkinan akan menampilkan kosong di kolom terkait)
        }
    } catch (error) {
        console.error(`Error updating dashboard data section for ${sourcePageId}:`, error);
    }
}
// -------------------------------------------------------------------------------

// Fungsi untuk memperbarui tabel dengan data yang difilter/pagination
function updateTable(dataToDisplay) {
    const tableBody = document.querySelector('#dataTable tbody');
    const tableHead = document.querySelector('#dataTable thead');
    if (!tableBody || !tableHead) return;

    // Kosongkan isi tabel sebelumnya
    tableBody.innerHTML = '';
    tableHead.innerHTML = '';

    const pageId = getPageId();

    // Buat header (logika berbeda tergantung halaman)
    if (pageId === 'target3Kiosk') {
        // Gunakan header gabungan dengan merging untuk Target 3Kiosk
        if (globalHeaderRow1.length > 0) { // Cek hanya baris pertama cukup
            let headerHTMLRow1 = '<tr>';
            let headerHTMLRow2 = ''; // Baris kedua header (untuk kolom yang tidak di-merge)

            globalHeaderRow1.forEach((header1, index) => {
                const freezeClass = (index === 0 || index === 1) ? 'freeze-column' : '';
                const header2 = globalHeaderRow2[index];

                if (index >= 0 && index <= 9) { // Kolom 1-10 (indeks 0-9) akan di-merge
                    headerHTMLRow1 += `<th rowspan="2" class="${freezeClass}">${header1 !== undefined && header1 !== null ? header1 : ''}</th>`;
                } else { // Kolom setelah indeks 9 akan di baris header kedua
                    // Untuk kolom yang tidak di-merge di baris pertama, mereka tetap ada di baris pertama (jika ada) dan baris kedua
                    // Kita hanya perlu membuat baris kedua untuk elemen header setelah indeks 9
                    headerHTMLRow1 += `<th class="${freezeClass}">${header1 !== undefined && header1 !== null ? header1 : ''}</th>`;
                    if (globalHeaderRow2.length > index) { // Pastikan header2 ada
                         headerHTMLRow2 += `<th class="${freezeClass}">${header2 !== undefined && header2 !== null ? header2 : ''}</th>`;
                    }
                }
            });

            headerHTMLRow1 += '</tr>';

            // Gabungkan HTML header
            let finalHeaderHTML = headerHTMLRow1;
            if (headerHTMLRow2 !== '') { // Tambahkan baris kedua hanya jika ada isinya
                finalHeaderHTML += '<tr>' + headerHTMLRow2 + '</tr>';
            }

            tableHead.innerHTML = finalHeaderHTML;
        }

        // Tampilkan data dari Firebase untuk Target 3Kiosk
        dataToDisplay.forEach(rowData => {
            let rowHTML = '<tr>';
            rowData.forEach((cellData, colIndex) => {
                const freezeClass = (colIndex === 0 || colIndex === 1) ? 'freeze-column' : '';
                // Format angka untuk semua kolom kecuali ID, PT TYPE, dan TS ID
                const headerText = globalHeaderRow1[colIndex];
                const excludeFormatting = ['ID', 'PT TYPE', 'TS ID'].includes(headerText);
                const formattedData = (cellData !== undefined && cellData !== null) ? 
                    (excludeFormatting ? cellData : formatNumberWithThousandsSeparator(cellData)) : '';
                rowHTML += `<td class="${freezeClass}">${formattedData}</td>`;
            });
            rowHTML += '</tr>';
            tableBody.innerHTML += rowHTML;
        });

    } else if (pageId === 'fileRaw') {
        // Gunakan header gabungan untuk File Raw
        if (globalHeaderRow1.length > 0 && globalHeaderRow2.length > 0) {
            let headerHTML = '<tr>';
            globalHeaderRow1.forEach((header, index) => {
                const freezeClass = (index === 0 || index === 1) ? 'freeze-column' : '';
                headerHTML += `<th class="${freezeClass}">${header !== undefined && header !== null ? header : ''}</th>`;
            });
            headerHTML += '</tr><tr>';
            globalHeaderRow2.forEach((header, index) => {
                 const freezeClass = (index === 0 || index === 1) ? 'freeze-column' : '';
                headerHTML += `<th class="${freezeClass}">${header !== undefined && header !== null ? header : ''}</th>`;
            });
            headerHTML += '</tr>';
            tableHead.innerHTML = headerHTML;
        }

        // Tampilkan data dari Firebase untuk File Raw
        if (dataToDisplay && dataToDisplay.length > 0) {
            dataToDisplay.forEach(rowData => {
                let rowHTML = '<tr>';
                rowData.forEach((cellData, colIndex) => {
                    const freezeClass = (colIndex === 0 || colIndex === 1) ? 'freeze-column' : '';
                    // Format angka untuk semua kolom kecuali ID, PT TYPE, dan TS ID di halaman File Raw
                    const headerText = globalHeaderRow1[colIndex];
                    const excludeFormatting = ['ID', 'PT TYPE', 'TS ID'].includes(headerText);
                    const formattedData = (cellData !== undefined && cellData !== null) ? 
                        (excludeFormatting ? cellData : formatNumberWithThousandsSeparator(cellData)) : '';
                    rowHTML += `<td class="${freezeClass}">${formattedData}</td>`;
                });
                rowHTML += '</tr>';
                tableBody.innerHTML += rowHTML;
            });
        }

    } else if (pageId === 'dashboard') {
        // --- Header Spesifik untuk Halaman Dashboard ---
        let headerHTMLRow1 = '<tr>';
        let headerHTMLRow2 = '<tr>';

        // Kolom 1: ID (Merged Row 1 & 2)
        headerHTMLRow1 += `<th rowspan="2" class="freeze-column">ID</th>`;

        // Kolom 2: Nama 3Kiosk (Merged Row 1 & 2)
        headerHTMLRow1 += `<th rowspan="2" class="freeze-column">Nama 3Kiosk</th>`;

        // Kolom 3: Micro Cluster (Merged Row 1 & 2)
        headerHTMLRow1 += `<th rowspan="2">Micro Cluster</th>`;

        // Kolom 4-9: Trade Demand (Merged Row 1)
        headerHTMLRow1 += `<th colspan="6">Trade Demand</th>`;
        headerHTMLRow2 += `<th>Target</th><th>Achv</th></th><th>GAP</th><th>%Achv</th><th>LMTD</th><th>Growth</th>`;

        // Kolom 10-15: RGU GA Trad (Merged Row 1)
        headerHTMLRow1 += `<th colspan="6">RGU GA Trad</th>`;
        headerHTMLRow2 += `<th>Target</th><th>Achv</th><th>GAP</th><th>%Achv</th><th>LMTD</th><th>Growth</th>`;

        // Kolom 16: Total Score (Merged Row 1 & 2)
        headerHTMLRow1 += `<th rowspan="2">Total Score</th>`;

        // Kolom 17: Rank (Merged Row 1 & 2)
        headerHTMLRow1 += `<th rowspan="2">Rank</th>`;

        // Kolom 18-22: Sellin 300K (Merged Row 1)
        headerHTMLRow1 += `<th colspan="5">Sellin 300K</th>`;
        headerHTMLRow2 += `<th>Secondary Outlet</th><th>Outlet PJP</th><th>Target</th><th>Achv</th><th>%</th>`;

        headerHTMLRow1 += '</tr>';
        headerHTMLRow2 += '</tr>';

        tableHead.innerHTML = headerHTMLRow1 + headerHTMLRow2;

        // Tampilkan data untuk Dashboard (gabungan data statis dan Excel)
        const numStaticRows = staticColumn1Data.length;
        const numExcelRows = dataToDisplay.length;
        const totalRowsToDisplay = Math.max(numStaticRows, numExcelRows);

        // Temukan indeks kolom ID di data Target 3Kiosk dan File RAW
        const target3KioskIdIndex = target3KioskHeaders1.findIndex(header => header && String(header).trim().toLowerCase() === 'id'); // Dari header target-3kiosk.xlsx baris 1
         const fileRawIdIndex = fileRawActualHeaders1.findIndex(header => header && String(header).trim().toLowerCase() === 'id'); // Dari header file-raw.xlsx baris 1

         // Temukan indeks kolom Nama 3Kiosk di data Target 3Kiosk (dari header baris 1)
         const target3KioskNama3KioskIndex = target3KioskHeaders1.findIndex(header => header && String(header).trim().toLowerCase() === 'nama 3kiosk'); // Dari header target-3kiosk.xlsx baris 1

         // --- Tentukan indeks kolom data yang diambil dari target3KioskRawData ---
         // Berdasarkan penjelasan user:
         // Kolom 4 dashboard diisi dari Kolom 4 (indeks 3) target3KioskRawData
         // Kolom 10 dashboard diisi dari Kolom 5 (indeks 4) target3KioskRawData
         const targetTradeDemandDataIndex = 3; // Indeks di target3KioskRawData untuk Target Trade Demand
         const targetRguGaTradDataIndex = 4;   // Indeks di target3KioskRawData untuk Target RGU GA Trad

         // Log untuk debugging indeks data yang diambil secara eksplisit
         console.log('DEBUG UPDATE TABLE - TARGET DATA INDEXES:', {
             targetTradeDemandDataIndex: targetTradeDemandDataIndex,
             targetRguGaTradDataIndex: targetRguGaTradDataIndex
         });
         // -----------------------------------------------------------------------


         // --- LOGGING UNTUK DEBUGGING TARGET DATA ---
         console.log('DEBUG UPDATE TABLE - TARGET:', {
             target3KioskHeaders1: target3KioskHeaders1,
             target3KioskHeaders2: target3KioskHeaders2,
             target3KioskIdIndex: target3KioskIdIndex,
             targetTradeDemandDataIndex: targetTradeDemandDataIndex,
             targetRguGaTradDataIndex: targetRguGaTradDataIndex,
             target3KioskRawDataLength: target3KioskRawData.length
         });
         // ------------------------------------------------------------------------------------------------------------

        for (let i = 0; i < totalRowsToDisplay; i++) {
            let rowHTML = '<tr>';
            const excelRow = dataToDisplay[i]; // Data dari file dashboard.xlsx

            // Kolom 1 (ID) - Data Statis/Excel Dashboard
            const idData = i < numStaticRows ? staticColumn1Data[i] : (excelRow && excelRow[0] !== undefined ? excelRow[0] : '');
            const idFreezeClass = (idData !== '') ? 'freeze-column' : '';
            rowHTML += `<td class="${idFreezeClass}">${idData}</td>`;

            // Kolom 2 (Nama 3Kiosk) - Data Statis/Excel Dashboard
            const nameData = i < numStaticRows ? staticColumn2Data[i] : (excelRow && excelRow[1] !== undefined ? excelRow[1] : '');
            const nameFreezeClass = (nameData !== '') ? 'freeze-column' : '';
            rowHTML += `<td class="${nameFreezeClass}">${nameData}</td>`;

            // Kolom 3 (Micro Cluster) - Data Statis/Excel Dashboard
            const microClusterData = i < numStaticRows ? staticColumn3Data[i] : (excelRow && excelRow[2] !== undefined ? excelRow[2] : '');
            rowHTML += `<td>${microClusterData}</td>`;

            // Kolom 4: Trade Demand - Target (dari data target-3kiosk.xlsx)
             let targetTradeDemandValue = '';
             // Pastikan data target dimuat dan indeks kolom ID target serta data target valid.
             // Gunakan targetTradeDemandDataIndex (indeks 3) untuk mengambil nilai dari target3KioskRawData
             if (target3KioskRawData.length > 0 && target3KioskIdIndex !== -1 && targetTradeDemandDataIndex !== undefined && targetTradeDemandDataIndex !== null) {
                  // Cari baris di target3KioskRawData yang cocok dengan ID saat ini
                 const matchedTargetRow = target3KioskRawData.find(targetRow =>
                     targetRow[target3KioskIdIndex] !== undefined &&
                     String(targetRow[target3KioskIdIndex]).trim() === String(idData).trim()
                 );

                 // Jika baris dengan ID yang cocok ditemukan dan nilai di kolom Target Trade Demand ada
                  if (matchedTargetRow) {
                     // Gunakan targetTradeDemandDataIndex untuk mengambil nilai dari matchedTargetRow
                     if (matchedTargetRow[targetTradeDemandDataIndex] !== undefined && matchedTargetRow[targetTradeDemandDataIndex] !== null) {
                          targetTradeDemandValue = formatNumberWithThousandsSeparator(matchedTargetRow[targetTradeDemandDataIndex]);
                     }
                 }
             }
             rowHTML += `<td style="text-align: center; font-weight: bold;">${targetTradeDemandValue}</td>`;

              // Kolom 5: Trade Demand - Achv (dari data file-raw.xlsx)
              let totalAchvTradeDemand = 0;
              // Indeks kolom di target3KioskRawData untuk RGU GA Trad Achv (Kolom 11 dashboard)
              // Ini adalah kolom 37 di file RAW aslinya, yang berarti indeks 36 di fileRawActualData
              const rawRguGaTradAchvIndex = 36; // Indeks 36 di fileRawActualData untuk Achv RGU GA Trad (Kolom 11 Dashboard)

               // Berdasarkan penjelasan user, Achv Trade Demand (Kolom 5 Dashboard) diambil dari Kolom 63 (indeks 62) di file RAW
               const rawTradeDemandAchvIndex = 62; // Indeks 62 di fileRawActualData untuk Achv Trade Demand (Kolom 5 Dashboard)

               console.log(`DEBUG K5: Processing ID ${idData}. fileRawActualData length: ${fileRawActualData.length}, fileRawIdIndex: ${fileRawIdIndex}, rawTradeDemandAchvIndex: ${rawTradeDemandAchvIndex}`);
              // Pastikan data raw dimuat, ID ditemukan, dan indeks kolom Achv Trade Demand valid
              if (fileRawActualData.length > 0 && fileRawIdIndex !== -1 && rawTradeDemandAchvIndex !== undefined && rawTradeDemandAchvIndex !== null) {
                   // Temukan SEMUA baris di fileRawActualData yang cocok dengan ID saat ini
                   const matchedRawRows = fileRawActualData.filter(rawRow =>
                        rawRow[fileRawIdIndex] !== undefined &&
                        String(rawRow[fileRawIdIndex]).trim() === String(idData).trim()
                   );

                    console.log(`DEBUG K5: Found ${matchedRawRows.length} matching RAW rows for ID ${idData}`);

                   // Jumlahkan nilai dari kolom Achv Trade Demand (indeks 62) dari SEMUA baris yang cocok
                   matchedRawRows.forEach(matchedRow => {
                        if (matchedRow[rawTradeDemandAchvIndex] !== undefined && matchedRow[rawTradeDemandAchvIndex] !== null) {
                             const rawValue = matchedRow[rawTradeDemandAchvIndex];
                             // Pastikan nilai bisa dikonversi menjadi angka. Trim spasi dan ganti koma jika ada.
                             const cleanedValue = String(rawValue).trim().replace(/,/g, '.');
                             const numericValue = parseFloat(cleanedValue) || 0;
                             totalAchvTradeDemand += numericValue;
                              console.log(`DEBUG K5: Added value ${rawValue} (cleaned: ${cleanedValue}, numeric: ${numericValue}). Running total: ${totalAchvTradeDemand}`);
                         }
                   });
                   console.log(`DEBUG K5: Final total for ID ${idData}: ${totalAchvTradeDemand}`);
              }

              // Isi sel Kolom 5 (Achv Trade Demand) dengan hasil penjumlahan
              let achvTradeDemandValue = formatNumberWithThousandsSeparator(totalAchvTradeDemand);
              rowHTML += `<td style="text-align: center; font-weight: bold;">${achvTradeDemandValue}</td>`;

               // Kolom 6: Trade Demand - GAP (Hitung GAP antara Achv (K5) dan Target (K4))
               let tradeDemandGap = '';
               let targetTD = parseFloat(String(targetTradeDemandValue).replace(/\./g, '')) || 0; // Hilangkan pemisah ribuan untuk perhitungan
               let achvTD = parseFloat(String(achvTradeDemandValue).replace(/\./g, '')) || 0; // Hilangkan pemisah ribuan untuk perhitungan

               if (targetTradeDemandValue !== '' || achvTradeDemandValue !== '') {
                   tradeDemandGap = formatNumberWithThousandsSeparator(achvTD - targetTD);
               }

               let gapBackgroundColor = '';
               if ((achvTD - targetTD) < 0) {
                   gapBackgroundColor = '#ffcdd2'; // Merah muda jika minus
               } else if ((achvTD - targetTD) > 0) {
                   gapBackgroundColor = '#c8e6c9'; // Hijau muda jika plus
               }

               rowHTML += `<td style="text-align: center; font-weight: bold; background-color: ${gapBackgroundColor};">${tradeDemandGap}</td>`;

               // Kolom 7: Trade Demand - %Achv (Hitung Persentase Achv terhadap Target)
               let tradeDemandAchvPercentage = '';
               let percentageBackgroundColor = '';
               if (targetTD > 0) {
                   const percentage = (achvTD / targetTD) * 100;
                   tradeDemandAchvPercentage = percentage.toFixed(2) + '%'; // Format 2 desimal dan tambahkan %

                   // Tentukan warna background berdasarkan persentase
                   if (percentage <= 50) {
                       percentageBackgroundColor = '#ffcdd2'; // Merah
                   } else if (percentage <= 79) {
                       percentageBackgroundColor = '#fff9c4'; // Kuning
                   } else {
                       percentageBackgroundColor = '#c8e6c9'; // Hijau
                   }
               } else if (achvTD > 0) {
                    // Target 0 tapi Achv > 0, anggap 100% atau lebih
                    tradeDemandAchvPercentage = '>100%'; // Tampilkan sebagai >100%
                     percentageBackgroundColor = '#c8e6c9'; // Hijau
               } else {
                    tradeDemandAchvPercentage = '0.00%'; // Target dan Achv 0
                     percentageBackgroundColor = '#ffcdd2'; // Merah
               }

               rowHTML += `<td style="text-align: center; font-weight: bold; background-color: ${percentageBackgroundColor};">${tradeDemandAchvPercentage}</td>`;

              // Kolom 8: Trade Demand - LMTD (Diisi dari penjumlahan Kolom 64 RAW - Achv Target)
               let totalAchvTargetRaw = 0;
               // Indeks kolom di fileRawActualData untuk Achv Target (Kolom 64 RAW)
               const rawAchvTargetIndex = 63; // Indeks 63 di fileRawActualData untuk Achv Target (Kolom 8 Dashboard)

               console.log(`DEBUG K8: Processing ID ${idData}. fileRawActualData length: ${fileRawActualData.length}, fileRawIdIndex: ${fileRawIdIndex}, rawAchvTargetIndex: ${rawAchvTargetIndex}`);
               // Pastikan data raw dimuat, ID ditemukan, dan indeks kolom Achv Target valid
               if (fileRawActualData.length > 0 && fileRawIdIndex !== -1 && rawAchvTargetIndex !== undefined && rawAchvTargetIndex !== null) {
                    // Temukan SEMUA baris di fileRawActualData yang cocok dengan ID saat ini
                    const matchedRawRows = fileRawActualData.filter(rawRow =>
                         rawRow[fileRawIdIndex] !== undefined &&
                         String(rawRow[fileRawIdIndex]).trim() === String(idData).trim()
                    );

                    console.log(`DEBUG K8: Found ${matchedRawRows.length} matching RAW rows for ID ${idData}`);

                    // Jumlahkan nilai dari kolom Achv Target (indeks 63) dari SEMUA baris yang cocok
                    matchedRawRows.forEach(matchedRow => {
                         if (matchedRow[rawAchvTargetIndex] !== undefined && matchedRow[rawAchvTargetIndex] !== null) {
                              const rawValue = matchedRow[rawAchvTargetIndex];
                              // Pastikan nilai bisa dikonversi menjadi angka. Trim spasi dan ganti koma jika ada.
                              const cleanedValue = String(rawValue).trim().replace(/,/g, '.');
                              const numericValue = parseFloat(cleanedValue) || 0;
                              totalAchvTargetRaw += numericValue;
                               console.log(`DEBUG K8: Added value ${rawValue} (cleaned: ${cleanedValue}, numeric: ${numericValue}). Running total: ${totalAchvTargetRaw}`);
                          }
                    });
                     console.log(`DEBUG K8: Final total for ID ${idData}: ${totalAchvTargetRaw}`);
               }

               // Isi sel Kolom 8 (LMTD - sebenarnya Achv Target) dengan hasil penjumlahan
               let achvTargetRawValue = formatNumberWithThousandsSeparator(totalAchvTargetRaw);
               rowHTML += `<td style="text-align: center; font-weight: bold;">${achvTargetRawValue}</td>`;

               // Kolom 9: Trade Demand - Growth (Hitung berdasarkan Kolom 5 dan Kolom 8)
               let tradeDemandGrowth = '';
               // let growthTextColor = ''; // Untuk warna teks (merah/hij) - Dinonaktifkan
               let growthBackgroundColor = ''; // Untuk warna latar belakang sel

               // Ambil nilai numerik dari Kolom 5 (Achv Trade Demand) dan Kolom 8 (LMTD Trade Demand)
               let achvTDNumeric = totalAchvTradeDemand; // Nilai sudah dalam bentuk angka
               let lmtdTDNumeric = totalAchvTargetRaw; // Nilai sudah dalam bentuk angka

               console.log(`DEBUG K9 Growth: ID ${idData}, AchvTD=${achvTDNumeric}, LMTDTD=${lmtdTDNumeric}`);

               if (lmtdTDNumeric > 0) {
                   const percentageGrowth = ((achvTDNumeric / lmtdTDNumeric) - 1) * 100;
                   tradeDemandGrowth = percentageGrowth.toFixed(2) + '%';

                   if (percentageGrowth < 0) {
                       // growthTextColor = 'color: red;'; // Merah jika pertumbuhan negatif - Dinonaktifkan
                       growthBackgroundColor = '#ffcdd2'; // Merah muda
                   } else if (percentageGrowth > 0) {
                       // growthTextColor = 'color: green;'; // Hijau jika pertumbuhan positif - Dinonaktifkan
                       growthBackgroundColor = '#c8e6c9'; // Hijau muda
                   } else {
                       // growthTextColor = ''; // Biarkan default (hitam) jika 0 - Dinonaktifkan
                       growthBackgroundColor = '#ffcdd2'; // Kuning muda untuk 0%
                   }
               } else if (achvTDNumeric > 0) {
                   // Jika LMTD 0 tapi Achv hari ini > 0
                   tradeDemandGrowth = '>100%'; // Atau representasi pertumbuhan tak terhingga
                   // growthTextColor = 'color: green;'; // Dianggap pertumbuhan positif - Dinonaktifkan
                   growthBackgroundColor = '#c8e6c9'; // Hijau muda
               } else {
                   // Jika LMTD 0 dan Achv hari ini 0
                   tradeDemandGrowth = '0.00%';
                   // growthTextColor = ''; // Default (hitam) - Dinonaktifkan
                   growthBackgroundColor = '#ffcdd2'; // Merah muda untuk 0%
               }

               // Gunakan growthBackgroundColor untuk style background
               rowHTML += `<td style="text-align: center; font-weight: bold; background-color: ${growthBackgroundColor};">${tradeDemandGrowth}</td>`;

              // Kolom 10: RGU GA Trad - Target (dari data target-3kiosk.xlsx)
               let targetRguGaTradValue = '';
               console.log(`DEBUG K10: Processing ID ${idData}. target3KioskRawData length: ${target3KioskRawData.length}, target3KioskIdIndex: ${target3KioskIdIndex}, targetRguGaTradDataIndex: ${targetRguGaTradDataIndex}`);
               // Pastikan data target dimuat dan indeks kolom ID target serta data target valid.
                // Gunakan targetRguGaTradDataIndex (indeks 4) untuk mengambil nilai dari target3KioskRawData
                if (target3KioskRawData.length > 0 && target3KioskIdIndex !== -1 && targetRguGaTradDataIndex !== undefined && targetRguGaTradDataIndex !== null) {
                     // Cari baris di target3KioskRawData yang cocok dengan ID saat ini
                    const matchedTargetRow = target3KioskRawData.find(targetRow =>
                        targetRow[target3KioskIdIndex] !== undefined &&
                        String(targetRow[target3KioskIdIndex]).trim() === String(idData).trim()
                    );

                     // Jika baris dengan ID yang cocok ditemukan dan nilai di kolom Target RGU GA Trad ada
                     if (matchedTargetRow) {
                         console.log('DEBUG K10: Matching target row found:', matchedTargetRow); // Keep this log
                         // Gunakan targetRguGaTradDataIndex untuk mengambil nilai dari matchedTargetRow
                         if (matchedTargetRow[targetRguGaTradDataIndex] !== undefined && matchedTargetRow[targetRguGaTradDataIndex] !== null) {
                              targetRguGaTradValue = formatNumberWithThousandsSeparator(matchedTargetRow[targetRguGaTradDataIndex]);
                               console.log(`DEBUG K10: Value found at index ${targetRguGaTradDataIndex}: ${matchedTargetRow[targetRguGaTradDataIndex]}, Formatted: ${targetRguGaTradValue}`); // Keep this log
                         } else {
                              console.log(`DEBUG K10: Value at index ${targetRguGaTradDataIndex} is undefined or null.`); // Keep this log
                         }
                     } else {
                         console.log(`DEBUG K10: No matching target row found for ID: ${idData}`); // Keep this log
                     }
                } else {
                    console.log('DEBUG K10: Target data not loaded or required indices not found or data index invalid.'); // Keep this log
                }
                rowHTML += `<td style="text-align: center; font-weight: bold;">${targetRguGaTradValue}</td>`;

              // Kolom 11: RGU GA Trad - Achv (dari data file-raw.xlsx, indeks 36)
              let totalAchvRguGaTrad = 0;
              // Indeks kolom di fileRawActualData untuk Achv RGU GA Trad (Kolom 11 Dashboard)
              const rawRguGaTradAchvIndexCorrected = 36; // Indeks 36 di fileRawActualData untuk Achv RGU GA Trad (Kolom 11 Dashboard)

               console.log(`DEBUG K11: Processing ID ${idData}. fileRawActualData length: ${fileRawActualData.length}, fileRawIdIndex: ${fileRawIdIndex}, rawRguGaTradAchvIndexCorrected: ${rawRguGaTradAchvIndexCorrected}`);
              // Pastikan data raw dimuat, ID ditemukan, dan indeks kolom Achv RGU GA Trad valid
              if (fileRawActualData.length > 0 && fileRawIdIndex !== -1 && rawRguGaTradAchvIndexCorrected !== undefined && rawRguGaTradAchvIndexCorrected !== null) {
                   // Temukan SEMUA baris di fileRawActualData yang cocok dengan ID saat ini
                   const matchedRawRows = fileRawActualData.filter(rawRow =>
                        rawRow[fileRawIdIndex] !== undefined &&
                        String(rawRow[fileRawIdIndex]).trim() === String(idData).trim()
                   );

                    console.log(`DEBUG K11: Found ${matchedRawRows.length} matching RAW rows for ID ${idData}`);

                    // Jumlahkan nilai dari kolom Achv RGU GA Trad (indeks 36) dari SEMUA baris yang cocok
                    matchedRawRows.forEach(matchedRow => {
                         if (matchedRow[rawRguGaTradAchvIndexCorrected] !== undefined && matchedRow[rawRguGaTradAchvIndexCorrected] !== null) {
                              const rawValue = matchedRow[rawRguGaTradAchvIndexCorrected];
                              // Pastikan nilai bisa dikonversi menjadi angka. Trim spasi dan ganti koma jika ada.
                              const cleanedValue = String(rawValue).trim().replace(/,/g, '.');
                              const numericValue = parseFloat(cleanedValue) || 0;
                             totalAchvRguGaTrad += numericValue;
                               console.log(`DEBUG K11: Added value ${rawValue} (cleaned: ${cleanedValue}, numeric: ${numericValue}). Running total: ${totalAchvRguGaTrad}`);
                          }
                    });
                    console.log(`DEBUG K11: Final total for ID ${idData}: ${totalAchvRguGaTrad}`);
               }

               // Isi sel Kolom 11 (Achv RGU GA Trad) dengan hasil penjumlahan
               let achvRguGaTradValue = formatNumberWithThousandsSeparator(totalAchvRguGaTrad);
               rowHTML += `<td style="text-align: center; font-weight: bold;">${achvRguGaTradValue}</td>`;

               // Kolom 12: RGU GA Trad - GAP (Hitung GAP antara Achv (K11) dan Target (K10))
               let rguGaTradGap = '';
               let targetRGGA = parseFloat(String(targetRguGaTradValue).replace(/\./g, '')) || 0; // Hilangkan pemisah ribuan
               let achvRGGA = parseFloat(String(achvRguGaTradValue).replace(/\./g, '')) || 0; // Hilangkan pemisah ribuan

                if (targetRguGaTradValue !== '' || achvRguGaTradValue !== '') {
                   rguGaTradGap = formatNumberWithThousandsSeparator(achvRGGA - targetRGGA);
                }

               let rggaGapBackgroundColor = '';
               if ((achvRGGA - targetRGGA) < 0) {
                   rggaGapBackgroundColor = '#ffcdd2'; // Merah muda jika minus
               } else if ((achvRGGA - targetRGGA) > 0) {
                   rggaGapBackgroundColor = '#c8e6c9'; // Hijau muda jika plus
               }

               rowHTML += `<td style="text-align: center; font-weight: bold; background-color: ${rggaGapBackgroundColor};">${rguGaTradGap}</td>`;

               // Kolom 13: RGU GA Trad - %Achv (Hitung Persentase Achv terhadap Target)
               let rguGaTradAchvPercentage = '';
               let rggaPercentageBackgroundColor = '';
               if (targetRGGA > 0) {
                   const percentage = (achvRGGA / targetRGGA) * 100;
                   rguGaTradAchvPercentage = percentage.toFixed(2) + '%'; // Format 2 desimal dan tambahkan %

                   // Tentukan warna background berdasarkan persentase
                   if (percentage <= 50) {
                       rggaPercentageBackgroundColor = '#ffcdd2'; // Merah
                   } else if (percentage <= 79) {
                       rggaPercentageBackgroundColor = '#fff9c4'; // Kuning
                   } else {
                       rggaPercentageBackgroundColor = '#c8e6c9'; // Hijau
                   }
                } else if (achvRGGA > 0) {
                    // Target 0 tapi Achv > 0
                     rguGaTradAchvPercentage = '>100%'; // Tampilkan sebagai >100%
                     rggaPercentageBackgroundColor = '#c8e6c9'; // Hijau
              } else {
                    rguGaTradAchvPercentage = '0.00%'; // Target dan Achv 0
                    rggaPercentageBackgroundColor = '#ffcdd2'; // Merah
                }

               rowHTML += `<td style="text-align: center; font-weight: bold; background-color: ${rggaPercentageBackgroundColor};">${rguGaTradAchvPercentage}</td>`;

               // Kolom 14: RGU GA Trad - LMTD (Diisi dari penjumlahan Kolom 38 RAW - Achv RGU GA Trad LMTD)
               let totalAchvRguGaTradLmtdRaw = 0;
               // Indeks kolom di fileRawActualData untuk Achv RGU GA Trad LMTD (Kolom 38 RAW)
               const rawAchvRguGaTradLmtdIndex = 37; // Indeks 37 di fileRawActualData untuk Achv RGU GA Trad LMTD (Kolom 14 Dashboard)

               console.log(`DEBUG K14: Processing ID ${idData}. fileRawActualData length: ${fileRawActualData.length}, fileRawIdIndex: ${fileRawIdIndex}, rawAchvRguGaTradLmtdIndex: ${rawAchvRguGaTradLmtdIndex}`);
               // Pastikan data raw dimuat, ID ditemukan, dan indeks kolom Achv RGU GA Trad LMTD valid
               if (fileRawActualData.length > 0 && fileRawIdIndex !== -1 && rawAchvRguGaTradLmtdIndex !== undefined && rawAchvRguGaTradLmtdIndex !== null) {
                    // Temukan SEMUA baris di fileRawActualData yang cocok dengan ID saat ini
                    const matchedRawRows = fileRawActualData.filter(rawRow =>
                         rawRow[fileRawIdIndex] !== undefined &&
                         String(rawRow[fileRawIdIndex]).trim() === String(idData).trim()
                    );

                    console.log(`DEBUG K14: Found ${matchedRawRows.length} matching RAW rows for ID ${idData}`);

                    // Jumlahkan nilai dari kolom Achv RGU GA Trad LMTD (indeks 37) dari SEMUA baris yang cocok
                    matchedRawRows.forEach(matchedRow => {
                         if (matchedRow[rawAchvRguGaTradLmtdIndex] !== undefined && matchedRow[rawAchvRguGaTradLmtdIndex] !== null) {
                              const rawValue = matchedRow[rawAchvRguGaTradLmtdIndex];
                              // Pastikan nilai bisa dikonversi menjadi angka. Trim spasi dan ganti koma jika ada.
                              const cleanedValue = String(rawValue).trim().replace(/,/g, '.');
                              const numericValue = parseFloat(cleanedValue) || 0;
                              totalAchvRguGaTradLmtdRaw += numericValue;
                               console.log(`DEBUG K14: Added value ${rawValue} (cleaned: ${cleanedValue}, numeric: ${numericValue}). Running total: ${totalAchvRguGaTradLmtdRaw}`);
                          }
                    });
                     console.log(`DEBUG K14: Final total for ID ${idData}: ${totalAchvRguGaTradLmtdRaw}`);
               }

               // Isi sel Kolom 14 (LMTD - sebenarnya Achv RGU GA Trad LMTD) dengan hasil penjumlahan
               let achvRguGaTradLmtdRawValue = formatNumberWithThousandsSeparator(totalAchvRguGaTradLmtdRaw);
               rowHTML += `<td style="text-align: center; font-weight: bold;">${achvRguGaTradLmtdRawValue}</td>`;

               // Kolom 15: RGU GA Trad - Growth (Hitung berdasarkan Kolom 11 dan Kolom 14)
               let rguGaTradGrowth = '';
               let rggaGrowthBackgroundColor = ''; // Untuk warna latar belakang sel

               // Ambil nilai numerik dari Kolom 11 (Achv RGU GA Trad) dan Kolom 14 (LMTD RGU GA Trad)
               let achvRGGANumeric = totalAchvRguGaTrad; // Nilai sudah dalam bentuk angka
               let lmtdRGGANumeric = totalAchvRguGaTradLmtdRaw; // Nilai sudah dalam bentuk angka

               console.log(`DEBUG K15 Growth: ID ${idData}, AchvRGGA=${achvRGGANumeric}, LMTDRGGA=${lmtdRGGANumeric}`);

               if (lmtdRGGANumeric > 0) {
                   const percentageGrowth = ((achvRGGANumeric / lmtdRGGANumeric) - 1) * 100;
                   rguGaTradGrowth = percentageGrowth.toFixed(2) + '%';

                   if (percentageGrowth < 0) {
                       rggaGrowthBackgroundColor = '#ffcdd2'; // Merah muda jika pertumbuhan negatif
                   } else if (percentageGrowth > 0) {
                       rggaGrowthBackgroundColor = '#c8e6c9'; // Hijau muda jika pertumbuhan positif
                   } else { 
                       rggaGrowthBackgroundColor = '#fff9c4'; // Kuning muda untuk 0%
                   }
               } else if (achvRGGANumeric > 0) {
                   // Jika LMTD 0 tapi Achv hari ini > 0
                   rguGaTradGrowth = '>100%'; // Atau representasi pertumbuhan tak terhingga
                   rggaGrowthBackgroundColor = '#c8e6c9'; // Hijau muda
              } else {
                   // Jika LMTD 0 dan Achv hari ini 0
                   rguGaTradGrowth = '0.00%';
                   rggaGrowthBackgroundColor = '#ffcdd2'; // Merah muda untuk 0%
               }

               // Gunakan rggaGrowthBackgroundColor untuk style background
               rowHTML += `<td style="text-align: center; font-weight: bold; background-color: ${rggaGrowthBackgroundColor};">${rguGaTradGrowth}</td>`;

               // Kolom 16: Total Score (Hitung dari (Kolom 7 + Kolom 13) dikali 50%)
               let totalScore = '';
               let totalScoreBackgroundColor = '';

               // Ambil nilai numerik dari Kolom 7 (%Achv Trade Demand) dan Kolom 13 (%Achv RGU GA Trad)
               let tradeDemandAchvNumeric = 0;
               let rguGaTradAchvNumeric = 0;

               // Parse nilai dari Kolom 7 (%Achv Trade Demand)
               if (tradeDemandAchvPercentage !== '>100%' && tradeDemandAchvPercentage !== '0.00%') {
                   tradeDemandAchvNumeric = parseFloat(tradeDemandAchvPercentage);
               } else if (tradeDemandAchvPercentage === '>100%') {
                   tradeDemandAchvNumeric = 100; // Atau nilai lain yang sesuai
               }

               // Parse nilai dari Kolom 13 (%Achv RGU GA Trad)
               if (rguGaTradAchvPercentage !== '>100%' && rguGaTradAchvPercentage !== '0.00%') {
                   rguGaTradAchvNumeric = parseFloat(rguGaTradAchvPercentage);
               } else if (rguGaTradAchvPercentage === '>100%') {
                   rguGaTradAchvNumeric = 100; // Atau nilai lain yang sesuai
               }

               // Hitung Total Score
               const totalScoreValue = ((tradeDemandAchvNumeric + rguGaTradAchvNumeric) * 0.5);
               totalScore = totalScoreValue.toFixed(2) + '%';

               // Tentukan warna background berdasarkan Total Score
               if (totalScoreValue <= 50) {
                   totalScoreBackgroundColor = '#ffcdd2'; // Merah
               } else if (totalScoreValue <= 79) {
                   totalScoreBackgroundColor = '#fff9c4'; // Kuning
               } else {
                   totalScoreBackgroundColor = '#c8e6c9'; // Hijau
               }

               rowHTML += `<td style="text-align: center; font-weight: bold; background-color: ${totalScoreBackgroundColor};">${totalScore}</td>`;

               // Kolom 17: Rank (Urutkan berdasarkan Total Score dari tertinggi ke terendah)
               let rank = '';
               let rankBackgroundColor = '';

               // Simpan nilai Total Score untuk perhitungan rank
               const totalScoreNumeric = parseFloat(totalScore);

               // Rank akan dihitung setelah semua baris diproses
               // Simpan nilai Total Score untuk perhitungan rank nanti
               if (!window.totalScores) {
                   window.totalScores = [];
               }
               window.totalScores.push({ id: idData, score: totalScoreNumeric });

               rowHTML += `<td style="text-align: center; font-weight: bold;">${rank}</td>`;

               // Tambahkan sel kosong untuk kolom 18-22 sementara dinonaktifkan
               for (let k = 0; k < 5; k++) { // Ada 5 kolom dari 18-22
                    rowHTML += `<td style="text-align: center; font-weight: bold;"></td>`;
              }

              rowHTML += '</tr>';
              tableBody.innerHTML += rowHTML;
          }

          // Hitung dan tampilkan rank setelah semua baris diproses
          if (window.totalScores && window.totalScores.length > 0) {
              // Urutkan totalScores berdasarkan score dari tertinggi ke terendah
              window.totalScores.sort((a, b) => b.score - a.score);

              // Tambahkan rank ke setiap baris
              const rows = tableBody.getElementsByTagName('tr');
              for (let i = 0; i < rows.length; i++) {
                  const cells = rows[i].getElementsByTagName('td');
                  if (cells.length > 16) { // Pastikan baris memiliki cukup kolom
                      const idCell = cells[0].textContent.trim();
                      const rankCell = cells[16]; // Kolom 17 (indeks 16)

                      // Cari rank untuk ID ini
                      const rankIndex = window.totalScores.findIndex(item => item.id === idCell);
                      if (rankIndex !== -1) {
                          const rankValue = rankIndex + 1;
                          rankCell.textContent = rankValue.toString();

                          // Berikan warna hijau hanya untuk rank 1-3
                          if (rankValue <= 3) {
                              rankCell.style.backgroundColor = '#c8e6c9'; // Hijau
                          }
                      }
                  }
              }

              // Reset totalScores untuk perhitungan berikutnya
              window.totalScores = [];
          }

          // Update pagination info (jika ada)
          const totalEntriesSpan = document.getElementById('totalEntries');
          if (totalEntriesSpan) {
              totalEntriesSpan.textContent = currentDisplayedData.length;
          }
      }
  }

  // Fungsi untuk memperbarui opsi filter dropdown
  export function updateFilters(dataRows, headerRow1, headerRow2) {
    console.log('Updating filters with data:', { dataRows, headerRow1, headerRow2 });
    
    const pageId = getPageId();
    const idFilter = document.getElementById('idFilter');
    const microClusterFilter = document.getElementById('microClusterFilter');
    const nama3KioskFilter = document.getElementById('nama3KioskFilter'); // Filter utama
    const kecamatanFilter = document.getElementById('kecamatanFilter');

    // Clear existing options except the first one
    if (idFilter) {
        idFilter.innerHTML = '<option value="">Semua ID</option>';
    }
    if (microClusterFilter) {
        microClusterFilter.innerHTML = '<option value="">Semua Micro Cluster</option>';
    }
    if (nama3KioskFilter) {
        nama3KioskFilter.innerHTML = '<option value="">Semua Nama 3Kiosk</option>';
    }
    if (kecamatanFilter) {
        kecamatanFilter.innerHTML = '<option value="">Semua Kecamatan</option>';
    }

    if (pageId === 'dashboard') {
        // Untuk dashboard, gunakan data dari file dashboard
        console.log('Using dashboard data for filters');
        
        // Tentukan indeks kolom dari header dashboard
        const idIndex = headerRow1.findIndex(h => h && String(h).toLowerCase().includes('id'));
        const microClusterIndex = headerRow1.findIndex(h => h && String(h).toLowerCase().includes('micro cluster'));
        const nama3KioskIndex = headerRow1.findIndex(h => h && String(h).toLowerCase().includes('nama 3kiosk'));

        console.log('Column indices for filters:', { idIndex, microClusterIndex, nama3KioskIndex });

        // Kumpulkan nilai unik dari data dashboard
        const uniqueIds = new Set();
        const uniqueMicroClusters = new Set();
        const uniqueNama3Kiosk = new Set();

        dataRows.forEach(row => {
            if (idIndex !== -1 && row[idIndex]) uniqueIds.add(String(row[idIndex]).trim());
            if (microClusterIndex !== -1 && row[microClusterIndex]) uniqueMicroClusters.add(String(row[microClusterIndex]).trim());
            if (nama3KioskIndex !== -1 && row[nama3KioskIndex]) uniqueNama3Kiosk.add(String(row[nama3KioskIndex]).trim());
        });

        // Add options to filters
        if (idFilter) {
            [...uniqueIds].sort().forEach(id => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = id;
                idFilter.appendChild(option);
            });
        }

        if (microClusterFilter) {
            [...uniqueMicroClusters].sort().forEach(mc => {
                const option = document.createElement('option');
                option.value = mc;
                option.textContent = mc;
                microClusterFilter.appendChild(option);
            });
        }

        // Populate both Nama 3Kiosk filters
        if (nama3KioskFilter) {
            [...uniqueNama3Kiosk].sort().forEach(nama => {
                const option = document.createElement('option');
                option.value = nama;
                option.textContent = nama;
                nama3KioskFilter.appendChild(option);
            });
        }
    } else {
        // Untuk halaman lain (target-3kiosk dan file-raw), gunakan data dari Excel
        const uniqueIds = new Set();
        const uniqueMicroClusters = new Set();
        const uniqueNama3Kiosk = new Set();
        const uniqueKecamatan = new Set();

        // Tentukan indeks kolom berdasarkan header
        const idIndex = headerRow1.findIndex(h => h && h.toLowerCase().includes('id'));
        const microClusterIndex = headerRow1.findIndex(h => h && h.toLowerCase().includes('micro cluster'));
        const nama3KioskIndex = headerRow1.findIndex(h => h && h.toLowerCase().includes('nama 3kiosk'));
        const kecamatanIndex = headerRow1.findIndex(h => h && h.toLowerCase().includes('kecamatan'));

        // Kumpulkan nilai unik dari data
        dataRows.forEach(row => {
            if (idIndex !== -1 && row[idIndex]) uniqueIds.add(row[idIndex]);
            if (microClusterIndex !== -1 && row[microClusterIndex]) uniqueMicroClusters.add(row[microClusterIndex]);
            if (nama3KioskIndex !== -1 && row[nama3KioskIndex]) uniqueNama3Kiosk.add(row[nama3KioskIndex]);
            if (kecamatanIndex !== -1 && row[kecamatanIndex]) uniqueKecamatan.add(row[kecamatanIndex]);
        });

        // Add options to filters
        if (idFilter) {
            [...uniqueIds].sort().forEach(id => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = id;
                idFilter.appendChild(option);
            });
        }

        if (microClusterFilter) {
            [...uniqueMicroClusters].sort().forEach(mc => {
                const option = document.createElement('option');
                option.value = mc;
                option.textContent = mc;
                microClusterFilter.appendChild(option);
            });
        }

        // Populate Nama 3Kiosk filter for other pages
        if (nama3KioskFilter) {
            [...uniqueNama3Kiosk].sort().forEach(nama => {
                const option = document.createElement('option');
                option.value = nama;
                option.textContent = nama;
                nama3KioskFilter.appendChild(option);
            });
        }

        if (kecamatanFilter) {
            [...uniqueKecamatan].sort().forEach(kec => {
                const option = document.createElement('option');
                option.value = kec;
                option.textContent = kec;
                kecamatanFilter.appendChild(option);
            });
        }
    }
}

// Fungsi untuk memfilter data berdasarkan input search dan filter dropdown
export function filterTable() {
    const pageId = getPageId();
    console.log('Filtering data for page:', pageId);

    if (pageId === 'dashboard') {
        // Ambil nilai filter
        const idFilter = document.getElementById('idFilter')?.value || '';
        const microClusterFilter = document.getElementById('microClusterFilter')?.value || '';
        const nama3KioskFilter = document.getElementById('nama3KioskFilter')?.value || '';
        const searchTerm = document.getElementById('globalSearch')?.value.toLowerCase() || '';

        console.log('Filter values:', { idFilter, microClusterFilter, nama3KioskFilter, searchTerm });
        console.log('Current data:', allTableData);

        // Filter data
        let filteredData = allTableData.filter(row => {
            // Filter berdasarkan ID
            if (idFilter && row[0] !== idFilter) {
                return false;
            }

            // Filter berdasarkan Micro Cluster
            if (microClusterFilter && row[2] !== microClusterFilter) {
                return false;
            }

            // Filter berdasarkan Nama 3Kiosk
            if (nama3KioskFilter && row[1] !== nama3KioskFilter) {
                return false;
            }

            // Filter berdasarkan search term
            if (searchTerm) {
                const rowString = row.join(' ').toLowerCase();
                if (!rowString.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });

        console.log('Filtered data:', filteredData);
        currentDisplayedData = filteredData;
        updateTable(filteredData);
    } else if (pageId === 'fileRaw') {
        const idFilter = document.getElementById('idFilter')?.value || '';
        const kecamatanFilter = document.getElementById('kecamatanFilter')?.value || '';
        const searchTerm = document.getElementById('globalSearch')?.value.toLowerCase() || '';

        let filteredData = [...allTableData];

        // Filter berdasarkan ID
        if (idFilter) {
            filteredData = filteredData.filter(row => {
                const idIndex = globalHeaderRow1.findIndex(h => h && String(h).toLowerCase().includes('id'));
                return idIndex !== -1 && row[idIndex] === idFilter;
            });
        }

        // Filter berdasarkan Kecamatan
        if (kecamatanFilter) {
            filteredData = filteredData.filter(row => {
                const kecamatanIndex = globalHeaderRow1.findIndex(h => h && String(h).toLowerCase().includes('kecamatan'));
                return kecamatanIndex !== -1 && row[kecamatanIndex] === kecamatanFilter;
            });
        }

        // Filter berdasarkan search term
        if (searchTerm) {
            filteredData = filteredData.filter(row => {
                const rowString = row.join(' ').toLowerCase();
                return rowString.includes(searchTerm);
            });
        }

        // Terapkan pagination untuk file raw
        if (currentViewEntries !== -1) {
            filteredData = filteredData.slice(0, currentViewEntries);
        }

        currentDisplayedData = filteredData;
        updateTable(filteredData);
    } else if (pageId === 'target3Kiosk') {
        const idFilter = document.getElementById('idFilter')?.value || '';
        const microClusterFilter = document.getElementById('microClusterFilter')?.value || '';
        const nama3KioskFilter = document.getElementById('nama3KioskFilter')?.value || '';
        const searchTerm = document.getElementById('globalSearch')?.value.toLowerCase() || '';

        let filteredData = [...allTableData];

        // Filter berdasarkan ID
        if (idFilter) {
            filteredData = filteredData.filter(row => {
                const idIndex = globalHeaderRow1.findIndex(h => h && String(h).toLowerCase().includes('id'));
                return idIndex !== -1 && row[idIndex] === idFilter;
            });
        }

        // Filter berdasarkan Micro Cluster
        if (microClusterFilter) {
            filteredData = filteredData.filter(row => {
                const mcIndex = globalHeaderRow1.findIndex(h => h && String(h).toLowerCase().includes('micro cluster'));
                return mcIndex !== -1 && row[mcIndex] === microClusterFilter;
            });
        }

        // Filter berdasarkan Nama 3Kiosk
        if (nama3KioskFilter) {
            filteredData = filteredData.filter(row => {
                const namaIndex = globalHeaderRow1.findIndex(h => h && String(h).toLowerCase().includes('nama 3kiosk'));
                return namaIndex !== -1 && row[namaIndex] === nama3KioskFilter;
            });
        }

        // Filter berdasarkan search term
        if (searchTerm) {
            filteredData = filteredData.filter(row => {
                const rowString = row.join(' ').toLowerCase();
                return rowString.includes(searchTerm);
            });
        }

        currentDisplayedData = filteredData;
        updateTable(filteredData);
    }
}

// Fungsi untuk mereset semua filter
function resetFilters() {
    // Reset nilai input search dan semua dropdown filter ke default ("Semua...")
    const globalSearchInput = document.getElementById('globalSearch');
     if(globalSearchInput) globalSearchInput.value = '';

     const idFilterSelect = document.getElementById('idFilter');
    if(idFilterSelect) idFilterSelect.value = '';

     const microClusterFilterSelect = document.getElementById('microClusterFilter');
    if(microClusterFilterSelect) microClusterFilterSelect.value = '';

     const nama3KioskFilterSelect = document.getElementById('nama3KioskFilter');
    if(nama3KioskFilterSelect) nama3KioskFilterSelect.value = '';

    const kecamatanFilterSelect = document.getElementById('kecamatanFilter');
    if(kecamatanFilterSelect) kecamatanFilterSelect.value = '';

    filterTable(); // Terapkan kembali filter (yang sekarang kosong)
}

// Fungsi untuk menangani upload file
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const pageId = getPageId();
    if (pageId === 'unknown') {
         alert('Unknown page, cannot upload file.');
         return;
    }

    console.log('Uploading file...', file.name, ' for ', pageId);
    try {
        // Panggil fungsi upload dengan file dan pageId
        const uploadedData = await uploadExcelFile(file, pageId);
        console.log('Upload successful!', uploadedData.name);
         // Log informasi setelah upload berhasil
         console.log(`DEBUG UPLOAD: File ${file.name} uploaded for page ${pageId}`);
         // uploadedData mungkin hanya berisi metadata, jadi tidak bisa log konten lengkap di sini.

        // Setelah upload, muat data terbaru dari Firestore untuk halaman yang sama
        await loadExcelData();

        alert('File uploaded and data loaded successfully!');
    } catch (error) {
        console.error('Upload failed:', error);
        alert('Failed to upload file. Check console for details.');
    }
}

// Fungsi untuk menangani download file
async function handleDownloadExcel() {
    console.log('Attempting to download data...');
    const pageId = getPageId();
    if (pageId === 'unknown') {
        alert('Unknown page, cannot download file.');
        return;
    }

    // Gunakan data yang saat ini ditampilkan di tabel (sudah difilter & digabung dengan statis jika dashboard)
    const dataToExport = currentDisplayedData;

    if (!dataToExport || dataToExport.length === 0) {
        alert('No data available to download.');
        return;
    }

    let headers = [];
    let merges = [];

    // Buat header dan tentukan merge berdasarkan halaman
    if (pageId === 'dashboard') {
        // Header spesifik Dashboard
        headers = [
            ['ID', 'Nama 3Kiosk', 'Micro Cluster', 'Trade Demand', null, null, null, null, null, 'RGU GA Trad', null, null, null, null, null, 'Total Score', 'Rank', 'Sellin 300K', null, null, null, null],
            [null, null, null, 'Target', 'Achv', 'GAP', '%Achv', 'LMTD', 'Growth', 'Target', 'Achv', 'GAP', '%Achv', 'LMTD', 'Growth', null, null, 'Secondary Outlet', 'Outlet PJP', 'Target', 'Achv', '%']
        ];
        // Definisi merge untuk header Dashboard
        merges = [
            { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // ID
            { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // Nama 3Kiosk
            { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } }, // Micro Cluster
            { s: { r: 0, c: 3 }, e: { r: 0, c: 8 } }, // Trade Demand
            { s: { r: 0, c: 9 }, e: { r: 0, c: 14 } }, // RGU GA Trad
            { s: { r: 0, c: 15 }, e: { r: 1, c: 15 } }, // Total Score
            { s: { r: 0, c: 16 }, e: { r: 1, c: 16 } }, // Rank
            { s: { r: 0, c: 17 }, e: { r: 0, c: 21 } }, // Sellin 300K
        ];
    } else {
        // Header standar (Target 3Kiosk & File RAW) - gunakan header asli dari upload
        headers.push(globalHeaderRow1);
        if (globalHeaderRow2.length > 0) {
            headers.push(globalHeaderRow2);
        }
    }

    // Siapkan data untuk sheet
    const sheetData = [...headers]; // Mulai sheet dengan header

    // Tambahkan data baris, terapkan format angka
    dataToExport.forEach(rowData => {
        const row = [];
        rowData.forEach((cellData, colIndex) => {
            // Tentukan apakah format angka perlu dikecualikan (sama seperti di updateTable)
            let excludeFormatting = false;
            if (pageId === 'target3Kiosk') {
                // Untuk Target 3Kiosk, kecualikan ID, PT TYPE, TS ID (dari header row 1)
                const headerText = globalHeaderRow1[colIndex];
                excludeFormatting = ['ID', 'PT TYPE', 'TS ID'].includes(headerText);
            } else if (pageId === 'fileRaw') {
                // Untuk File Raw, kecualikan ID, PT TYPE, TS ID (dari header row 1)
                const headerText = globalHeaderRow1[colIndex];
                excludeFormatting = ['ID', 'PT TYPE', 'TS ID'].includes(headerText);
            } else if (pageId === 'dashboard') {
                // Untuk Dashboard, kecualikan 3 kolom pertama (ID, Nama 3Kiosk, Micro Cluster)
                excludeFormatting = colIndex >= 0 && colIndex <= 2;
                
                // Khusus kolom Target Trade Demand di Dashboard (indeks 3)
                if (colIndex === 3) {
                    const idData = rowData[0]; // Ambil ID dari kolom pertama data yang ditampilkan
                    let targetTradeDemandValue = '';
                    
                    // Cari data di target3KioskRawData
                    if (target3KioskRawData.length > 0) {
                        // Cari baris yang cocok berdasarkan ID
                        const matchedTargetRow = target3KioskRawData.find(targetRow => {
                            // Cari kolom ID di data Target 3Kiosk
                            const idIndex = target3KioskHeaders1.findIndex(header => header && header.includes('ID'));
                            return idIndex !== -1 && targetRow[idIndex] !== undefined && String(targetRow[idIndex]) === String(idData);
                        });
                        
                        if (matchedTargetRow) {
                            // Cari kolom Trade Demand di data Target 3Kiosk
                            const tradeDemandIndex = target3KioskHeaders1.findIndex(header => header && header.includes('TRADE DEMAND'));
                            if (tradeDemandIndex !== -1 && matchedTargetRow[tradeDemandIndex] !== undefined) {
                                targetTradeDemandValue = matchedTargetRow[tradeDemandIndex];
                            }
                        }
                    }
                    
                    row.push(targetTradeDemandValue);
                    return;
                }
            }
            
            const formattedData = (cellData !== undefined && cellData !== null) ? 
                (excludeFormatting ? cellData : formatNumberWithThousandsSeparator(cellData)) : '';
            row.push(formattedData);
        });
        sheetData.push(row);
    });

    // Buat workbook dan sheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Tambahkan merge jika di halaman dashboard
    if (pageId === 'dashboard' && merges.length > 0) {
        ws['!merges'] = merges;
    }

    // Tambahkan sheet ke workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // Buat nama file
    const filename = `${pageId}_data_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;

    // Unduh file
    XLSX.writeFile(wb, filename);

    console.log('Download complete!');
}

// Event listener saat DOM selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    updateDateDisplay();

    const pageId = getPageId(); // Dapatkan pageId di sini

    // Inisialisasi data statis untuk dashboard
    if (pageId === 'dashboard') {
        console.log('Initializing static data for dashboard...');
        // Data statis untuk kolom 1, 2, 3
        allTableData = staticColumn1Data.map((id, index) => [
            id,
            staticColumn2Data[index] || '',
            staticColumn3Data[index] || ''
        ]);
        console.log('Static data initialized:', { dataCount: allTableData.length });

        // Inisialisasi filter untuk dashboard
        console.log('Initializing filters for dashboard...');
        const idFilter = document.getElementById('idFilter');
        const microClusterFilter = document.getElementById('microClusterFilter');
        const nama3KioskFilter = document.getElementById('nama3KioskFilter');

        // Reset filter options
        if (idFilter) {
            idFilter.innerHTML = '<option value="">Semua ID</option>';
            [...new Set(staticColumn1Data)].sort().forEach(id => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = id;
                idFilter.appendChild(option);
            });
        }

        if (nama3KioskFilter) {
            nama3KioskFilter.innerHTML = '<option value="">Semua Nama 3Kiosk</option>';
            [...new Set(staticColumn2Data)].sort().forEach(nama => {
                const option = document.createElement('option');
                option.value = nama;
                option.textContent = nama;
                nama3KioskFilter.appendChild(option);
            });
        }

        if (microClusterFilter) {
            microClusterFilter.innerHTML = '<option value="">Semua Micro Cluster</option>';
            [...new Set(staticColumn3Data)].sort().forEach(mc => {
                const option = document.createElement('option');
                option.value = mc;
                option.textContent = mc;
                microClusterFilter.appendChild(option);
            });
        }

        // Tambahkan event listeners untuk filter
        if (idFilter) {
            idFilter.addEventListener('change', () => {
                console.log('ID filter changed:', idFilter.value);
                filterTable();
            });
        }

        if (nama3KioskFilter) {
            nama3KioskFilter.addEventListener('change', () => {
                console.log('Nama 3Kiosk filter changed:', nama3KioskFilter.value);
                filterTable();
            });
        }

        if (microClusterFilter) {
            microClusterFilter.addEventListener('change', () => {
                console.log('Micro Cluster filter changed:', microClusterFilter.value);
                filterTable();
            });
        }

        // Event listener untuk reset filter
        const resetFiltersButton = document.getElementById('resetFilters');
        if (resetFiltersButton) {
            resetFiltersButton.addEventListener('click', () => {
                console.log('Resetting filters...');
                if (idFilter) idFilter.value = '';
                if (nama3KioskFilter) nama3KioskFilter.value = '';
                if (microClusterFilter) microClusterFilter.value = '';
                const globalSearch = document.getElementById('globalSearch');
                if (globalSearch) globalSearch.value = '';
                filterTable();
            });
        }
    }

    // Panggil updateRawFileDate() hanya di halaman fileRaw
    if (pageId === 'fileRaw') {
        updateRawFileDate();
    }

    loadExcelData();

    // Event listener untuk menu hamburger
    const hamburger = document.querySelector('.hamburger-menu');
    if (hamburger) {
        hamburger.addEventListener('click', toggleMenu);
    }

    // Event listener untuk upload file
    const fileUploadInput = document.getElementById('fileUpload');
    if (fileUploadInput) {
        fileUploadInput.addEventListener('change', handleFileUpload);
    }

    // Event listener untuk download file
    const downloadExcelButton = document.getElementById('downloadExcel');
    if (downloadExcelButton) {
        downloadExcelButton.addEventListener('click', handleDownloadExcel);
    }

    // Event listener untuk global search
    const globalSearchInput = document.getElementById('globalSearch');
    if (globalSearchInput) {
        globalSearchInput.addEventListener('input', filterTable);
    }

    // Event listeners untuk filter dropdown
     const idFilterSelect = document.getElementById('idFilter');
     if(idFilterSelect) idFilterSelect.addEventListener('change', filterTable);

     const microClusterFilterSelect = document.getElementById('microClusterFilter');
     if(microClusterFilterSelect) microClusterFilterSelect.addEventListener('change', filterTable);

     const nama3KioskFilterSelect = document.getElementById('nama3KioskFilter');
     if(nama3KioskFilterSelect) nama3KioskFilterSelect.addEventListener('change', filterTable);

    const kecamatanFilterSelect = document.getElementById('kecamatanFilter');
    if(kecamatanFilterSelect) kecamatanFilterSelect.addEventListener('change', filterTable);

    // Event listener for reset filters
    const resetFiltersButton = document.getElementById('resetFilters');
    if (resetFiltersButton) {
        resetFiltersButton.addEventListener('click', resetFilters);
    }

     // Event listener for View Entries (aktif hanya di halaman File Raw)
     const viewEntriesSelect = document.getElementById('viewEntries');
     if(viewEntriesSelect && getPageId() === 'fileRaw') { // Hanya aktif di halaman File Raw
         viewEntriesSelect.addEventListener('change', (event) => {
             currentViewEntries = parseInt(event.target.value, 10);
             filterTable(); // Apply filter again for pagination
         });
     }

    // Tambahkan event listener untuk menutup menu saat mengklik di luar area menu
    document.addEventListener('click', (event) => {
        const nav = document.querySelector('.nav');
        const hamburger = document.querySelector('.hamburger-menu');
        const targetElement = event.target; // Element clicked

        // Check if nav is active (open) and click is not inside nav or the hamburger button
        if (nav && nav.classList.contains('active') && !nav.contains(targetElement) && !hamburger.contains(targetElement)) {
            nav.classList.remove('active'); // Remove 'active' class to close the menu
        }
    });

    // Event listener to close menu when navigation links are clicked on mobile
    const navLinks = document.querySelectorAll('.nav ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const nav = document.querySelector('.nav');
            if (nav && nav.classList.contains('active')) {
                nav.classList.remove('active'); // Close the menu
            }
        });
    });

    // --- Tambahkan Firestore listeners untuk pembaruan otomatis di Dashboard ---
    let unsubscribeTarget = null; // Variabel untuk menyimpan fungsi unsubscribe
    let unsubscribeRaw = null; // Variabel untuk menyimpan fungsi unsubscribe

    if (pageId === 'dashboard') {
        console.log('Setting up Firestore listeners for dashboard...');

        // Listener untuk data Target 3Kiosk
        unsubscribeTarget = db.collection('excelData').doc('target3Kiosk').onSnapshot(snapshot => {
            console.log('Firestore snapshot change for target3Kiosk detected.');
            if (snapshot.exists) {
                // Panggil fungsi untuk memperbarui data Target 3Kiosk dan tabel dashboard
                updateDashboardDataSection('target3Kiosk');
            } else {
                console.log('target3Kiosk document does not exist.');
                // Dokumen dihapus, reset data target 3Kiosk di dashboard
                target3KioskRawData = [];
                target3KioskHeaders1 = [];
                target3KioskHeaders2 = [];
                // Mungkin perlu memanggil updateTable atau fungsi lain untuk merefresh tampilan jika data target dihapus
                 // Panggil updateDashboardDataSection untuk merefresh hanya bagian target
                 updateDashboardDataSection('target3Kiosk');
            }
        }, error => {
            console.error('Error listening to target3Kiosk data:', error);
        });

        // Listener untuk data File RAW
        unsubscribeRaw = db.collection('excelData').doc('fileRaw').onSnapshot(snapshot => {
            console.log('Firestore snapshot change for fileRaw detected.');
            if (snapshot.exists) {
                // Panggil fungsi untuk memperbarui data File RAW dan tabel dashboard
                updateDashboardDataSection('fileRaw');
            } else {
                console.log('fileRaw document does not exist.');
                // Dokumen dihapus, reset data file raw di dashboard
                 fileRawActualData = [];
                 fileRawActualHeaders1 = [];
                 fileRawActualHeaders2 = [];
                 rawTradeDemandMtdIndex = -1;
                 // Panggil updateDashboardDataSection untuk merefresh hanya bagian raw
                 updateDashboardDataSection('fileRaw');
            }
        }, error => {
            console.error('Error listening to fileRaw data:', error);
        });
        

        // --- Tambahkan cleanup untuk Firestore listeners saat halaman ditutup ---
    window.addEventListener('beforeunload', () => {
        console.log('Unsubscribing from Firestore listeners...');
        if (unsubscribeTarget) {
            unsubscribeTarget();
            console.log('Unsubscribed from target3Kiosk listener.');
        }
        if (unsubscribeRaw) {
            unsubscribeRaw();
            console.log('Unsubscribed from fileRaw listener.');
        }
    });
    }
    // --------------------------------------------------------------------------

    // Fungsi untuk menampilkan tanggal di judul card Raw File
    function updateRawFileDate() {
        const today = new Date();
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(today.getDate() - 2);
        
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        const formattedDate = twoDaysAgo.toLocaleDateString('id-ID', options);
        
        const rawFileDateElement = document.getElementById('rawFileDate');
        if (rawFileDateElement) {
            rawFileDateElement.textContent = formattedDate;
        }
    }

    // Panggil fungsi saat halaman dimuat
    document.addEventListener('DOMContentLoaded', function() {
        updateRawFileDate();
        // ... existing code ...
    });

    // Fungsi untuk memperbarui filter options
    function updateFilterOptions() {
        if (!allTableData || allTableData.length === 0) return;

        // Reset filter options
        const idFilter = document.getElementById('idFilter');
        const microClusterFilter = document.getElementById('microClusterFilter');
        const nama3KioskFilter = document.getElementById('nama3KioskFilter');
        const kecamatanFilter = document.getElementById('kecamatanFilter');

        // Clear existing options except the first one
        if (idFilter) {
            idFilter.innerHTML = '<option value="">Semua ID</option>';
        }
        if (microClusterFilter) {
            microClusterFilter.innerHTML = '<option value="">Semua Micro Cluster</option>';
        }
        if (nama3KioskFilter) {
            nama3KioskFilter.innerHTML = '<option value="">Semua Nama 3Kiosk</option>';
        }
        if (kecamatanFilter) {
            kecamatanFilter.innerHTML = '<option value="">Semua Kecamatan</option>';
        }

        // Collect unique values
        const uniqueIds = new Set();
        const uniqueMicroClusters = new Set();
        const uniqueNama3Kiosk = new Set();
        const uniqueKecamatan = new Set();

        allTableData.forEach(row => {
            if (row[0]) uniqueIds.add(row[0]); // ID
            if (row[1]) uniqueMicroClusters.add(row[1]); // Micro Cluster
            if (row[2]) uniqueNama3Kiosk.add(row[2]); // Nama 3Kiosk
            if (row[3]) uniqueKecamatan.add(row[3]); // Kecamatan
        });

        // Add options to filters
        if (idFilter) {
            [...uniqueIds].sort().forEach(id => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = id;
                idFilter.appendChild(option);
            });
        }

        if (microClusterFilter) {
            [...uniqueMicroClusters].sort().forEach(mc => {
                const option = document.createElement('option');
                option.value = mc;
                option.textContent = mc;
                microClusterFilter.appendChild(option);
            });
        }

        if (nama3KioskFilter) {
            [...uniqueNama3Kiosk].sort().forEach(nama => {
                const option = document.createElement('option');
                option.value = nama;
                option.textContent = nama;
                nama3KioskFilter.appendChild(option);
            });
        }

        if (kecamatanFilter) {
            [...uniqueKecamatan].sort().forEach(kec => {
                const option = document.createElement('option');
                option.value = kec;
                option.textContent = kec;
                kecamatanFilter.appendChild(option);
            });
        }
    }

    // Fungsi untuk menerapkan filter
    function applyFilters() {
        const searchTerm = document.getElementById('globalSearch').value.toLowerCase();
        const idFilter = document.getElementById('idFilter')?.value;
        const microClusterFilter = document.getElementById('microClusterFilter')?.value;
        const nama3KioskFilter = document.getElementById('nama3KioskFilter')?.value;
        const kecamatanFilter = document.getElementById('kecamatanFilter')?.value;

        currentDisplayedData = allTableData.filter(row => {
            // Filter berdasarkan pencarian global
            const rowString = row.join(' ').toLowerCase();
            if (searchTerm && !rowString.includes(searchTerm)) {
                return false;
            }

            // Filter berdasarkan ID
            if (idFilter && row[0] !== idFilter) {
                return false;
            }

            // Filter berdasarkan Micro Cluster
            if (microClusterFilter && row[1] !== microClusterFilter) {
                return false;
            }

            // Filter berdasarkan Nama 3Kiosk
            if (nama3KioskFilter && row[2] !== nama3KioskFilter) {
                return false;
            }

            // Filter berdasarkan Kecamatan
            if (kecamatanFilter && row[3] !== kecamatanFilter) {
                return false;
            }

            return true;
        });

        // Reset ke halaman pertama setelah filter
        currentPage = 1;
        
        // Update tampilan tabel
        updateTable();
        
        // Update pagination
        updatePagination();
    }

    // Event listeners untuk filter
    document.addEventListener('DOMContentLoaded', () => {
        // Global search
        const globalSearch = document.getElementById('globalSearch');
        if (globalSearch) {
            globalSearch.addEventListener('input', applyFilters);
        }

        // Filter dropdowns
        const idFilter = document.getElementById('idFilter');
        const microClusterFilter = document.getElementById('microClusterFilter');
        const nama3KioskFilter = document.getElementById('nama3KioskFilter');
        const kecamatanFilter = document.getElementById('kecamatanFilter');

        if (idFilter) idFilter.addEventListener('change', applyFilters);
        if (microClusterFilter) microClusterFilter.addEventListener('change', applyFilters);
        if (nama3KioskFilter) nama3KioskFilter.addEventListener('change', applyFilters);
        if (kecamatanFilter) kecamatanFilter.addEventListener('change', applyFilters);

        // Reset filter button
        const resetFilters = document.getElementById('resetFilters');
        if (resetFilters) {
            resetFilters.addEventListener('click', () => {
                if (globalSearch) globalSearch.value = '';
                if (idFilter) idFilter.value = '';
                if (microClusterFilter) microClusterFilter.value = '';
                if (nama3KioskFilter) nama3KioskFilter.value = '';
                if (kecamatanFilter) kecamatanFilter.value = '';
                
                currentDisplayedData = [...allTableData];
                currentPage = 1;
                updateTable();
                updatePagination();
            });
        }
    });
})
  