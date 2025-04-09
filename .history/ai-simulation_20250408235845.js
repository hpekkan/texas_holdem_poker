class AISimulation {
  constructor() {
    // Simulation configuration
    this.numGames = 10;
    this.handsPerGame = 20;
    this.initialChips = 1000;
    this.smallBlind = 5;
    this.bigBlind = 10;
    
    // Available AI strategies
    this.availableStrategies = [
      "minimax",
      "alphaBeta",
      "expectimax",
      "monteCarlo",
      "simulation",
      "bayesian",
      "heuristic",
      "pattern",
      "positionBased",
      "kelly",
      "adaptiveState",
      "gamephase",
      "random",
      "conservative",
      "aggressive",
      "advanced",
      "intermediate",
      "basic"
    ];
    
    // Selected strategies for this simulation
    this.selectedStrategies = ["minimax", "alphaBeta", "monteCarlo"];
    
    // Simulation state
    this.isRunning = false;
    this.isPaused = false;
    this.currentGame = 0;
    this.currentHand = 0;
    this.gameInstance = null;
    
    // Performance metrics and statistics
    this.metrics = {
      // Overall metrics
      gamesPlayed: 0,
      handsPlayed: 0,
      totalTime: 0,
      startTime: 0,
      
      // Per-strategy metrics
      strategyMetrics: {}
    };
    
    // Event callbacks
    this.onProgress = null;
    this.onGameComplete = null;
    this.onHandComplete = null;
    this.onSimulationComplete = null;
    this.onLog = null;
    
    // Initialize empty metrics
    this.resetMetrics();
  }
  
  // Reset all metrics tracking
  resetMetrics() {
    this.metrics = {
      gamesPlayed: 0,
      handsPlayed: 0,
      totalTime: 0,
      startTime: 0,
      strategyMetrics: {}
    };
    
    // Initialize metrics for each strategy
    this.availableStrategies.forEach(strategy => {
      this.metrics.strategyMetrics[strategy] = {
        // Win rate tracking
        handsPlayed: 0,
        handsWon: 0,
        winRate: 0,
        
        // Chip tracking
        initialChips: this.initialChips,
        currentChips: this.initialChips,
        chipDelta: 0,
        chipHistory: [this.initialChips],
        
        // Decision metrics
        decisions: {
          fold: 0,
          call: 0,
          raise: 0,
          total: 0
        },
        
        // Performance metrics
        performanceMetrics: {
          totalDecisionTime: 0,
          decisionCount: 0,
          averageDecisionTime: 0,
          minDecisionTime: Infinity,
          maxDecisionTime: 0
        }
      };
    });
  }
  
  // Configure the simulation with parameters
  configure(config) {
    if (config.numGames !== undefined) this.numGames = config.numGames;
    if (config.handsPerGame !== undefined) this.handsPerGame = config.handsPerGame;
    if (config.initialChips !== undefined) this.initialChips = config.initialChips;
    if (config.smallBlind !== undefined) this.smallBlind = config.smallBlind;
    if (config.bigBlind !== undefined) this.bigBlind = config.bigBlind;
    if (config.selectedStrategies !== undefined) this.selectedStrategies = config.selectedStrategies;
    
    // Reset metrics with new initial values
    this.resetMetrics();
    
    return this;
  }
  
  // Start the simulation
  start() {
    if (this.isRunning) return this;
    
    this.log("Starting simulation with strategies: " + this.selectedStrategies.join(", "));
    
    this.isRunning = true;
    this.isPaused = false;
    this.currentGame = 0;
    this.currentHand = 0;
    this.metrics.startTime = performance.now();
    
    // Start simulation
    this.startNextGame();
    
    return this;
  }
  
  // Pause the simulation
  pause() {
    if (!this.isRunning) return this;
    
    this.isPaused = true;
    this.log("Simulation paused");
    
    return this;
  }
  
  // Resume a paused simulation
  resume() {
    if (!this.isRunning || !this.isPaused) return this;
    
    this.isPaused = false;
    this.log("Simulation resumed");
    
    // Continue the simulation
    this.processNextStep();
    
    return this;
  }
  
  // Stop the simulation
  stop() {
    if (!this.isRunning) return this;
    
    this.isRunning = false;
    this.isPaused = false;
    
    // Calculate total time
    this.metrics.totalTime = performance.now() - this.metrics.startTime;
    
    this.log("Simulation stopped. Total time: " + (this.metrics.totalTime / 1000).toFixed(2) + " seconds");
    
    // Calculate final metrics
    this.calculateFinalMetrics();
    
    // Fire completion event
    if (this.onSimulationComplete) {
      this.onSimulationComplete(this.metrics);
    }
    
    return this;
  }
  
  // Start the next game in the simulation
  startNextGame() {
    if (!this.isRunning || this.isPaused) return;
    
    this.currentGame++;
    
    // Check if we're done with all games
    if (this.currentGame > this.numGames) {
      this.stop();
      return;
    }
    
    this.log(`Starting game ${this.currentGame} of ${this.numGames}`);
    
    // Create new players with selected strategies
    const players = this.createPlayers();
    
    // Create new game instance 
    this.gameInstance = new PokerGame();
    
    // Set up game parameters
    this.gameInstance.smallBlindAmount = this.smallBlind;
    this.gameInstance.bigBlindAmount = this.bigBlind;
    this.gameInstance.players = players;
    
    // Override key game methods to track stats
    this.setupGameTracking();
    
    // Reset hand counter and start the first hand
    this.currentHand = 0;
    this.startNextHand();
  }
  
  // Create players with the selected strategies
  createPlayers() {
    const players = [];
    
    // Create players with wrapped decision making to track performance
    for (let i = 0; i < this.selectedStrategies.length; i++) {
      const strategy = this.selectedStrategies[i];
      
      // Create player with this strategy
      const player = new AIPlayer(
        `${strategy}`,
        i,  // Use index as position - ensures player at position 0 is also AI
        this.initialChips,
        strategy
      );
      
      // Reduce decision delay for faster simulation
      player.decisionDelay = 100; // 100ms instead of 1000ms
      
      // Wrap the makeDecision method to track performance
      const originalMakeDecision = player.makeDecision;
      player.makeDecision = async (game) => {
        // Record decision start time
        const startTime = performance.now();
        
        // Get the decision
        const decision = await originalMakeDecision.call(player, game);
        
        // Record decision time
        const endTime = performance.now();
        const decisionTime = endTime - startTime;
        
        // Track decision metrics
        this.trackDecisionMetrics(strategy, decision, decisionTime);
        
        return decision;
      };
      
      players.push(player);
    }
    
    return players;
  }
  
  // Set up tracking in the game instance
  setupGameTracking() {
    // Override the processNextPlayer method to handle AI players only
    const originalProcessNextPlayer = this.gameInstance.processNextPlayer;
    this.gameInstance.processNextPlayer = async function() {
      // Skip if game is not in betting phase
      if (this.gamePhase !== "betting") return;

      const player = this.players[this.currentPlayerIndex];

      // Skip folded or all-in players
      if (player.folded || player.isAllIn || !player.isActive) {
        this.moveToNextPlayer();
        return;
      }

      // For ALL players in simulation (including position 0), treat as AI
      this.updateControls(false);

      try {
        // Get the AI's decision
        const decision = await player.makeDecision(this);
        
        // Execute AI's move
        switch (decision.action) {
          case "fold":
            this.makeFold(player);
            break;
          case "call":
            this.makeCall(player);
            break;
          case "raise":
            this.makeRaise(player, decision.amount);
            break;
        }
        
        // Move to next player
        this.moveToNextPlayer();
      } catch (error) {
        console.error("Error processing AI move:", error);
        // Move to next player if there's an error
        this.moveToNextPlayer();
      }
    };
    
    // Track hand completion
    const originalDetermineWinners = this.gameInstance.determineWinners;
    this.gameInstance.determineWinners = function() {
      // First call the original method
      const winners = originalDetermineWinners.call(this);
      
      // Track winners
      this.simulation.trackWinners(winners);
      
      // Track chip counts
      this.simulation.trackChipCounts();
      
      // Update hand counter
      this.simulation.currentHand++;
      this.simulation.metrics.handsPlayed++;
      
      // Fire hand complete event
      if (this.simulation.onHandComplete) {
        this.simulation.onHandComplete(this.simulation.currentGame, this.simulation.currentHand, winners);
      }
      
      // Update progress
      if (this.simulation.onProgress) {
        const progress = ((this.simulation.currentGame - 1) * this.simulation.handsPerGame + this.simulation.currentHand) / 
                          (this.simulation.numGames * this.simulation.handsPerGame);
        this.simulation.onProgress(progress);
      }
      
      // Check if we've completed hands for this game
      if (this.simulation.currentHand >= this.simulation.handsPerGame) {
        // Update game counter
        this.simulation.metrics.gamesPlayed++;
        
        // Fire game complete event
        if (this.simulation.onGameComplete) {
          this.simulation.onGameComplete(this.simulation.currentGame);
        }
        
        // Start the next game
        this.simulation.startNextGame();
      } else {
        // Start the next hand in this game
        this.simulation.startNextHand();
      }
      
      return winners;
    };
    
    // Add reference to simulation in game instance
    this.gameInstance.simulation = this;
  }
  
  // Start the next hand in the current game
  startNextHand() {
    if (!this.isRunning || this.isPaused) return;
    
    // Start a new hand
    this.gameInstance.startNewHand();
  }
  
  // Process the next step in the simulation
  processNextStep() {
    if (!this.isRunning || this.isPaused) return;
    
    // If we have an active game, continue with next hand
    if (this.gameInstance) {
      this.startNextHand();
    } else {
      // Otherwise start a new game
      this.startNextGame();
    }
  }
  
  // Track decision metrics
  trackDecisionMetrics(strategy, decision, decisionTime) {
    // Get metrics for this strategy
    const metrics = this.metrics.strategyMetrics[strategy];
    if (!metrics) return;
    
    // Track decision type
    if (decision.action === 'fold') {
      metrics.decisions.fold++;
    } else if (decision.action === 'call') {
      metrics.decisions.call++;
    } else if (decision.action === 'raise') {
      metrics.decisions.raise++;
    }
    
    metrics.decisions.total++;
    
    // Track performance metrics
    metrics.performanceMetrics.totalDecisionTime += decisionTime;
    metrics.performanceMetrics.decisionCount++;
    metrics.performanceMetrics.minDecisionTime = Math.min(metrics.performanceMetrics.minDecisionTime, decisionTime);
    metrics.performanceMetrics.maxDecisionTime = Math.max(metrics.performanceMetrics.maxDecisionTime, decisionTime);
    metrics.performanceMetrics.averageDecisionTime = 
      metrics.performanceMetrics.totalDecisionTime / metrics.performanceMetrics.decisionCount;
  }
  
  // Track winners after a hand
  trackWinners(winners) {
    if (!winners || !winners.length) return;
    
    // Track each winner
    winners.forEach(winner => {
      const strategy = winner.player.strategy;
      
      // Get metrics for this strategy
      const metrics = this.metrics.strategyMetrics[strategy];
      if (!metrics) return;
      
      // Update wins count
      metrics.handsWon++;
      
      // Update win rate
      metrics.handsPlayed++;
      metrics.winRate = metrics.handsWon / metrics.handsPlayed;
    });
    
    // Track hands played for all players
    this.gameInstance.players.forEach(player => {
      const strategy = player.strategy;
      
      // Get metrics for this strategy
      const metrics = this.metrics.strategyMetrics[strategy];
      if (!metrics) return;
      
      // Increment hands played if not already counted as a win
      if (!winners.some(w => w.player.strategy === strategy)) {
        metrics.handsPlayed++;
        
        // Recalculate win rate
        metrics.winRate = metrics.handsWon / metrics.handsPlayed;
      }
    });
  }
  
  // Track chip counts for all players
  trackChipCounts() {
    this.gameInstance.players.forEach(player => {
      const strategy = player.strategy;
      
      // Get metrics for this strategy
      const metrics = this.metrics.strategyMetrics[strategy];
      if (!metrics) return;
      
      // Update chip count
      metrics.currentChips = player.chips;
      metrics.chipDelta = player.chips - metrics.initialChips;
      
      // Add to chip history
      metrics.chipHistory.push(player.chips);
    });
  }
  
  // Calculate final metrics after simulation completes
  calculateFinalMetrics() {
    // Calculate average metrics across all strategies
    const activeStrategies = this.selectedStrategies.filter(strategy => 
      this.metrics.strategyMetrics[strategy].handsPlayed > 0
    );
    
    // Calculate win rates and other metrics
    activeStrategies.forEach(strategy => {
      const metrics = this.metrics.strategyMetrics[strategy];
      
      // Final win rate
      metrics.winRate = metrics.handsWon / metrics.handsPlayed;
      
      // Final decision distribution
      const totalDecisions = metrics.decisions.total;
      if (totalDecisions > 0) {
        metrics.decisions.foldRate = metrics.decisions.fold / totalDecisions;
        metrics.decisions.callRate = metrics.decisions.call / totalDecisions;
        metrics.decisions.raiseRate = metrics.decisions.raise / totalDecisions;
      }
    });
  }
  
  // Log a message
  log(message) {
    console.log(`[AI Simulation] ${message}`);
    
    // Call log callback if defined
    if (this.onLog) {
      this.onLog(message);
    }
  }
  
  // Get current metrics
  getMetrics() {
    return this.metrics;
  }
  
  // Get metrics for a specific strategy
  getStrategyMetrics(strategy) {
    return this.metrics.strategyMetrics[strategy] || null;
  }
}