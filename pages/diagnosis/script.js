document.addEventListener('DOMContentLoaded', () => {
    //initializeChart();
    loadDataset();
});

let chart;
let whichCellClicked = null;

function updateChart(value) {
    // Placeholder function to update chart based on slider value
    chart.options.plugins.annotation.annotations.line1.xMin = value;
    chart.options.plugins.annotation.annotations.line1.xMax = value;    // Update chart data here
    chart.options.plugins.annotation.annotations.line1.label.content = `Cutoff: ${value}`;

    chart.update();
}



// Load the dataset
function loadDataset() {
    console.log("loading dataset");
    Papa.parse("dataset.csv", {
        download: true,
        header: true,
        complete: function(results) {
            const data = results.data;

            // Extract data points
            const allData = [];
            const testData = [];

            data.forEach(record => {
                const xValue = parseFloat(record.diagnostic_value);
                const status = record.disease_status === "True" ? "has" : "doesn't";
                const name = record.name;

                // Create point with custom properties (x, y, name, status)
                const point = {
                    x: xValue,
                    y: 0.5,  // Fixed y-value to display points on a single line
                    name: name,
                    status: status
                };

                allData.push(point);
                testData.push(point);
            });

            // Set up the chart with empty datasets
            const ctx = document.getElementById('chart').getContext('2d');
            chart = new Chart(ctx, {
                type: 'scatter',
                data: {
                    datasets: [
                        {
                            label: 'Does Not Have Disease',
                            data: [],
                            backgroundColor: 'rgba(255, 205, 86, 0.3)', // Yellow
                            pointRadius: 6,
                            pointStyle: 'circle' // Yellow circles
                        },
                        {
                            label: 'Has Disease',
                            data: [],
                            backgroundColor: 'rgba(153, 102, 255, 0.6)', // Purple
                            pointRadius: 8,
                            pointStyle: 'triangle' // Purple spikes
                        }
                    ]
                },
                options: {
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const point = context.raw; // Access the original data point object
                                    return `${point.name}, ${point.status}, ${point.x.toFixed(1)}`;
                                }
                            }
                        },
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        annotation: {
                            annotations: {
                                line1: {
                                    type: 'line',
                                    xMin: 50, // Initial value
                                    xMax: 50, // Initial value
                                    borderColor: 'red',
                                    borderWidth: 2,
                                    label: {
                                        enabled: true,
                                        content: 'Cutoff',
                                        position: 'start'
                                    }
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom',
                            title: {
                                display: true,
                                text: 'Diagnostic Value'
                            },
                            min: 0,
                            max: 100
                        },
                        y: {
                            display: false // Hide y-axis since it's not relevant
                        }
                    }
                }
            });

            // Set up the testing chart with empty datasets
            const testCtx = document.getElementById('test-chart').getContext('2d');
            testChart = new Chart(testCtx, {
                type: 'scatter',
                data: {
                    datasets: [
                        {
                            label: 'Does Not Have Disease',
                            data: [],
                            backgroundColor: 'rgba(255, 205, 86, 0.3)', // Yellow
                            pointRadius: 6,
                            pointStyle: 'circle' // Yellow circles
                        },
                        {
                            label: 'Has Disease',
                            data: [],
                            backgroundColor: 'rgba(153, 102, 255, 0.6)', // Purple
                            pointRadius: 8,
                            pointStyle: 'triangle' // Purple spikes
                        }
                    ]
                },
                options: {
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const point = context.raw; // Access the original data point object
                                    return `${point.name}, ${point.status}, ${point.x.toFixed(1)}`;
                                }
                            }
                        },
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        annotation: {
                            annotations: {
                                line1: {
                                    type: 'line',
                                    xMin: 50, // Initial value
                                    xMax: 50, // Initial value
                                    borderColor: 'red',
                                    borderWidth: 2,
                                    label: {
                                        enabled: true,
                                        content: 'Cutoff',
                                        position: 'start'
                                    }
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom',
                            title: {
                                display: true,
                                text: 'Diagnostic Value'
                            },
                            min: 0,
                            max: 100
                        },
                        y: {
                            display: false // Hide y-axis since it's not relevant
                        }
                    }
                }
            });
    

            let currentIndex = 0;
            const maxPoints = 20;
            const loadMoreData = () => {
                if (currentIndex >= maxPoints) {
                    document.getElementById('loadMore').disabled = true;
                    document.getElementById('classification-container').style.display = 'block';
                    return;
                }

                const nextIndex = currentIndex + 1;
                const newData = allData.slice(currentIndex, nextIndex);

                const newHasDisease = newData.filter(point => point.status === "has");
                const newDoesNotHaveDisease = newData.filter(point => point.status === "doesn't");

                chart.data.datasets[0].data.push(...newDoesNotHaveDisease);
                chart.data.datasets[1].data.push(...newHasDisease);
                chart.update();

                currentIndex = nextIndex;

                if (currentIndex >= maxPoints) {
                    document.getElementById('loadMore').disabled = true;
                    document.getElementById('classification-container').style.display = 'block';
                }
            };

            
            let testCurrentIndex = 0;
            const loadMoreTestData = () => {
                const nextIndex = testCurrentIndex + 10;
                const newData = testData.slice(testCurrentIndex, nextIndex);

                const newHasDisease = newData.filter(point => point.status === "has");
                const newDoesNotHaveDisease = newData.filter(point => point.status === "doesn't");

                testChart.data.datasets[0].data.push(...newDoesNotHaveDisease);
                testChart.data.datasets[1].data.push(...newHasDisease);
                testChart.update();

                testCurrentIndex = nextIndex;

                calculateTestConfusionMatrix();
            };

            document.getElementById('loadMore').addEventListener('click', loadMoreData);
            document.getElementById('loadMoreTest').addEventListener('click', loadMoreTestData);

        }
    });

    document.getElementById('data-slider').addEventListener('input', function() {
        updateChart(this.value);
    });

    document.getElementById('calculate-matrix').addEventListener('click', function() {
        const cutoff = parseFloat(document.getElementById('data-slider').value);
        const rule = document.getElementById('classification-rule').value;
        calculateConfusionMatrix(cutoff, rule);
    });

    const matrixCells = document.querySelectorAll('.matrix div');
    matrixCells.forEach(cell => {
        //cellDiv = document.getElementById(cell.id);
        cell.addEventListener('click', function(event) {
            // If the cell is already clicked, reset it
            if (cell.clicked) {
                cell.style.backgroundColor = 'white';
                cell.clicked = false;
                resetPoints(cell.id);
                whichCellClicked = null;
            } else {
                // Reset all cells
                matrixCells.forEach(c => {
                    c.style.backgroundColor = 'white';
                    c.clicked = false;
                    resetPoints(cell.id);
                });

                // Highlight the clicked cell
                if (cell.id.includes('count')) {
                    cell.style.backgroundColor = 'red';
                    cell.clicked = true;
                    whichCellClicked = cell;
                    if (cell.id.includes('test')) {
                        highlightPoints(cell.id, testChart);
                    }else {
                        highlightPoints(cell.id, chart);
                    }
                }
            }
            });

        cell.addEventListener('mouseover', function(event) {
            showTooltip(event, cell);
        })

        cell.addEventListener('mouseleave', function() {
            hideTooltip();
        });
    });

    document.getElementById('confirm-cutoff').addEventListener('click', function() {
        // Deactivate the cutoff slider
        document.getElementById('data-slider').disabled = true;
    
        // Reveal the next section of the page
        document.getElementById('testing-container').style.display = 'block';

        // Set the cutoff line in the test chart
        const cutoff = parseFloat(document.getElementById('data-slider').value);
        testChart.options.plugins.annotation.annotations.line1.xMin = cutoff;
        testChart.options.plugins.annotation.annotations.line1.xMax = cutoff;
        testChart.options.plugins.annotation.annotations.line1.label.content = `Cutoff: ${cutoff}`;

        testChart.update();
    });
};


function calculateConfusionMatrix(cutoff, rule) {
    const tp = chart.data.datasets[1].data.filter(point => (rule === 'less' ? point.x <= cutoff : point.x > cutoff)).length;
    const tn = chart.data.datasets[0].data.filter(point => (rule === 'less' ? point.x > cutoff : point.x <= cutoff)).length;
    const fp = chart.data.datasets[0].data.filter(point => (rule === 'less' ? point.x <= cutoff : point.x > cutoff)).length;
    const fn = chart.data.datasets[1].data.filter(point => (rule === 'less' ? point.x > cutoff : point.x <= cutoff)).length;

    document.getElementById('tp-count').textContent = tp;
    document.getElementById('tn-count').textContent = tn;
    document.getElementById('fp-count').textContent = fp;
    document.getElementById('fn-count').textContent = fn;

    document.getElementById('confusion-matrix').style.display = 'block';
}

function calculateTestConfusionMatrix() {
    const cutoff = parseFloat(document.getElementById('data-slider').value);
    const rule = document.getElementById('classification-rule').value;

    const tp = testChart.data.datasets[1].data.filter(point => (rule === 'less' ? point.x <= cutoff : point.x > cutoff)).length;
    const tn = testChart.data.datasets[0].data.filter(point => (rule === 'less' ? point.x > cutoff : point.x <= cutoff)).length;
    const fp = testChart.data.datasets[0].data.filter(point => (rule === 'less' ? point.x <= cutoff : point.x > cutoff)).length;
    const fn = testChart.data.datasets[1].data.filter(point => (rule === 'less' ? point.x > cutoff : point.x <= cutoff)).length;

    document.getElementById('test-tp-count').textContent = tp;
    document.getElementById('test-tn-count').textContent = tn;
    document.getElementById('test-fp-count').textContent = fp;
    document.getElementById('test-fn-count').textContent = fn;
}

function showTooltip(event, cell) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = getTooltipText(cell.id);
    document.body.appendChild(tooltip);
    tooltip.style.left = `${event.pageX + 10}px`;
    tooltip.style.top = `${event.pageY + 10}px`;
    tooltip.style.display = 'block';
}

function hideTooltip() {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

function getTooltipText(id) {
    switch (id) {
        case 'tp-count':
        case 'test-tp-count':
            return 'True Positives (TP): Correctly identified as having the disease.';
        case 'tn-count':
        case 'test-tn-count':
            return 'True Negatives (TN): Correctly identified as not having the disease.';
        case 'fp-count':
        case 'test-fp-count':
            return 'False Positives (FP): Incorrectly identified as having the disease.';
        case 'fn-count':
        case 'test-fn-count':
            return 'False Negatives (FN): Incorrectly identified as not having the disease.';
        default:
            return '';
    }
}

function highlightPoints(id, chartId) {
    const cutoff = parseFloat(document.getElementById('data-slider').value);
    const rule = document.getElementById('classification-rule').value;

    chartId.data.datasets.forEach((dataset, datasetIndex) => {
        dataset.data.forEach((point, pointIndex) => {
            const isPositive = rule === 'less' ? point.x <= cutoff : point.x > cutoff;
            const isHighlighted = (id.includes('tp') && datasetIndex === 1 && isPositive) ||
                                  (id.includes('fn') && datasetIndex === 1 && !isPositive) ||
                                  (id.includes('fp') && datasetIndex === 0 && isPositive) ||
                                  (id.includes('tn') && datasetIndex === 0 && !isPositive);

            point.highlight = isHighlighted;  // Set the highlight property to true or false

            // Change the visual properties of the point directly if highlighted
            if (point.highlight) {
                dataset.pointBackgroundColor = dataset.pointBackgroundColor || []; // Ensure property exists

                // Set point-specific styles by directly accessing the dataset properties
                dataset.pointBackgroundColor[pointIndex] = 'rgba(255,0,0,0.8)'; // Change to red color for highlighting
                dataset.pointRadius = dataset.pointRadius || []; // Ensure array exists
                dataset.pointRadius[pointIndex] = 20;  // Increase point size
            } else {
                // Reset to default styles if not highlighted
                dataset.pointBackgroundColor = dataset.pointBackgroundColor || [];
                dataset.pointBackgroundColor[pointIndex] = dataset.backgroundColor; // Set to default dataset color
                dataset.pointRadius = dataset.pointRadius || [];
                dataset.pointRadius[pointIndex] = 6;  // Reset to default size
            }
        });

    });

    chartId.update();
}

function resetPoints(cellId) {
    let chartId = cellId.includes('test') ? testChart : chart;
    chartId.data.datasets.forEach((dataset, datasetIndex) => {
        dataset.data.forEach((point, pointIndex) => {
            dataset.pointBackgroundColor = dataset.pointBackgroundColor || [];
            dataset.pointBackgroundColor[pointIndex] = dataset.backgroundColor; // Set to default dataset color
            dataset.pointRadius = dataset.pointRadius || [];
            dataset.pointRadius[pointIndex] = 6;  // Reset to default size        });
        });
    })
    chartId.update();
}