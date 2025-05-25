// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
// import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js"; // Tidak lagi menggunakan Storage

// Konfigurasi Firebase Anda
const firebaseConfig = {
    apiKey: "AIzaSyCYOo-ig7nwJzNgLLS4Qje2FZFokPmtgXY",
    authDomain: "kiosk-3f674.firebaseapp.com",
    projectId: "kiosk-3f674",
    storageBucket: "kiosk-3f674.firebasestorage.app", // Meskipun tidak digunakan, properti ini mungkin ada
    messagingSenderId: "900540315357",
    appId: "1:900540315357:web:1b3cdb10a605b535c2cd34",
    measurementId: "G-XED77TGRMF"
    // databaseURL tidak diperlukan untuk Firestore
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Gunakan getFirestore
// const storage = getStorage(app); // Tidak lagi menggunakan Storage

export { db }; // Mengekspor instance db

// Fungsi untuk membaca file sebagai string Base64
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            // Ambil bagian Base64 setelah koma standar
            const base64String = result.split(',')[1];
            if (base64String) {
                resolve(base64String);
            } else {
                reject('Failed to read file as Base64.');
            }
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// Fungsi untuk menyimpan konten file Excel (sebagai Base64) ke Firestore untuk halaman spesifik
export async function uploadExcelFile(file, pageId) {
    try {
        const base64Content = await readFileAsBase64(file);
        
        // Simpan konten Base64 ke Firestore di koleksi spesifik halaman
        // Perhatian: Pastikan ukuran total data dalam dokumen tidak melebihi 1MB
        // Menggunakan nama file sebagai ID dokumen untuk kemudahan (jika nama file unik per halaman)
        // Atau bisa menggunakan addDoc untuk ID otomatis jika satu halaman bisa punya banyak file
        // Untuk saat ini, mari gunakan addDoc dengan timestamp untuk mendapatkan yang terbaru
        const docRef = await addDoc(collection(db, pageId + 'Data'), {
            name: file.name,
            content: base64Content, // Simpan konten sebagai string Base64
            timestamp: new Date() // Gunakan objek Date untuk timestamp di Firestore
        });
        
        console.log("Document written with ID: ", docRef.id, " in collection ", pageId + 'Data');
        // Mengembalikan data dokumen yang tersimpan
        return { name: file.name, content: base64Content };
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

// Fungsi untuk mengambil konten file Excel terbaru (sebagai Base64) dari Firestore untuk halaman spesifik
export async function fetchExcelData(pageId) {
    try {
        const dataCollection = collection(db, pageId + 'Data');
        // Query untuk mendapatkan dokumen terbaru berdasarkan timestamp
        const q = query(dataCollection, orderBy('timestamp', 'desc'), limit(1));
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const latestDoc = querySnapshot.docs[0];
            return latestDoc.data(); // Mengembalikan data dokumen (termasuk content Base64)
        }
        return null;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

// Fungsi untuk mengunduh file Excel (menggunakan konten Base64)
export async function downloadExcelFile(data) { // data diharapkan berupa objek { name: string, content: string (base64) }
    try {
        if (!data || !data.content) {
            console.error('No data or content to download.');
            return;
        }

        // Konversi Base64 kembali menjadi Blob
        const byteCharacters = atob(data.content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }); // Tipe MIME untuk .xlsx

        // Buat URL objek dan trigger download
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = data.name || 'downloaded_data.xlsx'; // Gunakan nama file dari data jika ada
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        console.error('Error downloading file:', error);
        throw error;
    }
} 