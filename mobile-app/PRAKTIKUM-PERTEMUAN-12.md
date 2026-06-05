# PRAKTIKUM PERTEMUAN 12: Dashboard & Data Visualization (Stable Version)

Dokumen ini berisi panduan *step-by-step* untuk mengimplementasikan fitur **Dashboard Laporan** dan **Visualisasi Data** menggunakan grafik pada aplikasi Point of Sales (POS) berbasis React Native. 

*Catatan: Kita akan menggunakan Victory Native versi 36 yang sangat stabil dan tidak memerlukan konfigurasi animasi yang rumit.*

---

## Langkah 1: Instalasi Library Grafik

Kita akan menggunakan library **Victory Native** untuk membuat grafik dan **React Native SVG** sebagai engine pengolah gambarnya.

1. **Buka Terminal** (VS Code Terminal atau CMD/Bash).
2. **Pastikan Anda berada di direktori project mobile-app.**
3. **Jalankan perintah berikut:**

```bash
npm install victory-native@36.9.2 react-native-svg
```

---

## Langkah 2: Membuat Layar Dashboard (DashboardScreen)

Layar ini akan berfungsi untuk mengambil data ringkasan penjualan dari API dan menampilkannya dalam bentuk grafik batang (Bar Chart) serta daftar detail.

1. **Buat file baru** bernama `DashboardScreen.js` di dalam folder `screens`. (`/screens/DashboardScreen.js`)
2. **Tuliskan kode berikut:**

```javascript
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, ScrollView } from 'react-native';
import { VictoryChart, VictoryTheme, VictoryBar, VictoryAxis } from 'victory-native';
import apiClient from '../api/config';

const DashboardScreen = () => {
    const [reportType, setReportType] = useState('daily');
    const [reportData, setReportData] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/reports.php?type=${reportType}`);
            
            if (response.data && response.data.data) {
                setReportData(response.data.data);
                setChartData(response.data.chartData || []);
            } else {
                setReportData([]);
                setChartData([]);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
            setReportData([]);
            setChartData([]);
        } finally {
            setLoading(false);
        }
    }, [reportType]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.buttonContainer}>
                <View style={styles.buttonWrapper}>
                    <Button 
                        title="Harian" 
                        onPress={() => setReportType('daily')} 
                        color={reportType === 'daily' ? '#2196F3' : '#757575'}
                    />
                </View>
                <View style={styles.buttonWrapper}>
                    <Button 
                        title="Mingguan" 
                        onPress={() => setReportType('weekly')} 
                        color={reportType === 'weekly' ? '#2196F3' : '#757575'}
                    />
                </View>
            </View>
            
            <Text style={styles.title}>Grafik Penjualan ({reportType === 'daily' ? 'Harian' : 'Mingguan'})</Text>
            
            <View style={styles.chartContainer}>
                {chartData.length > 0 ? (
                    <VictoryChart theme={VictoryTheme.material} domainPadding={20}>
                        <VictoryAxis />
                        <VictoryAxis dependentAxis tickFormat={(y) => (`Rp${y / 1000}k`)} />
                        <VictoryBar 
                            data={chartData} 
                            x="x" 
                            y="y"
                            style={{ data: { fill: "#2196F3" } }}
                        />
                    </VictoryChart>
                ) : (
                    <View style={styles.noData}>
                        <Text>Tidak ada data grafik untuk periode ini</Text>
                    </View>
                )}
            </View>

            <Text style={styles.title}>Detail Laporan</Text>
            {reportData.length > 0 ? (
                reportData.map((item, index) => (
                    <View key={index} style={styles.reportItem}>
                        <Text style={styles.reportDate}>
                            {reportType === 'daily' ? item.report_date : `Minggu ${item.report_week}`}
                        </Text>
                        <Text style={styles.reportSales}>Total: Rp. {parseFloat(item.total_sales).toLocaleString('id-ID')}</Text>
                    </View>
                ))
            ) : (
                <View style={styles.noData}>
                    <Text>Tidak ada rincian data laporan</Text>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10, backgroundColor: '#f5f5f5' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
    buttonWrapper: { flex: 1, marginHorizontal: 5 },
    title: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
    chartContainer: { backgroundColor: 'white', borderRadius: 10, padding: 10, marginBottom: 20, minHeight: 300, justifyContent: 'center' },
    noData: { alignItems: 'center', padding: 20 },
    reportItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        padding: 15,
        marginBottom: 5,
        borderRadius: 5,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
    },
    reportDate: { fontSize: 14, color: '#333' },
    reportSales: { fontSize: 14, fontWeight: 'bold', color: '#2E7D32' },
});

export default DashboardScreen;
```

---

## Langkah 3: Mendaftarkan Layar ke Navigasi (App.js)

Agar Dashboard bisa dibuka, kita perlu mendaftarkannya ke dalam `Stack.Navigator`.

1. **Buka file `App.js`.**
2. **Tambahkan import DashboardScreen:**

```javascript
import DashboardScreen from './screens/DashboardScreen';
```

**3. Daftarkan di dalam Stack.Navigator:**

```javascript
<Stack.Screen
  name="Dashboard"
  component={DashboardScreen}
  options={{ title: 'Dashboard Laporan' }}
/>
```

---

## Langkah 4: Menambahkan Tombol Dashboard di Layar Utama

1. **Buka file `screens/ProductListScreen.js`.**
2. **Tambahkan tombol Dashboard di bagian bawah layar:**

```javascript
<TouchableOpacity
    style={[styles.button, { backgroundColor: '#6200EE' }]}
    onPress={() => navigation.navigate('Dashboard')}
>
    <Text style={styles.buttonText}>📊 Dashboard</Text>
</TouchableOpacity>
```

---

## Langkah 5: Membuat Endpoint API Laporan (Backend)

1. **Buat file baru** `api/reports.php` di project backend.
2. **Gunakan kode berikut untuk mengagregasi data transaksi:**

```php
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once '../config/database.php';

$type = $_GET['type'] ?? 'daily';

try {
    if ($type === 'daily') {
        $query = "SELECT DATE(created_at) as report_date, SUM(final_amount) as total_sales FROM transactions GROUP BY DATE(created_at) ORDER BY report_date DESC LIMIT 7";
    } else {
        $query = "SELECT WEEK(created_at) as report_week, SUM(final_amount) as total_sales FROM transactions GROUP BY WEEK(created_at) ORDER BY report_week DESC LIMIT 4";
    }

    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $chartData = array_map(function($item) use ($type) {
        $label = $type === 'daily' ? date('d M', strtotime($item['report_date'])) : "Minggu " . $item['report_week'];
        return ['x' => $label, 'y' => (float)$item['total_sales']];
    }, array_reverse($reports));

    echo json_encode(['status' => 'success', 'data' => $reports, 'chartData' => $chartData]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
```

---

**Selesai!** Dashboard Anda sekarang menggunakan versi stabil dan siap digunakan.
