// Data statis untuk kolom 1, 2, 3 (ID, Nama 3Kiosk, Micro Cluster)
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

// Fungsi untuk menginisialisasi filter
function initializeNettingFilters() {
    const nama3KioskFilter = document.getElementById('nettingNama3KioskFilter');
    const microClusterFilter = document.getElementById('nettingMicroClusterFilter');
    const idFilter = document.getElementById('nettingIdFilter');

    // Populate Nama 3Kiosk filter
    const uniqueNama3Kiosk = [...new Set(staticColumn2Data)];
    uniqueNama3Kiosk.forEach(nama => {
        const option = document.createElement('option');
        option.value = nama;
        option.textContent = nama;
        nama3KioskFilter.appendChild(option);
    });

    // Populate Micro Cluster filter
    const uniqueMicroCluster = [...new Set(staticColumn3Data)];
    uniqueMicroCluster.forEach(cluster => {
        const option = document.createElement('option');
        option.value = cluster;
        option.textContent = cluster;
        microClusterFilter.appendChild(option);
    });

    // Event listener untuk Micro Cluster filter
    microClusterFilter.addEventListener('change', function() {
        const selectedCluster = this.value;
        idFilter.innerHTML = '<option value="">Pilih ID</option>';
        
        if (selectedCluster) {
            // Enable ID filter
            idFilter.disabled = false;
            
            // Filter ID berdasarkan Micro Cluster yang dipilih
            staticColumn3Data.forEach((cluster, index) => {
                if (cluster === selectedCluster) {
                    const option = document.createElement('option');
                    option.value = staticColumn1Data[index];
                    option.textContent = staticColumn1Data[index];
                    idFilter.appendChild(option);
                }
            });
        } else {
            // Disable ID filter jika tidak ada Micro Cluster yang dipilih
            idFilter.disabled = true;
            // Disable Nama 3Kiosk filter
            nama3KioskFilter.disabled = true;
            nama3KioskFilter.value = '';
        }
    });

    // Event listener untuk ID filter
    idFilter.addEventListener('change', function() {
        const selectedId = this.value;
        if (selectedId) {
            // Enable Nama 3Kiosk filter
            nama3KioskFilter.disabled = false;
            // Cari index ID yang dipilih
            const idIndex = staticColumn1Data.indexOf(selectedId);
            if (idIndex !== -1) {
                // Set Nama 3Kiosk sesuai dengan ID yang dipilih
                nama3KioskFilter.value = staticColumn2Data[idIndex];
                // Isi data tabel netting
                fillNettingTableData(selectedId);
            }
        } else {
            // Disable Nama 3Kiosk filter jika tidak ada ID yang dipilih
            nama3KioskFilter.disabled = true;
            nama3KioskFilter.value = '';
        }
    });

    // Event listener untuk Nama 3Kiosk filter
    nama3KioskFilter.addEventListener('change', function() {
        const selectedNama = this.value;
        if (selectedNama) {
            // Reset Micro Cluster filter
            microClusterFilter.value = '';
            // Reset ID filter
            idFilter.innerHTML = '<option value="">Pilih Micro Cluster terlebih dahulu</option>';
            idFilter.disabled = true;
            // Disable Nama 3Kiosk filter
            this.disabled = true;
            this.value = '';
        }
    });

    // Event listener untuk tombol reset
    const resetButton = document.getElementById('resetNettingFilters');
    resetButton.addEventListener('click', function() {
        // Reset semua filter ke nilai default
        nama3KioskFilter.value = '';
        nama3KioskFilter.disabled = true;
        microClusterFilter.value = '';
        idFilter.innerHTML = '<option value="">Pilih Micro Cluster terlebih dahulu</option>';
        idFilter.disabled = true;
    });
}

// Fungsi untuk mengisi data pada tabel netting
function fillNettingTableData(selectedId) {
    // Ambil data dari tabel performa
    const performanceTable = document.getElementById('dataTable');
    if (!performanceTable) {
        console.error('Tabel performa tidak ditemukan');
        return;
    }
    const rows = performanceTable.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    
    // Cari baris yang sesuai dengan ID yang dipilih
    let targetData = null;
    let achieveData = null;
    let achPercentData = null;
    let rguGaTargetData = null;
    let rguGaAchieveData = null;
    let rguGaAchPercentData = null;
    let hvcAchieveData = 0;

    // Cari data di tabel performa
    for (let row of rows) {
        const cells = row.getElementsByTagName('td');
        if (cells[0].textContent === selectedId) {
            targetData = cells[3]?.textContent || '';
            achieveData = cells[4]?.textContent || '';
            achPercentData = cells[6]?.textContent || '';
            rguGaTargetData = cells[9]?.textContent || '';
            rguGaAchieveData = cells[10]?.textContent || '';
            rguGaAchPercentData = cells[12]?.textContent || '';
            break;
        }
    }

    // Ambil tabel netting
    const nettingTable = document.getElementById('dataTable2');
    if (!nettingTable) {
        console.error('Tabel netting tidak ditemukan');
        return;
    }
    const nettingRows = nettingTable.getElementsByTagName('tbody')[0].getElementsByTagName('tr');

    // Inisialisasi variabel untuk nilai-nilai TERTIARY
    let totalLmtDTertiary = 0;
    let totalMtdTertiary = 0;
    let totalLmtDTertiaryInner = 0;
    let totalMtdTertiaryInner = 0;
    let totalLmtDTertiaryOuter = 0;
    let totalMtdTertiaryOuter = 0;
    let totalMvcAchieve = 0;

    // Hitung nilai-nilai TERTIARY dan MVC
    if (window.fileRawActualData && window.fileRawActualData.length > 0) {
        const fileRawIdIndex = window.fileRawActualHeaders1.findIndex(header => header && String(header).trim().toLowerCase() === 'id');
        console.log('Indeks kolom ID:', fileRawIdIndex);
        
        const matchingRows = window.fileRawActualData.filter(rawRow =>
            rawRow[fileRawIdIndex] !== undefined &&
            String(rawRow[fileRawIdIndex]).trim() === String(selectedId).trim()
        );
        
        console.log('Jumlah baris yang cocok:', matchingRows.length);

        matchingRows.forEach(matchedRow => {
            // LMTD tertiary b# (kolom 8)
            const lmtDValue = matchedRow[7];
            if (lmtDValue !== undefined && lmtDValue !== null) {
                const cleanedValue = String(lmtDValue).trim().replace(/,/g, '.');
                totalLmtDTertiary += parseFloat(cleanedValue) || 0;
                console.log('LMTD Value:', { original: lmtDValue, cleaned: cleanedValue, total: totalLmtDTertiary });
            }

            // MTD tertiary b# (kolom 7)
            const mtdValue = matchedRow[6];
            if (mtdValue !== undefined && mtdValue !== null) {
                const cleanedValue = String(mtdValue).trim().replace(/,/g, '.');
                totalMtdTertiary += parseFloat(cleanedValue) || 0;
                console.log('MTD Value:', { original: mtdValue, cleaned: cleanedValue, total: totalMtdTertiary });
            }

            // LMTD tertiary b# inner (kolom 10)
            const lmtDInnerValue = matchedRow[9];
            if (lmtDInnerValue !== undefined && lmtDInnerValue !== null) {
                const cleanedValue = String(lmtDInnerValue).trim().replace(/,/g, '.');
                totalLmtDTertiaryInner += parseFloat(cleanedValue) || 0;
                console.log('LMTD Inner Value:', { original: lmtDInnerValue, cleaned: cleanedValue, total: totalLmtDTertiaryInner });
            }

            // MTD tertiary b# inner (kolom 9)
            const mtdInnerValue = matchedRow[8];
            if (mtdInnerValue !== undefined && mtdInnerValue !== null) {
                const cleanedValue = String(mtdInnerValue).trim().replace(/,/g, '.');
                totalMtdTertiaryInner += parseFloat(cleanedValue) || 0;
                console.log('MTD Inner Value:', { original: mtdInnerValue, cleaned: cleanedValue, total: totalMtdTertiaryInner });
            }

            // LMTD tertiary b# outer (kolom 12)
            const lmtDOuterValue = matchedRow[11];
            if (lmtDOuterValue !== undefined && lmtDOuterValue !== null) {
                const cleanedValue = String(lmtDOuterValue).trim().replace(/,/g, '.');
                totalLmtDTertiaryOuter += parseFloat(cleanedValue) || 0;
                console.log('LMTD Outer Value:', { original: lmtDOuterValue, cleaned: cleanedValue, total: totalLmtDTertiaryOuter });
            }

            // MTD tertiary b# outer (kolom 11)
            const mtdOuterValue = matchedRow[10];
            if (mtdOuterValue !== undefined && mtdOuterValue !== null) {
                const cleanedValue = String(mtdOuterValue).trim().replace(/,/g, '.');
                totalMtdTertiaryOuter += parseFloat(cleanedValue) || 0;
                console.log('MTD Outer Value:', { original: mtdOuterValue, cleaned: cleanedValue, total: totalMtdTertiaryOuter });
            }

            // HVC (kolom 39)
            const hvcValue = matchedRow[38];
            if (hvcValue !== undefined && hvcValue !== null) {
                const cleanedValue = String(hvcValue).trim().replace(/,/g, '.');
                hvcAchieveData += parseFloat(cleanedValue) || 0;
            }

            // MVC (kolom 43)
            const mvcValue = matchedRow[42];
            if (mvcValue !== undefined && mvcValue !== null) {
                const cleanedValue = String(mvcValue).trim().replace(/,/g, '.');
                totalMvcAchieve += parseFloat(cleanedValue) || 0;
            }
        });

        console.log('Hasil akhir perhitungan TERTIARY:', {
            totalLmtDTertiary,
            totalMtdTertiary,
            totalLmtDTertiaryInner,
            totalMtdTertiaryInner,
            totalLmtDTertiaryOuter,
            totalMtdTertiaryOuter
        });
    }

    // Isi data pada baris Trade Demand
    const tradeDemandRow = nettingRows[0];
    tradeDemandRow.cells[1].textContent = targetData;
    tradeDemandRow.cells[2].textContent = achieveData;
    tradeDemandRow.cells[3].textContent = achPercentData;
    tradeDemandRow.cells[6].textContent = '1%';

    // Isi data pada baris RGU GA
    const rguGaRow = nettingRows[1];
    rguGaRow.cells[1].textContent = rguGaTargetData;
    const rguGaAchieveValue = parseFloat(rguGaAchieveData) || 0;
    rguGaRow.cells[2].textContent = Math.round(rguGaAchieveValue);
    rguGaRow.cells[3].textContent = rguGaAchPercentData;
    rguGaRow.cells[6].textContent = '';

    // Isi data pada baris HVC
    const hvcRow = nettingRows[2];
    hvcRow.cells[2].textContent = Math.round(hvcAchieveData);

    // Isi data pada baris MVC
    const mvcRow = nettingRows[3];
    mvcRow.cells[2].textContent = Math.round(totalMvcAchieve);

    // Hitung hasil perkalian untuk kolom 8 baris 2 (Est Netting trade demand)
    const tertiaryBMTD = parseFloat(totalMtdTertiary) || 0;
    const multiplierTradeDemand = parseFloat(targetData) || 0;
    const tariffTradeDemand = parseFloat(achieveData) || 0;

    const estNettingTradeDemand = tertiaryBMTD * multiplierTradeDemand * tariffTradeDemand;
    tradeDemandRow.cells[7].textContent = Math.round(estNettingTradeDemand).toLocaleString('id-ID');

    // Log untuk debugging
    console.log('Data yang diisi ke tabel:', {
        selectedId,
        targetData,
        achieveData,
        achPercentData,
        rguGaTargetData,
        rguGaAchieveData,
        rguGaAchPercentData,
        hvcAchieveData,
        totalMvcAchieve,
        totalLmtDTertiary,
        totalMtdTertiary,
        totalLmtDTertiaryInner,
        totalMtdTertiaryInner,
        totalLmtDTertiaryOuter,
        totalMtdTertiaryOuter,
        estNettingTradeDemand
    });
}

// Panggil fungsi inisialisasi saat dokumen dimuat
document.addEventListener('DOMContentLoaded', initializeNettingFilters); 
document.addEventListener('DOMContentLoaded', initializeNettingFilters); 