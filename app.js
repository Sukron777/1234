// Global chart instances
let grStatusChartInstance = null;
let destinationChartInstance = null;
let matlGroupChartInstance = null;

// DOM Elements
const fileInput = document.getElementById('csvFileInput');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const dashboardGrid = document.getElementById('dashboardGrid');
const dataInfo = document.getElementById('dataInfo');

// Setup Chart.js defaults for Dark Theme
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.9)';
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.titleFont = { size: 14, weight: 'bold' };
Chart.defaults.plugins.tooltip.bodyFont = { size: 13 };
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.padding = 20;

// Event Listener for File Upload
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Show loading
    emptyState.style.display = 'none';
    dashboardGrid.style.display = 'none';
    loadingState.style.display = 'flex';
    
    dataInfo.textContent = `Memproses: ${file.name}...`;

    Papa.parse(file, {
        delimiter: ";", // Fix for this specific CSV
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            processData(results.data);
            
            // Hide loading, show dashboard
            setTimeout(() => {
                loadingState.style.display = 'none';
                dashboardGrid.style.display = 'block';
                dataInfo.textContent = `Data berhasil dimuat (${results.data.length} baris)`;
            }, 800); // Artificial delay for smooth transition
        },
        error: function(error) {
            console.error("Error parsing CSV:", error);
            dataInfo.textContent = "Gagal membaca file CSV. Pastikan formatnya benar.";
            loadingState.style.display = 'none';
            emptyState.style.display = 'flex';
        }
    });
});

function processData(data) {
    // 1. KPI Calculations
    const totalRecords = data.length;
    let sudahGR = 0;
    let belumGR = 0;
    
    // Aggregation objects
    const destinations = {};
    const matlGroups = {};
    
    data.forEach(row => {
        // Find GR Status (Note: based on analysis, it might be in the second 'Material Document' column, 
        // or we check the keys since PapaParse handles duplicate headers by appending a number, e.g. 'Material Document_1')
        // Let's try to find it by value "Sudah GR" / "Belum GR" or fallback logic.
        let statusGR = "Unknown";
        for (const key in row) {
            const val = row[key] ? row[key].toString().trim() : "";
            if (val === "Sudah GR" || val === "Belum GR") {
                statusGR = val;
                break;
            }
        }
        
        if (statusGR === "Sudah GR") sudahGR++;
        if (statusGR === "Belum GR") belumGR++;

        // Destinations
        const dest = row["Destination"] ? row["Destination"].trim() : "Unknown";
        if (dest !== "Unknown" && dest !== "") {
            destinations[dest] = (destinations[dest] || 0) + 1;
        }

        // Material Groups
        const mg = row["Matl.Group"] ? row["Matl.Group"].trim() : "Unknown";
        if (mg !== "Unknown" && mg !== "") {
            matlGroups[mg] = (matlGroups[mg] || 0) + 1;
        }
    });

    // Update KPI UI
    document.getElementById('kpiTotalRecords').textContent = totalRecords.toLocaleString();
    document.getElementById('kpiSudahGR').textContent = sudahGR.toLocaleString();
    document.getElementById('kpiBelumGR').textContent = belumGR.toLocaleString();
    document.getElementById('kpiTotalDest').textContent = Object.keys(destinations).length.toLocaleString();

    // Render Charts
    renderGRStatusChart(sudahGR, belumGR);
    renderDestinationChart(destinations);
    renderMatlGroupChart(matlGroups);
}

function renderGRStatusChart(sudah, belum) {
    const ctx = document.getElementById('grStatusChart').getContext('2d');
    
    if (grStatusChartInstance) grStatusChartInstance.destroy();

    grStatusChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Sudah GR', 'Belum GR', 'Lainnya'],
            datasets: [{
                data: [sudah, belum, 0],
                backgroundColor: ['#10b981', '#f59e0b', '#3b82f6'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function renderDestinationChart(destData) {
    const ctx = document.getElementById('destinationChart').getContext('2d');
    
    // Sort and limit to top 5 for better visualization
    const sortedDests = Object.entries(destData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (destinationChartInstance) destinationChartInstance.destroy();

    destinationChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedDests.map(d => d[0]),
            datasets: [{
                label: 'Jumlah Pengiriman',
                data: sortedDests.map(d => d[1]),
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderRadius: 6,
                barThickness: 30
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                x: {
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function renderMatlGroupChart(mgData) {
    const ctx = document.getElementById('matlGroupChart').getContext('2d');
    
    // Sort and limit to top 8
    const sortedMGs = Object.entries(mgData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    if (matlGroupChartInstance) matlGroupChartInstance.destroy();

    matlGroupChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedMGs.map(d => d[0]),
            datasets: [{
                label: 'Jumlah Material',
                data: sortedMGs.map(d => d[1]),
                backgroundColor: 'rgba(139, 92, 246, 0.8)',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}
