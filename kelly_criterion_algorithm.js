const KellyCriterionAlgorithm = {
  makeKellyCriterionDecision(player, callAmount, communityCards, potSize, game) {
    try {
      player.logReasoningStep("Starting Kelly Criterion decision process");
      
      
      const handStrength = player.evaluateCompleteHand(player.cards, communityCards);
      player.logReasoningStep(`Current hand strength: ${handStrength.toFixed(4)}`);
      
      
      const gameStage = this.determineGameStage(communityCards);
      player.logReasoningStep(`Current game stage: ${gameStage}`);
      
      
      const winProbability = this.calculateWinProbability(player, handStrength, gameStage, game);
      player.logReasoningStep(`Estimated win probability: ${winProbability.toFixed(4)}`);
      
      
      const potOdds = callAmount > 0 ? callAmount / (potSize + callAmount) : 0;
      player.logReasoningStep(`Pot odds: ${potOdds.toFixed(4)}`);
      
      
      const callEV = this.calculateCallEV(winProbability, potSize, callAmount);
      player.logReasoningStep(`Call EV: ${callEV.toFixed(2)}`);
      
      
      const kellyFraction = this.calculateKellyFraction(winProbability, potOdds);
      player.logReasoningStep(`Kelly fraction: ${kellyFraction.toFixed(4)}`);
      
      
      return this.makeDecisionBasedOnKelly(
        player,
        callAmount,
        potSize,
        kellyFraction,
        winProbability,
        callEV,
        gameStage
      );
    } catch (error) {
      console.error("Error in Kelly Criterion decision making:", error);
      
      player.logReasoningStep("Error in algorithm, defaulting to conservative decision");
      if (callAmount === 0) {
        return { action: "check", amount: 0 };
      } else if (callAmount <= 20) {
        return { action: "call", amount: callAmount };
      } else {
        return { action: "fold", amount: 0 };
      }
    }
  },
  
  
  calculateCallEV(winProbability, potSize, callAmount) {
    return (winProbability * potSize) - ((1 - winProbability) * callAmount);
  },
  
  
  calculateRaiseEV(winProbability, potSize, raiseAmount) {
    const newPot = potSize + raiseAmount;
    return (winProbability * newPot) - ((1 - winProbability) * raiseAmount);
  },
  
  determineGameStage(communityCards) {
    const count = communityCards.length;
    if (count === 0) return "preflop";
    if (count === 3) return "flop";
    if (count === 4) return "turn";
    if (count === 5) return "river";
    return "unknown";
  },
  
  calculateWinProbability(player, rawHandStrength, gameStage, game) {
    
    let adjustedProbability = rawHandStrength;
    
    
    let activePlayers = 1; 
    try {
      if (game && typeof game.getActivePlayers === 'function') {
        activePlayers = game.getActivePlayers().length - 1; 
      } else if (game && Array.isArray(game.players)) {
        activePlayers = game.players.filter(p => !p.folded).length - 1;
      }
    } catch (err) {
      console.error("Error getting active player count:", err);
    }
    
    player.logReasoningStep(`Active opponents: ${activePlayers}`);
    
    
    
    const multiPlayerAdjustment = Math.pow(0.9, activePlayers - 1);
    adjustedProbability *= multiPlayerAdjustment;
    
    
    
    if (gameStage === "preflop") {
      
      if (adjustedProbability > 0.8) {
        
        adjustedProbability = Math.min(0.9, adjustedProbability * 0.95);
      } else if (adjustedProbability > 0.6) {
        
        adjustedProbability = adjustedProbability * 0.85;
      } else {
        
        adjustedProbability = adjustedProbability * 0.7;
      }
    } else if (gameStage === "flop") {
      
      adjustedProbability = adjustedProbability * 0.9;
    } else if (gameStage === "turn") {
      
      adjustedProbability = adjustedProbability * 0.95;
    }
    
    
    
    return Math.max(0.05, Math.min(0.95, adjustedProbability));
  },
  
  calculateKellyFraction(winProbability, potOdds) {
    
    
    
    
    
    
    
    const effectiveOdds = potOdds > 0 ? 1 / potOdds : 0;
    
    
    const kellyFraction = (winProbability * effectiveOdds - (1 - winProbability)) / effectiveOdds;
    
    
    
    
    const fractionalKelly = kellyFraction / 2; 
    
    return Math.max(0, fractionalKelly);
  },
  
  makeDecisionBasedOnKelly(player, callAmount, potSize, kellyFraction, winProbability, callEV, gameStage) {
    
    if (callAmount === 0) {
      
      if (kellyFraction <= 0.05) {
        
        player.logReasoningStep("Kelly fraction suggests checking (weak hand)");
        return { action: "check", amount: 0 };
      } else {
        
        const kellyBetAmount = Math.floor(player.chips * kellyFraction);
        
        const maxBetAmount = Math.max(20, Math.floor(potSize * 0.75));
        const betAmount = Math.min(kellyBetAmount, maxBetAmount);
        
        player.logReasoningStep(`Kelly suggests betting ${betAmount} (${(kellyFraction * 100).toFixed(1)}% of stack)`);
        return { action: "raise", amount: betAmount };
      }
    }
    
    
    if (kellyFraction <= 0) {
      
      player.logReasoningStep("Negative Kelly fraction suggests folding");
      return { action: "fold", amount: 0 };
    }
    
    
    const kellyCallAmount = Math.floor(player.chips * kellyFraction);
    
    if (kellyCallAmount < callAmount) {
      
      player.logReasoningStep(`Kelly optimal amount (${kellyCallAmount}) less than call amount (${callAmount})`);
      
      
      if (kellyCallAmount >= callAmount * 0.7 && callEV > 0) {
        player.logReasoningStep("Close enough to optimal Kelly and positive EV, calling");
        return { action: "call", amount: callAmount };
      }
      
      player.logReasoningStep("Kelly suggests folding");
      return { action: "fold", amount: 0 };
    }
    
    
    
    if (kellyCallAmount > callAmount * 2) {
      
      const raiseMultiplier = this.determineRaiseMultiplier(kellyFraction, gameStage, winProbability);
      const raiseAmount = Math.min(
        player.chips,
        Math.max(callAmount * 2, Math.floor(callAmount * raiseMultiplier))
      );
      
      player.logReasoningStep(`Kelly suggests raising to ${raiseAmount} (${raiseMultiplier.toFixed(1)}x call amount)`);
      return { action: "raise", amount: raiseAmount };
    }
    
    
    player.logReasoningStep("Kelly suggests calling is optimal");
    return { action: "call", amount: callAmount };
  },
  
  determineRaiseMultiplier(kellyFraction, gameStage, winProbability) {
    
    let multiplier = 2 + (kellyFraction * 5); 
    
    
    if (gameStage === "preflop") {
      multiplier *= 0.8; 
    } else if (gameStage === "river") {
      multiplier *= 1.2; 
    }
    
    
    if (winProbability > 0.8) {
      multiplier *= 1.3; 
    } else if (winProbability < 0.6) {
      multiplier *= 0.8; 
    }
    
    
    return Math.max(2, Math.min(5, multiplier));
  },
  
  
  calculateBankrollRisk(player, gameStage) {
    
    
    
    
    let riskPercentage = 0.05; 
    
    
    if (gameStage === "turn") {
      riskPercentage *= 1.2;
    } else if (gameStage === "river") {
      riskPercentage *= 1.5;
    }
    
    
    
    const bigStackThreshold = 1500;
    if (player.chips > bigStackThreshold) {
      riskPercentage *= 1.2;
    }
    
    
    const shortStackThreshold = 500;
    if (player.chips < shortStackThreshold) {
      riskPercentage *= 1.5;
    }
    
    
    return Math.max(0.02, Math.min(0.2, riskPercentage));
  },
  
  calculateKellyForDraws(player, drawType, potSize, callAmount) {
    
    let drawOdds = 0;
    
    
    if (drawType === "flush") {
      
      drawOdds = 0.19;
    } else if (drawType === "openEndedStraight") {
      
      drawOdds = 0.17;
    } else if (drawType === "gutshot") {
      
      drawOdds = 0.085;
    }
    
    
    const impliedOdds = (potSize + callAmount * 2) / callAmount;
    
    
    const kellyFraction = (drawOdds * impliedOdds - (1 - drawOdds)) / impliedOdds;
    
    
    return Math.max(0, kellyFraction / 3); 
  }
}; 