<!DOCTYPE html>
<html>
<head>
    <title>Test Database Connection</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .success { color: green; }
        .error { color: red; }
        .info { color: blue; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Database Connection Test</h1>
    <div id="results"></div>

    <script>
        async function testConnection() {
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = '<p class="info">Testing database connection...</p>';

            try {
                // Test check_simulation_table.php
                const response = await fetch('check_simulation_table.php');
                const data = await response.json();
                
                resultsDiv.innerHTML = `
                    <h2>Results:</h2>
                    <p><strong>Status:</strong> <span class="${data.success ? 'success' : 'error'}">${data.success ? 'Success' : 'Failed'}</span></p>
                    <p><strong>Message:</strong> ${data.message}</p>
                    <p><strong>Total Records:</strong> ${data.total_records || 0}</p>
                    <h3>Recent Records:</h3>
                    <pre>${JSON.stringify(data.recent_records, null, 2)}</pre>
                    <h3>Table Structure:</h3>
                    <pre>${JSON.stringify(data.table_structure, null, 2)}</pre>
                `;
            } catch (error) {
                resultsDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
            }
        }

        testConnection();
    </script>
</body>
</html>
