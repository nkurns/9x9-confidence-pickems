class PicksSummary {
  constructor() {
    this.serverUrl = "http://localhost:3333";
    this.loadPool();
    this.loadSummary();
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
    header.textContent = `${poolName} Picks Summary`;
  }

  async loadSummary() {
    try {
      const response = await fetch(`${this.serverUrl}/api/picks/summary`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.renderSummary(data);
    } catch (error) {
      console.error("Error loading summary:", error);
    }
  }

  renderSummary(data) {
    const table = document.getElementById("picks-summary");
    const thead = table.querySelector("thead tr");
    const tbody = document.getElementById("picks-summary-body");

    // Clear existing content
    thead.innerHTML = "";
    tbody.innerHTML = "";

    // Create headers
    const headers = [
      "Date",
      "Round",
      "Game",
      "Teams",
      "John Smith",
      "Lisa Brown",
      "Mike Wilson",
      "Sarah Johnson",
    ];
    headers.forEach((header) => {
      const th = document.createElement("th");
      th.textContent = header;
      thead.appendChild(th);
    });

    // Add game rows
    data.games.forEach((game) => {
      const row = document.createElement("tr");

      // Add date
      const timeCell = document.createElement("td");
      const date = new Date(game.gameTime);
      timeCell.textContent = `${date.getMonth() + 1}/${date.getDate()}`;
      row.appendChild(timeCell);

      // Add round
      const roundCell = document.createElement("td");
      roundCell.textContent = game.round;
      row.appendChild(roundCell);

      // Add game title
      const gameCell = document.createElement("td");
      gameCell.textContent = game.gameTitle;
      row.appendChild(gameCell);

      // Add teams
      const teamsCell = document.createElement("td");
      teamsCell.textContent = `${game.awayTeam} vs ${game.homeTeam}`;
      row.appendChild(teamsCell);

      // Get picks for this game
      const gamePicks = data.picks[game.id] || {};

      // Add picks for each participant using the correct IDs from the database
      const participantIds = [
        "676af5a66eb0ec41430c2fd7", // John Smith
        "676af5a66eb0ec41430c2fd8", // Lisa Brown
        "676af5a66eb0ec41430c2fd9", // Mike Wilson
        "676af5a66eb0ec41430c2fda", // Sarah Johnson
      ];

      participantIds.forEach((participantId) => {
        const td = document.createElement("td");
        const pick = gamePicks[participantId];

        if (pick) {
          td.innerHTML = `
            <div class="pick-team">${pick.selectedTeam}</div>
            <div class="pick-points">${pick.points}</div>
          `;
        } else {
          td.textContent = "No pick";
        }

        row.appendChild(td);
      });

      tbody.appendChild(row);
    });
  }
}

// Initialize the summary page
new PicksSummary();
