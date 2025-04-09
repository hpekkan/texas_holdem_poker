class AIPlayer extends Player {
  constructor(name, position, initialChips = 1000, strategy = "basic") {
    super(name, position, initialChips);
    this.strategy = strategy; 
    this.decisionDelay = 1000; 

    
    this.decisionHistory = [];

    
    this.gameState = {
      handCount: 0,
      opponentModels: {},
      bettingPatterns: {},
      lastHandResult: null,
    };

    
    this.decisionProcess = null;
  }

  
  
  get cards() {
    return this.hand;
  }

  
  makeDecision(game) {
    return new Promise((resolve) => {
      setTimeout(() => {
        
        const decisionStartTime = performance.now();

        
        this.decisionProcess = {
          strategy: this.strategy,
          startTime: new Date().toISOString(), 
          decisionStartTimestamp: decisionStartTime, 
          nodesExplored: 0,
          maxDepth: 0,
          simulationsRun: 0,
          bestPath: [],
          evaluation: {},
          reasoningSteps: [],
        };

        
        const currentBet = game.currentBet;
        const callAmount = currentBet - this.currentBet;
        const communityCards = game.communityCards;
        const potSize = game.pot;

        
        this.updateGameState(game);

        
        let decision;
        switch (this.strategy) {
          
          case "minimax":
            decision = MinimaxAlgorithm.makeMinimaxDecision(
              this,
              callAmount,
              communityCards,
              potSize,
              game
            );
            break;
          case "alphaBeta":
            decision = this.makeAlphaBetaDecision(
              callAmount,
              communityCards,
              potSize,
              game
            );
            break;
          case "expectimax":
            decision = this.makeExpectimaxDecision(
              callAmount,
              communityCards,
              potSize,
              game
            );
            break;

          
          case "monteCarlo":
            decision = MonteCarloAlgorithm.makeMonteCarloDecision(
              this,
              callAmount,
              communityCards,
              potSize,
              game
            );
            break;
          case "simulation":
            decision = this.makeSimulationBasedDecision(
              callAmount,
              communityCards,
              potSize,
              game
            );
            break;

          
          case "bayesian":
            decision = BayesianAlgorithm.makeBayesianDecision(
              this,
              callAmount,
              communityCards,
              potSize,
              game
            );
            break;
          case "heuristic":
            decision = this.makeHeuristicDecision(
              callAmount,
              communityCards,
              potSize,
              game
            );
            break;
          case "pattern":
            decision = this.makePatternBasedDecision(
              callAmount,
              communityCards,
              potSize,
              game
            );
            break;
          case "positionBased":
            decision = this.makePositionBasedDecision(
              callAmount,
              communityCards,
              potSize,
              game
            );
            break;
          case "kelly":
            decision = this.makeKellyCriterionDecision(
              callAmount,
              communityCards,
              potSize,
              game
            );
            break;
          case "adaptiveState":
            decision = this.makeAdaptiveStateDecision(
              callAmount,
              communityCards,
              potSize,
              game
            );
            break;
          case "gamephase":
            decision = GamePhaseStrategy.makeGamePhaseDecision(
              this,
              callAmount,
              communityCards,
              potSize,
              game
            );
            break;
          case "random":
            decision = BasicStrategies.makeRandomDecision(
              this,
              callAmount
            );
            break;
          case "conservative":
            decision = BasicStrategies.makeConservativeDecision(
              this,
              callAmount,
              communityCards
            );
            break;
          case "aggressive":
            decision = BasicStrategies.makeAggressiveDecision(
              this,
              callAmount,
              communityCards,
              potSize
            );
            break;
          case "advanced":
            decision = BasicStrategies.makeAdvancedDecision(
              this,
              callAmount,
              communityCards,
              potSize
            );
            break;
          case "intermediate":
            decision = BasicStrategies.makeIntermediateDecision(
              this,
              callAmount,
              communityCards,
              potSize
            );
            break;
          case "basic":
          default:
            decision = BasicStrategies.makeBasicDecision(
              this,
              callAmount,
              communityCards
            );
            break;
        }

        
        const decisionEndTime = performance.now();
        
        const decisionTimeElapsed = decisionEndTime - decisionStartTime;

        
        this.decisionProcess.endTime = new Date().toISOString(); 
        this.decisionProcess.decisionTimeMs = decisionTimeElapsed; 
        this.decisionProcess.decision = decision;

        
          try {
          this.recordDecision(decision, game);
          } catch (error) {
          console.error("Error recording decision:", error);
          
        }

        
        resolve(decision);
      }, this.decisionDelay);
    });
  }

  
  recordDecision(decision, game) {
    
    try {
      
      let activePlayerCount = 0;
      try {
        
        if (game && typeof game.getActivePlayers === 'function') {
          activePlayerCount = game.getActivePlayers().length;
        } else {
          
          activePlayerCount = game && Array.isArray(game.players) 
            ? game.players.filter(p => !p.folded).length 
            : 1;
        }
      } catch (err) {
        console.error("Error getting active players:", err);
        activePlayerCount = 1; 
      }
      
      const decisionRecord = {
        gameState: {
          communityCards: game && Array.isArray(game.communityCards) ? [...game.communityCards] : [],
          pot: game ? game.pot : 0,
          currentBet: game ? game.currentBet : 0,
          phase: !game || !Array.isArray(game.communityCards) ? 'unknown' :
                game.communityCards.length === 0 ? 'preflop' :
                game.communityCards.length === 3 ? 'flop' :
                game.communityCards.length === 4 ? 'turn' : 'river',
          position: this.position,
          activePlayers: activePlayerCount
        },
        decision: { ...decision },
        handStrength: this.evaluateCompleteHand(
          this.cards, 
          game && Array.isArray(game.communityCards) ? game.communityCards : []
        ),
        timestamp: new Date().toISOString()
      };

      
      this.decisionHistory.push(decisionRecord);

      
      if (this.decisionHistory.length > 100) {
        this.decisionHistory.shift();
      }
    } catch (error) {
      console.error("Error in recordDecision:", error);
      
    }
  }

  
  updateGameState(game) {
    try {
      
      if (!game) {
        console.warn("updateGameState called with undefined game");
        return;
      }
      
      
      if (game.handNumber > this.gameState.handCount) {
        this.gameState.handCount = game.handNumber;
      }

      
      
    } catch (error) {
      console.error("Error updating game state:", error);
    }
  }

  
  logReasoningStep(message) {
    if (this.decisionProcess) {
      this.decisionProcess.reasoningSteps.push(message);
    }
  }

  
  calculateCallEV(winProbability, potSize, callAmount) {
    return AIUtils.calculateCallEV(winProbability, potSize, callAmount);
  }

  calculateRaiseEV(winProbability, potSize, raiseAmount) {
    return AIUtils.calculateRaiseEV(winProbability, potSize, raiseAmount);
  }

  
  evaluateCompleteHand(holeCards, communityCards) {
    try {
      
      const verboseLogging = false; 

      
      if (!holeCards || !Array.isArray(holeCards) || holeCards.length === 0) {
        if (verboseLogging) {
          console.error("Invalid holeCards provided to evaluateCompleteHand:", holeCards);
        }
        return 0; 
      }

      
      if (!communityCards || !Array.isArray(communityCards)) {
        if (verboseLogging) {
          console.error("Invalid communityCards provided to evaluateCompleteHand:", communityCards);
        }
        communityCards = []; 
      }
      
      
      for (const card of holeCards) {
        if (!card || typeof card !== 'object' || !card.value || !card.suit) {
          if (verboseLogging) {
            console.error("Invalid card object in holeCards:", card);
          }
          return 0;
        }
      }
      
      for (const card of communityCards) {
        if (!card || typeof card !== 'object' || !card.value || !card.suit) {
          if (verboseLogging) {
            console.error("Invalid card object in communityCards:", card);
          }
          
          return 0;
        }
      }
      
      
      const myCards = [...holeCards];
      const boardCards = [...communityCards];
      
      
      if (communityCards.length < 5) {
        return this.evaluateIncompleteHand(myCards, boardCards);
      }
      
      
      const allCards = [...myCards, ...boardCards];
      
      
      if (this.checkStraightFlush(allCards)) {
        return 0.9 + Math.random() * 0.1; 
      }
      
      if (this.checkFourOfAKind(allCards)) {
        return 0.8 + Math.random() * 0.1; 
      }
      
      if (this.checkFullHouse(allCards)) {
        return 0.7 + Math.random() * 0.1; 
      }
      
      if (this.checkFlush(allCards)) {
        return 0.6 + Math.random() * 0.1; 
      }
      
      if (this.checkStraight(allCards)) {
        return 0.5 + Math.random() * 0.1; 
      }
      
      if (this.checkThreeOfAKind(allCards)) {
        return 0.4 + Math.random() * 0.1; 
      }
      
      if (this.checkTwoPair(allCards)) {
        return 0.3 + Math.random() * 0.1; 
      }
      
      if (this.checkPair(allCards)) {
        return 0.2 + Math.random() * 0.1; 
      }

      
      return Math.random() * 0.2;
    } catch (error) {
      if (verboseLogging) {
        console.error("Error in evaluateCompleteHand:", error);
      }
      return 0; 
    }
  }
  
  evaluateIncompleteHand(holeCards, communityCards) {
    try {
      
      
      
      if (!holeCards || !Array.isArray(holeCards) || holeCards.length < 2 || 
          !communityCards || !Array.isArray(communityCards)) {
    return 0;
  }

      
      const currentCards = [...holeCards, ...communityCards];
      let madeHandStrength = 0;
      
      
      const hasHolePair = holeCards[0].value === holeCards[1].value;
      
      if (hasHolePair) {
        const pairValue = this.getCardNumericValue(holeCards[0].value);
        
        madeHandStrength = 0.3 + (pairValue / 14) * 0.2;
      }
      
      
      const highCard1 = this.getCardNumericValue(holeCards[0].value);
      const highCard2 = this.getCardNumericValue(holeCards[1].value);
      const hasHighCards = highCard1 >= 10 || highCard2 >= 10;
      
      if (hasHighCards && !hasHolePair) {
        madeHandStrength = Math.max(madeHandStrength, 0.1 + (Math.max(highCard1, highCard2) / 14) * 0.2);
      }
      
      
      if (communityCards.length > 0) {
        if (this.checkPair(currentCards)) {
          madeHandStrength = Math.max(madeHandStrength, 0.2 + Math.random() * 0.1);
        }
        
        if (this.checkTwoPair(currentCards)) {
          madeHandStrength = Math.max(madeHandStrength, 0.3 + Math.random() * 0.1);
        }
        
        if (this.checkThreeOfAKind(currentCards)) {
          madeHandStrength = Math.max(madeHandStrength, 0.4 + Math.random() * 0.1);
        }
        
        if (communityCards.length >= 3) {
          if (this.checkStraight(currentCards)) {
            madeHandStrength = Math.max(madeHandStrength, 0.5 + Math.random() * 0.1);
          }
          
          if (this.checkFlush(currentCards)) {
            madeHandStrength = Math.max(madeHandStrength, 0.6 + Math.random() * 0.1);
          }
          
          if (this.checkFullHouse(currentCards)) {
            madeHandStrength = Math.max(madeHandStrength, 0.7 + Math.random() * 0.1);
          }
          
          if (this.checkFourOfAKind(currentCards)) {
            madeHandStrength = Math.max(madeHandStrength, 0.8 + Math.random() * 0.1);
          }
          
          if (this.checkStraightFlush(currentCards)) {
            madeHandStrength = Math.max(madeHandStrength, 0.9 + Math.random() * 0.1);
          }
        }
      }
      
      
      let drawPotential = 0;
      
      if (communityCards.length >= 3 && communityCards.length < 5) {
    
        const suits = {};
        for (const card of currentCards) {
          suits[card.suit] = (suits[card.suit] || 0) + 1;
        }
        
        for (const suit in suits) {
          if (suits[suit] === 4) {
            
            drawPotential = Math.max(drawPotential, 0.2);
          }
        }
        
        
        const values = currentCards.map(card => this.getCardNumericValue(card.value))
      .sort((a, b) => a - b);
        
    const uniqueValues = [...new Set(values)];

        
        for (let i = 0; i <= uniqueValues.length - 4; i++) {
          if (uniqueValues[i] + 3 === uniqueValues[i + 3]) {
            
            drawPotential = Math.max(drawPotential, 0.15);
          }
        }
      }
      
      
      
      const drawWeight = 5 - communityCards.length;
      return madeHandStrength * 0.7 + drawPotential * 0.3 * (drawWeight / 5);
    } catch (error) {
      
      return 0;
    }
  }
  
  getCardNumericValue(value) {
    if (value === "A") return 14;
    if (value === "K") return 13;
    if (value === "Q") return 12;
    if (value === "J") return 11;
    if (value === "T") return 10;
    return parseInt(value);
  }
  
  checkStraightFlush(cards) {
    
    const suits = ["h", "d", "c", "s"];
    
    for (const suit of suits) {
      const suitedCards = cards.filter(card => card.suit === suit);
      
      if (suitedCards.length >= 5) {
        const values = suitedCards.map(card => this.getCardNumericValue(card.value))
      .sort((a, b) => a - b);
        
    const uniqueValues = [...new Set(values)];

        
        for (let i = 0; i <= uniqueValues.length - 5; i++) {
          if (uniqueValues[i] + 4 === uniqueValues[i + 4]) {
            return true;
          }
        }
        
        
        if (uniqueValues.includes(14) && 
            uniqueValues.includes(2) && 
            uniqueValues.includes(3) && 
            uniqueValues.includes(4) && 
            uniqueValues.includes(5)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  checkFourOfAKind(cards) {
    
    const valueCounts = {};
    
    for (const card of cards) {
      valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
    }
    
    
    for (const value in valueCounts) {
      if (valueCounts[value] === 4) {
        return true;
      }
    }
    
    return false;
  }
  
  checkFullHouse(cards) {
    
    const valueCounts = {};
    
    for (const card of cards) {
      valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
    }
    
    let hasThree = false;
    let hasPair = false;
    
    for (const value in valueCounts) {
      if (valueCounts[value] >= 3) {
        hasThree = true;
      } else if (valueCounts[value] >= 2) {
        hasPair = true;
      }
    }
    
    
    let tripCount = 0;
    for (const value in valueCounts) {
      if (valueCounts[value] >= 3) {
        tripCount++;
      }
    }
    
    if (tripCount >= 2) {
      return true;
    }
    
    return hasThree && hasPair;
  }
  
  checkFlush(cards) {
    
    const suitCounts = {};
    
    for (const card of cards) {
      suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    }
    
    
    for (const suit in suitCounts) {
      if (suitCounts[suit] >= 5) {
        return true;
      }
    }
    
    return false;
  }
  
  checkStraight(cards) {
    
    const values = cards.map(card => this.getCardNumericValue(card.value))
      .sort((a, b) => a - b);
    
    
    const uniqueValues = [...new Set(values)];
    
    
    for (let i = 0; i <= uniqueValues.length - 5; i++) {
      if (uniqueValues[i] + 4 === uniqueValues[i + 4]) {
        return true;
      }
    }
    
    
    if (uniqueValues.includes(14) && 
        uniqueValues.includes(2) && 
        uniqueValues.includes(3) && 
        uniqueValues.includes(4) && 
        uniqueValues.includes(5)) {
      return true;
    }
    
    return false;
  }
  
  checkThreeOfAKind(cards) {
    
    const valueCounts = {};
    
    for (const card of cards) {
      valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
    }
    
    
    for (const value in valueCounts) {
      if (valueCounts[value] === 3) {
        return true;
      }
    }
    
      return false;
    }

  checkTwoPair(cards) {
    
    const valueCounts = {};
    
    for (const card of cards) {
      valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
    }
    
    
    let pairCount = 0;
    for (const value in valueCounts) {
      if (valueCounts[value] >= 2) {
        pairCount++;
      }
    }
    
    return pairCount >= 2;
  }
  
  checkPair(cards) {
    
    const valueCounts = {};
    
    for (const card of cards) {
      valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
    }
    
    
    for (const value in valueCounts) {
      if (valueCounts[value] >= 2) {
        return true;
      }
    }

    return false;
  }

  getHighCards(cards, count) {
    
    const sortedCards = [...cards].sort((a, b) => 
      this.getCardNumericValue(b.value) - this.getCardNumericValue(a.value)
    );
    
    return sortedCards.slice(0, count);
  }
  
  compareKickers(kickers1, kickers2) {
    
    for (let i = 0; i < kickers1.length && i < kickers2.length; i++) {
      const val1 = this.getCardNumericValue(kickers1[i].value);
      const val2 = this.getCardNumericValue(kickers2[i].value);
      
      if (val1 !== val2) {
        return val1 - val2;
      }
    }
    
    return 0; 
  }

  
  makeAlphaBetaDecision(callAmount, communityCards, potSize, game) {
    
    return AlphaBetaAlgorithm.makeAlphaBetaDecision(
      this,
    callAmount,
    communityCards,
    potSize,
      game
    );
  }
  
  makeExpectimaxDecision(callAmount, communityCards, potSize, game) {
    
    return ExpectimaxAlgorithm.makeExpectimaxDecision(
      this,
        callAmount,
        communityCards,
        potSize,
      game
    );
  }
  
  makeSimulationBasedDecision(callAmount, communityCards, potSize, game) {
    // Check if SimulationBasedAlgorithm is defined, if not define it with basic functionality
    if (typeof SimulationBasedAlgorithm === 'undefined') {
      console.warn("SimulationBasedAlgorithm was not defined! Creating a fallback implementation.");
      window.SimulationBasedAlgorithm = {
        makeSimulationBasedDecision(player, callAmount, communityCards, potSize, game) {
          player.logReasoningStep("Using fallback SimulationBasedAlgorithm implementation");
          const handStrength = player.evaluateCompleteHand(player.cards, communityCards);
          
          // Basic simulation-based logic
          const winProbability = handStrength * 0.8; // Simple approximation
          player.logReasoningStep(`Estimated win probability: ${winProbability.toFixed(4)}`);
          
          const potOdds = callAmount / (potSize + callAmount);
          
          if (winProbability > 0.8) {
            // Strong hand - raise
            const raiseAmount = Math.min(player.chips, Math.max(callAmount * 3, potSize));
            return { action: "raise", amount: raiseAmount };
          } else if (winProbability > potOdds + 0.1) {
            // +EV call
            if (callAmount === 0) {
              return { action: "check", amount: 0 };
            }
            return { action: "call", amount: callAmount };
          } else if (callAmount === 0) {
            return { action: "check", amount: 0 };
          } else {
            return { action: "fold", amount: 0 };
          }
        }
      };
    }
    
    return SimulationBasedAlgorithm.makeSimulationBasedDecision(
      this,
      callAmount,
      communityCards,
      potSize,
      game
    );
  }
  
  makeHeuristicDecision(callAmount, communityCards, potSize, game) {
    
    return HeuristicAlgorithm.makeHeuristicDecision(
      this,
        callAmount,
        communityCards,
        potSize,
      game
    );
  }
  
  makePatternBasedDecision(callAmount, communityCards, potSize, game) {
    
    return PatternBasedAlgorithm.makePatternBasedDecision(
      this,
      callAmount,
      communityCards,
      potSize,
      game
    );
  }
  
  makePositionBasedDecision(callAmount, communityCards, potSize, game) {
    
    return PositionBasedAlgorithm.makePositionBasedDecision(
      this,
    callAmount,
    communityCards,
    potSize,
      game
    );
  }
  
  makeKellyCriterionDecision(callAmount, communityCards, potSize, game) {
    
    return KellyCriterionAlgorithm.makeKellyCriterionDecision(
      this,
        callAmount,
        communityCards,
        potSize,
        game
      );
    }

  makeAdaptiveStateDecision(callAmount, communityCards, potSize, game) {
    // Check if AdaptiveStateAlgorithm is defined, if not define it with basic functionality
    if (typeof AdaptiveStateAlgorithm === 'undefined') {
      console.warn("AdaptiveStateAlgorithm was not defined! Creating a fallback implementation.");
      window.AdaptiveStateAlgorithm = {
        makeAdaptiveStateDecision(player, callAmount, communityCards, potSize, game) {
          player.logReasoningStep("Using fallback AdaptiveStateAlgorithm implementation");
          const handStrength = player.evaluateCompleteHand(player.cards, communityCards);
          
          if (handStrength > 0.7) {
            return { action: "raise", amount: Math.min(player.chips, potSize) };
          } else if (handStrength > 0.5) {
            return { action: "call", amount: callAmount };
          } else if (callAmount === 0) {
            return { action: "check", amount: 0 };
          } else {
            return { action: "fold", amount: 0 };
          }
        }
      };
    }
    
    return AdaptiveStateAlgorithm.makeAdaptiveStateDecision(
      this,
      callAmount,
      communityCards,
      potSize,
      game
    );
  }
}
