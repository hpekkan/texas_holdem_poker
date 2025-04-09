const BayesianAlgorithm = {
  makeBayesianDecision(player, callAmount, communityCards, potSize, game) {
    try {
      player.logReasoningStep("Starting Bayesian decision process");
      
      
      try {
        if (game && Array.isArray(game.players)) {
          this.updateOpponentModels(player, game);
        }
      } catch (err) {
        console.error("Error updating opponent models:", err);
        
      }
      
      
      const handStrength = player.evaluateCompleteHand(player.cards, communityCards);
      
      
      const adjustedStrength = this.estimateHandStrengthBayesian(player, handStrength, communityCards, game);
      
      player.logReasoningStep(`Base hand strength: ${handStrength.toFixed(4)}, Adjusted: ${adjustedStrength.toFixed(4)}`);
      
      
      const potOdds = callAmount / (potSize + callAmount);
      player.logReasoningStep(`Pot odds: ${potOdds.toFixed(4)}`);
      
      
      let drawPotential = 0;
      if (communityCards.length < 5) {
        drawPotential = this.calculateDrawPotential(player, communityCards);
        player.logReasoningStep(`Draw potential: ${drawPotential.toFixed(4)}`);
      }
      
      
      if (callAmount === 0) {
        
        if (adjustedStrength > 0.7) {
          
          const betAmount = Math.max(20, Math.floor(potSize * 0.6));
          player.logReasoningStep(`Strong hand, betting ${betAmount}`);
          return { action: "raise", amount: betAmount };
        } else if (adjustedStrength > 0.5 || drawPotential > 0.3) {
          
          const betAmount = Math.max(15, Math.floor(potSize * 0.4));
          player.logReasoningStep(`Medium hand/draw, betting ${betAmount}`);
          return { action: "raise", amount: betAmount };
        } else if (drawPotential > 0.2) {
          
          const betAmount = Math.max(10, Math.floor(potSize * 0.25));
          player.logReasoningStep(`Decent draw, small bet ${betAmount}`);
          return { action: "raise", amount: betAmount };
        } else {
          
          player.logReasoningStep("Weak hand, checking");
          return { action: "check", amount: 0 };
        }
      } else {
        
        
        
        const effectiveStrength = adjustedStrength + drawPotential;
        const callEV = (effectiveStrength * potSize) - ((1 - effectiveStrength) * callAmount);
        player.logReasoningStep(`Call EV: ${callEV.toFixed(2)}`);
        
        
        const isSmallBet = callAmount <= 20;
        const smallBetBonus = isSmallBet ? AIUtils.CALL_BONUS : 0;
        const adjustedCallEV = callEV + smallBetBonus;
        
        if (adjustedStrength > 0.8) {
          
          const raiseAmount = Math.max(callAmount * 2.5, Math.floor(potSize * 0.75));
          player.logReasoningStep(`Very strong hand, raising to ${raiseAmount}`);
          return { action: "raise", amount: raiseAmount };
        } else if (adjustedStrength > 0.6 && callAmount < potSize * 0.5) {
          
          const raiseAmount = Math.max(callAmount * 2, Math.floor(potSize * 0.6));
          player.logReasoningStep(`Strong hand, raising to ${raiseAmount}`);
          return { action: "raise", amount: raiseAmount };
        } else if (adjustedCallEV > 0 || (isSmallBet && adjustedStrength > 0.3)) {
          
          player.logReasoningStep(`+EV call or small bet, calling ${callAmount}`);
          return { action: "call", amount: callAmount };
        } else {
          
          player.logReasoningStep("-EV call, folding");
          return { action: "fold", amount: 0 };
        }
      }
    } catch (error) {
      console.error("Error in Bayesian decision making:", error);
      
      if (callAmount === 0) {
        return { action: "check", amount: 0 };
      } else if (callAmount <= 20) {
        return { action: "call", amount: callAmount };
      } else {
        return { action: "fold", amount: 0 };
      }
    }
  },
  
  updateOpponentModels(player, game) {
    
    const opponents = game.players.filter(p => p !== player && !p.folded);
    
    
    let activePlayers = [];
    try {
      
      if (game && typeof game.getActivePlayers === 'function') {
        activePlayers = game.getActivePlayers();
      } else {
        
        activePlayers = game && Array.isArray(game.players) 
          ? game.players.filter(p => !p.folded && p.isActive)
          : [];
      }
    } catch (err) {
      console.error("Error getting active players in Bayesian algorithm:", err);
      
    }
    
    opponents.forEach(opponent => {
      
      if (!player.gameState.opponentModels[opponent.name]) {
        player.gameState.opponentModels[opponent.name] = {
          aggressionFactor: 0.5, 
          bluffFrequency: 0.2,   
          callFrequency: 0.5,    
          tightness: 0.5,        
          observations: 0        
        };
      }
      
      const model = player.gameState.opponentModels[opponent.name];
      
      
      const lastAction = opponent.lastAction;
      
      if (lastAction) {
        
        model.observations++;
        
        if (lastAction.action === "raise") {
          
          model.aggressionFactor = (model.aggressionFactor * (model.observations - 1) + 1) / model.observations;
          
          
          if (game.communityCards.length >= 3) {
            
            if (lastAction.amount > game.pot * 0.7) {
              model.bluffFrequency = (model.bluffFrequency * (model.observations - 1) + 0.1) / model.observations;
            } else {
              model.bluffFrequency = (model.bluffFrequency * (model.observations - 1) + 0.3) / model.observations;
            }
          }
        } else if (lastAction.action === "call") {
          
          model.callFrequency = (model.callFrequency * (model.observations - 1) + 1) / model.observations;
          
          
          model.aggressionFactor = (model.aggressionFactor * (model.observations - 1) + 0.3) / model.observations;
        } else if (lastAction.action === "fold") {
          
          model.tightness = (model.tightness * (model.observations - 1) + 0.7) / model.observations;
          
          
          model.callFrequency = (model.callFrequency * (model.observations - 1) + 0) / model.observations;
        }
        
        
        model.aggressionFactor = Math.max(0.1, Math.min(0.9, model.aggressionFactor));
        model.bluffFrequency = Math.max(0.1, Math.min(0.9, model.bluffFrequency));
        model.callFrequency = Math.max(0.1, Math.min(0.9, model.callFrequency));
        model.tightness = Math.max(0.1, Math.min(0.9, model.tightness));
      }
    });
  },
  
  estimateHandStrengthBayesian(player, handStrength, communityCards, game) {
    
    try {
      
      if (!game || !Array.isArray(game.players)) {
        return handStrength; 
      }
      
      const opponents = game.players.filter(p => p !== player && !p.folded);
      
      
      if (opponents.length === 0) {
        return handStrength;
      }
      
      
      let adjustedStrength = handStrength;
      
      
      if (!player.gameState || !player.gameState.opponentModels) {
        
        if (!player.gameState) {
          player.gameState = {};
        }
        if (!player.gameState.opponentModels) {
          player.gameState.opponentModels = {};
        }
        return handStrength; 
      }
      
      
      opponents.forEach(opponent => {
        
        if (!opponent || !opponent.name) return;
        
        const model = player.gameState.opponentModels[opponent.name];
        
        if (model && model.observations > 0) {
          
          if (model.aggressionFactor > 0.6 && opponent.lastAction && 
              (opponent.lastAction.action === "raise" || opponent.lastAction.action === "bet")) {
            
            const discount = (model.aggressionFactor - 0.5) * 0.2;
            
            
            const bluffAdjustment = model.bluffFrequency * 0.2;
            
            adjustedStrength -= discount - bluffAdjustment;
          }
          
          
          if (model.tightness > 0.6 && opponent.lastAction && 
              (opponent.lastAction.action === "call" || opponent.lastAction.action === "raise")) {
            const discount = (model.tightness - 0.5) * 0.15;
            adjustedStrength -= discount;
          }
        }
      });
      
      
      if (opponents.length > 1) {
        adjustedStrength -= 0.05 * (opponents.length - 1);
      }
      
      
      if (communityCards && communityCards.length >= 3) {
        
        const values = communityCards.map(card => card.value);
        const uniqueValues = new Set(values);
        
        if (uniqueValues.size < communityCards.length) {
          
          adjustedStrength -= 0.05;
        }
        
        
        const suits = communityCards.map(card => card.suit);
        const suitCounts = {};
        for (const suit of suits) {
          suitCounts[suit] = (suitCounts[suit] || 0) + 1;
        }
        
        const maxSuitCount = Math.max(...Object.values(suitCounts));
        if (maxSuitCount >= 3) {
          
          adjustedStrength -= 0.1;
        }
        
        
        const numericValues = values.map(v => {
          if (v === "A") return 14;
          if (v === "K") return 13;
          if (v === "Q") return 12;
          if (v === "J") return 11;
          if (v === "T") return 10;
          return parseInt(v);
        }).sort((a, b) => a - b);
        
        const isConnected = numericValues.some((val, i) => 
          i < numericValues.length - 1 && Math.abs(val - numericValues[i + 1]) <= 2
        );
        
        if (isConnected) {
          
          adjustedStrength -= 0.05;
        }
      }
      
      
      return Math.max(0.1, Math.min(0.95, adjustedStrength));
    } catch (error) {
      console.error("Error in estimateHandStrengthBayesian:", error);
      return handStrength; 
    }
  },
  
  calculateDrawPotential(player, communityCards) {
    
    if (communityCards.length === 5) {
      return 0; 
    }
    
    
    const allCards = [...player.cards, ...communityCards];
    
    
    const suits = allCards.map(card => card.suit);
    const suitCounts = {};
    for (const suit of suits) {
      suitCounts[suit] = (suitCounts[suit] || 0) + 1;
    }
    
    const maxSuitCount = Math.max(...Object.values(suitCounts));
    let flushDrawPotential = 0;
    
    if (maxSuitCount === 4) {
      
      flushDrawPotential = communityCards.length === 3 ? 0.35 : 0.2; 
    } else if (maxSuitCount === 3 && communityCards.length === 3) {
      
      flushDrawPotential = 0.15;
    }
    
    
    const values = allCards.map(card => {
      if (card.value === "A") return 14;
      if (card.value === "K") return 13;
      if (card.value === "Q") return 12;
      if (card.value === "J") return 11;
      if (card.value === "T") return 10;
      return parseInt(card.value);
    });
    
    
    const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
    
    
    let straightDrawPotential = 0;
    
    
    if (uniqueValues.includes(14)) {
      uniqueValues.push(1); 
      uniqueValues.sort((a, b) => a - b);
    }
    
    
    let maxConsecutive = 1;
    let current = 1;
    for (let i = 1; i < uniqueValues.length; i++) {
      if (uniqueValues[i] === uniqueValues[i-1] + 1) {
        current++;
        maxConsecutive = Math.max(maxConsecutive, current);
      } else if (uniqueValues[i] > uniqueValues[i-1] + 1) {
        current = 1;
      }
    }
    
    if (maxConsecutive === 4) {
      
      straightDrawPotential = communityCards.length === 3 ? 0.4 : 0.2;
    } else if (maxConsecutive === 3) {
      
      straightDrawPotential = communityCards.length === 3 ? 0.2 : 0.1;
    }
    
    
    return Math.max(flushDrawPotential, straightDrawPotential);
  }
}; 