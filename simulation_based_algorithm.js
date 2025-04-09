window.SimulationBasedAlgorithm = {
  makeSimulationBasedDecision(player, callAmount, communityCards, potSize, game) {
    try {
      player.logReasoningStep("Starting Simulation-based decision making");
      
      
      const handStrength = player.evaluateCompleteHand(player.cards, communityCards);
      player.logReasoningStep(`Current hand strength: ${handStrength.toFixed(4)}`);
      
      
      const gameStage = this.determineGameStage(communityCards);
      player.logReasoningStep(`Current game stage: ${gameStage}`);
      
      
      const simulations = 1000;
      player.decisionProcess.simulationsRun = simulations;
      
      
      let activePlayers = 4; 
      try {
        if (game && typeof game.getActivePlayers === 'function') {
          activePlayers = game.getActivePlayers().length;
        } else if (game && Array.isArray(game.players)) {
          activePlayers = game.players.filter(p => !p.folded).length;
        }
      } catch (err) {
        console.error("Error getting active player count in simulation:", err);
      }
      
      player.logReasoningStep(`Running ${simulations} simulations against ${activePlayers - 1} opponents`);
      
      
      const simulationDeck = this.createDeckWithoutKnownCards(player, player.cards, communityCards);
      
      
      const simulationResults = this.runWeightedSimulations(
        player, 
        player.cards, 
        communityCards, 
        simulationDeck, 
        activePlayers, 
        simulations,
        gameStage
      );
      
      player.logReasoningStep(`Win probability from simulations: ${simulationResults.winProbability.toFixed(4)} (${simulationResults.wins}/${simulations})`);
      player.logReasoningStep(`Average hand strength improvement: ${simulationResults.avgStrengthImprovement.toFixed(4)}`);
      
      
      const potOdds = callAmount / (potSize + callAmount);
      player.logReasoningStep(`Pot odds: ${potOdds.toFixed(4)}`);
      
      
      const adjustedWinProbability = this.calculateAdjustedWinProbability(
        simulationResults.winProbability,
        simulationResults.avgStrengthImprovement,
        gameStage
      );
      
      player.logReasoningStep(`Adjusted win probability: ${adjustedWinProbability.toFixed(4)}`);
      
      
      const callEV = player.calculateCallEV(adjustedWinProbability, potSize, callAmount);
      player.logReasoningStep(`Call EV: ${callEV.toFixed(2)}`);
      
      
      const raiseEvaluation = this.evaluatePotentialRaises(
        player,
        adjustedWinProbability,
        potSize,
        callAmount,
        game
      );
      
      
      return this.makeFinalDecision(
        player,
        callAmount,
        callEV,
        raiseEvaluation,
        gameStage,
        adjustedWinProbability
      );
    } catch (error) {
      console.error("Critical error in Simulation-based decision making:", error);
      
      player.logReasoningStep("Error in Simulation-based algorithm, defaulting to conservative decision");
      if (callAmount === 0) {
        return { action: "check", amount: 0 };
      } else if (callAmount <= 20) {
        return { action: "call", amount: callAmount };
      } else {
        return { action: "fold", amount: 0 };
      }
    }
  },
  
  determineGameStage(communityCards) {
    const count = communityCards.length;
    if (count === 0) return "preflop";
    if (count === 3) return "flop";
    if (count === 4) return "turn";
    if (count === 5) return "river";
    return "unknown";
  },
  
  createDeckWithoutKnownCards(player, myHand, communityCards) {
    
    const deck = [];
    const suits = ["h", "d", "c", "s"];
    const values = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
    
    for (const suit of suits) {
      for (const value of values) {
        deck.push({ value, suit });
      }
    }
    
    
    const knownCards = [...myHand, ...communityCards];
    
    return deck.filter(card => {
      return !knownCards.some(knownCard => 
        knownCard.value === card.value && knownCard.suit === card.suit
      );
    });
  },
  
  runWeightedSimulations(player, myHand, communityCards, deck, playerCount, simulations, gameStage) {
    let wins = 0;
    let totalStrengthImprovement = 0;
    
    
    const currentHandStrength = player.evaluateCompleteHand(myHand, communityCards);
    
    
    
    
    const handRangeWeights = this.getHandRangeWeightsByStage(gameStage);
    
    try {
      for (let i = 0; i < simulations; i++) {
        
        const deckCopy = [...deck];
        
        
        this.shuffleDeck(deckCopy);
        
        
        const fullCommunityCards = [...communityCards];
        const cardsNeeded = 5 - communityCards.length;
        
        for (let j = 0; j < cardsNeeded; j++) {
          fullCommunityCards.push(deckCopy.pop());
        }
        
        
        const finalHandStrength = player.evaluateCompleteHand(myHand, fullCommunityCards);
        
        
        const strengthImprovement = finalHandStrength - currentHandStrength;
        totalStrengthImprovement += strengthImprovement;
        
        
        let simulationWon = true;
        
        for (let k = 0; k < playerCount - 1; k++) {
          
          const opponentHand = this.generateWeightedOpponentHand(
            deckCopy, 
            handRangeWeights,
            gameStage
          );
          
          
          if (!opponentHand || !Array.isArray(opponentHand) || opponentHand.length < 2) {
            
            continue;
          }
          
          const opponentHandValue = player.evaluateCompleteHand(opponentHand, fullCommunityCards);
          
          if (opponentHandValue > finalHandStrength) {
            simulationWon = false;
            break;
          }
        }
        
        if (simulationWon) {
          wins++;
        }
      }
    } catch (error) {
      console.error("Error during simulation:", error);
      if (wins === 0 && simulations > 0) {
        wins = Math.floor(simulations * 0.2); 
      }
    }
    
    return {
      wins: wins,
      winProbability: wins / simulations,
      avgStrengthImprovement: totalStrengthImprovement / simulations
    };
  },
  
  getHandRangeWeightsByStage(gameStage) {
    
    
    switch (gameStage) {
      case "preflop":
        return 0.8; 
      case "flop":
        return 0.6; 
      case "turn":
        return 0.4; 
      case "river":
        return 0.2; 
      default:
        return 0.5;
    }
  },
  
  shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  },
  
  generateWeightedOpponentHand(deck, handRangeWeight, gameStage) {
    try {
      
      if (gameStage === "preflop" && Math.random() < handRangeWeight) {
        
        const premiumHandTypes = ['AA', 'KK', 'QQ', 'JJ', 'AK', 'AQ', 'AJ', 'KQ'];
        const handType = premiumHandTypes[Math.floor(Math.random() * premiumHandTypes.length)];
        
        
        const hand = this.findMatchingHandInDeck(deck, handType);
        
        
        if (hand && Array.isArray(hand) && hand.length === 2) {
          return hand;
        }
      }
      
      
      if (deck.length >= 2) {
        return [deck.pop(), deck.pop()];
      }
      
      
      console.warn("Not enough cards in deck for opponent hand");
      return [
        { value: "2", suit: "d" },
        { value: "3", suit: "d" }
      ];
    } catch (error) {
      console.error("Error generating opponent hand:", error);
      
      return [
        { value: "2", suit: "h" },
        { value: "3", suit: "h" }
      ];
    }
  },
  
  findMatchingHandInDeck(deck, handType) {
    
    
    if (handType.length === 2) {
      
      const value = handType[0];
      
      const matchingCards = deck.filter(card => card.value === value);
      if (matchingCards.length >= 2) {
        
        deck.splice(deck.indexOf(matchingCards[0]), 1);
        deck.splice(deck.indexOf(matchingCards[1]), 1);
        return [matchingCards[0], matchingCards[1]];
      }
    } else {
      
      const value1 = handType[0];
      const value2 = handType[1];
      const matchingCard1 = deck.find(card => card.value === value1);
      const matchingCard2 = deck.find(card => card.value === value2);
      
      if (matchingCard1 && matchingCard2) {
        deck.splice(deck.indexOf(matchingCard1), 1);
        deck.splice(deck.indexOf(matchingCard2), 1);
        return [matchingCard1, matchingCard2];
      }
    }
    
    
    if (deck.length >= 2) {
      return [deck.pop(), deck.pop()];
    }
    
    
    
    console.warn("Not enough cards in deck to create opponent hand");
    return [
      { value: "2", suit: "c" },
      { value: "3", suit: "c" }
    ];
  },
  
  calculateAdjustedWinProbability(winProbability, avgStrengthImprovement, gameStage) {
    
    
    
    
    let stageMultiplier;
    switch (gameStage) {
      case "preflop":
        stageMultiplier = 0.8; 
        break;
      case "flop":
        stageMultiplier = 1.0; 
        break;
      case "turn":
        stageMultiplier = 1.1; 
        break;
      case "river":
        stageMultiplier = 1.2; 
        break;
      default:
        stageMultiplier = 1.0;
    }
    
    
    
    const improvementAdjustment = avgStrengthImprovement > 0 
      ? Math.min(avgStrengthImprovement * 0.5, 0.2) 
      : Math.max(avgStrengthImprovement * 0.5, -0.2); 
    
    
    let adjustedProbability = winProbability * stageMultiplier + improvementAdjustment;
    
    
    return Math.max(0, Math.min(1, adjustedProbability));
  },
  
  evaluatePotentialRaises(player, winProbability, potSize, callAmount, game) {
    let bestRaiseEV = -Infinity;
    let bestRaiseAmount = 0;
    
    
    const minRaiseAmount = game && game.minRaise ? game.minRaise : Math.max(20, callAmount * 2);
    const possibleRaises = [
      minRaiseAmount,
      Math.floor(potSize * 0.5),
      Math.floor(potSize * 0.75),
      potSize,
      Math.floor(potSize * 1.5),
      Math.floor(potSize * 2)
    ].filter(amount => amount > callAmount && amount <= player.chips);
    
    for (const raiseAmount of possibleRaises) {
      
      
      let raiseWinProbModifier;
      
      if (raiseAmount <= potSize * 0.5) {
        
        raiseWinProbModifier = 1.05;
      } else if (raiseAmount <= potSize) {
        
        raiseWinProbModifier = 1.1;
      } else {
        
        
        raiseWinProbModifier = 0.95;
      }
      
      const raiseWinProbability = Math.min(1, winProbability * raiseWinProbModifier);
      
      
      const raiseEV = player.calculateRaiseEV(raiseWinProbability, potSize, raiseAmount);
      player.logReasoningStep(`Raise ${raiseAmount} EV: ${raiseEV.toFixed(2)}`);
      
      if (raiseEV > bestRaiseEV) {
        bestRaiseEV = raiseEV;
        bestRaiseAmount = raiseAmount;
      }
    }
    
    return { bestRaiseEV, bestRaiseAmount };
  },
  
  makeFinalDecision(player, callAmount, callEV, raiseEvaluation, gameStage, winProbability) {
    const { bestRaiseEV, bestRaiseAmount } = raiseEvaluation;
    
    
    if (gameStage === "preflop" && winProbability > 0.7) {
      
      if (bestRaiseAmount > 0) {
        player.logReasoningStep(`Decided to raise ${bestRaiseAmount} with strong preflop hand`);
        return { action: "raise", amount: bestRaiseAmount };
      }
    }
    
    
    if (callAmount === 0) {
      
      if (bestRaiseEV > 5) { 
        player.logReasoningStep(`Decided to raise ${bestRaiseAmount} (EV: ${bestRaiseEV.toFixed(2)})`);
        return { action: "raise", amount: bestRaiseAmount };
      } else {
        player.logReasoningStep("Decided to check");
        return { action: "check", amount: 0 };
      }
    } else {
      
      if (callEV <= -15) {
        player.logReasoningStep(`Decided to fold, negative call EV: ${callEV.toFixed(2)}`);
        return { action: "fold", amount: 0 };
      } else if (bestRaiseEV > callEV && bestRaiseEV > 0) {
        player.logReasoningStep(`Decided to raise ${bestRaiseAmount} (EV: ${bestRaiseEV.toFixed(2)})`);
        return { action: "raise", amount: bestRaiseAmount };
      } else if (callEV > -15) {
        player.logReasoningStep(`Decided to call (EV: ${callEV.toFixed(2)})`);
        return { action: "call", amount: callAmount };
      } else {
        player.logReasoningStep("Decided to fold (marginal case)");
        return { action: "fold", amount: 0 };
      }
    }
  }
}; 