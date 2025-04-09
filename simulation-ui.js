let simulation;
let canvas;
let simLog;
let logEntries = [];
const MAX_LOG_ENTRIES = 50;

function setup() {
  
  canvas = createCanvas(windowWidth - 330, windowHeight - 350);
  canvas.parent('sim-canvas');
  
  
  simulation = new AISimulation();
  
  
  simLog = document.getElementById('sim-log');
  
  
  simulation.onProgress = updateProgress;
  simulation.onSimulationComplete = showResults;
  simulation.onGameComplete = updateGameCompletion;
  simulation.onHandComplete = updateHandCompletion;
  simulation.onLog = addLogEntry;
  
  
  setupUI();
  
  
  document.getElementById('num-games').value = simulation.numGames;
  document.getElementById('num-hands').value = simulation.handsPerGame;
  document.getElementById('initial-chips').value = simulation.initialChips;
  document.getElementById('small-blind').value = simulation.smallBlind;
  document.getElementById('big-blind').value = simulation.bigBlind;
  
  
  populateStrategyDropdowns();
  
  
  updateStatDisplay();
}

function draw() {
  
  background('#1a1a1a');
  
  
  if (simulation.isRunning) {
    drawSimulationProgress();
  } else {
    drawSimulationIdle();
  }
  
  
  if (simulation.gameInstance && simulation.isRunning) {
    drawGameState();
  }
}

function windowResized() {
  resizeCanvas(windowWidth - 330, windowHeight - 350);
}

function populateStrategyDropdowns() {
  const dropdowns = [
    document.getElementById('player1-strategy'),
    document.getElementById('player2-strategy'),
    document.getElementById('player3-strategy')
  ];
  
  
  dropdowns.forEach(dropdown => {
    dropdown.innerHTML = '';
  });
  
  
  simulation.availableStrategies.forEach(strategy => {
    dropdowns.forEach((dropdown, index) => {
      const option = document.createElement('option');
      option.value = strategy;
      option.textContent = strategy.charAt(0).toUpperCase() + strategy.slice(1);
      dropdown.appendChild(option);
      
      
      if (index < simulation.selectedStrategies.length) {
        if (strategy === simulation.selectedStrategies[index]) {
          option.selected = true;
        }
      }
    });
  });
}

function setupUI() {
  
  document.getElementById('start-sim').addEventListener('click', () => {
    
    const config = {
      numGames: parseInt(document.getElementById('num-games').value),
      handsPerGame: parseInt(document.getElementById('num-hands').value),
      initialChips: parseInt(document.getElementById('initial-chips').value),
      smallBlind: parseInt(document.getElementById('small-blind').value),
      bigBlind: parseInt(document.getElementById('big-blind').value),
      selectedStrategies: [
        document.getElementById('player1-strategy').value,
        document.getElementById('player2-strategy').value,
        document.getElementById('player3-strategy').value
      ]
    };
    
    
    simulation.configure(config).start();
    
    
    document.getElementById('start-sim').disabled = true;
    document.getElementById('stop-sim').disabled = false;
    document.getElementById('reset-sim').disabled = true;
    
    
    setInputsEnabled(false);
    
    
    clearLog();
  });
  
  
  document.getElementById('stop-sim').addEventListener('click', () => {
    
    simulation.stop();
    
    
    cleanupAfterStop();
    
    
    document.getElementById('start-sim').disabled = false;
    document.getElementById('stop-sim').disabled = true;
    document.getElementById('reset-sim').disabled = false;
    
    
    setInputsEnabled(true);
  });
  
  
  document.getElementById('reset-sim').addEventListener('click', () => {
    simulation.resetMetrics();
    updateProgress(0);
    
    
    document.getElementById('stat-content').innerHTML = '';
    document.getElementById('progress-text').textContent = 'Ready to start';
    
    
    document.getElementById('reset-sim').disabled = true;
    
    
    clearLog();
    
    
    updateStatDisplay();
  });
}

function setInputsEnabled(enabled) {
  document.getElementById('num-games').disabled = !enabled;
  document.getElementById('num-hands').disabled = !enabled;
  document.getElementById('initial-chips').disabled = !enabled;
  document.getElementById('small-blind').disabled = !enabled;
  document.getElementById('big-blind').disabled = !enabled;
  document.getElementById('player1-strategy').disabled = !enabled;
  document.getElementById('player2-strategy').disabled = !enabled;
  document.getElementById('player3-strategy').disabled = !enabled;
}

function updateProgress(progress) {
  const progressPercent = Math.round(progress * 100);
  document.getElementById('progress-fill').style.width = `${progressPercent}%`;
  document.getElementById('progress-text').textContent = `Progress: ${progressPercent}%`;
  
  
  if (progressPercent % 10 === 0 || progressPercent >= 99) {
    updateStatDisplay();
  }
}

function updateGameCompletion(gameNumber) {
  addLogEntry(`Game ${gameNumber} completed`);
  
  
  updateStatDisplay();
}

function updateHandCompletion(gameNumber, handNumber, winners) {
  
  if (handNumber % 5 === 0 || handNumber === 1) {
    addLogEntry(`Game ${gameNumber}, Hand ${handNumber} completed`);
  }
  
  
  if (handNumber % 5 === 0) {
    updateStatDisplay();
  }
}

function showResults(results) {
  updateStatDisplay();
  addLogEntry('Simulation complete! Final results displayed.');
}

function updateStatDisplay() {
  const statContent = document.getElementById('stat-content');
  
  
  statContent.innerHTML = '';
  
  
  if (simulation.metrics.gamesPlayed > 0 || simulation.isRunning) {
    const heading = document.createElement('h3');
    heading.textContent = simulation.isRunning ? 'Interim Results' : 'Final Results';
    statContent.appendChild(heading);
    
    
    const winRateSection = document.createElement('div');
    winRateSection.className = 'stat-card';
    winRateSection.innerHTML = '<h4>Chip Performance</h4>';
    
    
    const strategies = simulation.selectedStrategies;
    strategies.forEach(strategy => {
      const metrics = simulation.metrics.strategyMetrics[strategy];
      
      
      if (metrics) {
        
        const initialChips = metrics.initialChips;
        const currentChips = metrics.currentChips;
        const chipDelta = metrics.chipDelta;
        const handsPlayed = metrics.handsPlayed || 1; 
        
        
        const roi = (chipDelta / initialChips) * 100;
        
        
        const avgProfitPerHand = chipDelta / handsPlayed;
        
        
        let avgChipWin = 0;
        if (metrics.handsWon > 0 && metrics.totalChipsWon > 0) {
          avgChipWin = metrics.totalChipsWon / metrics.handsWon;
        }
        
        const strategyDiv = document.createElement('div');
        strategyDiv.className = 'strategy-label';
        strategyDiv.textContent = `${strategy}`;
        winRateSection.appendChild(strategyDiv);
        
        
        const roiRow = document.createElement('div');
        roiRow.className = 'metric-row';
        roiRow.innerHTML = `
          <span>ROI: <span class="${roi >= 0 ? 'chip-positive' : 'chip-negative'}">${roi.toFixed(2)}%</span></span>
          <span>Hands: ${metrics.handsPlayed || 0}</span>
        `;
        winRateSection.appendChild(roiRow);
        
        
        const profitRow = document.createElement('div');
        profitRow.className = 'metric-row';
        profitRow.innerHTML = `
          <span>Profit/hand: <span class="${avgProfitPerHand >= 0 ? 'chip-positive' : 'chip-negative'}">${avgProfitPerHand.toFixed(2)}</span></span>
          <span>Avg win: <span class="chip-positive">${avgChipWin.toFixed(1)}</span></span>
        `;
        winRateSection.appendChild(profitRow);
        
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-bar-fill';
        
        
        const normalizedROI = Math.min(Math.max(roi, -25), 25);
        const roiPercentage = 50 + (normalizedROI * 2); 
        
        progressFill.style.width = `${Math.min(100, Math.max(0, roiPercentage))}%`;
        
        progressFill.style.backgroundColor = roi >= 0 ? '#2ecc71' : '#e74c3c';
        
        progressBar.appendChild(progressFill);
        winRateSection.appendChild(progressBar);
      }
    });
    
    statContent.appendChild(winRateSection);
    
    
    const chipSection = document.createElement('div');
    chipSection.className = 'stat-card';
    chipSection.innerHTML = '<h4>Chip Analytics</h4>';
    
    
    strategies.forEach(strategy => {
      const metrics = simulation.metrics.strategyMetrics[strategy];
      if (metrics) {
        const currentChips = metrics.currentChips;
        const initialChips = metrics.initialChips;
        const chipDelta = metrics.chipDelta;
        const handsPlayed = metrics.handsPlayed || 1; 
        
        
        const growthRate = (Math.pow(currentChips / initialChips, 1 / handsPlayed) - 1) * 100;
        
        
        let avgStack = currentChips;
        if (metrics.chipHistory && metrics.chipHistory.length > 0) {
          const sum = metrics.chipHistory.reduce((a, b) => a + b, 0);
          avgStack = sum / metrics.chipHistory.length;
        }
        
        
        let volatility = 0;
        if (metrics.chipHistory && metrics.chipHistory.length > 2) {
          
          const changes = [];
          for (let i = 1; i < metrics.chipHistory.length; i++) {
            changes.push(metrics.chipHistory[i] - metrics.chipHistory[i-1]);
          }
          const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
          const squaredDiffs = changes.map(x => Math.pow(x - avgChange, 2));
          const variance = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
          volatility = Math.sqrt(variance);
        }
        
        const strategyDiv = document.createElement('div');
        strategyDiv.className = 'strategy-label';
        strategyDiv.textContent = `${strategy}`;
        chipSection.appendChild(strategyDiv);
        
        
        const chipRow = document.createElement('div');
        chipRow.className = 'metric-row';
        chipRow.innerHTML = `
          <span>Current: ${currentChips}</span>
          <span class="${chipDelta >= 0 ? 'chip-positive' : 'chip-negative'}">
            ${chipDelta >= 0 ? '+' : ''}${chipDelta} (${((chipDelta / initialChips) * 100).toFixed(1)}%)
          </span>
        `;
        chipSection.appendChild(chipRow);
        
        
        const growthRow = document.createElement('div');
        growthRow.className = 'metric-row';
        growthRow.innerHTML = `
          <span>Growth/hand: <span class="${growthRate >= 0 ? 'chip-positive' : 'chip-negative'}">${growthRate.toFixed(2)}%</span></span>
          <span>Volatility: ${volatility.toFixed(1)}</span>
        `;
        chipSection.appendChild(growthRow);
        
        
        if (metrics.chipHistory && metrics.chipHistory.length > 1) {
          const trendContainer = document.createElement('div');
          trendContainer.style.height = '20px';
          trendContainer.style.width = '100%';
          trendContainer.style.marginTop = '5px';
          trendContainer.style.position = 'relative';
          trendContainer.style.backgroundColor = '#444';
          
          
          const historyLength = metrics.chipHistory.length;
          const maxChip = Math.max(...metrics.chipHistory);
          const minChip = Math.min(...metrics.chipHistory);
          const range = maxChip - minChip;
          
          
          for (let i = 1; i < historyLength; i++) {
            const point = document.createElement('div');
            point.style.position = 'absolute';
            point.style.width = '2px';
            point.style.bottom = '0';
            
            
            const height = range > 0 ? 
              ((metrics.chipHistory[i] - minChip) / range) * 20 : 10;
            
            point.style.height = `${height}px`;
            point.style.left = `${(i / historyLength) * 100}%`;
            point.style.backgroundColor = metrics.chipHistory[i] >= initialChips ? '#2ecc71' : '#e74c3c';
            
            trendContainer.appendChild(point);
          }
          
          chipSection.appendChild(trendContainer);
        }
      }
    });
    
    statContent.appendChild(chipSection);
    
    
    const timeSection = document.createElement('div');
    timeSection.className = 'stat-card';
    timeSection.innerHTML = '<h4>Decision Times (ms)</h4>';
    
    
    strategies.forEach(strategy => {
      const metrics = simulation.metrics.strategyMetrics[strategy];
      if (metrics && metrics.performanceMetrics.decisionCount > 0) {
        const avgTime = metrics.performanceMetrics.averageDecisionTime.toFixed(2);
        const minTime = metrics.performanceMetrics.minDecisionTime.toFixed(2);
        const maxTime = metrics.performanceMetrics.maxDecisionTime.toFixed(2);
        
        const strategyDiv = document.createElement('div');
        strategyDiv.className = 'strategy-label';
        strategyDiv.textContent = `${strategy}`;
        timeSection.appendChild(strategyDiv);
        
        const metricRow1 = document.createElement('div');
        metricRow1.className = 'metric-row';
        metricRow1.innerHTML = `
          <span>Avg: ${avgTime}ms</span>
          <span>Decisions: ${metrics.performanceMetrics.decisionCount}</span>
        `;
        timeSection.appendChild(metricRow1);
        
        const metricRow2 = document.createElement('div');
        metricRow2.className = 'metric-row';
        metricRow2.innerHTML = `
          <span>Min: ${minTime}ms</span>
          <span>Max: ${maxTime}ms</span>
        `;
        timeSection.appendChild(metricRow2);
      }
    });
    
    statContent.appendChild(timeSection);
    
    
    const decisionSection = document.createElement('div');
    decisionSection.className = 'stat-card';
    decisionSection.innerHTML = '<h4>Decision Distribution</h4>';
    
    
    strategies.forEach(strategy => {
      const metrics = simulation.metrics.strategyMetrics[strategy];
      if (metrics && metrics.decisions.total > 0) {
        const total = metrics.decisions.total;
        const foldPercent = ((metrics.decisions.fold / total) * 100).toFixed(1);
        const callPercent = ((metrics.decisions.call / total) * 100).toFixed(1);
        const raisePercent = ((metrics.decisions.raise / total) * 100).toFixed(1);
        
        const strategyDiv = document.createElement('div');
        strategyDiv.className = 'strategy-label';
        strategyDiv.textContent = `${strategy}`;
        decisionSection.appendChild(strategyDiv);
        
        const metricRow = document.createElement('div');
        metricRow.className = 'metric-row';
        metricRow.innerHTML = `
          <span>Fold: ${foldPercent}%</span>
          <span>Call: ${callPercent}%</span>
          <span>Raise: ${raisePercent}%</span>
        `;
        decisionSection.appendChild(metricRow);
      }
    });
    
    statContent.appendChild(decisionSection);
  } else {
    
    const noDataMsg = document.createElement('p');
    noDataMsg.textContent = 'Start a simulation to see statistics.';
    statContent.appendChild(noDataMsg);
  }
}

function addLogEntry(message) {
  
  const timestamp = new Date().toLocaleTimeString();
  const logMessage = `[${timestamp}] ${message}`;
  
  
  logEntries.push(logMessage);
  
  
  if (logEntries.length > MAX_LOG_ENTRIES) {
    logEntries.shift();
  }
  
  
  updateLogDisplay();
}

function updateLogDisplay() {
  if (!simLog) return;
  
  
  simLog.innerHTML = '';
  
  
  logEntries.forEach(entry => {
    const entryElement = document.createElement('div');
    entryElement.className = 'log-entry';
    entryElement.textContent = entry;
    simLog.appendChild(entryElement);
  });
  
  
  simLog.scrollTop = simLog.scrollHeight;
}

function clearLog() {
  logEntries = [];
  updateLogDisplay();
}

function drawSimulationProgress() {
  
  fill(40, 40, 50);
  noStroke();
  rect(0, 0, width, height);
  
  
  textAlign(CENTER, TOP);
  textSize(24);
  fill(255);
  text(`Game ${simulation.currentGame} of ${simulation.numGames}`, width/2, 20);
  text(`Hand ${simulation.currentHand} of ${simulation.handsPerGame}`, width/2, 50);
  
  
  if (!simulation.gameInstance) return;
  
  
  drawPokerTable();
  
  
  drawPlayers();
  
  
  if (simulation.gameInstance.communityCards.length > 0) {
    drawCommunityCards();
  }
  
  
  drawPotInfo();
}

function drawSimulationIdle() {
  
  fill(30, 30, 40);
  noStroke();
  rect(0, 0, width, height);
  
  
  textAlign(CENTER, CENTER);
  textSize(32);
  fill(255);
  text("Texas Hold'em AI Simulation", width/2, height/2 - 40);
  
  textSize(18);
  fill(180);
  text("Configure simulation parameters and click Start", width/2, height/2 + 20);
  
  
  textSize(16);
  const strategies = [
    document.getElementById('player1-strategy').value,
    document.getElementById('player2-strategy').value,
    document.getElementById('player3-strategy').value
  ];
  
  text(`Selected strategies: ${strategies.join(', ')}`, width/2, height/2 + 60);
}

function drawGameState() {
  
}

function drawPokerTable() {
  
  fill(39, 119, 60); 
  stroke(30, 30, 30);
  strokeWeight(4);
  ellipse(width/2, height/2, width * 0.7, height * 0.7);
  
  
  fill(120, 60, 20); 
  stroke(80, 40, 10);
  strokeWeight(2);
  
  
  push();
  noFill();
  stroke(120, 60, 20);
  strokeWeight(20);
  ellipse(width/2, height/2, width * 0.7 + 10, height * 0.7 + 10);
  pop();
}

function drawPlayers() {
  const players = simulation.gameInstance.players;
  const numPlayers = players.length;
  
  
  for (let i = 0; i < numPlayers; i++) {
    const angle = (i / numPlayers) * TWO_PI - HALF_PI; 
    const radius = Math.min(width, height) * 0.3;
    
    const x = width/2 + cos(angle) * radius;
    const y = height/2 + sin(angle) * radius;
    
    drawPlayer(players[i], x, y, i === simulation.gameInstance.currentPlayerIndex);
  }
}

function drawPlayer(player, x, y, isCurrentPlayer) {
  const boxWidth = 140;
  const boxHeight = 90;
  
  
  stroke(0);
  strokeWeight(2);
  
  if (player.folded) {
    fill(100, 30, 30, 200); 
  } else if (isCurrentPlayer) {
    fill(30, 100, 70, 220); 
  } else {
    fill(30, 50, 100, 200); 
  }
  
  rect(x - boxWidth/2, y - boxHeight/2, boxWidth, boxHeight, 10);
  
  
  textAlign(CENTER, CENTER);
  textSize(14);
  fill(255);
  text(player.name, x, y - 25);
  
  
  textSize(12);
  fill(220, 220, 100); 
  text(`Chips: ${player.chips}`, x, y);
  
  
  if (player.currentBet > 0) {
    fill(255, 150, 50); 
    text(`Bet: ${player.currentBet}`, x, y + 20);
  }
  
  
  if (player.isAllIn) {
    fill(255, 50, 50);
    textSize(16);
    text("ALL IN", x, y + 20);
  }
  
  
  if (simulation.gameInstance.dealerIndex === player.position) {
    fill(255);
    stroke(0);
    strokeWeight(1);
    ellipse(x - boxWidth/2 + 15, y - boxHeight/2 + 15, 20, 20);
    fill(0);
    noStroke();
    textSize(10);
    text("D", x - boxWidth/2 + 15, y - boxHeight/2 + 15);
  }
}

function drawCommunityCards() {
  const cards = simulation.gameInstance.communityCards;
  const cardWidth = 50;
  const cardHeight = 70;
  const cardSpacing = 10;
  const startX = width/2 - ((cards.length * cardWidth) + ((cards.length - 1) * cardSpacing)) / 2;
  
  for (let i = 0; i < cards.length; i++) {
    const x = startX + i * (cardWidth + cardSpacing);
    const y = height/2 - cardHeight/2;
    
    drawCard(cards[i], x, y, cardWidth, cardHeight);
  }
}

function drawCard(card, x, y, width, height) {
  
  fill(255);
  stroke(0);
  strokeWeight(1);
  rect(x, y, width, height, 5);
  
  
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  fill(isRed ? color(255, 0, 0) : 0);
  
  
  textAlign(LEFT, TOP);
  textSize(height * 0.2);
  text(card.valueDisplay, x + width * 0.1, y + height * 0.1);
  
  textAlign(CENTER, CENTER);
  textSize(height * 0.3);
  text(card.suitSymbol, x + width/2, y + height/2);
}

function drawPotInfo() {
  
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(18);
  text(`Pot: ${simulation.gameInstance.pot}`, width/2, height/2 - 80);
  
  
  if (simulation.gameInstance.currentBet > 0) {
    textSize(14);
    fill(200, 200, 100);
    text(`Current bet: ${simulation.gameInstance.currentBet}`, width/2, height/2 - 60);
  }
  
  
  textSize(14);
  fill(150, 220, 255);
  text(`Phase: ${simulation.gameInstance.gamePhase}`, width/2, height/2 - 40);
  
  
  if (simulation.gameInstance.roundName) {
    textSize(14);
    fill(150, 255, 150);
    text(`Round: ${simulation.gameInstance.roundName}`, width/2, height/2 - 20);
  }
}

function cleanupAfterStop() {
  
  addLogEntry('Simulation stopped by user. Cleaning up...');
  
  
  if (simulation.gameInstance) {
    
    simulation.gameInstance.gamePhase = "gameover";
    
    
    if (simulation.gameInstance.players) {
      simulation.gameInstance.players.forEach(player => {
        if (player._decisionTimeout) {
          clearTimeout(player._decisionTimeout);
          player._decisionTimeout = null;
        }
      });
    }
    
    
    simulation.gameInstance = null;
  }
  
  
  addLogEntry('Cleanup complete. Simulation terminated.');
}
