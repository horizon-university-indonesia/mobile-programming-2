import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, Button, ActivityIndicator, ScrollView} from 'react-native';
import {VictoryChart, VictoryTheme, VictoryBar, VictoryAxis} from 'victory-native';
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
            // Check if response.data exists and has data property
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
                <ActivityIndicator size="large" color="#0000ff"/>
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
                        <VictoryAxis/>
                        <VictoryAxis dependentAxis tickFormat={(y) => (`Rp${y / 1000}k`)}/>
                        <VictoryBar
                            data={chartData}
                            x="x"
                            y="y"
                            style={{data: {fill: "#2196F3"}}}
                        />
                    </VictoryChart>
                ) : (
                    <View style={styles.noData}>
                        <Text>Tidak ada data grafik</Text>
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
                    <Text>Tidak ada data laporan</Text>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {flex: 1, padding: 10, backgroundColor: '#f5f5f5'},
    centered: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    buttonContainer: {flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20},
    buttonWrapper: {flex: 1, marginHorizontal: 5},
    title: {fontSize: 18, fontWeight: 'bold', marginVertical: 10},
    chartContainer: {backgroundColor: 'white', borderRadius: 10, padding: 10, marginBottom: 20, minHeight: 300, justifyContent: 'center'},
    noData: {alignItems: 'center', padding: 20},
    reportItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        padding: 15,
        marginBottom: 5,
        borderRadius: 5,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.2,
        shadowRadius: 1,
    },
    reportDate: {fontSize: 14, color: '#333'},
    reportSales: {fontSize: 14, fontWeight: 'bold', color: '#2E7D32'},
});

export default DashboardScreen;
