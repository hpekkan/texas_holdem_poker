
const MinimaxAlgorithm = {
  makeMinimaxDecision(player, callAmount, communityCards, potSize, game) {
    const handStrength = player.evaluateCompleteHand(player.cards, communityCards);
    
    player.logReasoningStep(`Starting minimax decision process with hand strength: ${handStrength}`);
    player.decisionProcess.nodesExplored = 0;
    player.decisionProcess.maxDepth = 0;
    
    let bestAction = "fold";
    let bestValue = -Infinity;
    let bestAmount = 0;
    
    const canCheck = callAmount === 0;
    
    if (!canCheck) {
      const foldPenalty = Math.min(10, potSize * 0.2);
      const smallBetThreshold = game.bigBlindAmount * 2;
      const isSmallBet = callAmount <= smallBetThreshold;
      
      const adjustedFoldPenalty = isSmallBet ? foldPenalty * 2 : foldPenalty;
      
      const foldValue = this.minimaxEvaluate(player, "fold", 0, handStrength, callAmount, potSize, 0) - adjustedFoldPenalty;
      player.logReasoningStep(`Evaluated FOLD option: ${foldValue} (with fold penalty: ${adjustedFoldPenalty})`);
      
      if (foldValue > bestValue) {
        bestValue = foldValue;
        bestAction = "fold";
        bestAmount = 0;
      }
    }
    
    const callValue = this.minimaxEvaluate(player, canCheck ? "check" : "call", callAmount, handStrength, callAmount, potSize, 0);
    
    const smallBetCallBonus = callAmount <= (game.bigBlindAmount * 2) ? 5 : 0;
    const adjustedCallValue = callValue + smallBetCallBonus;
    
    player.logReasoningStep(`Evaluated ${canCheck ? "CHECK" : "CALL"} option: ${adjustedCallValue}${smallBetCallBonus > 0 ? ` (with small bet bonus: ${smallBetCallBonus})` : ''}`);
    
    if (adjustedCallValue > bestValue) {
      bestValue = adjustedCallValue;
      bestAction = canCheck ? "check" : "call";
      bestAmount = callAmount;
    }
    
    const minRaiseAmount = game.minRaise;
    const possibleRaises = [
      minRaiseAmount,
      Math.floor(potSize * 0.5),
      Math.floor(potSize * 0.75),
      potSize,
      Math.floor(potSize * 1.5),
      Math.floor(potSize * 2)
    ];
    
    for (const raiseAmount of possibleRaises) {
      if (raiseAmount <= player.chips && raiseAmount > callAmount) {
        const raiseValue = this.minimaxEvaluate(player, "raise", raiseAmount, handStrength, callAmount, potSize, 0);
        player.logReasoningStep(`Evaluated RAISE ${raiseAmount} option: ${raiseValue}`);
        
        if (raiseValue > bestValue) {
          bestValue = raiseValue;
          bestAction = "raise";
          bestAmount = raiseAmount;
        }
      }
    }
    
    player.decisionProcess.evaluation = { bestAction, bestValue, bestAmount };
    player.logReasoningStep(`Final decision: ${bestAction} ${bestAmount > 0 ? bestAmount : ""}`);
    
    return {
      action: bestAction,
      amount: bestAmount
    };
  },
  
  minimaxEvaluate(player, action, actionAmount, handStrength, callAmount, potSize, depth) {
    player.decisionProcess.nodesExplored++;
    player.decisionProcess.maxDepth = Math.max(player.decisionProcess.maxDepth, depth);
    
    const MAX_DEPTH = 1000;
    if (depth >= MAX_DEPTH) {
      return this.calculateLeafValue(player, action, actionAmount, handStrength, callAmount, potSize);
    }
    
    if (action === "fold") {
      return -callAmount;
    }
    
    if (action === "call" || action === "check") {
      return this.minimaxEvaluateOpponent(player, action, actionAmount, handStrength, callAmount, potSize, depth + 1);
    }
    
    if (action === "raise") {
      return this.minimaxEvaluateOpponent(player, action, actionAmount, handStrength, actionAmount, potSize + actionAmount, depth + 1);
    }
    
    return 0;
  },
  
  minimaxEvaluateOpponent(player, action, actionAmount, handStrength, callAmount, potSize, depth) {
    const opponentHandStrength = Math.random();
    
    const opponentFoldValue = this.calculateShowdownValue(player, handStrength, opponentHandStrength, potSize);
    const opponentCallValue = -this.calculateShowdownValue(player, handStrength, opponentHandStrength, potSize + callAmount);
    
    return Math.min(opponentFoldValue, opponentCallValue);
  },
  
  calculateLeafValue(player, action, actionAmount, handStrength, callAmount, potSize) {
    if (action === "fold") {
      return -player.currentBet;
    }
    
    const winProbability = handStrength;
    
    if (action === "call" || action === "check") {
      const EV = (winProbability * potSize) - ((1 - winProbability) * callAmount);
      return EV;
    }
    
    if (action === "raise") {
      const newPot = potSize + actionAmount;
      const EV = (winProbability * newPot) - ((1 - winProbability) * actionAmount);
      
      const aggressionBonus = handStrength > 0.7 ? 0.1 * potSize : 0;
      
      return EV + aggressionBonus;
    }
    
    return 0;
  },
  
  calculateShowdownValue(player, ourHandStrength, opponentHandStrength, potSize) {
    if (ourHandStrength > opponentHandStrength) {
      return potSize;
    } else if (ourHandStrength < opponentHandStrength) {
      return -potSize;
    } else {
      return 0;
    }
  }
}; 