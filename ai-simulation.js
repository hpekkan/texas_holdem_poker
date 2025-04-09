class AISimulation {
  constructor() {
    
    this.numGames = 10;
    this.handsPerGame = 20;
    this.initialChips = 1000;
    this.smallBlind = 5;
    this.bigBlind = 10;
    
    
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
    
    
    this.selectedStrategies = ["minimax", "alphaBeta", "monteCarlo"];
    
    
    this.isRunning = false;
    this.isPaused = false;
    this.currentGame = 0;
    this.currentHand = 0;
    this.gameInstance = null;
    
    
    this.metrics = {
      
      gamesPlayed: 0,
      handsPlayed: 0,
      totalTime: 0,
      startTime: 0,
      
      
      strategyMetrics: {}
    };
    
    
    this.players = [];
    
    
    this.onProgress = null;
    this.onGameComplete = null;
    this.onHandComplete = null;
    this.onSimulationComplete = null;
    this.onLog = null;
    
    
    this.resetMetrics();
  }
  
  
  resetMetrics() {
    this.metrics = {
      gamesPlayed: 0,
      handsPlayed: 0,
      totalTime: 0,
      startTime: 0,
      strategyMetrics: {}
    };
    
    
    this.availableStrategies.forEach(strategy => {
      this.metrics.strategyMetrics[strategy] = {
        
        handsPlayed: 0,
        handsWon: 0,
        winRate: 0,
        
        
        initialChips: this.initialChips,
        currentChips: this.initialChips,
        chipDelta: 0,
        chipHistory: [this.initialChips],
        
        
        decisions: {
          fold: 0,
          call: 0,
          raise: 0,
          total: 0
        },
        
        
        performanceMetrics: {
          totalDecisionTime: 0,
          decisionCount: 0,
          averageDecisionTime: 0,
          minDecisionTime: Infinity,
          maxDecisionTime: 0
        },
        
        
        totalChipsWon: 0,
        
        
        gamesPlayed: 0
      };
    });
  }
  
  
  configure(config) {
    if (config.numGames !== undefined) this.numGames = config.numGames;
    if (config.handsPerGame !== undefined) this.handsPerGame = config.handsPerGame;
    if (config.initialChips !== undefined) this.initialChips = config.initialChips;
    if (config.smallBlind !== undefined) this.smallBlind = config.smallBlind;
    if (config.bigBlind !== undefined) this.bigBlind = config.bigBlind;
    if (config.selectedStrategies !== undefined) this.selectedStrategies = config.selectedStrategies;
    
    
    this.resetMetrics();
    
    this.players = [];
    
    return this;
  }
  
  
  start() {
    if (this.isRunning) return this;
    
    this.log("Starting simulation with strategies: " + this.selectedStrategies.join(", "));
    
    this.isRunning = true;
    this.isPaused = false;
    this.currentGame = 0;
    this.currentHand = 0;
    this.metrics.startTime = performance.now();
    
    
    if (this.players.length === 0) {
      this.players = this.createPlayers();
    }
    
    
    this.startNextGame();
    
    return this;
  }
  
  
  pause() {
    if (!this.isRunning) return this;
    
    this.isPaused = true;
    this.log("Simulation paused");
    
    return this;
  }
  
  
  resume() {
    if (!this.isRunning || !this.isPaused) return this;
    
    this.isPaused = false;
    this.log("Simulation resumed");
    
    
    this.processNextStep();
    
    return this;
  }
  
  
  stop() {
    if (!this.isRunning) return this;
    
    this.isRunning = false;
    this.isPaused = false;
    
    
    this.metrics.totalTime = performance.now() - this.metrics.startTime;
    
    this.log("Simulation stopped. Total time: " + (this.metrics.totalTime / 1000).toFixed(2) + " seconds");
    
    
    if (this.gameInstance) {
      
      this.gameInstance.gamePhase = "gameover";
      
      
      if (this.gameInstance.players) {
        for (const player of this.gameInstance.players) {
          
          if (player._decisionTimeout) {
            clearTimeout(player._decisionTimeout);
          }
        }
      }
      
      
      const oldInstance = this.gameInstance;
      this.gameInstance = null;
      
      
      try {
        oldInstance.logMessage("Game terminated by simulation stop");
      } catch (e) {
        
      }
    }
    
    
    this.calculateFinalMetrics();
    
    
    if (this.onSimulationComplete) {
      this.onSimulationComplete(this.metrics);
    }
    
    return this;
  }
  
  
  startNextGame() {
    if (!this.isRunning || this.isPaused) return;
    
    this.currentGame++;
    
    
    if (this.currentGame > this.numGames) {
      this.stop();
      return;
    }
    
    this.log(`Starting game ${this.currentGame} of ${this.numGames}`);
    
    
    
    if (this.currentGame === 1) {
      
    } else {
      
      this.players.forEach(player => {
        player.chips = this.initialChips;
        
        
        player.decisionDelay = 0;
        
        
        
        const strategy = player.strategy;
        const originalMakeDecision = player._originalMakeDecision || player.makeDecision;
        
        
        if (!player._originalMakeDecision) {
          player._originalMakeDecision = originalMakeDecision;
        }
        
        
        player.makeDecision = async (game) => {
          
          const startTime = performance.now();
          
          
          const decision = await originalMakeDecision.call(player, game);
          
          
          const endTime = performance.now();
          const decisionTime = endTime - startTime;
          
          
          this.trackDecisionMetrics(strategy, decision, decisionTime);
          
          return decision;
        };
        
        
        const metrics = this.metrics.strategyMetrics[strategy];
        if (metrics) {
          metrics.gamesPlayed++;
          
          metrics.chipHistory.push(player.chips);
        }
      });
    }
    
    
    this.gameInstance = new PokerGame();
    
    
    this.gameInstance.smallBlindAmount = this.smallBlind;
    this.gameInstance.bigBlindAmount = this.bigBlind;
    this.gameInstance.players = this.players;
    
    
    this.setupGameTracking();
    
    
    this.currentHand = 0;
    this.startNextHand();
  }
  
  
  createPlayers() {
    const players = [];
    
    
    for (let i = 0; i < this.selectedStrategies.length; i++) {
      const strategy = this.selectedStrategies[i];
      
      
      const player = new AIPlayer(
        `${strategy}`,
        i,  
        this.initialChips,
        strategy
      );
      
      
      player.strategyName = strategy;
      
      
      
      player.decisionDelay = 0;

      
      player._originalMakeDecision = player.makeDecision;
      
      
      player.makeDecision = async (game) => {
        
        try {
          
          const currentBet = game.currentBet;
          const callAmount = currentBet - player.currentBet;
          const communityCards = game.communityCards;
          const potSize = game.pot;
          
          
          const startTime = performance.now();
          
          
          let decision;
          
          
          switch (strategy) {
            case "minimax":
              decision = MinimaxAlgorithm.makeMinimaxDecision(
                player, callAmount, communityCards, potSize, game
              );
              break;
            case "alphaBeta":
              if (typeof player.makeAlphaBetaDecision === 'function') {
                decision = player.makeAlphaBetaDecision(callAmount, communityCards, potSize, game);
              } else if (typeof AlphaBetaAlgorithm !== 'undefined' && AlphaBetaAlgorithm.makeAlphaBetaDecision) {
                decision = AlphaBetaAlgorithm.makeAlphaBetaDecision(
                  player, callAmount, communityCards, potSize, game
                );
              }
              break;
            case "expectimax":
              if (typeof player.makeExpectimaxDecision === 'function') {
                decision = player.makeExpectimaxDecision(callAmount, communityCards, potSize, game);
              } else if (typeof ExpectimaxAlgorithm !== 'undefined' && ExpectimaxAlgorithm.makeExpectimaxDecision) {
                decision = ExpectimaxAlgorithm.makeExpectimaxDecision(
                  player, callAmount, communityCards, potSize, game
                );
              }
              break;
            case "monteCarlo":
              if (typeof MonteCarloAlgorithm !== 'undefined' && MonteCarloAlgorithm.makeMonteCarloDecision) {
                decision = MonteCarloAlgorithm.makeMonteCarloDecision(
                  player, callAmount, communityCards, potSize, game
                );
              }
              break;
            case "simulation":
              if (typeof player.makeSimulationBasedDecision === 'function') {
                decision = player.makeSimulationBasedDecision(callAmount, communityCards, potSize, game);
              } else if (typeof SimulationBasedAlgorithm !== 'undefined' && SimulationBasedAlgorithm.makeSimulationBasedDecision) {
                decision = SimulationBasedAlgorithm.makeSimulationBasedDecision(
                  player, callAmount, communityCards, potSize, game
                );
              }
              break;
            case "bayesian":
              if (typeof player.makeBayesianDecision === 'function') {
                decision = player.makeBayesianDecision(callAmount, communityCards, potSize, game);
              } else if (typeof BayesianAlgorithm !== 'undefined' && BayesianAlgorithm.makeBayesianDecision) {
                decision = BayesianAlgorithm.makeBayesianDecision(
                  player, callAmount, communityCards, potSize, game
                );
              }
              break;
            case "heuristic":
              if (typeof player.makeHeuristicDecision === 'function') {
                decision = player.makeHeuristicDecision(callAmount, communityCards, potSize, game);
              } else if (typeof HeuristicAlgorithm !== 'undefined' && HeuristicAlgorithm.makeHeuristicDecision) {
                decision = HeuristicAlgorithm.makeHeuristicDecision(
                  player, callAmount, communityCards, potSize, game
                );
              }
              break;
            case "pattern":
              if (typeof player.makePatternBasedDecision === 'function') {
                decision = player.makePatternBasedDecision(callAmount, communityCards, potSize, game);
              } else if (typeof PatternRecognition !== 'undefined' && PatternRecognition.makePatternBasedDecision) {
                decision = PatternRecognition.makePatternBasedDecision(
                  player, callAmount, communityCards, potSize, game
                );
              }
              break;
            case "positionBased":
              if (typeof player.makePositionBasedDecision === 'function') {
                decision = player.makePositionBasedDecision(callAmount, communityCards, potSize, game);
              } else if (typeof PositionBasedAlgorithm !== 'undefined' && PositionBasedAlgorithm.makePositionBasedDecision) {
                decision = PositionBasedAlgorithm.makePositionBasedDecision(
                  player, callAmount, communityCards, potSize, game
                );
              }
              break;
            case "kelly":
              if (typeof player.makeKellyCriterionDecision === 'function') {
                decision = player.makeKellyCriterionDecision(callAmount, communityCards, potSize, game);
              } else if (typeof KellyCriterion !== 'undefined' && KellyCriterion.makeKellyDecision) {
                decision = KellyCriterion.makeKellyDecision(
                  player, callAmount, communityCards, potSize, game
                );
              }
              break;
            case "adaptiveState":
              if (typeof player.makeAdaptiveStateDecision === 'function') {
                decision = player.makeAdaptiveStateDecision(callAmount, communityCards, potSize, game);
              } else if (typeof AdaptiveStateAlgorithm !== 'undefined' && AdaptiveStateAlgorithm.makeAdaptiveStateDecision) {
                decision = AdaptiveStateAlgorithm.makeAdaptiveStateDecision(
                  player, callAmount, communityCards, potSize, game
                );
              }
              break;
            case "gamephase":
              if (typeof GamePhaseStrategy !== 'undefined' && GamePhaseStrategy.makeGamePhaseDecision) {
                decision = GamePhaseStrategy.makeGamePhaseDecision(
                  player, callAmount, communityCards, potSize, game
                );
              }
              break;
            case "random":
              decision = BasicStrategies.makeRandomDecision(
                player, callAmount
              );
              break;
            case "conservative":
              decision = BasicStrategies.makeConservativeDecision(
                player, callAmount, communityCards
              );
              break;
            case "aggressive":
              decision = BasicStrategies.makeAggressiveDecision(
                player, callAmount, communityCards, potSize
              );
              break;
            case "advanced":
              decision = BasicStrategies.makeAdvancedDecision(
                player, callAmount, communityCards, potSize
              );
              break;
            case "intermediate":
              decision = BasicStrategies.makeIntermediateDecision(
                player, callAmount, communityCards, potSize
              );
              break;
            case "basic":
            default:
              decision = BasicStrategies.makeBasicDecision(
                player, callAmount, communityCards
              );
              break;
          }
          
          
          if (!decision) {
            console.warn(`Strategy ${strategy} failed to produce a decision, using basic strategy`);
            decision = BasicStrategies.makeBasicDecision(player, callAmount, communityCards);
          }
          
          
          const endTime = performance.now();
          
          
          const decisionTime = endTime - startTime;
          
          
          this.trackDecisionMetrics(strategy, decision, decisionTime);
          
          
          return decision;
        } catch (error) {
          console.error(`Error in AI decision (${strategy}):`, error);
          
          return { action: "fold" };
        }
      };
      
      players.push(player);
    }
    
    return players;
  }
  
  
  setupGameTracking() {
    
    const simulationRef = this;
    
    
    const originalProcessNextPlayer = this.gameInstance.processNextPlayer;
    this.gameInstance.processNextPlayer = async function() {
      
      if (this.gamePhase !== "betting") return;
      
      
      if (!this.simulation || !this.simulation.isRunning) {
        console.log("Simulation no longer running, skipping game actions");
        return;
      }

      
      const activePlayers = this.players.filter(p => !p.folded && p.isActive);
      if (activePlayers.length <= 1) {
        console.log("Only one active player remains, ending hand");
        
        this.completeBettingRound();
        return;
      }

      const player = this.players[this.currentPlayerIndex];

      
      if (player.folded || player.isAllIn || !player.isActive) {
        this.moveToNextPlayer();
        return;
      }

      
      this.updateControls(false);

      try {
        
        const decision = await player.makeDecision(this);
        
        
        if (!this.simulation || !this.simulation.isRunning) {
          console.log("Simulation stopped during decision making, cancelling action");
          return;
        }
        
        
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
        
        
        const remainingPlayers = this.players.filter(p => !p.folded && p.isActive);
        if (remainingPlayers.length <= 1) {
          console.log("Only one player remains after move, ending hand");
          
          this.completeBettingRound();
          return;
        }
        
        
        this.moveToNextPlayer();
      } catch (error) {
        console.error("Error processing AI move:", error);
        
        this.moveToNextPlayer();
      }
    };
    
    
    const originalDetermineWinners = this.gameInstance.determineWinners;
    this.gameInstance.determineWinners = function() {
      
      const winners = originalDetermineWinners.call(this);
      
      
      if (!this.simulation || !this.simulation.isRunning) {
        console.log("Simulation no longer running, skipping post-hand actions");
        return winners;
      }
      
      
      this.simulation.trackWinners(winners);
      
      
      this.simulation.trackChipCounts();
      
      
      this.simulation.currentHand++;
      this.simulation.metrics.handsPlayed++;
      
      
      if (this.simulation.onHandComplete) {
        this.simulation.onHandComplete(this.simulation.currentGame, this.simulation.currentHand, winners);
      }
      
      
      if (this.simulation.onProgress) {
        const progress = ((this.simulation.currentGame - 1) * this.simulation.handsPerGame + this.simulation.currentHand) / 
                          (this.simulation.numGames * this.simulation.handsPerGame);
        this.simulation.onProgress(progress);
      }
      
      
      if (this.simulation.currentHand >= this.simulation.handsPerGame) {
        
        this.simulation.metrics.gamesPlayed++;
        
        
        if (this.simulation.onGameComplete) {
          this.simulation.onGameComplete(this.simulation.currentGame);
        }
        
        
        this.simulation.startNextGame();
      } else {
        
        this.simulation.startNextHand();
      }
      
      return winners;
    };
    
    
    const originalStartNewHand = this.gameInstance.startNewHand;
    this.gameInstance.startNewHand = function() {
      
      const activePlayers = this.players.filter(p => p.chips > 0);
      
      
      if (activePlayers.length < 2) {
        console.log("Not enough players with chips to continue. Ending game.");
        
        
        if (this.simulation) {
          this.simulation.currentHand = this.simulation.handsPerGame;
          
          
          this.simulation.metrics.gamesPlayed++;
          
          
          if (this.simulation.onGameComplete) {
            this.simulation.onGameComplete(this.simulation.currentGame);
          }
          
          
          this.simulation.startNextGame();
        }
        return;
      }
      
      
      originalStartNewHand.call(this);
    };
    
    
    this.gameInstance.simulation = this;
  }
  
  
  startNextHand() {
    if (!this.isRunning || this.isPaused) return;
    
    
    if (!this.gameInstance) {
      console.warn("Cannot start next hand - game instance is null");
      return;
    }
    
    
    this.gameInstance.startNewHand();
  }
  
  
  processNextStep() {
    if (!this.isRunning || this.isPaused) return;
    
    
    if (this.gameInstance) {
      this.startNextHand();
    } else {
      
      this.startNextGame();
    }
  }
  
  
  trackDecisionMetrics(strategy, decision, decisionTime) {
    
    const metrics = this.metrics.strategyMetrics[strategy];
    if (!metrics) return;
    
    
    if (decision.action === 'fold') {
      metrics.decisions.fold++;
    } else if (decision.action === 'call') {
      metrics.decisions.call++;
    } else if (decision.action === 'raise') {
      metrics.decisions.raise++;
    }
    
    metrics.decisions.total++;
    
    
    
    const MAX_REASONABLE_DECISION_TIME = 30000; 
    
    
    if (decisionTime < MAX_REASONABLE_DECISION_TIME) {
      metrics.performanceMetrics.totalDecisionTime += decisionTime;
      metrics.performanceMetrics.decisionCount++;
      
      
      if (metrics.performanceMetrics.minDecisionTime === Infinity) {
        metrics.performanceMetrics.minDecisionTime = decisionTime;
      } else {
        metrics.performanceMetrics.minDecisionTime = Math.min(metrics.performanceMetrics.minDecisionTime, decisionTime);
      }
      
      metrics.performanceMetrics.maxDecisionTime = Math.max(metrics.performanceMetrics.maxDecisionTime, decisionTime);
      
      
      metrics.performanceMetrics.averageDecisionTime = 
        metrics.performanceMetrics.totalDecisionTime / metrics.performanceMetrics.decisionCount;
    } else {
      console.log(`Excluded outlier decision time of ${decisionTime.toFixed(2)}ms for ${strategy}`);
    }
  }
  
  
  trackWinners(winners) {
    if (!winners || !winners.length) return;
    
    
    this.gameInstance.players.forEach(player => {
      const strategy = player.strategy;
      
      
      const metrics = this.metrics.strategyMetrics[strategy];
      if (!metrics) return;
      
      
      metrics.handsPlayed++;
    });
    
    
    winners.forEach(winner => {
      const strategy = winner.player.strategy;
      
      
      const metrics = this.metrics.strategyMetrics[strategy];
      if (!metrics) return;
      
      
      metrics.handsWon++;
      
      
      metrics.winRate = metrics.handsWon / metrics.handsPlayed;
      
      
      metrics.totalChipsWon += winner.potAmount;
    });
  }
  
  
  trackChipCounts() {
    
    this.verifyChipBalance();
    
    
    this.gameInstance.players.forEach(player => {
      const strategy = player.strategy;
      
      
      const metrics = this.metrics.strategyMetrics[strategy];
      if (!metrics) return;
      
      
      metrics.currentChips = player.chips;
      metrics.chipDelta = player.chips - metrics.initialChips;
      
      
      metrics.chipHistory.push(player.chips);
    });
  }
  
  
  verifyChipBalance() {
    
    let totalChips = 0;
    let playerChips = [];
    
    
    this.gameInstance.players.forEach(player => {
      totalChips += player.chips;
      playerChips.push({
        player: player,
        chips: player.chips
      });
    });
    
    
    totalChips += this.gameInstance.pot;
    
    
    const expectedTotal = this.initialChips * this.selectedStrategies.length;
    
    
    if (totalChips !== expectedTotal) {
      const diff = expectedTotal - totalChips;
      this.log(`Chip balance error detected: total ${totalChips}, expected ${expectedTotal}, diff ${diff}`);
      
      
      if (diff !== 0 && playerChips.length > 0) {
        
        playerChips.sort((a, b) => b.chips - a.chips);
        
        
        
        let remainingDiff = diff;
        
        
        const richestPlayer = playerChips[0].player;
        richestPlayer.chips += remainingDiff;
        
        this.log(`Adjusted ${richestPlayer.name}'s chips by ${remainingDiff} to maintain balance`);
      }
    }
  }
  
  
  calculateFinalMetrics() {
    
    if (this.gameInstance) {
      this.verifyChipBalance();
    }
    
    
    const activeStrategies = this.selectedStrategies.filter(strategy => 
      this.metrics.strategyMetrics[strategy].handsPlayed > 0
    );
    
    
    activeStrategies.forEach(strategy => {
      const metrics = this.metrics.strategyMetrics[strategy];
      
      
      if (metrics.handsPlayed === 0) {
        metrics.winRate = 0;
      } else {
        
        metrics.winRate = metrics.handsWon / metrics.handsPlayed;
      }
      
      
      const totalDecisions = metrics.decisions.total;
      if (totalDecisions > 0) {
        metrics.decisions.foldRate = metrics.decisions.fold / totalDecisions;
        metrics.decisions.callRate = metrics.decisions.call / totalDecisions;
        metrics.decisions.raiseRate = metrics.decisions.raise / totalDecisions;
      }
      
      
      metrics.gamesPlayed = this.metrics.gamesPlayed;
      
      
      console.log(`Strategy ${strategy}: ${metrics.handsWon}/${metrics.handsPlayed} = ${metrics.winRate}, Final chips: ${metrics.currentChips}`);
    });
  }
  
  
  log(message) {
    console.log(`[AI Simulation] ${message}`);
    
    
    if (this.onLog) {
      this.onLog(message);
    }
  }
  
  
  getMetrics() {
    return this.metrics;
  }
  
  
  getStrategyMetrics(strategy) {
    return this.metrics.strategyMetrics[strategy] || null;
  }
  
  
  trackHandComplete(game) {
    
    game.players.forEach(player => {
      if (player.strategy) {
        
        const metrics = this.metrics.strategyMetrics[player.strategy];
        if (metrics) {
          metrics.handsPlayed++;
        }
      }
    });
    
    
    const winners = game.getWinners();
    this.log(`Hand complete with ${winners.length} winners`);
    
    winners.forEach(winner => {
      if (winner.player && winner.player.strategy) {
        const metrics = this.metrics.strategyMetrics[winner.player.strategy];
        if (metrics) {
          
          metrics.handsWon++;
          
          
          if (metrics.handsPlayed > 0) {
            metrics.winRate = metrics.handsWon / metrics.handsPlayed;
          }
          
          this.log(`Updated ${winner.player.strategy} win rate: ${metrics.handsWon}/${metrics.handsPlayed} = ${metrics.winRate.toFixed(2)}`);
          
          
          metrics.totalChipsWon += winner.potAmount;
        }
      }
    });
    
    
    game.players.forEach(player => {
      if (player.strategy) {
        const metrics = this.metrics.strategyMetrics[player.strategy];
        if (metrics) {
          
          metrics.currentChips = player.chips;
          metrics.chipDelta = player.chips - metrics.initialChips;
          
          this.log(`Updated ${player.strategy} chips: ${metrics.currentChips} (Δ${metrics.chipDelta})`);
        }
      }
    });
    
    
    this.log("Strategy metrics after hand complete:");
    Object.keys(this.metrics.strategyMetrics).forEach(strategy => {
      if (this.selectedStrategies.includes(strategy)) {
        const m = this.metrics.strategyMetrics[strategy];
        this.log(`${strategy}: ${m.handsWon}/${m.handsPlayed} wins (${(m.winRate * 100).toFixed(1)}%), chips: ${m.currentChips}`);
      }
    });
  }
}