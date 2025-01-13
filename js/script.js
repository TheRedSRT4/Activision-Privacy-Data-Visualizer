document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  const uploadButton = document.getElementById('uploadButton');
  const loader = document.getElementById('loader');
  const progressText = document.getElementById('progressText');
  const closeLoaderButton = document.getElementById('closeLoaderButton');

  // Log progress messages
  function logProgress(message) {
    progressText.textContent = message;
    console.log(message);
  }

  // Set the loader state
  function setLoaderState(state) {
    loader.style.display = state === 'loading' ? 'flex' : 'none';
  }

  // Generate a temporary page for viewing data
  function generateTemporaryPage(reportID, games) {
    const tempWindow = window.open('', '_blank');
  
    // Filter Cold War Multiplayer Match Data
    const coldWarGame = games.find((game) => game.title.toLowerCase().includes('cold war'));
    if (!coldWarGame) {
      tempWindow.document.write(`
        <h1>No data available for Cold War Multiplayer Match Data.</h1>
      `);
      tempWindow.document.close();
      return;
    }
  
    const multiplayerData = coldWarGame.stats.find(
      (stat) => stat.category === 'Multiplayer Match Data (reverse chronological)'
    );
    if (!multiplayerData) {
      tempWindow.document.write(`
        <h1>No Multiplayer Match Data available for Cold War.</h1>
      `);
      tempWindow.document.close();
      return;
    }
  
    const rows = multiplayerData.data.slice(1); // Exclude headers
  
    // Aggregate kills by day
    const aggregatedData = {};
    rows.forEach((row) => {
      const date = new Date(row[0]).toISOString().split('T')[0]; // Extract date from UTC Timestamp
      const kills = parseInt(row[5]) || 0; // Kills column
  
      if (!aggregatedData[date]) {
        aggregatedData[date] = 0;
      }
      aggregatedData[date] += kills;
    });
  
    // Prepare data for the chart
    const chartLabels = Object.keys(aggregatedData); // Dates
    const killsData = chartLabels.map((date) => aggregatedData[date]); // Daily kills
  
    // Log data for debugging
    console.log('Aggregated Daily Kills:', aggregatedData);
  
    tempWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Report ID: ${reportID}</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background-color: #121212;
            color: #e0e0e0;
            padding: 20px;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          .chart-container {
            width: 100%;
            max-width: 600px;
            height: 400px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Report ID: ${reportID}</h1>
          <div class="chart-container">
            <canvas id="coldWarChart"></canvas>
          </div>
        </div>
        <script>
          const ctx = document.getElementById('coldWarChart').getContext('2d');
          new Chart(ctx, {
            type: 'line',
            data: {
              labels: ${JSON.stringify(chartLabels)}, // Dates
              datasets: [
                {
                  label: 'Kills Per Day',
                  data: ${JSON.stringify(killsData)}, // Daily kills
                  borderColor: 'rgba(75, 192, 192, 1)',
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  tension: 0, // Disable line curvature
                  stepped: true, // Enable stepped line
                  fill: true,
                  pointRadius: 5,
                  pointHoverRadius: 7,
                },
              ],
            },
            options: {
              responsive: true,
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Date',
                  },
                },
                y: {
                  title: {
                    display: true,
                    text: 'Kills',
                  },
                  beginAtZero: true,
                },
              },
              plugins: {
                legend: {
                  display: true,
                  labels: {
                    color: '#e0e0e0',
                  },
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      return context.dataset.label + ': ' + context.raw;
                    },
                  },
                },
              },
            },
          });
        </script>
      </body>
      </html>
    `);
    tempWindow.document.close();
  }
  
  
  // Parse the HTML content to extract data
  function parseHTMLContent(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // Extract the Report ID
    const reportID = doc.querySelector('p')?.textContent.match(/Report ID:\s*(\d+)/)?.[1] || 'Unknown Report ID';

    // Titles to ignore
    const ignoredTitles = [
      'Activision SAR Report',
      'How We Use Your Personal Information',
      'Information We Collect',
      'Who We Send Your Data To',
      'Who Your Data Comes From',
      'How Long We Keep Your Data',
      'Your Rights'
    ];

    // Process relevant data
    const games = Array.from(doc.querySelectorAll('h1, h2, table')).reduce(
      (acc, node) => {
        if (node.tagName === 'H1' && !ignoredTitles.includes(node.textContent.trim())) {
          acc.currentGame = { title: node.textContent.trim(), stats: [] };
          acc.games.push(acc.currentGame);
        } else if (node.tagName === 'H2') {
          acc.currentGame.stats.push({ category: node.textContent.trim(), data: [] });
        } else if (node.tagName === 'TABLE') {
          const lastStat = acc.currentGame.stats[acc.currentGame.stats.length - 1];
          if (lastStat) {
            const rows = Array.from(node.querySelectorAll('tr'));
            rows.forEach((row) => {
              const cells = Array.from(row.querySelectorAll('td, th')).map((cell) => cell.textContent.trim());
              lastStat.data.push(cells);
            });
          }
        }
        return acc;
      },
      { games: [], currentGame: null }
    );

    return { reportID, games: games.games };
  }

  // Dynamically transform game data
  async function transformGameData(game) {
    try {
      const transformModule = await import(`js/transformGames/${game.title.replace(/\s+/g, '')}.js`);
      return transformModule.default(game);
    } catch (error) {
      console.warn(`No specific transformation found for ${game.title}. Using raw data.`);
      return game;
    }
  }

  // Event listener for the upload button
  uploadButton.addEventListener('click', async () => {
    const file = fileInput.files[0];

    if (!file) {
      logProgress('Error: Please select a file.');
      return;
    }

    if (!file.name.endsWith('.html')) {
      logProgress('Error: Only .html files are allowed.');
      return;
    }

    setLoaderState('loading');
    logProgress('Reading file...');

    const reader = new FileReader();
    reader.onload = async (e) => {
      logProgress('Parsing HTML content...');
      const parsedData = parseHTMLContent(e.target.result);
      console.log('Parsed Data:', parsedData);

      const transformedGames = [];
      for (const game of parsedData.games) {
        const transformedGame = await transformGameData(game);
        transformedGames.push(transformedGame);
      }

      console.log('Transformed Games:', transformedGames);

      // Generate the temporary page with transformed data
      generateTemporaryPage(parsedData.reportID, transformedGames);

      setLoaderState('none');
      logProgress('Processing complete!');
    };

    reader.onerror = () => {
      logProgress('Error reading the file.');
      setLoaderState('none');
    };

    reader.readAsText(file);
  });

  // Close loader button
  closeLoaderButton.addEventListener('click', () => {
    setLoaderState('none');
    progressText.textContent = '';
  });
});