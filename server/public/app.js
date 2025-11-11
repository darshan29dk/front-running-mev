document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const config = {
        apiBase: window.location.origin + '/api',
        wsBase: `ws${window.location.protocol === 'https:' ? 's' : ''}://${window.location.host}`,
        updateInterval: 5000, // ms
    };

    // State
    let websocket = null;
    let charts = {
        pie: null,
        line: null
    };
    let walletAddress = null;

    // DOM Elements
    const elements = {
        status: document.getElementById('connectionStatus'),
        connectWallet: document.getElementById('connectWallet'),
        attackCount: document.getElementById('attackCount'),
        riskScore: document.getElementById('riskScore'),
        slippageTotal: document.getElementById('slippageTotal'),
        protectedUsers: document.getElementById('protectedUsers'),
        attackFeed: document.getElementById('attackFeed'),
        simulatorForm: document.getElementById('simulatorForm'),
        simResults: document.getElementById('simResults'),
        notifications: document.getElementById('notifications'),
        tabs: {
            nav: document.querySelectorAll('.nav-item'),
            content: document.querySelectorAll('.tab-content')
        }
    };

    // Initialize Charts
    function initCharts() {
        // Pie Chart
        const pieCtx = document.getElementById('pieChart').getContext('2d');
        charts.pie = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: ['Sandwich', 'Front-run', 'Back-run', 'Other'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#7c3aed', '#2563eb', '#059669', '#d97706']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#e2e8f0'
                        }
                    }
                }
            }
        });

        // Line Chart
        const lineCtx = document.getElementById('lineChart').getContext('2d');
        charts.line = new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Attacks',
                    data: [],
                    borderColor: '#7c3aed',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#334155'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    x: {
                        grid: {
                            color: '#334155'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#e2e8f0'
                        }
                    }
                }
            }
        });
    }

    // WebSocket Connection
    function connectWebSocket() {
        websocket = new WebSocket(config.wsBase);

        websocket.onopen = () => {
            elements.status.textContent = 'Connected';
            elements.status.style.color = '#059669';
            websocket.send(JSON.stringify({ type: 'subscribe', channel: 'attacks' }));
        };

        websocket.onclose = () => {
            elements.status.textContent = 'Disconnected';
            elements.status.style.color = '#dc2626';
            setTimeout(connectWebSocket, 5000);
        };

        websocket.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'attack-detected') {
                    const attackData = msg.data || {};
                    handleAttack(attackData);
                }
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        };

        websocket.onerror = () => {
            elements.status.textContent = 'Connection Error';
            elements.status.style.color = '#dc2626';
        };
    }

    // Handle Attack Event
    function handleAttack(attack) {
        // Add to feed
        const item = document.createElement('div');
        item.className = 'feed-item';
        item.innerHTML = `
            <span class="attack-type">${attack.attackType || 'Unknown Attack'}</span>
            <span class="attack-details">
                Risk: ${attack.riskScore ?? 'N/A'}% | 
                Target: ${attack.target ?? attack.victim ?? 'unknown'}
            </span>
            <span class="attack-time">${new Date().toLocaleTimeString()}</span>
        `;
        elements.attackFeed.insertBefore(item, elements.attackFeed.firstChild);

        // Limit feed items
        while (elements.attackFeed.childElementCount > 50) {
            elements.attackFeed.removeChild(elements.attackFeed.lastChild);
        }

        // Update stats
        updateStats();

        // Show notification
        showNotification(`New ${attack.attackType} attack detected!`, 'warning');
    }

    // Update Statistics
    async function updateStats() {
        try {
            const response = await fetch(`${config.apiBase}/stats`);
            const stats = await response.json();

            if (stats.success) {
                elements.attackCount.textContent = stats.data.todayAttacks;
                elements.riskScore.textContent = stats.data.avgRiskScore.toFixed(1) + '%';
                elements.slippageTotal.textContent = stats.data.totalSlippage.toFixed(2);
                elements.protectedUsers.textContent = stats.data.protectedUsers;

                // Update charts
                updateCharts(stats.data);
            }
        } catch (error) {
            console.error('Stats update error:', error);
            showNotification('Failed to update statistics', 'error');
        }
    }

    // Update Charts
    function updateCharts(data) {
        // Update pie chart
        if (data.attackTypes) {
            charts.pie.data.datasets[0].data = [
                data.attackTypes.sandwich || 0,
                data.attackTypes.frontRun || 0,
                data.attackTypes.backRun || 0,
                data.attackTypes.other || 0
            ];
            charts.pie.update();
        }

        // Update line chart
        if (data.timeline) {
            charts.line.data.labels = data.timeline.map(t => t.hour);
            charts.line.data.datasets[0].data = data.timeline.map(t => t.attacks);
            charts.line.update();
        }
    }

    // Simulator Form
    if (elements.simulatorForm) {
        elements.simulatorForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!walletAddress) {
                showNotification('Please connect your wallet first', 'error');
                return;
            }

            const formData = {
                targetAddress: e.target.targetAddress.value,
                value: e.target.txValue.value,
                data: e.target.txData.value || '0x'
            };

            try {
                const response = await fetch(`${config.apiBase}/simulate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();
                
                if (result.success) {
                    showSimulationResults(result.data);
                } else {
                    showNotification('Simulation failed: ' + result.error, 'error');
                }
            } catch (error) {
                showNotification('Simulation error: ' + error.message, 'error');
            }
        });
    }

    // Show Simulation Results
    function showSimulationResults(data) {
        elements.simResults.innerHTML = `
            <div class="sim-results">
                <h3>Simulation Results</h3>
                <div class="result-item">
                    <span>Risk Score:</span>
                    <span class="${data.riskScore > 70 ? 'high-risk' : data.riskScore > 30 ? 'medium-risk' : 'low-risk'}">
                        ${data.riskScore}%
                    </span>
                </div>
                <div class="result-item">
                    <span>Estimated Slippage:</span>
                    <span>${data.estimatedSlippage} ETH</span>
                </div>
                <div class="result-item">
                    <span>MEV Profit Potential:</span>
                    <span>${data.mevProfit} ETH</span>
                </div>
                <div class="recommendations">
                    <h4>Recommendations:</h4>
                    <ul>
                        ${data.recommendations.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
        elements.simResults.classList.remove('hidden');
    }

    // Notifications
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        elements.notifications.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Wallet Connection
    async function connectWallet() {
        window.open('https://metamask.io/download/', '_blank');
    }

    // Tab Navigation
    elements.tabs.nav.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            
            // Update nav items
            elements.tabs.nav.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update content
            elements.tabs.content.forEach(content => {
                content.classList.remove('active');
                if (content.id === target) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Initialize
    initCharts();
    connectWebSocket();
    updateStats();
    setInterval(updateStats, config.updateInterval);

    // Event Listeners
    elements.connectWallet.addEventListener('click', connectWallet);
});
