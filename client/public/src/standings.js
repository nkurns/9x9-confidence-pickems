class Standings {
  constructor() {
    this.serverUrl = "http://localhost:3333";
    this.chart = null;
    this.loadPool();
    this.loadStandings();
  }

  async loadPool() {
    try {
      const response = await fetch(`${this.serverUrl}/api/pool`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const pool = await response.json();
      this.updateHeader(pool.name);
    } catch (error) {
      console.error("Error loading pool:", error);
    }
  }

  updateHeader(poolName) {
    const header = document.querySelector("h1");
    header.textContent = `${poolName} Standings`;
  }

  async loadStandings() {
    try {
      const response = await fetch(`${this.serverUrl}/api/standings`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const standings = await response.json();
      this.renderStandings(standings);
    } catch (error) {
      console.error("Error loading standings:", error);
    }
  }

  renderStandings(standings) {
    const tbody = document.getElementById("standings-body");
    tbody.innerHTML = "";

    standings.forEach((participant, index) => {
      const row = document.createElement("tr");

      // Rank
      const rankCell = document.createElement("td");
      rankCell.textContent = index + 1;
      if (index < 3) {
        rankCell.classList.add(`rank-${index + 1}`);
      }
      row.appendChild(rankCell);

      // Name
      const nameCell = document.createElement("td");
      nameCell.textContent = participant.name;
      row.appendChild(nameCell);

      // Total Points
      const pointsCell = document.createElement("td");
      pointsCell.textContent = participant.totalPoints;
      row.appendChild(pointsCell);

      // Correct Picks
      const correctCell = document.createElement("td");
      correctCell.textContent = participant.correctPicks;
      row.appendChild(correctCell);

      // Win Percentage
      const winPctCell = document.createElement("td");
      const winPct =
        participant.totalPicks > 0
          ? ((participant.correctPicks / participant.totalPicks) * 100).toFixed(
              1
            )
          : "0.0";
      winPctCell.textContent = `${winPct}%`;
      row.appendChild(winPctCell);

      tbody.appendChild(row);
    });
    this.renderChart(standings);
  }

  renderChart(standings) {
    const ctx = document.getElementById("pointsChart");

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }

    // Prepare data
    const labels = standings.map((p) => p.name);
    const earnedPoints = standings.map((p) => p.totalPoints);
    const maxPoints = standings.map((p) => p.totalPicks * 11); // Assuming max points per pick is 11

    this.chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Points Earned",
            data: earnedPoints,
            backgroundColor: "#007bff",
            borderColor: "#0056b3",
            borderWidth: 1,
          },
          {
            label: "Points Available",
            data: maxPoints.map((max, i) => max - earnedPoints[i]),
            backgroundColor: "#e9ecef",
            borderColor: "#dee2e6",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: {
              display: true,
              text: "Points",
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: "Points Distribution",
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const datasetLabel = context.dataset.label;
                const value = context.parsed.y;
                return `${datasetLabel}: ${value}`;
              },
            },
          },
        },
      },
    });
  }
}

// Initialize the standings page
new Standings();
