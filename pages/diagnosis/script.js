document.addEventListener('DOMContentLoaded', () => {
    //initializeChart();
    loadDataset();
});

let chart;

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
                            backgroundColor: 'rgba(255, 205, 86, 0.7)', // Yellow
                            pointRadius: 6,
                            pointStyle: 'circle' // Yellow circles
                        },
                        {
                            label: 'Has Disease',
                            data: [],
                            backgroundColor: 'rgba(153, 102, 255, 0.7)', // Purple
                            pointRadius: 6,
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

            document.getElementById('loadMore').addEventListener('click', loadMoreData);
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
        cell.addEventListener('click', function(event) {
            showTooltip(event, cell);
            highlightPoints(cell.id);
        });
        cell.addEventListener('mouseleave', function() {
            hideTooltip();
            resetPoints();
        });
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
    console.log(id, id.includes('tp'))
    switch (id) {
        case 'tp-count':
            return 'True Positives (TP): Correctly identified as having the disease.';
        case 'tn-count':
            return 'True Negatives (TN): Correctly identified as not having the disease.';
        case 'fp-count':
            return 'False Positives (FP): Incorrectly identified as having the disease.';
        case 'fn-count':
            return 'False Negatives (FN): Incorrectly identified as not having the disease.';
        default:
            return '';
    }
}

function highlightPoints(id) {
    const cutoff = parseFloat(document.getElementById('data-slider').value);
    const rule = document.getElementById('classification-rule').value;

    chart.data.datasets.forEach((dataset, datasetIndex) => {
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
                dataset.pointBackgroundColor[pointIndex] = 'red'; // Change to black color for highlighting
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

    chart.update();
}

function resetPoints() {
    chart.data.datasets.forEach(dataset => {
        dataset.data.forEach(point => {
            point.highlight = false;  // Reset highlight property to false
        });
    });
    chart.update();
}