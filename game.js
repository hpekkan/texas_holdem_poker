
class PokerGame {
  constructor() {
    this.deck = new Deck();
    this.players = [];
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;
    this.minBet = 10;
    this.currentPlayerIndex = 0;
    this.dealerIndex = 0;
    this.smallBlindIndex = 0;
    this.bigBlindIndex = 0;
    this.smallBlindAmount = 5;
    this.bigBlindAmount = 10;
    this.gamePhase = "menu"; 
    this.roundName = ""; 
    this.betHistory = [];
    this.winners = [];
    this.messageLog = [];

    
    this.aiStrategies = {
      ai1: "basic",
      ai2: "intermediate",
      ai3: "advanced",
    };

    
    this.setupLogDownloadButton();
  }

  
  setupPlayers() {
    const capitalizeStrategy = (str) => {
      return str.charAt(0).toUpperCase() + str.slice(1);
    };

    this.players = [
      new Player("You", 0),
      new AIPlayer(
        `AI 1 (${capitalizeStrategy(this.aiStrategies.ai1)})`,
        1,
        1000,
        this.aiStrategies.ai1
      ),
      new AIPlayer(
        `AI 2 (${capitalizeStrategy(this.aiStrategies.ai2)})`,
        2,
        1000,
        this.aiStrategies.ai2
      ),
      new AIPlayer(
        `AI 3 (${capitalizeStrategy(this.aiStrategies.ai3)})`,
        3,
        1000,
        this.aiStrategies.ai3
      ),
    ];

    
    if (typeof aiLogger !== "undefined") {
      this.players.forEach((player) => {
        aiLogger.initializePlayerLog(player);
      });
    }
  }

  startGame(ai1Strategy, ai2Strategy, ai3Strategy) {
    this.aiStrategies = {
      ai1: ai1Strategy,
      ai2: ai2Strategy,
      ai3: ai3Strategy,
    };

    
    if (typeof aiLogger !== "undefined") {
      aiLogger.enabled = true;
      aiLogger.initializeGameLog();
      console.log("Game logger initialized:", aiLogger);
    }

    this.setupPlayers();
    this.gamePhase = "waiting";
    this.messageLog = []; 
    this.logMessage(
      "Game started with AI strategies: " +
        "AI 1: " +
        ai1Strategy +
        ", " +
        "AI 2: " +
        ai2Strategy +
        ", " +
        "AI 3: " +
        ai3Strategy
    );

    
    this.updateControls(true);
  }

  
  startNewHand() {
    
    this.deck.reset().shuffle();
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;
    this.winners = [];
    this.betHistory = [];
    this.gamePhase = "dealing";

    
    this.players.forEach((player) => player.reset());

    
    this.players = this.players.filter((player) => {
      const isActive = player.chips > 0;
      player.isActive = isActive;
      return isActive;
    });

    if (this.players.length < 2) {
      this.logMessage("Game over - not enough players with chips");
      this.gamePhase = "gameover";
      return;
    }

    
    this.dealerIndex = (this.dealerIndex + 1) % this.players.length;

    
    this.smallBlindIndex = (this.dealerIndex + 1) % this.players.length;
    this.bigBlindIndex = (this.dealerIndex + 2) % this.players.length;

    
    this.postBlinds();

    
    this.dealPlayerCards();

    
    this.startBettingRound("preflop");
  }

  
  postBlinds() {
    const smallBlindPlayer = this.players[this.smallBlindIndex];
    const bigBlindPlayer = this.players[this.bigBlindIndex];

    
    const sbAmount = Math.min(this.smallBlindAmount, smallBlindPlayer.chips);
    smallBlindPlayer.placeBet(sbAmount);
    this.pot += sbAmount;
    this.logMessage(`${smallBlindPlayer.name} posts small blind: $${sbAmount}`);

    
    const bbAmount = Math.min(this.bigBlindAmount, bigBlindPlayer.chips);
    bigBlindPlayer.placeBet(bbAmount);
    this.pot += bbAmount;
    this.currentBet = bbAmount;
    this.logMessage(`${bigBlindPlayer.name} posts big blind: $${bbAmount}`);
  }

  
  dealPlayerCards() {
    
    for (let i = 0; i < 2; i++) {
      for (let player of this.players) {
        const card = this.deck.deal();
        
        if (player.position === 0) {
          card.flip();
        }
        player.receiveCard(card);
      }
    }

    this.logMessage("Cards dealt to all players");

    
    if (typeof aiLogger !== "undefined") {
      aiLogger.logGameState(this);
    }
  }

  
  startBettingRound(roundName) {
    this.roundName = roundName;
    this.gamePhase = "betting";

    
    this.players.forEach((player) => (player.currentBet = 0));

    
    if (roundName === "preflop") {
      
      this.currentPlayerIndex = (this.bigBlindIndex + 1) % this.players.length;
    } else {
      
      this.currentPlayerIndex = (this.dealerIndex + 1) % this.players.length;
      while (
        !this.players[this.currentPlayerIndex].isActive ||
        this.players[this.currentPlayerIndex].folded
      ) {
        this.currentPlayerIndex =
          (this.currentPlayerIndex + 1) % this.players.length;
      }
    }

    this.logMessage(`--- ${this.roundName.toUpperCase()} ---`);

    
    if (typeof aiLogger !== "undefined") {
      aiLogger.logGameState(this);
    }

    
    this.processNextPlayer();
  }

  
  async processNextPlayer() {
    
    if (this.gamePhase !== "betting") return;

    const player = this.players[this.currentPlayerIndex];

    
    if (player.folded || player.isAllIn || !player.isActive) {
      this.moveToNextPlayer();
      return;
    }

    
    if (player.position === 0) {
      console.log("Human player's turn - waiting for input");
      this.updateControls(true);
      return;
    }

    
    this.updateControls(false);

    
    const aiPlayer = player;
    const decision = await aiPlayer.makeDecision(this);
    
    
    if (typeof aiLogger !== "undefined" && aiLogger.enabled) {
      
      const decisionDetails = aiPlayer.decisionProcess || {};
      aiLogger.logDecision(aiPlayer, decision, this, decisionDetails);
      
      
      if (decisionDetails.reasoningSteps && decisionDetails.reasoningSteps.length > 0) {
        this.logMessage(`${aiPlayer.name} reasoning:`);
        decisionDetails.reasoningSteps.forEach(step => {
          this.logMessage(`  > ${step}`);
        });
      }
    }
    
    
    if (aiPlayer.decisionProcess && aiPlayer.decisionProcess.reasoningSteps) {
      const reasoningSteps = aiPlayer.decisionProcess.reasoningSteps;
      if (reasoningSteps.length > 0) {
        this.logMessage(`${aiPlayer.name} reasoning:`);
        for (let i = 0; i < Math.min(5, reasoningSteps.length); i++) {
          this.logMessage(`  > ${reasoningSteps[i]}`);
        }
        if (reasoningSteps.length > 5) {
          this.logMessage(`  > (${reasoningSteps.length - 5} more steps not shown)`);
        }
      }
    }

    
    switch (decision.action) {
      case "fold":
        this.makeFold(aiPlayer);
        break;

      case "call":
        this.makeCall(aiPlayer);
        break;

      case "raise":
        this.makeRaise(aiPlayer, decision.amount);
        break;
    }

    
    this.moveToNextPlayer();
  }

  
  moveToNextPlayer() {
    
    if (this.simulation && !this.simulation.isRunning) {
      console.log("Game is in a stopped simulation, skipping moveToNextPlayer");
      
      this.gamePhase = "gameover";
      return;
    }
    
    
    if (this.isBettingRoundComplete()) {
      this.completeBettingRound();
      return;
    }

    
    do {
      this.currentPlayerIndex =
        (this.currentPlayerIndex + 1) % this.players.length;
    } while (
      (this.players[this.currentPlayerIndex].folded ||
        this.players[this.currentPlayerIndex].isAllIn ||
        !this.players[this.currentPlayerIndex].isActive) &&
      !this.isBettingRoundComplete()
    );

    
    this.processNextPlayer();
  }

  
  isBettingRoundComplete() {
    
    const activePlayers = this.players.filter((p) => p.isActive && !p.folded);

    
    if (activePlayers.length <= 1) {
      return true;
    }

    
    const remainingToBet = activePlayers.filter(
      (p) => !p.isAllIn && p.currentBet !== this.currentBet
    );

    return remainingToBet.length === 0;
  }

  
  completeBettingRound() {
    
    if (this.simulation && !this.simulation.isRunning) {
      console.log("Game is in a stopped simulation, skipping completeBettingRound");
      
      this.gamePhase = "gameover";
      return;
    }
  
    
    for (let player of this.players) {
      this.pot += player.currentBet;
      player.currentBet = 0;
    }

    
    const activePlayers = this.players.filter((p) => !p.folded && p.isActive);

    
    if (activePlayers.length === 1) {
      this.determineWinners();
      return;
    }

    
    switch (this.roundName) {
      case "preflop":
        this.dealFlop();
        break;

      case "flop":
        this.dealTurn();
        break;

      case "turn":
        this.dealRiver();
        break;

      case "river":
        this.determineWinners();
        break;
    }
  }

  
  dealFlop() {
    
    this.deck.deal();

    
    for (let i = 0; i < 3; i++) {
      this.communityCards.push(this.deck.deal(true));
    }

    this.logMessage(
      "Flop: " + this.communityCards.map((c) => c.fullName).join(", ")
    );

    
    if (typeof aiLogger !== "undefined") {
      aiLogger.logGameState(this);
    }

    
    this.currentBet = 0;
    this.startBettingRound("flop");
  }

  
  dealTurn() {
    
    this.deck.deal();

    
    this.communityCards.push(this.deck.deal(true));

    this.logMessage(
      "Turn: " + this.communityCards[this.communityCards.length - 1].fullName
    );

    
    if (typeof aiLogger !== "undefined") {
      aiLogger.logGameState(this);
    }

    
    this.currentBet = 0;
    this.startBettingRound("turn");
  }

  
  dealRiver() {
    
    this.deck.deal();

    
    this.communityCards.push(this.deck.deal(true));

    this.logMessage(
      "River: " + this.communityCards[this.communityCards.length - 1].fullName
    );

    
    if (typeof aiLogger !== "undefined") {
      aiLogger.logGameState(this);
    }

    
    this.currentBet = 0;
    this.startBettingRound("river");
  }

  
  determineWinners() {
    
    if (this.simulation && !this.simulation.isRunning) {
      console.log("Game is in a stopped simulation, skipping determineWinners");
      
      this.gamePhase = "gameover";
      return [];
    }
    
    this.gamePhase = "showdown";
    this.logMessage("--- SHOWDOWN ---");

    
    for (let player of this.players) {
      if (!player.folded && player.isActive) {
        player.hand.forEach((card) => (card.faceUp = true));
        const handResult = player.getHandStrength(this.communityCards);
        this.logMessage(`${player.name}: ${handResult.description}`);
      }
    }

    
    const activePlayers = this.players.filter((p) => !p.folded && p.isActive);

    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      winner.receiveChips(this.pot);
      if (this.pot > 0) {
        this.winners.push({
          player: winner,
          amount: this.pot,
          hand: null,
        });
      }

      this.pot = 0;

      
      if (typeof aiLogger !== "undefined") {
        aiLogger.logHandResult(this, this.winners);
      }

      
      this.gamePhase = "waiting";
      this.updateControls(true);

      
      if (this.simulation) {
        
        if (this.simulation.currentHand >= this.simulation.handsPerGame) {
          
          this.simulation.metrics.gamesPlayed++;
          
          
          if (this.simulation.onGameComplete) {
            this.simulation.onGameComplete(this.simulation.currentGame);
          }
          
          
          this.simulation.startNextGame();
        } else {
          
          this.simulation.startNextHand();
        }
      }
      return;
    }

    
    const playerHandResults = activePlayers.map((player) => {
      return {
        player,
        handResult: player.getHandStrength(this.communityCards),
      };
    });

    
    playerHandResults.sort((a, b) => {
      return HandEvaluator.compareHands(b.handResult, a.handResult);
    });

    
    const winningPlayers = [];
    let bestHandRank = -1;

    for (let playerResult of playerHandResults) {
      if (winningPlayers.length === 0) {
        winningPlayers.push(playerResult);
        bestHandRank = playerResult.handResult.rank;
      } else if (
        HandEvaluator.compareHands(
          playerResult.handResult,
          winningPlayers[0].handResult
        ) === 0
      ) {
        winningPlayers.push(playerResult);
      } else {
        break;
      }
    }

    
    const winAmount = Math.floor(this.pot / winningPlayers.length);

    for (let winner of winningPlayers) {
      winner.player.receiveChips(winAmount);
      this.winners.push({
        player: winner.player,
        amount: winAmount,
        hand: winner.handResult,
      });
    }

    
    const remainder = this.pot % winningPlayers.length;
    if (remainder > 0) {
      winningPlayers[0].player.receiveChips(remainder);
      this.logMessage(
        `${winningPlayers[0].player.name} gets ${remainder} odd chip(s)`
      );
      this.winners[0].amount += remainder;
    }

    this.pot = 0;

    
    if (typeof aiLogger !== "undefined") {
      aiLogger.logHandResult(this, this.winners);
    }

    
    this.gamePhase = "waiting";
    this.updateControls(true);

    
    if (this.simulation) {
      
      if (this.simulation.currentHand >= this.simulation.handsPerGame) {
        
        this.simulation.metrics.gamesPlayed++;
        
        
        if (this.simulation.onGameComplete) {
          this.simulation.onGameComplete(this.simulation.currentGame);
        }
        
        
        this.simulation.startNextGame();
      } else {
        
        this.simulation.startNextHand();
      }
    }
  }

  
  makeFold(player) {
    player.fold();
    this.logMessage(`${player.name} folds`);

    
    const activePlayers = this.players.filter((p) => !p.folded && p.isActive);
    if (activePlayers.length === 1) {
      this.completeBettingRound();
    }
  }

  
  makeCall(player) {
    const callAmount = this.currentBet - player.currentBet;
    const actualBet = player.placeBet(callAmount);

    if (actualBet === 0) {
      this.logMessage(`${player.name} checks`);
    } else {
      this.logMessage(`${player.name} calls $${actualBet}`);
    }
  }

  
  makeRaise(player, amount) {
    const minRaise = this.currentBet * 2;
    const callAmount = this.currentBet - player.currentBet;

    
    amount = Math.max(amount, this.currentBet + this.minBet);

    
    const totalBet = callAmount + amount;
    const actualBet = player.placeBet(totalBet);

    this.currentBet = player.currentBet;
    this.logMessage(`${player.name} raises to $${this.currentBet}`);
  }

  
  updateControls(isEnabled) {
    if (typeof document === "undefined") return; 

    const callBtn = document.getElementById("callBtn");
    const raiseBtn = document.getElementById("raiseBtn");
    const foldBtn = document.getElementById("foldBtn");
    const dealBtn = document.getElementById("dealBtn");
    const betAmount = document.getElementById("betAmount");
    const downloadLogsBtn = document.getElementById("downloadLogsBtn");

    if (!callBtn || !raiseBtn || !foldBtn || !dealBtn || !betAmount) return;

    
    if (downloadLogsBtn) {
      downloadLogsBtn.style.display =
        typeof aiLogger !== "undefined" && aiLogger.enabled ? "block" : "none";
    }

    
    if (this.gamePhase === "menu") {
      callBtn.disabled = true;
      raiseBtn.disabled = true;
      foldBtn.disabled = true;
      dealBtn.disabled = true;
      betAmount.disabled = true;
      return;
    }

    
    if (
      this.gamePhase === "betting" &&
      this.currentPlayerIndex >= 0 &&
      this.players[this.currentPlayerIndex].position === 0 &&
      isEnabled
    ) {
      const player = this.players[this.currentPlayerIndex];
      const callAmount = this.currentBet - player.currentBet;

      callBtn.disabled = false;
      callBtn.textContent = callAmount > 0 ? `Call $${callAmount}` : "Check";

      raiseBtn.disabled = player.chips <= callAmount;
      foldBtn.disabled = callAmount === 0;
      dealBtn.disabled = true;
      betAmount.disabled = false;
      betAmount.min = this.minBet;
      betAmount.max = player.chips;
      betAmount.value = Math.min(this.currentBet * 2, player.chips);
    }
    
    else if (this.gamePhase === "waiting" && isEnabled) {
      callBtn.disabled = true;
      raiseBtn.disabled = true;
      foldBtn.disabled = true;
      dealBtn.disabled = false;
      betAmount.disabled = true;
    }
    
    else {
      callBtn.disabled = true;
      raiseBtn.disabled = true;
      foldBtn.disabled = true;
      dealBtn.disabled = true;
      betAmount.disabled = true;
    }
  }

  
  logMessage(message) {
    this.messageLog.push({
      message,
      timestamp: new Date().toLocaleTimeString(),
    });

    
    if (this.messageLog.length > 50) {
      this.messageLog.shift();
    }

    console.log(message);
  }

  
  setupLogDownloadButton() {
    if (typeof document === "undefined") return;

    
    const gameControls = document.getElementById("gameControls");
    if (!gameControls) return;

    
    if (document.getElementById("downloadLogsBtn")) return;

    const downloadBtn = document.createElement("button");
    downloadBtn.id = "downloadLogsBtn";
    downloadBtn.textContent = "Download AI Logs";
    downloadBtn.style.backgroundColor = "#27ae60";
    downloadBtn.style.display = "none"; 

    
    downloadBtn.addEventListener("click", () => {
      if (typeof aiLogger !== "undefined") {
        aiLogger.saveLogsToFile();
      }
    });

    
    gameControls.appendChild(downloadBtn);
  }
}
