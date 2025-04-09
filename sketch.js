let game;
let messageLogHeight = 200;
let messageLogScrollPosition = 0;
let showLegend = true;

const aiStrategies = [
  "basic",
  "intermediate",
  "advanced",
  "monteCarlo",
  "minimax",
  "alphaBeta",
  "random",
  "conservative",
  "aggressive",
  
  "expectimax",
  "bayesian",
  "heuristic",
  "pattern",
  "positionBased",
  "simulation",
  "kelly",
  "adaptiveState",
  "gamephase",
];


let ai1StrategyIndex = 0;
let ai2StrategyIndex = 1;
let ai3StrategyIndex = 2;

let strategyTableStartIndex = 0;


let startGameBtn;
let ai1SelectionBtn;
let ai2SelectionBtn;
let ai3SelectionBtn;
let strategyInfoText = "";


let showLogsBtn;
let downloadLogsBtn;
let aiLogViewer;
let logEnabled = false;

function setup() {
  createCanvas(1000, 850);
  textFont("Arial");

  
  game = new PokerGame();

  
  setupButtonHandlers();

  
  setupMenuControls();

  
  setupLoggingControls();

  
  createTreeVisualizer();
  
  
  if (!window.aiLogger && typeof aiLogger !== 'undefined') {
    console.log("DEBUGGING: Making aiLogger available in window scope");
    window.aiLogger = aiLogger;
  }

  
  window.addEventListener("load", function () {
    const aiSimBtn = document.getElementById("aiSimBtn");
    if (aiSimBtn) {
      aiSimBtn.addEventListener("click", function () {
        runAISimulation();
      });
    } else {
      console.error("AI Simulation button not found in the DOM");
    }
    
    
    if (!window.aiLogger && typeof aiLogger !== 'undefined') {
      console.log("DEBUGGING: Setting aiLogger in window scope after load");
      window.aiLogger = aiLogger;
    } else if (!window.aiLogger) {
      console.warn("DEBUGGING: aiLogger still not available after load");
    }
  });

  
  setTimeout(checkLogging, 1000); 
}

function draw() {
  background("#1a1a1a");

  if (game.gamePhase === "menu") {
    drawMenu();

    
    if (ai1SelectionBtn) ai1SelectionBtn.style("display", "block");
    if (ai2SelectionBtn) ai2SelectionBtn.style("display", "block");
    if (ai3SelectionBtn) ai3SelectionBtn.style("display", "block");
    if (startGameBtn) startGameBtn.style("display", "block");

    
    document.getElementById("gameControls").style.display = "none";
  } else {
    
    if (ai1SelectionBtn) ai1SelectionBtn.style("display", "none");
    if (ai2SelectionBtn) ai2SelectionBtn.style("display", "none");
    if (ai3SelectionBtn) ai3SelectionBtn.style("display", "none");
    if (startGameBtn) startGameBtn.style("display", "none");

    
    document.getElementById("gameControls").style.display = "flex";

    
    drawTable();

    
    drawCommunityCards();

    
    drawPlayers();

    
    drawPot();

    
    drawMessageLog();

    
    drawGamePhase();
    if (logEnabled) {
      drawAlgorithmLegend();
    }
    
    if (logEnabled && aiLogViewer) {
      updateAILogContent();
    }
  }
}

function drawAILogs() {
  
  
  if (!aiLogViewer) return;

  
  aiLogViewer.style("display", "block");

  
  
  if (frameCount % 60 === 0) {
    updateAILogContent();
  }

  
  push();
  fill(140, 68, 173, 150); 
  noStroke();
  rect(5, 5, 100, 5, 2);
  pop();
}

function keyPressed() {
  
  if (game.gamePhase === "menu") {
    
    if (keyCode === UP_ARROW || keyCode === LEFT_ARROW) {
      
      strategyTableStartIndex = Math.max(0, strategyTableStartIndex - 10);
      return false; 
    } else if (keyCode === DOWN_ARROW || keyCode === RIGHT_ARROW) {
      
      const maxStartIndex = Math.max(0, aiStrategies.length - 10);
      strategyTableStartIndex = Math.min(
        maxStartIndex,
        strategyTableStartIndex + 10
      );
      return false; 
    }
  }
  return true; 
}

function setupMenuControls() {
  
  const buttonStyle =
    "background-color: #3498db; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin: 5px; width: 200px;";

  ai1SelectionBtn = createButton(
    `AI 1: ${capitalizeFirstLetter(aiStrategies[ai1StrategyIndex])}`
  );
  ai1SelectionBtn.position(width - 150, height / 2 - 100);
  ai1SelectionBtn.style(buttonStyle);
  ai1SelectionBtn.mousePressed(() => {
    ai1StrategyIndex = (ai1StrategyIndex + 1) % aiStrategies.length;
    ai1SelectionBtn.html(
      `AI 1: ${capitalizeFirstLetter(aiStrategies[ai1StrategyIndex])}`
    );
    updateStrategyInfo(aiStrategies[ai1StrategyIndex]);
  });

  ai2SelectionBtn = createButton(
    `AI 2: ${capitalizeFirstLetter(aiStrategies[ai2StrategyIndex])}`
  );
  ai2SelectionBtn.position(width - 150, height / 2 - 50);
  ai2SelectionBtn.style(buttonStyle);
  ai2SelectionBtn.mousePressed(() => {
    ai2StrategyIndex = (ai2StrategyIndex + 1) % aiStrategies.length;
    ai2SelectionBtn.html(
      `AI 2: ${capitalizeFirstLetter(aiStrategies[ai2StrategyIndex])}`
    );
    updateStrategyInfo(aiStrategies[ai2StrategyIndex]);
  });

  ai3SelectionBtn = createButton(
    `AI 3: ${capitalizeFirstLetter(aiStrategies[ai3StrategyIndex])}`
  );
  ai3SelectionBtn.position(width - 150, height / 2 + 0);
  ai3SelectionBtn.style(buttonStyle);
  ai3SelectionBtn.mousePressed(() => {
    ai3StrategyIndex = (ai3StrategyIndex + 1) % aiStrategies.length;
    ai3SelectionBtn.html(
      `AI 3: ${capitalizeFirstLetter(aiStrategies[ai3StrategyIndex])}`
    );
    updateStrategyInfo(aiStrategies[ai3StrategyIndex]);
  });

  startGameBtn = createButton("Start Game");
  startGameBtn.position(width - 150, height / 2 + 50);
  startGameBtn.style(buttonStyle + "background-color: #27ae60;");
  startGameBtn.mousePressed(() => {
    
    game.startGame(
      aiStrategies[ai1StrategyIndex],
      aiStrategies[ai2StrategyIndex],
      aiStrategies[ai3StrategyIndex]
    );
  });
}

function setupLoggingControls() {
  
  const logButtonStyle =
    "background-color: #8e44ad; color: white; padding: 5px 10px; " +
    "border: none; border-radius: 5px; cursor: pointer; " +
    "font-size: 12px; position: absolute; z-index: 100;";

  
  showLogsBtn = createButton("Show AI Logs");
  showLogsBtn.position(10, 10);
  showLogsBtn.style(logButtonStyle);
  showLogsBtn.mousePressed(toggleAILogs);

  
  downloadLogsBtn = createButton("Download Logs");
  downloadLogsBtn.position(120, 10);
  downloadLogsBtn.style(logButtonStyle);
  downloadLogsBtn.style("display", "none");
  downloadLogsBtn.mousePressed(() => {
    if (aiLogger) {
      aiLogger.saveLogsToFile();
    } else {
      console.log("No game AI logger found");
    }
  });

  
  aiLogViewer = createDiv("");
  aiLogViewer.id("aiLogViewer");
  aiLogViewer.style("position: absolute");
  aiLogViewer.style("top", "40px");
  aiLogViewer.style("left", "10px");
  aiLogViewer.style("width", "280px");
  aiLogViewer.style("max-height", "70%");
  aiLogViewer.style("background-color", "rgba(0, 0, 0, 0.8)");
  aiLogViewer.style("color", "white");
  aiLogViewer.style("padding", "10px");
  aiLogViewer.style("border-radius", "5px");
  aiLogViewer.style("overflow-y", "auto");
  aiLogViewer.style("font-family", "monospace");
  aiLogViewer.style("font-size", "12px");
  aiLogViewer.style("z-index", "90");
  aiLogViewer.style("display", "none");

  
  const playerFilterDiv = createDiv("");
  playerFilterDiv.parent(aiLogViewer);

  const playerFilter = createSelect();
  playerFilter.parent(playerFilterDiv);
  playerFilter.id("aiPlayerFilter");
  playerFilter.style("width", "100%");
  playerFilter.style("margin-bottom", "10px");
  playerFilter.style("background-color", "#333");
  playerFilter.style("color", "white");
  playerFilter.style("border", "1px solid #555");
  playerFilter.style("padding", "3px");

  
  playerFilter.option("All AI Players", "all");

  
  playerFilter.changed(updateAILogContent);

  
  const logContent = createDiv("");
  logContent.id("aiLogContent");
  logContent.parent(aiLogViewer);

  
  if (window.aiLogger) {
    console.log("DEBUGGING: aiLogger found in global scope");
    
    window.aiLogger.enabled = true;
    console.log("DEBUGGING: aiLogger enabled:", window.aiLogger.enabled);
  } else {
    console.error("DEBUGGING: aiLogger not found in global scope!");
  }

  
  createTreeVisualizer();
}

function setupButtonHandlers() {
  
  const dealBtn = document.getElementById("dealBtn");
  if (dealBtn) {
    dealBtn.addEventListener("click", () => {
      game.startNewHand();
    });
  }

  
  const callBtn = document.getElementById("callBtn");
  if (callBtn) {
    callBtn.addEventListener("click", () => {
      if (
        game.gamePhase === "betting" &&
        game.players[game.currentPlayerIndex].position === 0
      ) {
        game.makeCall(game.players[game.currentPlayerIndex]);
        game.moveToNextPlayer();
      }
    });
  }

  
  const raiseBtn = document.getElementById("raiseBtn");
  const betAmount = document.getElementById("betAmount");
  if (raiseBtn && betAmount) {
    raiseBtn.addEventListener("click", () => {
      if (
        game.gamePhase === "betting" &&
        game.players[game.currentPlayerIndex].position === 0
      ) {
        const amount = parseInt(betAmount.value) || game.minBet;
        game.makeRaise(game.players[game.currentPlayerIndex], amount);
        game.moveToNextPlayer();
      }
    });
  }

  
  const foldBtn = document.getElementById("foldBtn");
  if (foldBtn) {
    foldBtn.addEventListener("click", () => {
      if (
        game.gamePhase === "betting" &&
        game.players[game.currentPlayerIndex].position === 0
      ) {
        game.makeFold(game.players[game.currentPlayerIndex]);
        game.moveToNextPlayer();
      }
    });
  }

  
  const menuBtn = document.getElementById("menuBtn");
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      game.gamePhase = "menu";
      setupMenuControls(); 
    });
  }
}

function updateStrategyInfo(strategy) {
  switch (strategy) {
    case "basic":
      strategyInfoText = "Makes simple decisions based on hand strength only";
      break;
    case "intermediate":
      strategyInfoText =
        "Considers pot odds and position in addition to hand strength";
      break;
    case "advanced":
      strategyInfoText =
        "Uses more sophisticated strategy with strategic aggression";
      break;
    case "monteCarlo":
      strategyInfoText =
        "Simulates multiple possible outcomes to find optimal plays";
      break;
    case "minimax":
      strategyInfoText =
        "Uses game theory to evaluate best moves assuming optimal play";
      break;
    case "alphaBeta":
      strategyInfoText =
        "Enhanced minimax with more efficient search and decision making";
      break;
    case "random":
      strategyInfoText =
        "Makes completely random decisions (unpredictable but weak)";
      break;
    case "conservative":
      strategyInfoText =
        "Only plays strong hands, folds quickly with weak cards";
      break;
    case "aggressive":
      strategyInfoText = "Plays many hands aggressively with frequent bluffing";
      break;
    
    case "expectimax":
      strategyInfoText =
        "Evaluates expected value of actions based on probability analysis";
      break;
    case "bayesian":
      strategyInfoText =
        "Updates belief models and adapts based on observed actions";
      break;
    case "heuristic":
      strategyInfoText =
        "Uses expert-defined rules for different game situations";
      break;
    case "pattern":
      strategyInfoText = "Identifies and exploits patterns in betting behavior";
      break;
    case "positionBased":
      strategyInfoText =
        "Heavily emphasizes table position as key factor in decisions";
      break;
    case "simulation":
      strategyInfoText =
        "Runs deterministic simulations to evaluate hand strength";
      break;
    case "kelly":
      strategyInfoText = "Uses optimal bet sizing based on bankroll and edge";
      break;
    case "adaptiveState":
      strategyInfoText =
        "Adapts strategy based on current game state and stack sizes";
      break;
    case "gamephase":
      strategyInfoText =
        "Uses different strategies for preflop, flop, turn and river";
      break;
  }
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}


function drawMenu() {
  
  drawMenuBackground();

  
  fill(255);
  textSize(40);
  textAlign(CENTER, CENTER);
  text("Texas Hold'em Poker", width / 2, height / 4 - 20);

  
  textSize(24);
  text("Select AI Strategies", width / 2, height / 4 + 40);

  
  if (strategyInfoText) {
    fill(220, 220, 150);
    textSize(16);
    textAlign(CENTER, CENTER);
    text(strategyInfoText, width / 2, height / 2 + 105);
  }

  
  drawStrategyTable();
}

function drawMenuBackground() {
  
  fill("#267326");
  noStroke();
  rect(0, 0, width, height);

  
  fill("#1e5b1e");
  ellipse(width / 2, height / 2, width * 0.7, height * 0.6);

  
  noFill();
  stroke("#593e1a");
  strokeWeight(15);
  ellipse(width / 2, height / 2, width * 0.7 + 20, height * 0.6 + 20);
}

function drawStrategyTable() {
  const tableX = width / 2 - 400;
  const tableY = height - 300;
  const colWidth = 285;
  const rowHeight = 25; 

  textAlign(LEFT, CENTER);
  textSize(14);

  
  fill(50, 50, 80, 200);
  noStroke();
  rect(tableX, tableY, colWidth * 3, rowHeight, 5, 5, 0, 0);

  fill(255);
  text("Strategy", tableX + 10, tableY + rowHeight / 2);
  text("Description", tableX + colWidth + 10, tableY + rowHeight / 2);
  text("Difficulty", tableX + colWidth * 2 + 10, tableY + rowHeight / 2);

  
  const visibleRows = 10; 
  const startIndex = strategyTableStartIndex; 

  
  for (
    let i = startIndex;
    i < Math.min(aiStrategies.length, startIndex + visibleRows);
    i++
  ) {
    const y = tableY + rowHeight * (i - startIndex + 1);

    
    fill(i % 2 === 0 ? "rgba(40, 70, 40, 0.7)" : "rgba(50, 80, 50, 0.7)");
    rect(tableX, y, colWidth * 3, rowHeight);

    
    fill(220, 220, 255);
    text(
      capitalizeFirstLetter(aiStrategies[i]),
      tableX + 10,
      y + rowHeight / 2
    );

    
    let description = "";
    let difficulty = "";

    switch (aiStrategies[i]) {
      case "basic":
        description = "Simple hand strength evaluation";
        difficulty = "Easy";
        break;
      case "intermediate":
        description = "Considers pot odds and position";
        difficulty = "Medium";
        break;
      case "advanced":
        description = "More sophisticated with strategic aggression";
        difficulty = "Hard";
        break;
      case "monteCarlo":
        description = "Simulates multiple possible outcomes";
        difficulty = "Very Hard";
        break;
      case "minimax":
        description = "Game theory optimal play evaluation";
        difficulty = "Very Hard";
        break;
      case "alphaBeta":
        description = "Enhanced minimax with efficient search";
        difficulty = "Extreme";
        break;
      case "random":
        description = "Completely random decisions";
        difficulty = "Very Easy";
        break;
      case "conservative":
        description = "Only plays strong hands";
        difficulty = "Easy";
        break;
      case "aggressive":
        description = "Plays aggressively with frequent bluffs";
        difficulty = "Medium";
        break;
      
      case "expectimax":
        description = "Evaluates expected value of actions";
        difficulty = "Very Hard";
        break;
      case "bayesian":
        description = "Updates belief models based on actions";
        difficulty = "Hard";
        break;
      case "heuristic":
        description = "Expert rules for different situations";
        difficulty = "Medium";
        break;
      case "pattern":
        description = "Identifies patterns in betting behavior";
        difficulty = "Hard";
        break;
      case "positionBased":
        description = "Emphasizes position in decision making";
        difficulty = "Medium";
        break;
      case "simulation":
        description = "Runs simulations to evaluate hands";
        difficulty = "Hard";
        break;
      case "kelly":
        description = "Optimal bet sizing based on edge";
        difficulty = "Hard";
        break;
      case "adaptiveState":
        description = "Adapts to game state and stack sizes";
        difficulty = "Very Hard";
        break;
      case "gamephase":
        description = "Specialized strategy for each betting round";
        difficulty = "Hard";
        break;
    }

    fill(200);
    text(description, tableX + colWidth + 10, y + rowHeight / 2);

    
    switch (difficulty) {
      case "Very Easy":
        fill(200, 255, 200);
        break;
      case "Easy":
        fill(150, 255, 150);
        break;
      case "Medium":
        fill(255, 255, 150);
        break;
      case "Hard":
        fill(255, 200, 150);
        break;
      case "Very Hard":
        fill(255, 150, 150);
        break;
      case "Extreme":
        fill(255, 100, 100);
        break;
    }

    text(difficulty, tableX + colWidth * 2 + 10, y + rowHeight / 2);
  }

  if (aiStrategies.length > visibleRows) {
    fill(180, 180, 255);
    textAlign(CENTER, CENTER);
    text(
      "* Cycle through all strategies using the buttons ←→",
      width / 2,
      tableY + rowHeight * (visibleRows + 1.5)
    );
  }
}

function drawTable() {
  
  const availableHeight = height - messageLogHeight;
  const tableWidth = width * 0.7; 
  const tableHeight = availableHeight * 0.65; 

  
  fill("#267326"); 
  stroke("#593e1a"); 
  strokeWeight(20);
  ellipse(width / 2, availableHeight / 2, tableWidth, tableHeight);

  
  stroke("#1e5b1e");
  strokeWeight(5);
  ellipse(width / 2, availableHeight / 2, tableWidth - 30, tableHeight - 30);

  
  if (game.players.length > 0) {
    const dealer = game.players[game.dealerIndex];
    if (dealer) {
      const pos = getPlayerPosition(dealer.position);

      
      let offsetX = 0;
      let offsetY = 0;

      switch (dealer.position) {
        case 0: 
          offsetX = 0;
          offsetY = -60;
          break;
        case 1: 
          offsetX = 60;
          offsetY = 0;
          break;
        case 2: 
          offsetX = 0;
          offsetY = 60;
          break;
        case 3: 
          offsetX = -60;
          offsetY = 0;
          break;
      }

      fill(255);
      stroke(0);
      strokeWeight(2);
      ellipse(pos.x + offsetX, pos.y + offsetY, 30, 30);
      fill(0);
      noStroke();
      textSize(14);
      textAlign(CENTER, CENTER);
      text("D", pos.x + offsetX, pos.y + offsetY);
    }
  }
}

function drawCommunityCards() {
  const cardWidth = 70;
  const cardHeight = 100;
  const spacing = 15;
  const availableHeight = height - messageLogHeight;
  const totalWidth = cardWidth * 5 + spacing * 4;
  const startX = width / 2 - totalWidth / 2;
  const y = availableHeight / 2 - cardHeight / 2;

  
  for (let i = 0; i < 5; i++) {
    const x = startX + i * (cardWidth + spacing);

    if (i >= game.communityCards.length) {
      
      stroke(100);
      strokeWeight(1);
      fill(40);
      rect(x, y, cardWidth, cardHeight, 5);
    } else {
      
      game.communityCards[i].draw(x, y, cardWidth, cardHeight);
    }
  }
}

function drawPlayers() {
  const availableHeight = height - messageLogHeight;
  const playerWidth = 150; 
  const playerHeight = 190; 

  
  for (let i = 0; i < game.players.length; i++) {
    const player = game.players[i];
    if (player.folded) continue; 

    const pos = getPlayerPosition(player.position);
    const isCurrentPlayer =
      i === game.currentPlayerIndex && game.gamePhase === "betting";

    
    let playerX, playerY;

    switch (player.position) {
      case 0: 
        playerX = pos.x - playerWidth / 2;
        playerY = pos.y - 20; 
        break;
      case 1: 
        playerX = pos.x - playerWidth - 10; 
        playerY = pos.y - playerHeight / 2;
        break;
      case 2: 
        playerX = pos.x - playerWidth / 2;
        playerY = pos.y - playerHeight + 20; 
        break;
      case 3: 
        playerX = pos.x + 10; 
        playerY = pos.y - playerHeight / 2;
        break;
      default:
        playerX = pos.x - playerWidth / 2;
        playerY = pos.y - playerHeight / 2;
    }

    
    player.draw(playerX, playerY, playerWidth, playerHeight, isCurrentPlayer);

    
    if (
      player instanceof AIPlayer &&
      aiLogger &&
      aiLogger.enabled &&
      isCurrentPlayer
    ) {
      drawAIThinkingIndicator(playerX, playerY, playerWidth, playerHeight);
    }
  }

  
  for (let i = 0; i < game.players.length; i++) {
    const player = game.players[i];
    if (!player.folded) continue; 

    const pos = getPlayerPosition(player.position);
    const isCurrentPlayer =
      i === game.currentPlayerIndex && game.gamePhase === "betting";

    
    let playerX, playerY;

    switch (player.position) {
      case 0: 
        playerX = pos.x - playerWidth / 2;
        playerY = pos.y - 20; 
        break;
      case 1: 
        playerX = pos.x - playerWidth - 10; 
        playerY = pos.y - playerHeight / 2;
        break;
      case 2: 
        playerX = pos.x - playerWidth / 2;
        playerY = pos.y - playerHeight + 20; 
        break;
      case 3: 
        playerX = pos.x + 10; 
        playerY = pos.y - playerHeight / 2;
        break;
      default:
        playerX = pos.x - playerWidth / 2;
        playerY = pos.y - playerHeight / 2;
    }

    
    player.draw(playerX, playerY, playerWidth, playerHeight, isCurrentPlayer);
  }
}

function drawAIThinkingIndicator(x, y, width, height) {
  
  const indicatorX = x + width - 25;
  const indicatorY = y + 5;

  fill(50, 150, 200, 200);
  stroke(255);
  strokeWeight(1);
  ellipse(indicatorX, indicatorY, 15, 15);

  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(10);
  text("AI", indicatorX, indicatorY);
}

function getPlayerPosition(position) {
  
  const availableHeight = height - messageLogHeight;
  const centerX = width / 2;
  const centerY = availableHeight / 2;

  
  const tableRadiusX = width * 0.28; 
  const tableRadiusY = availableHeight * 0.25; 

  
  switch (position) {
    case 0: 
      return { x: centerX, y: centerY + tableRadiusY };
    case 1: 
      return { x: centerX - tableRadiusX, y: centerY };
    case 2: 
      return { x: centerX, y: centerY - tableRadiusY };
    case 3: 
      return { x: centerX + tableRadiusX, y: centerY };
    default:
      return { x: centerX, y: centerY };
  }
}

function drawPot() {

  const availableHeight = height - messageLogHeight;

  
  fill(30, 90, 40, 200);
  stroke(200);
  strokeWeight(2);
  rectMode(CENTER);
  rect(width / 2, availableHeight / 2 - 70, 150, 40, 10);
  rectMode(CORNER);

  fill(255);
  noStroke();
  textSize(24);
  textAlign(CENTER, CENTER);
  text(`Pot: ${game.pot}`, width / 2, availableHeight / 2 - 70);

  
  if (game.winners.length > 0) {
    
    let y = availableHeight / 2 - 20;
    for (let winner of game.winners) {
      if (winner.amount === 0) {
        return;
      }
      
      fill(50, 50, 10, 220);
      stroke(255, 215, 0);
      strokeWeight(2);
      rectMode(CENTER);
      rect(width / 2, y + 12, 300, 50, 8);
      rectMode(CORNER);

      fill(255, 215, 0); 
      noStroke();
      textSize(20);
      text(`${winner.player.name} wins ${winner.amount}`, width / 2, y);

      if (winner.hand) {
        fill(200);
        textSize(16);
        text(`with ${winner.hand.description}`, width / 2, y + 25);
      }

      y += 60;
    }
  }
}

function drawMessageLog() {
  const emptyBoxHeight = 60;
  const actualMessageAreaHeight = messageLogHeight - emptyBoxHeight;

  
  fill(30);
  stroke(80);
  strokeWeight(2);
  rect(0, height - messageLogHeight, width, messageLogHeight);

  
  fill(200);
  noStroke();
  textSize(18);
  textAlign(LEFT, TOP);
  text("Game Log", 20, height - messageLogHeight + 10);

  
  stroke(80);
  line(
    0,
    height - messageLogHeight + 40,
    width,
    height - messageLogHeight + 40
  );

  
  noStroke();
  textSize(14);
  textAlign(LEFT, TOP);

  
  const messageHeight = 28; 
  const topPadding = 50; 
  const availableHeight = actualMessageAreaHeight - topPadding;
  const visibleMessageCount = Math.floor(availableHeight / messageHeight);

  const startIndex = Math.max(
    0,
    game.messageLog.length - visibleMessageCount - messageLogScrollPosition
  );
  const endIndex = Math.min(
    game.messageLog.length,
    startIndex + visibleMessageCount
  );

  for (let i = startIndex; i < endIndex; i++) {
    const message = game.messageLog[i];
    const y =
      height - messageLogHeight + topPadding + (i - startIndex) * messageHeight;

    
    fill(150);
    text(`[${message.timestamp}]`, 20, y);

    
    const isReasoningStep = message.message.startsWith("  > ");
    
    
    if (message.message.includes("reasoning:")) {
      
      fill(120, 220, 120); 
    } else if (isReasoningStep) {
      
      fill(180, 255, 180);
    } else {
      
      fill(230);
    }
    
    
    text(message.message, isReasoningStep ? 130 : 120, y);
  }

  
  const emptyBoxY = height - emptyBoxHeight;

  
  fill(40, 40, 45);
  stroke(90);
  strokeWeight(1);
  rect(0, emptyBoxY, width, emptyBoxHeight);

  
  stroke(100);
  strokeWeight(1);
  line(0, emptyBoxY, width, emptyBoxY);

  
  if (game.messageLog.length > visibleMessageCount) {
    
    fill(150);
    triangle(
      width - 20,
      height - messageLogHeight + 50,
      width - 10,
      height - messageLogHeight + 60,
      width - 30,
      height - messageLogHeight + 60
    );

    
    triangle(
      width - 20,
      emptyBoxY - 10,
      width - 10,
      emptyBoxY - 20,
      width - 30,
      emptyBoxY - 20
    );

    
    const scrollbarTop = height - messageLogHeight + 70;
    const scrollbarHeight = emptyBoxY - scrollbarTop - 20; 

    fill(100);
    rect(width - 25, scrollbarTop, 10, scrollbarHeight, 5);

    
    const maxScroll = Math.max(0, game.messageLog.length - visibleMessageCount);
    const scrollRatio = messageLogScrollPosition / maxScroll;
    const handleHeight = Math.max(
      20,
      scrollbarHeight / (game.messageLog.length / visibleMessageCount)
    );
    const handleY =
      scrollbarTop + scrollRatio * (scrollbarHeight - handleHeight);

    fill(200);
    rect(width - 25, handleY, 10, handleHeight, 5);

    
    fill(150);
    textSize(11);
    textAlign(RIGHT, CENTER);
    text("Scroll with mouse wheel", width - 40, emptyBoxY + emptyBoxHeight / 2);
  }
}

function drawGamePhase() {
  fill(255);
  noStroke();
  textSize(16);
  textAlign(RIGHT, TOP);

  let phaseText = "";

  switch (game.gamePhase) {
    case "menu":
      phaseText = "Main Menu";
      break;
    case "waiting":
      phaseText = "Waiting to deal";
      break;
    case "dealing":
      phaseText = "Dealing cards";
      break;
    case "betting":
      phaseText = `Betting round: ${game.roundName}`;
      break;
    case "showdown":
      phaseText = "Showdown";
      break;
    case "gameover":
      phaseText = "Game Over";
      break;
  }

  text(phaseText, width - 20, 20);

  
  if (game.players && game.players.length > 1) {
    for (let i = 1; i < game.players.length; i++) {
      if (game.players[i] instanceof AIPlayer) {
        text(
          `${game.players[i].name}: ${capitalizeFirstLetter(
            game.players[i].strategy
          )}`,
          width - 20,
          20 + i * 20
        );
      }
    }
  }
}


function mouseWheel(event) {
  if (mouseY > height - messageLogHeight) {
    
    const emptyBoxHeight = 40;
    const actualMessageAreaHeight = messageLogHeight - emptyBoxHeight;
    const messageHeight = 28;
    const topPadding = 50;
    const availableHeight = actualMessageAreaHeight - topPadding;
    const visibleMessageCount = Math.floor(availableHeight / messageHeight);

    
    messageLogScrollPosition += event.delta > 0 ? 1 : -1;
    const maxScroll = Math.max(0, game.messageLog.length - visibleMessageCount);
    messageLogScrollPosition = constrain(
      messageLogScrollPosition,
      0,
      maxScroll
    );
    return false; 
  }

  
  if (
    logEnabled &&
    aiLogViewer &&
    mouseX < 300 &&
    mouseY < height - messageLogHeight
  ) {
    const logContent = document.getElementById("aiLogContent");
    if (logContent) {
      logContent.scrollTop += event.delta;
      return false;
    }
  }
}
function mousePressed() {
  
  if (game.gamePhase !== "menu" && logEnabled) {
    const legendX = 10;
    const legendY = 10;
    const legendWidth = 180;
    const padding = 10;

    
    if (
      showLegend &&
      mouseX >= legendX + legendWidth - padding - 20 &&
      mouseX <= legendX + legendWidth - padding + 10 &&
      mouseY >= legendY + padding - 10 &&
      mouseY <= legendY + padding + 10
    ) {
      showLegend = false;
      return false; 
    }

    
    if (
      !showLegend &&
      mouseX >= legendX &&
      mouseX <= legendX + 30 &&
      mouseY >= legendY &&
      mouseY <= legendY + 30
    ) {
      showLegend = true;
      return false; 
    }
  }
  return true; 
}

function toggleAILogs() {
  logEnabled = !logEnabled;
  console.log(`DEBUGGING: AI logs ${logEnabled ? "enabled" : "disabled"}`);

  
  if (!showLogsBtn) {
    console.error("DEBUGGING: Show logs button not found");
    return;
  }

  if (logEnabled) {
    showLogsBtn.html("Hide AI Logs");

    
    if (downloadLogsBtn) {
      downloadLogsBtn.style("display", "block");
    }

    
    if (!aiLogViewer) {
      console.error("DEBUGGING: AI Log Viewer not created yet");
      setupLoggingControls(); 
      return toggleAILogs(); 
    }

    aiLogViewer.style("display", "block");

    
    let loggerFound = false;
    
    
    if (window.aiLogger) {
      window.aiLogger.enabled = true;
      console.log("DEBUGGING: AI Logger enabled in window scope:", window.aiLogger.enabled);
      loggerFound = true;
    } 
    
    else if (typeof aiLogger !== 'undefined') {
      aiLogger.enabled = true;
      
      window.aiLogger = aiLogger;
      console.log("DEBUGGING: AI Logger enabled from global variable:", aiLogger.enabled);
      loggerFound = true;
    }
    
    if (!loggerFound) {
      console.error("DEBUGGING: AI Logger not found in any scope! Creating a default instance...");
      
      try {
        if (typeof AILogger === 'function') {
          window.aiLogger = new AILogger();
          window.aiLogger.enabled = true;
          console.log("DEBUGGING: Created new AILogger instance");
          loggerFound = true;
        } else {
          console.error("DEBUGGING: AILogger constructor not available");
        }
      } catch (e) {
        console.error("DEBUGGING: Failed to create AILogger:", e);
      }
    }
    
    
    if (loggerFound && window.aiLogger) {
      console.log("DEBUGGING: AI Logger loggers available:", 
                window.aiLogger.loggers ? Object.keys(window.aiLogger.loggers).length : 0);
    }

    
    updatePlayerFilter();
    updateAILogContent();

    
    if (!document.getElementById("treeVisualizerModal")) {
      console.log("DEBUGGING: Creating tree visualizer modal as it does not exist");
      createTreeVisualizer();
    } else {
      console.log("DEBUGGING: Tree visualizer modal already exists");
    }
  } else {
    showLogsBtn.html("Show AI Logs");

    if (downloadLogsBtn) {
      downloadLogsBtn.style("display", "none");
    }

    if (aiLogViewer) {
      aiLogViewer.style("display", "none");
    }
  }
}
function checkLogging() {
  console.log("Checking AI logging functionality...");

  
  if (!aiLogger) {
    console.error("AI Logger not available!");
    return false;
  }

  
  console.log(`AI Logger enabled: ${aiLogger.enabled}`);

  
  const loggerCount = aiLogger.loggers
    ? Object.keys(aiLogger.loggers).length
    : 0;
  console.log(`AI Loggers available: ${loggerCount}`);

  if (loggerCount > 0) {
    
    Object.entries(aiLogger.loggers).forEach(([playerId, logger]) => {
      console.log(
        `Player ${playerId} (${logger.playerName}): ` +
          `${logger.decisions ? logger.decisions.length : 0} decisions, ` +
          `${logger.trees ? logger.trees.length : 0} trees`
      );
    });
  }

  return true;
}


function updatePlayerFilter() {
  const playerFilter = document.getElementById("aiPlayerFilter");
  if (!playerFilter) return;

  
  while (playerFilter.options.length > 1) {
    playerFilter.remove(1);
  }

  
  if (game.players) {
    game.players.forEach((player) => {
      if (player instanceof AIPlayer) {
        const option = document.createElement("option");
        option.value = player.position;
        option.textContent = `${player.name} (${player.strategy})`;
        playerFilter.appendChild(option);
      }
    });
  }
}


function updateAILogContent() {
  const logContent = document.getElementById("aiLogContent");
  const playerFilter = document.getElementById("aiPlayerFilter");
  if (!logContent || !playerFilter) {
    return;
  }

  if (!aiLogger) {
    return;
  }

  

  
  logContent.innerHTML = "";

  const selectedValue = playerFilter.value;

  
  if (!aiLogger.loggers || Object.keys(aiLogger.loggers).length === 0) {
    logContent.innerHTML =
      '<div style="color: #999; font-style: italic;">No AI decisions recorded yet.</div>';
    logContent.innerHTML +=
      '<div style="color: #cc7; font-style: italic; margin-top: 10px;">Try playing some hands to see AI decisions.</div>';
    return;
  }

  
  let totalDecisions = 0;
  Object.values(aiLogger.loggers).forEach((logger) => {
    if (logger.decisions) {
      totalDecisions += logger.decisions.length;
    }
  });

  if (totalDecisions === 0) {
    logContent.innerHTML =
      '<div style="color: #999; font-style: italic;">No AI decisions recorded yet.</div>';
    logContent.innerHTML +=
      '<div style="color: #cc7; font-style: italic; margin-top: 10px;">Try playing some hands to see AI decisions.</div>';
    return;
  }

  
  const headerDiv = document.createElement("div");
  headerDiv.style.color = "#3498db";
  headerDiv.style.marginBottom = "10px";
  headerDiv.style.fontWeight = "bold";
  headerDiv.textContent = `Recorded AI decisions: ${totalDecisions}`;
  logContent.appendChild(headerDiv);

  
  if (selectedValue === "all") {
    
    Object.values(aiLogger.loggers).forEach((logger) => {
      if (logger.strategy !== "human") {
        addPlayerLogToContent(logger, logContent);
      }
    });
  } else {
    
    const position = parseInt(selectedValue);
    const logger = aiLogger.loggers[position];
    if (logger) {
      addPlayerLogToContent(logger, logContent);
    }
  }
}

function addPlayerLogToContent(logger, contentElement) {
  
  const playerHeader = document.createElement("div");
  playerHeader.style.fontWeight = "bold";
  playerHeader.style.marginTop = "10px";
  playerHeader.style.marginBottom = "5px";
  playerHeader.style.color = "#3498db";
  playerHeader.textContent = `${logger.playerName} (${logger.strategy})`;
  contentElement.appendChild(playerHeader);

  
  if (!logger.decisions || logger.decisions.length === 0) {
    const noDecisions = document.createElement("div");
    noDecisions.style.fontStyle = "italic";
    noDecisions.style.color = "#999";
    noDecisions.textContent = "No decisions recorded yet";
    contentElement.appendChild(noDecisions);
    return;
  }

  
  const recentDecisions = logger.decisions.slice(-3);

  recentDecisions.forEach((decision, index) => {
    const decisionElement = document.createElement("div");
    decisionElement.style.marginBottom = "8px";
    decisionElement.style.padding = "5px";
    decisionElement.style.backgroundColor = "rgba(50, 50, 50, 0.5)";
    decisionElement.style.borderLeft = "3px solid #3498db";

    
    const decisionId = `decision-${logger.playerId}-${index}`;
    decisionElement.id = decisionId;

    
    const actionText = document.createElement("div");
    let actionStr = decision.action.toUpperCase();
    if (decision.action === "raise") {
      actionStr += ` to $${decision.amount}`;
    }
    actionText.textContent = `${actionStr} (${decision.gamePhase})`;
    actionText.style.color = getActionColor(decision.action);
    actionText.style.fontWeight = "bold";

    
    const detailsText = document.createElement("div");
    detailsText.style.fontSize = "10px";
    detailsText.style.color = "#aaa";

    
    if (decision.handStrength && typeof decision.handStrength === "object") {
      if (decision.handStrength.description) {
        detailsText.textContent += `Hand: ${decision.handStrength.description} | `;
      } else if (decision.handStrength.cards) {
        detailsText.textContent += `Cards: ${decision.handStrength.cards.join(
          " "
        )} | `;
      }
    }

    
    detailsText.textContent += `Pot: $${decision.pot} | Odds: ${decision.potOdds}`;

    decisionElement.appendChild(actionText);
    decisionElement.appendChild(detailsText);

    
    if (decision.reasoningSteps && decision.reasoningSteps.length > 0) {
      
      const toggleBtn = document.createElement("button");
      toggleBtn.textContent = "Show Reasoning";
      toggleBtn.style.fontSize = "10px";
      toggleBtn.style.backgroundColor = "#4CAF50";
      toggleBtn.style.color = "white";
      toggleBtn.style.border = "none";
      toggleBtn.style.borderRadius = "3px";
      toggleBtn.style.padding = "3px 8px";
      toggleBtn.style.margin = "5px 0";
      toggleBtn.style.cursor = "pointer";

      
      const reasoningId = `reasoning-${logger.playerId}-${index}`;

      
      const reasoningContent = document.createElement("div");
      reasoningContent.id = reasoningId;
      reasoningContent.style.display = "none";
      reasoningContent.style.fontSize = "10px";
      reasoningContent.style.maxHeight = "100px";
      reasoningContent.style.overflowY = "auto";
      reasoningContent.style.marginTop = "5px";
      reasoningContent.style.padding = "5px";
      reasoningContent.style.backgroundColor = "rgba(30, 30, 30, 0.7)";
      reasoningContent.style.borderLeft = "2px solid #4CAF50";

      
      decision.reasoningSteps.forEach((step) => {
        const stepElement = document.createElement("div");
        stepElement.textContent = step;
        stepElement.style.marginBottom = "3px";
        reasoningContent.appendChild(stepElement);
      });

      
      toggleBtn.addEventListener("click", function(event) {
        console.log("DEBUGGING: Reasoning toggle button clicked");
        console.log(`Toggle button clicked for ${reasoningId}`);
        const content = document.getElementById(reasoningId);
        console.log("DEBUGGING: Content element found:", !!content);
        
        if (content) {
          console.log("DEBUGGING: Current display state:", content.style.display);
          if (content.style.display === "none") {
            console.log("DEBUGGING: Showing reasoning content");
            content.style.display = "block";
            this.textContent = "Hide Reasoning";
            this.style.backgroundColor = "#e74c3c";
          } else {
            console.log("DEBUGGING: Hiding reasoning content");
            content.style.display = "none";
            this.textContent = "Show Reasoning";
            this.style.backgroundColor = "#4CAF50";
          }
        } else {
          console.error(`Reasoning content with ID ${reasoningId} not found`);
        }
        event.preventDefault();
        event.stopPropagation();
      });

      decisionElement.appendChild(toggleBtn);
      decisionElement.appendChild(reasoningContent);
    }

    
    if (
      ["minimax", "alphaBeta", "expectimax"].includes(logger.strategy) &&
      logger.trees &&
      logger.trees.length > 0
    ) {
      
      let matchingTree = null;
      if (decision.timestamp) {
        const decisionTime = new Date(decision.timestamp).getTime();

        
        let closestTree = null;
        let smallestTimeDiff = Infinity;

        for (const tree of logger.trees) {
          if (tree.timestamp) {
            const treeTime = new Date(tree.timestamp).getTime();
            const timeDiff = Math.abs(treeTime - decisionTime);

            if (timeDiff < smallestTimeDiff) {
              smallestTimeDiff = timeDiff;
              closestTree = tree;
            }
          }
        }

        
        if (closestTree && smallestTimeDiff < 2000) {
          matchingTree = closestTree;
        }
      }

      
      const treeToShow = matchingTree || logger.trees[logger.trees.length - 1];

      
      const treeBtn = document.createElement("button");
      treeBtn.textContent = "View Decision Tree";
      treeBtn.style.fontSize = "10px";
      treeBtn.style.backgroundColor = "#3498db";
      treeBtn.style.color = "white";
      treeBtn.style.border = "none";
      treeBtn.style.borderRadius = "3px";
      treeBtn.style.padding = "3px 8px";
      treeBtn.style.margin = "5px 0";
      treeBtn.style.cursor = "pointer";

      
      treeBtn.addEventListener("click", function(event) {
        console.log("DEBUGGING: Tree visualization button clicked!");
        console.log(`Tree button clicked for ${treeToShow.id}`);
        
        try {
          console.log("DEBUGGING: Calling showTreeVisualization");
          showTreeVisualization(logger.playerId, treeToShow.id);
          console.log("DEBUGGING: Returned from showTreeVisualization");
        } catch (err) {
          console.error("DEBUGGING: Error in tree visualization button click handler:", err);
        }
        event.preventDefault();
        event.stopPropagation();
      });

      decisionElement.appendChild(treeBtn);
    }

    contentElement.appendChild(decisionElement);
  });

  
  const separator = document.createElement("hr");
  separator.style.border = "0";
  separator.style.borderTop = "1px dashed #444";
  separator.style.margin = "10px 0";
  contentElement.appendChild(separator);
}


function createTreeVisualizer() {
  console.log("DEBUGGING: Creating tree visualizer modal");

  
  const existingModal = document.getElementById("treeVisualizerModal");
  if (existingModal) {
    console.log("DEBUGGING: Removing existing modal");
    existingModal.remove();
  }

  
  const modal = document.createElement("div");
  modal.id = "treeVisualizerModal";
  modal.style.display = "none";
  modal.style.position = "fixed";
  modal.style.zIndex = "2000"; 
  modal.style.left = "0";
  modal.style.top = "0";
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.overflow = "auto";
  modal.style.backgroundColor = "rgba(0,0,0,0.8)";

  
  const modalContent = document.createElement("div");
  modalContent.style.backgroundColor = "#222";
  modalContent.style.color = "#fff";
  modalContent.style.margin = "10% auto";
  modalContent.style.padding = "20px";
  modalContent.style.border = "1px solid #888";
  modalContent.style.borderRadius = "5px";
  modalContent.style.width = "80%";
  modalContent.style.maxHeight = "70vh";
  modalContent.style.overflow = "auto";
  modalContent.style.position = "relative";

  
  const modalTitle = document.createElement("h3");
  modalTitle.id = "treeModalTitle";
  modalTitle.textContent = "Decision Tree Visualization";
  modalTitle.style.margin = "0 0 10px 0";
  modalTitle.style.borderBottom = "1px solid #555";
  modalTitle.style.paddingBottom = "5px";

  
  const closeBtn = document.createElement("span");
  closeBtn.id = "treeModalCloseBtn";
  closeBtn.textContent = "×";
  closeBtn.style.color = "#aaa";
  closeBtn.style.float = "right";
  closeBtn.style.fontSize = "28px";
  closeBtn.style.fontWeight = "bold";
  closeBtn.style.cursor = "pointer";

  
  const treeContent = document.createElement("pre");
  treeContent.id = "treeVisualizationContent";
  treeContent.style.backgroundColor = "#222";
  treeContent.style.padding = "10px";
  treeContent.style.borderRadius = "5px";
  treeContent.style.maxHeight = "50vh";
  treeContent.style.overflowY = "auto";
  treeContent.style.fontFamily = "monospace";
  treeContent.style.whiteSpace = "pre-wrap";
  treeContent.style.fontSize = "14px";

  
  closeBtn.addEventListener("click", function() {
    console.log("DEBUGGING: Close button clicked");
    modal.style.display = "none";
  });

  
  window.addEventListener("click", function(event) {
    if (event.target == modal) {
      console.log("DEBUGGING: Modal background clicked");
      modal.style.display = "none";
    }
  });

  
  modalContent.appendChild(closeBtn);
  modalContent.appendChild(modalTitle);
  modalContent.appendChild(treeContent);
  modal.appendChild(modalContent);

  
  document.body.appendChild(modal);

  
  const testBtn = document.createElement("button");
  testBtn.textContent = "Test Modal";
  testBtn.style.position = "fixed";
  testBtn.style.bottom = "10px";
  testBtn.style.right = "10px";
  testBtn.style.zIndex = "1500";
  testBtn.style.padding = "5px 10px";
  testBtn.style.backgroundColor = "#d35400";
  testBtn.style.color = "white";
  testBtn.style.border = "none";
  testBtn.style.borderRadius = "3px";
  testBtn.style.cursor = "pointer";
  
  testBtn.addEventListener("click", function() {
    console.log("DEBUGGING: Test button clicked");
    modal.style.display = "block";
    document.getElementById("treeVisualizationContent").textContent = "Test modal content";
    document.getElementById("treeModalTitle").textContent = "Test Modal Title";
  });
  
  document.body.appendChild(testBtn);

  console.log("DEBUGGING: Tree visualizer modal created successfully");
  
  
  console.log("DEBUGGING: Modal exists:", !!document.getElementById("treeVisualizerModal"));
  console.log("DEBUGGING: Content exists:", !!document.getElementById("treeVisualizationContent"));
  console.log("DEBUGGING: Title exists:", !!document.getElementById("treeModalTitle"));
  console.log("DEBUGGING: Close button exists:", !!document.getElementById("treeModalCloseBtn"));
}


function showTreeVisualization(playerId, treeId) {
  console.log("DEBUGGING: showTreeVisualization called with:", playerId, treeId);
  
  
  if (!document.getElementById("treeVisualizerModal")) {
    console.log("DEBUGGING: Tree visualizer modal not found, creating it now");
    createTreeVisualizer();
  }
  
  
  const modal = document.getElementById("treeVisualizerModal");
  const treeContent = document.getElementById("treeVisualizationContent");
  const modalTitle = document.getElementById("treeModalTitle");
  
  if (!modal || !treeContent || !modalTitle) {
    console.error("DEBUGGING: Tree visualizer elements not found after creation attempt");
    console.log("Modal exists:", !!modal);
    console.log("Tree content exists:", !!treeContent);
    console.log("Modal title exists:", !!modalTitle);
    return;
  }
  
  try {
    
    console.log("DEBUGGING: Attempting to get tree data from aiLogger");
    
    
    let logger = null;
    if (window.aiLogger) {
      logger = window.aiLogger;
      console.log("DEBUGGING: Using aiLogger from window scope");
    } else if (typeof aiLogger !== 'undefined') {
      logger = aiLogger;
      console.log("DEBUGGING: Using aiLogger from global variable");
    }
    
    if (!logger) {
      console.error("DEBUGGING: aiLogger is not available in any scope!");
      treeContent.textContent = "Error: AI Logger is not available";
      modal.style.display = "block";
      return;
    }
    
    const treeData = logger.getTreeData(playerId, treeId);
    console.log("DEBUGGING: Tree data result:", treeData ? "Data found" : "No data found");
    
    if (!treeData) {
      treeContent.textContent = "No tree data available for this decision.";
      modalTitle.textContent = "Decision Tree - No Data";
    } else {
      
      console.log("DEBUGGING: Generating tree visualization");
      const visualization = generateTreeVisualization(treeData);
      treeContent.innerHTML = visualization;
      
      
      modalTitle.textContent = `Decision Tree - ${treeData.gamePhase || "Unknown Phase"}`;
    }
    
    
    console.log("DEBUGGING: Setting modal display to block");
    modal.style.display = "block";
    
    
    setTimeout(() => {
      console.log("DEBUGGING: Forcing modal visibility again after delay");
      modal.style.display = "none";
      modal.offsetHeight; 
      modal.style.display = "block";
    }, 100);
    
  } catch (error) {
    console.error("DEBUGGING: Error in showTreeVisualization:", error);
    treeContent.textContent = "Error displaying tree data: " + error.message;
    modal.style.display = "block";
  }
}


function generateTreeVisualization(treeData) {
  let html = "";
  
  
  html += `<div style="margin-bottom: 15px; padding: 10px; background-color: #333; border-radius: 5px;">`;
  html += `<div><strong>Game Phase:</strong> ${treeData.gamePhase || "Unknown"}</div>`;
  html += `<div><strong>Max Depth:</strong> ${treeData.maxDepth || "N/A"}</div>`;
  html += `<div><strong>Nodes Explored:</strong> ${treeData.nodesExplored || "N/A"}</div>`;
  html += `<div><strong>Best Path:</strong> ${treeData.bestPath || "N/A"}</div>`;
  html += `</div>`;
  
  
  if (treeData.rootNode) {
    html += renderNode(treeData.rootNode, 0, true);
  } else {
    html += `<div>No node data available</div>`;
  }
  
  return html;
}


function renderNode(node, depth, isInBestPath) {
  if (!node) return "";
  
  const indent = "&nbsp;".repeat(depth * 4);
  let html = `<div style="margin: 2px 0; padding: 2px 0;">`;
  
  
  let style = `color: ${isInBestPath ? "#3498db" : "#aaa"};`;
  if (node.action) {
    style += `background-color: ${getActionColor(node.action.toLowerCase())}22;`; 
  }
  
  html += `<div style="${style}">`;
  html += `${indent}${isInBestPath ? "➜ " : ""}`;
  
  
  if (node.action) {
    html += `<span style="font-weight: bold;">${node.action}</span>`;
  }
  
  if (node.value !== undefined) {
    html += ` (Value: ${node.value.toFixed(2)})`;
  }
  
  if (node.probabilityOfReaching !== undefined) {
    html += ` [Prob: ${(node.probabilityOfReaching * 100).toFixed(1)}%]`;
  }
  
  html += `</div>`;
  
  
  if (node.children && node.children.length > 0) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const childIsInBestPath = isInBestPath && node.bestChildIndex === i;
      html += renderNode(child, depth + 1, childIsInBestPath);
    }
  }
  
  html += `</div>`;
  return html;
}

function drawAlgorithmLegend() {
  
  if (game.gamePhase === "menu") return;

  const legendX = 10;
  const legendY = 10;
  const legendWidth = 180;
  const legendHeight = 165;
  const itemHeight = 20;
  const padding = 10;

  
  if (showLegend) {
    
    fill(0, 0, 0, 180);
    stroke(100);
    strokeWeight(1);
    rect(legendX, legendY, legendWidth, legendHeight, 5);

    
    fill(255);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(14);
    text("Algorithm Categories", legendX + padding, legendY + padding);

    
    const categories = [
      {
        name: "Tree-Based",
        color: color(100, 180, 255),
        examples: "Minimax, AlphaBeta",
      },
      {
        name: "Simulation",
        color: color(100, 255, 150),
        examples: "MonteCarlo, Simulation",
      },
      {
        name: "Probability",
        color: color(200, 130, 255),
        examples: "Bayesian, Kelly",
      },
      {
        name: "Heuristic",
        color: color(255, 200, 100),
        examples: "Heuristic, Pattern",
      },
      {
        name: "Adaptive",
        color: color(255, 130, 130),
        examples: "AdaptiveState, GamePhase",
      },
      {
        name: "Original",
        color: color(230, 230, 230),
        examples: "Basic, Intermediate...",
      },
    ];

    textSize(12);
    let yPos = legendY + padding + 20;

    categories.forEach((category) => {
      
      fill(category.color);
      stroke(255);
      strokeWeight(1);
      rect(legendX + padding, yPos, 15, 15, 3);

      
      fill(255);
      noStroke();
      textAlign(LEFT, TOP);
      text(category.name, legendX + padding + 25, yPos);

      
      fill(200);
      textSize(9);
      text(category.examples, legendX + padding + 25, yPos + 12);
      textSize(12);

      yPos += itemHeight + 5;
    });

    
    fill(150);
    noStroke();
    textSize(16);
    textAlign(RIGHT, TOP);
    text("⊗", legendX + legendWidth - padding, legendY + padding);
  } else {
    
    fill(0, 0, 0, 180);
    stroke(100);
    strokeWeight(1);
    rect(legendX, legendY, 30, 30, 5);

    
    fill(150);
    noStroke();
    textSize(16);
    textAlign(CENTER, CENTER);
    text("ⓘ", legendX + 15, legendY + 15);
  }
}


function setupLogDirectory() {
  
  console.log("Setting up log directory (simulated)");

  if (aiLogger) {
    aiLogger.logPath = "logs";
  }
}


function saveLogsToFile() {
  if (aiLogger) {
    aiLogger.saveLogsToFile();
  }
}


function getActionColor(action) {
  if (action === "FOLD") return "#ff6666";  
  if (action === "CALL" || action === "CHECK") return "#66ff66";  
  if (action === "RAISE" || action === "BET") return "#6666ff";  
  return "#ffffff";  
}
