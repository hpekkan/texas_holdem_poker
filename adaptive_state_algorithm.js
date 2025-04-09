window.AdaptiveStateAlgorithm = {
  makeAdaptiveStateDecision(player, callAmount, communityCards, potSize, game) {
    try {
      player.logReasoningStep("Starting Adaptive State decision process");
      
      
      const handStrength = player.evaluateCompleteHand(player.cards, communityCards);
      player.logReasoningStep(`Current hand strength: ${handStrength.toFixed(4)}`);
      
      
      const gameStage = this.determineGameStage(communityCards);
      player.logReasoningStep(`Current game stage: ${gameStage}`);
      
      
      const gameState = this.determineGameState(player, handStrength, gameStage, game);
      player.logReasoningStep(`Current game state: ${gameState.state}`);
      
      
      const adjustedStrategy = this.adaptStrategy(
        player, 
        handStrength, 
        gameState, 
        callAmount, 
        potSize, 
        gameStage, 
        game
      );
      
      
      return this.makeDecisionBasedOnStrategy(
        player,
        callAmount,
        potSize,
        handStrength,
        adjustedStrategy,
        gameState,
        communityCards
      );
    } catch (error) {
      console.error("Error in Adaptive State decision making:", error);
      
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
  
  determineGameState(player, handStrength, gameStage, game) {
    
    
    const stackState = this.determineStackState(player, game);
    
    
    const handState = this.determineHandState(handStrength, gameStage);
    
    
    const positionState = this.determinePositionState(player, game);
    
    
    const opponentsState = this.determineOpponentsState(player, game);
    
    
    const tableState = this.determineTableDynamics(player, game);
    
    
    const state = this.combineStates(stackState, handState, positionState, opponentsState, tableState);
    
    return {
      state,
      stackState,
      handState,
      positionState,
      opponentsState,
      tableState
    };
  },
  
  determineStackState(player, game) {
    
    const bb = game && game.bigBlind ? game.bigBlind : 20;
    const stackToBB = player.chips / bb;
    
    if (stackToBB < 10) return "desperate";
    if (stackToBB < 20) return "short";
    if (stackToBB < 40) return "medium";
    if (stackToBB < 100) return "comfortable";
    return "deep";
  },
  
  determineHandState(handStrength, gameStage) {
    
    if (gameStage === "preflop") {
      if (handStrength > 0.8) return "premium";
      if (handStrength > 0.6) return "strong";
      if (handStrength > 0.4) return "playable";
      return "weak";
    } else {
      if (handStrength > 0.8) return "monster";
      if (handStrength > 0.7) return "strong";
      if (handStrength > 0.6) return "good";
      if (handStrength > 0.4) return "marginal";
      return "weak";
    }
  },
  
  determinePositionState(player, game) {
    if (!game || !game.players) return "unknown";
    
    try {
      const buttonIndex = game.buttonIndex || 0;
      const playerIndex = game.players.findIndex(p => p === player);
      
      if (playerIndex === -1) return "unknown";
      
      const playerCount = game.players.length;
      
      let relativePosition = (playerIndex - buttonIndex + playerCount) % playerCount;
      
      if (relativePosition === 0) return "button";
      if (relativePosition === 1) return "small_blind";
      if (relativePosition === 2) return "big_blind";
      if (relativePosition <= Math.floor(playerCount * 0.33)) return "early";
      if (relativePosition <= Math.floor(playerCount * 0.66)) return "middle";
      return "late";
    } catch (err) {
      console.error("Error determining position:", err);
      return "unknown";
    }
  },
  
  determineOpponentsState(player, game) {
    if (!game || !game.players) return "unknown";
    
    
    let activePlayers = 0;
    try {
      if (game && typeof game.getActivePlayers === 'function') {
        activePlayers = game.getActivePlayers().length - 1; 
      } else if (game && Array.isArray(game.players)) {
        activePlayers = game.players.filter(p => !p.folded && p !== player).length;
      }
    } catch (err) {
      console.error("Error counting opponents:", err);
      return "unknown";
    }
    
    
    let aggressiveCount = 0;
    let passiveCount = 0;
    
    if (player.gameState && player.gameState.opponentModels) {
      for (const opName in player.gameState.opponentModels) {
        const model = player.gameState.opponentModels[opName];
        if (model.aggressionFactor > 0.6) aggressiveCount++;
        if (model.aggressionFactor < 0.4) passiveCount++;
      }
    }
    
    
    if (activePlayers === 0) return "no_opponents";
    if (activePlayers === 1) return "heads_up";
    if (activePlayers > 3) return "multiway";
    
    if (aggressiveCount > passiveCount && aggressiveCount > activePlayers/2) 
      return "aggressive_table";
    if (passiveCount > aggressiveCount && passiveCount > activePlayers/2) 
      return "passive_table";
      
    return "mixed_table";
  },
  
  determineTableDynamics(player, game) {
    if (!game) return "unknown";
    
    
    const bb = game.bigBlind || 20;
    const potToBB = game.pot / bb;
    
    
    let raiseCount = 0;
    let callCount = 0;
    
    try {
      if (game.actionHistory && Array.isArray(game.actionHistory)) {
        for (const action of game.actionHistory) {
          if (action.action === "raise") raiseCount++;
          if (action.action === "call") callCount++;
        }
      }
    } catch (err) {
      console.error("Error analyzing table dynamics:", err);
    }
    
    
    if (potToBB > 20 || raiseCount > 3) return "aggressive";
    if (callCount > raiseCount * 2) return "passive";
    if (potToBB < 5 && raiseCount === 0) return "tight";
    
    return "neutral";
  },
  
  combineStates(stackState, handState, positionState, opponentsState, tableState) {
    
    
    
    if (stackState === "desperate") return "survival";
    
    
    if (opponentsState === "multiway" && (handState === "monster" || handState === "strong")) 
      return "value_betting";
    
    
    if (tableState === "passive" && (handState !== "weak")) 
      return "aggressive";
    
    
    if (tableState === "aggressive" && handState === "marginal") 
      return "cautious";
    
    
    if ((positionState === "late" || positionState === "button") && 
        (stackState === "comfortable" || stackState === "deep")) 
      return "positional";
    
    
    if (handState === "monster" || handState === "premium") return "value_betting";
    if (handState === "strong" || handState === "good") return "standard";
    if (handState === "marginal" || handState === "playable") return "cautious";
    
    return "defensive";
  },
  
  adaptStrategy(player, handStrength, gameState, callAmount, potSize, gameStage, game) {
    
    switch (gameState.state) {
      case "value_betting":
        return {
          name: "value_betting",
          checkRaiseThreshold: 0.5,           
          continuationBetFrequency: 0.9,      
          bluffFrequency: 0.1,                
          raiseMultiplier: potSize > 100 ? 1.0 : 1.5,  
          description: "Focusing on maximizing value with strong hands"
        };
        
      case "aggressive":
        return {
          name: "aggressive",
          checkRaiseThreshold: 0.4,           
          continuationBetFrequency: 0.8,      
          bluffFrequency: 0.3,                
          raiseMultiplier: 1.5,               
          description: "Playing aggressively to put pressure on opponents"
        };
        
      case "positional":
        return {
          name: "positional",
          checkRaiseThreshold: 0.3,           
          continuationBetFrequency: 0.7,      
          bluffFrequency: 0.4,                
          raiseMultiplier: 1.2,               
          description: "Exploiting positional advantage"
        };
        
      case "standard":
        return {
          name: "standard",
          checkRaiseThreshold: 0.3,           
          continuationBetFrequency: 0.6,      
          bluffFrequency: 0.2,                
          raiseMultiplier: 1.0,               
          description: "Using standard strategy for solid hands"
        };
        
      case "cautious":
        return {
          name: "cautious",
          checkRaiseThreshold: 0.2,           
          continuationBetFrequency: 0.5,      
          bluffFrequency: 0.1,                
          raiseMultiplier: 0.8,               
          description: "Playing cautiously with marginal holdings"
        };
        
      case "defensive":
        return {
          name: "defensive",
          checkRaiseThreshold: 0.1,           
          continuationBetFrequency: 0.3,      
          bluffFrequency: 0.05,               
          raiseMultiplier: 0.6,               
          description: "Defending with weak holdings, minimizing losses"
        };
        
      case "survival":
        return {
          name: "survival",
          checkRaiseThreshold: 0.05,          
          continuationBetFrequency: 0.2,      
          bluffFrequency: 0.0,                
          raiseMultiplier: 0.5,               
          description: "Survival mode with desperate stack, waiting for premium hands"
        };
        
      default:
        return {
          name: "balanced",
          checkRaiseThreshold: 0.25,          
          continuationBetFrequency: 0.5,      
          bluffFrequency: 0.15,               
          raiseMultiplier: 1.0,               
          description: "Using balanced strategy"
        };
    }
  },
  
  makeDecisionBasedOnStrategy(player, callAmount, potSize, handStrength, strategy, gameState, communityCards) {
    player.logReasoningStep(`Using '${strategy.name}' strategy: ${strategy.description}`);
    
    
    const draws = this.identifyDraws(player.cards, communityCards);
    if (draws.hasFlushDraw) player.logReasoningStep("Has flush draw");
    if (draws.hasStraightDraw) player.logReasoningStep("Has straight draw");
    
    
    if (callAmount === 0) {
      
      if (this.shouldBetInstead(player, strategy, handStrength, gameState)) {
        
        const betAmount = Math.max(
          20, 
          Math.min(
            Math.floor(potSize * strategy.raiseMultiplier), 
            player.chips
          )
        );
        player.logReasoningStep(`${strategy.name} strategy suggests betting ${betAmount}`);
        return { action: "raise", amount: betAmount };
      } else {
        
        player.logReasoningStep(`${strategy.name} strategy suggests checking`);
        return { action: "check", amount: 0 };
      }
    }
    
    
    const potOdds = callAmount / (potSize + callAmount);
    player.logReasoningStep(`Pot odds: ${potOdds.toFixed(4)}`);
    
    
    const winProbability = this.adjustWinProbability(handStrength, strategy, gameState);
    player.logReasoningStep(`Adjusted win probability: ${winProbability.toFixed(4)}`);
    const callEV = this.calculateCallEV(winProbability, potSize, callAmount);
    player.logReasoningStep(`Call EV: ${callEV.toFixed(2)}`);
    
    
    if (this.shouldRaise(player, strategy, handStrength, gameState, winProbability)) {
      
      const raiseAmount = this.calculateRaiseAmount(
        callAmount, 
        potSize, 
        strategy, 
        player.chips, 
        gameState
      );
      player.logReasoningStep(`${strategy.name} strategy suggests raising to ${raiseAmount}`);
      return { action: "raise", amount: raiseAmount };
    } else if (this.shouldCall(callEV, callAmount, potOdds, winProbability, draws)) {
      player.logReasoningStep(`${strategy.name} strategy suggests calling ${callAmount}`);
      return { action: "call", amount: callAmount };
    } else {
      player.logReasoningStep(`${strategy.name} strategy suggests folding`);
      return { action: "fold", amount: 0 };
    }
  },
  
  shouldBetInstead(player, strategy, handStrength, gameState) {
    
    
    
    if (strategy.name === "value_betting" && handStrength > 0.7) return true;
    
    
    let shouldCBet = false;
    if (player.lastAction && player.lastAction.streetAction === "raise" && 
        Math.random() < strategy.continuationBetFrequency) {
      shouldCBet = true;
    }
    
    
    const betThreshold = 0.5 - (strategy.continuationBetFrequency - 0.5);
    
    
    const shouldBluff = Math.random() < strategy.bluffFrequency;
    
    return handStrength > betThreshold || shouldCBet || shouldBluff;
  },
  
  shouldRaise(player, strategy, handStrength, gameState, winProbability) {
    
    if (handStrength > 0.8) return true;
    
    
    if (strategy.name === "survival" && handStrength < 0.85) return false;
    
    
    const raiseThreshold = 0.65 - (strategy.raiseMultiplier - 1.0) * 0.1;
    
    
    const positionModifier = gameState.positionState === "late" || 
                             gameState.positionState === "button" ? 0.05 : 0;
    
    
    const bluffChance = Math.random() < strategy.bluffFrequency * 0.5;
    
    return handStrength > (raiseThreshold - positionModifier) || 
           (handStrength > 0.5 && bluffChance);
  },
  
  shouldCall(callEV, callAmount, potOdds, winProbability, draws) {
    
    if (callEV > 0) return true;
    
    
    if (draws.hasFlushDraw && potOdds < 0.2) return true;
    if (draws.hasStraightDraw && potOdds < 0.17) return true;
    
    
    if (callEV > -10 && winProbability > 0.4) return true;
    
    
    if (callAmount <= 20 && winProbability > 0.3) return true;
    
    return false;
  },
  
  calculateRaiseAmount(callAmount, potSize, strategy, availableChips, gameState) {
    
    let baseRaise = Math.floor(potSize * strategy.raiseMultiplier);
    
    
    if (gameState.state === "survival") {
      
      baseRaise = Math.max(callAmount * 2, Math.min(baseRaise, availableChips * 0.3));
    } else if (gameState.state === "value_betting") {
      
      baseRaise = Math.max(callAmount * 2, Math.min(baseRaise * 1.2, availableChips * 0.7));
    }
    
    
    return Math.min(
      Math.max(callAmount * 2, baseRaise),
      availableChips
    );
  },
  
  adjustWinProbability(handStrength, strategy, gameState) {
    
    let adjustment = 0;
    
    
    if (strategy.name === "aggressive" || strategy.name === "value_betting") {
      adjustment -= 0.05;
    }
    
    
    if (strategy.name === "cautious" || strategy.name === "defensive") {
      adjustment += 0.05;
    }
    
    
    if (gameState.tableState === "aggressive") {
      adjustment -= 0.05; 
    } else if (gameState.tableState === "passive") {
      adjustment += 0.05; 
    }
    
    
    return Math.max(0.1, Math.min(0.95, handStrength + adjustment));
  },
  
  identifyDraws(holeCards, communityCards) {
    if (!communityCards || communityCards.length < 3) {
      return { hasFlushDraw: false, hasStraightDraw: false };
    }
    
    const allCards = [...holeCards, ...communityCards];
    
    
    const suits = {};
    for (const card of allCards) {
      suits[card.suit] = (suits[card.suit] || 0) + 1;
    }
    const hasFlushDraw = Object.values(suits).some(count => count === 4);
    
    
    const values = allCards.map(card => {
      if (card.value === "A") return 14;
      if (card.value === "K") return 13;
      if (card.value === "Q") return 12;
      if (card.value === "J") return 11;
      if (card.value === "T") return 10;
      return parseInt(card.value);
    }).sort((a, b) => a - b);
    
    
    if (values.includes(14)) {
      values.push(1);
    }
    
    
    const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
    
    
    let hasStraightDraw = false;
    for (let i = 0; i < uniqueValues.length - 3; i++) {
      
      if (uniqueValues[i] + 3 === uniqueValues[i + 3]) {
        hasStraightDraw = true;
        break;
      }
      
      
      if (i < uniqueValues.length - 4 && 
          uniqueValues[i] + 4 === uniqueValues[i + 4] && 
          (uniqueValues[i + 1] - uniqueValues[i] > 1 || 
           uniqueValues[i + 2] - uniqueValues[i + 1] > 1 || 
           uniqueValues[i + 3] - uniqueValues[i + 2] > 1 || 
           uniqueValues[i + 4] - uniqueValues[i + 3] > 1)) {
        hasStraightDraw = true;
        break;
      }
    }
    
    return { hasFlushDraw, hasStraightDraw };
  }
}; 