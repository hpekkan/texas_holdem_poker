
const AlphaBetaAlgorithm = {
  makeAlphaBetaDecision(player, callAmount, communityCards, potSize, game) {
    const handStrength = player.evaluateCompleteHand(player.cards, communityCards);
    
    player.logReasoningStep(`Starting Alpha-Beta decision process with hand strength: ${handStrength}`);
    player.decisionProcess.nodesExplored = 0;
    player.decisionProcess.maxDepth = 0;
    
    let bestAction = "fold";
    let bestValue = -Infinity;
    let bestAmount = 0;
    
    const canCheck = callAmount === 0;
    
    if (!canCheck) {
      const foldPenalty = Math.min(15, potSize * 0.25);
      const smallBetThreshold = game.bigBlindAmount * 2;
      const isSmallBet = callAmount <= smallBetThreshold;
      
      const adjustedFoldPenalty = isSmallBet ? foldPenalty * 1.5 : foldPenalty;
      
      const foldValue = this.alphaBetaEvaluate(
        player, handStrength, callAmount, potSize, 0, 1000, -Infinity, Infinity, true
      ) - adjustedFoldPenalty;
      
      player.logReasoningStep(`Evaluated FOLD option with Alpha-Beta: ${foldValue} (with fold penalty: ${adjustedFoldPenalty})`);
      
      if (foldValue > bestValue) {
        bestValue = foldValue;
        bestAction = "fold";
        bestAmount = 0;
      }
    }
    
    const smallBetCallBonus = callAmount <= (game.bigBlindAmount * 2) ? 8 : 0;
    
    const checkCallValue = this.alphaBetaEvaluate(
      player, handStrength, callAmount, potSize + callAmount, 0, 1000, -Infinity, Infinity, false
    ) + smallBetCallBonus;
    
    player.logReasoningStep(`Evaluated ${canCheck ? "CHECK" : "CALL"} option with Alpha-Beta: ${checkCallValue}${smallBetCallBonus > 0 ? ` (with small bet bonus: ${smallBetCallBonus})` : ''}`);
    
    if (checkCallValue > bestValue) {
      bestValue = checkCallValue;
      bestAction = canCheck ? "check" : "call";
      bestAmount = callAmount;
    }
    
    const minRaiseAmount = Math.max(game.minRaise || 10, callAmount * 2);
    const possibleRaises = [
      minRaiseAmount,
      Math.floor(potSize * 0.5),
      Math.floor(potSize * 0.75),
      potSize,
      Math.floor(potSize * 1.5)
    ].filter(amount => amount > callAmount && amount <= player.chips);
    
    for (const raiseAmount of possibleRaises) {
      const newPot = potSize + raiseAmount;
      const raiseValue = this.alphaBetaEvaluate(
        player, handStrength, raiseAmount, newPot, 0, 1000, -Infinity, Infinity, false
      );
      player.logReasoningStep(`Evaluated RAISE ${raiseAmount} option with Alpha-Beta: ${raiseValue}`);
      
      if (raiseValue > bestValue) {
        bestValue = raiseValue;
        bestAction = "raise";
        bestAmount = raiseAmount;
      }
    }
    
    player.decisionProcess.evaluation = { bestAction, bestValue, bestAmount };
    player.logReasoningStep(`Final Alpha-Beta decision: ${bestAction} ${bestAmount > 0 ? bestAmount : ""}`);
    
    return {
      action: bestAction,
      amount: bestAmount
    };
  },
  
  
  alphaBetaEvaluate(player, handStrength, betAmount, potSize, depth, maxDepth, alpha, beta, isFolding) {
    player.decisionProcess.nodesExplored++;
    player.decisionProcess.maxDepth = Math.max(player.decisionProcess.maxDepth, depth);
    
    if (depth >= maxDepth) {
      return this.calculateLeafValue(player, handStrength, betAmount, potSize, isFolding);
    }
    
    if (isFolding) {
      return -betAmount;
    }
    
    if (depth % 2 === 0) {
      let value = -Infinity;
      
      const foldValue = potSize;
      value = Math.max(value, foldValue);
      alpha = Math.max(alpha, value);
      
      const showdownValue = this.calculateShowdownValue(handStrength, potSize);
      value = Math.max(value, showdownValue);
      alpha = Math.max(alpha, value);
      
      const possibleRaises = [
        betAmount * 2,
        Math.floor(potSize * 0.5),
        potSize
      ];
      
      for (const raiseAmount of possibleRaises) {
        if (alpha >= beta) break;
        
        const newPot = potSize + raiseAmount;
        const raiseValue = this.alphaBetaEvaluate(
          player, handStrength, raiseAmount, newPot, depth + 1, maxDepth, alpha, beta, false
        );
        
        value = Math.max(value, raiseValue);
        alpha = Math.max(alpha, value);
      }
      
      return value;
    }
    else {
      let value = Infinity;
      
      const foldValue = -betAmount;
      value = Math.min(value, foldValue);
      beta = Math.min(beta, value);
      
      const opponentHandStrength = 0.5 + Math.random() * 0.3;
      const showdownValue = this.calculateOpponentShowdownValue(handStrength, opponentHandStrength, potSize);
      value = Math.min(value, showdownValue);
      beta = Math.min(beta, value);
      
      const possibleRaises = [
        betAmount * 2,
        Math.floor(potSize * 0.5),
        potSize
      ];
      
      for (const raiseAmount of possibleRaises) {
        if (alpha >= beta) break;
        
        const newPot = potSize + raiseAmount;
        const raiseValue = this.alphaBetaEvaluate(
          player, handStrength, raiseAmount, newPot, depth + 1, maxDepth, alpha, beta, false
        );
        
        value = Math.min(value, raiseValue);
        beta = Math.min(beta, value);
      }
      
      return value;
    }
  },
  
  
  calculateLeafValue(player, handStrength, betAmount, potSize, isFolding) {
    if (isFolding) {
      return -betAmount;
    }
    
    const winProbability = handStrength;
    const EV = (winProbability * potSize) - ((1 - winProbability) * betAmount);
    
    const aggressionBonus = handStrength > 0.7 ? 0.1 * potSize : 0;
    const positionBonus = player.position === 'button' ? 0.05 * potSize : 0;
    
    return EV + aggressionBonus + positionBonus;
  },
  
  calculateShowdownValue(handStrength, potSize) {
    const winProbability = handStrength;
    return (winProbability * potSize) - ((1 - winProbability) * potSize);
  },
  
  calculateOpponentShowdownValue(ourHandStrength, opponentHandStrength, potSize) {
    if (ourHandStrength > opponentHandStrength) {
      return potSize;
    } else if (ourHandStrength < opponentHandStrength) {
      return -potSize;
    } else {
      return 0;
    }
  }
}; 