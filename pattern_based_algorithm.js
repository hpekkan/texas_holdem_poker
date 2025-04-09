const PatternBasedAlgorithm = {
  makePatternBasedDecision(player, callAmount, communityCards, potSize, game) {
    try {
      player.logReasoningStep("Starting Pattern-based decision making");
      
      
      const handStrength = player.evaluateCompleteHand(player.cards, communityCards);
      player.logReasoningStep(`Current hand strength: ${handStrength.toFixed(4)}`);
      
      
      const gameStage = this.determineGameStage(communityCards);
      player.logReasoningStep(`Current game stage: ${gameStage}`);
      
      
      const opponentPatterns = this.analyzeOpponentPatterns(player, game);
      player.logReasoningStep(`Opponent patterns: ${opponentPatterns.type}`);
      
      
      const opponentMoves = this.getCurrentHandActions(game);
      player.logReasoningStep(`Current hand actions: ${opponentMoves.actionCount} actions, aggressive rating: ${opponentMoves.aggressiveRating.toFixed(2)}`);
      
      
      const ownPatterns = this.analyzeSelfPatterns(player);
      player.logReasoningStep(`Own pattern analysis: predictability ${ownPatterns.predictabilityScore.toFixed(2)}`);
      
      
      const counterStrategy = this.determineCounterStrategy(opponentPatterns, handStrength, gameStage);
      player.logReasoningStep(`Counter strategy: ${counterStrategy.type}`);
      
      
      const shouldBeUnpredictable = ownPatterns.predictabilityScore > 0.7;
      if (shouldBeUnpredictable) {
        player.logReasoningStep("Detected high predictability, adding randomness to decision");
      }
      
      
      return this.makeDecisionBasedOnPatterns(
        player,
        callAmount,
        potSize, 
        handStrength,
        counterStrategy,
        opponentPatterns,
        opponentMoves,
        gameStage,
        shouldBeUnpredictable
      );
    } catch (error) {
      console.error("Error in Pattern-based decision making:", error);
      
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
  
  
  determineGameStage(communityCards) {
    const count = communityCards.length;
    if (count === 0) return "preflop";
    if (count === 3) return "flop";
    if (count === 4) return "turn";
    if (count === 5) return "river";
    return "unknown";
  },
  
  analyzeOpponentPatterns(player, game) {
    
    let patternType = "unknown";
    let confidenceLevel = 0;
    let aggressionFactor = 0.5;
    let bluffFrequency = 0.2;
    let checkRaiseFrequency = 0.1;
    
    try {
      
      const opponentModels = player.gameState && player.gameState.opponentModels 
                           ? player.gameState.opponentModels 
                           : {};
      
      
      if (player.decisionHistory && player.decisionHistory.length > 10) {
        
        let raiseCount = 0;
        let callCount = 0;
        let checkCount = 0;
        let foldCount = 0;
        let totalActions = 0;
        
        
        const historySlice = player.decisionHistory.slice(-20);
        
        for (const record of historySlice) {
          if (record.gameState && record.gameState.actions) {
            
            for (const action of record.gameState.actions) {
              if (action.player !== player.name) {
                totalActions++;
                if (action.action === "raise") raiseCount++;
                else if (action.action === "call") callCount++;
                else if (action.action === "check") checkCount++;
                else if (action.action === "fold") foldCount++;
              }
            }
          }
        }
        
        
        if (totalActions > 5) {
          confidenceLevel = Math.min(0.2 + (totalActions / 50), 0.9);
          
          
          const aggressiveActions = raiseCount;
          const passiveActions = callCount + checkCount;
          
          if (passiveActions > 0) {
            aggressionFactor = aggressiveActions / (aggressiveActions + passiveActions);
          }
          
          
          if (aggressionFactor > 0.7) {
            patternType = "aggressive";
          } else if (aggressionFactor < 0.3) {
            patternType = "passive";
          } else if (foldCount > totalActions * 0.6) {
            patternType = "tight";
          } else if (callCount > totalActions * 0.5) {
            patternType = "calling_station";
          } else {
            patternType = "balanced";
          }
          
          
          if (player.gameState && player.gameState.showdowns && player.gameState.showdowns.length > 0) {
            let bluffCount = 0;
            let showdownCount = 0;
            
            for (const showdown of player.gameState.showdowns) {
              
              if (showdown.finalBet > showdown.potSize * 0.5 && showdown.handStrength < 0.3) {
                bluffCount++;
              }
              showdownCount++;
            }
            
            if (showdownCount > 0) {
              bluffFrequency = bluffCount / showdownCount;
            }
          }
          
          
          let checkRaiseCount = 0;
          for (const record of historySlice) {
            if (record.gameState && record.gameState.actions && record.gameState.actions.length >= 2) {
              for (let i = 1; i < record.gameState.actions.length; i++) {
                const prevAction = record.gameState.actions[i-1];
                const currAction = record.gameState.actions[i];
                
                if (prevAction.action === "check" && currAction.action === "raise" && 
                    prevAction.player === currAction.player) {
                  checkRaiseCount++;
                }
              }
            }
          }
          
          if (totalActions > 0) {
            checkRaiseFrequency = checkRaiseCount / totalActions;
          }
        }
      }
      
      
      if (game && game.players) {
        for (const opponent of game.players) {
          if (opponent !== player && opponent.strategy) {
            
            if (opponent.strategy === "aggressive") {
              patternType = "aggressive";
              confidenceLevel = Math.max(confidenceLevel, 0.7);
              aggressionFactor = 0.8;
            } else if (opponent.strategy === "conservative") {
              patternType = "tight";
              confidenceLevel = Math.max(confidenceLevel, 0.7);
              aggressionFactor = 0.3;
            }
          }
        }
      }
    } catch (err) {
      console.error("Error analyzing opponent patterns:", err);
      
    }
    
    return {
      type: patternType,
      confidence: confidenceLevel,
      aggressionFactor: aggressionFactor,
      bluffFrequency: bluffFrequency,
      checkRaiseFrequency: checkRaiseFrequency
    };
  },
  
  getCurrentHandActions(game) {
    
    let actionCount = 0;
    let raiseCount = 0;
    let callCount = 0;
    let checkCount = 0;
    let foldCount = 0;
    let aggressiveRating = 0.5;
    
    try {
      
      if (game && game.actionHistory && Array.isArray(game.actionHistory)) {
        actionCount = game.actionHistory.length;
        
        
        for (const action of game.actionHistory) {
          if (action.action === "raise") raiseCount++;
          else if (action.action === "call") callCount++;
          else if (action.action === "check") checkCount++;
          else if (action.action === "fold") foldCount++;
        }
        
        
        const aggressiveActions = raiseCount;
        const passiveActions = callCount + checkCount;
        
        if (aggressiveActions + passiveActions > 0) {
          aggressiveRating = aggressiveActions / (aggressiveActions + passiveActions);
        }
      }
    } catch (err) {
      console.error("Error analyzing current hand actions:", err);
    }
    
    return {
      actionCount,
      raiseCount,
      callCount,
      checkCount,
      foldCount,
      aggressiveRating
    };
  },
  
  analyzeSelfPatterns(player) {
    
    let predictabilityScore = 0.3;
    let aggression = 0.5;
    let foldFrequency = 0.3;
    
    try {
      
      if (player.decisionHistory && player.decisionHistory.length > 10) {
        const recentHistory = player.decisionHistory.slice(-10);
        
        
        let raiseCount = 0;
        let callCount = 0;
        let checkCount = 0;
        let foldCount = 0;
        
        for (const decision of recentHistory) {
          const action = decision.decision.action;
          if (action === "raise") raiseCount++;
          else if (action === "call") callCount++;
          else if (action === "check") checkCount++;
          else if (action === "fold") foldCount++;
        }
        
        const totalActions = raiseCount + callCount + checkCount + foldCount;
        
        if (totalActions > 0) {
          aggression = (raiseCount) / totalActions;
          foldFrequency = foldCount / totalActions;
        }
        
        
        let strongHandRaiseCount = 0;
        let strongHandCount = 0;
        
        for (const decision of recentHistory) {
          if (decision.handStrength > 0.7) {
            strongHandCount++;
            if (decision.decision.action === "raise") {
              strongHandRaiseCount++;
            }
          }
        }
        
        
        if (strongHandCount > 3) {
          const strongHandRaiseFrequency = strongHandRaiseCount / strongHandCount;
          if (strongHandRaiseFrequency > 0.8 || strongHandRaiseFrequency < 0.2) {
            predictabilityScore += 0.3;
          }
        }
        
        
        let weakHandFoldCount = 0;
        let weakHandCount = 0;
        
        for (const decision of recentHistory) {
          if (decision.handStrength < 0.3) {
            weakHandCount++;
            if (decision.decision.action === "fold") {
              weakHandFoldCount++;
            }
          }
        }
        
        if (weakHandCount > 3) {
          const weakHandFoldFrequency = weakHandFoldCount / weakHandCount;
          if (weakHandFoldFrequency > 0.8) {
            predictabilityScore += 0.3;
          }
        }
        
        
        const raiseSizes = recentHistory
          .filter(d => d.decision.action === "raise" && d.gameState.pot > 0)
          .map(d => d.decision.amount / d.gameState.pot);
        
        if (raiseSizes.length > 3) {
          
          const mean = raiseSizes.reduce((sum, size) => sum + size, 0) / raiseSizes.length;
          const variance = raiseSizes.reduce((sum, size) => sum + Math.pow(size - mean, 2), 0) / raiseSizes.length;
          const standardDeviation = Math.sqrt(variance);
          
          
          if (standardDeviation < 0.2) {
            predictabilityScore += 0.2;
          }
        }
      }
    } catch (err) {
      console.error("Error analyzing self patterns:", err);
    }
    
    return {
      predictabilityScore: Math.min(predictabilityScore, 1),
      aggression,
      foldFrequency
    };
  },
  
  determineCounterStrategy(opponentPatterns, handStrength, gameStage) {
    let strategyType = "balanced";
    let aggressionLevel = 0.5;
    let bluffFrequency = 0.2;
    
    
    switch (opponentPatterns.type) {
      case "aggressive":
        
        strategyType = "trapping";
        aggressionLevel = 0.3;
        bluffFrequency = 0.1;
        break;
        
      case "passive":
        
        strategyType = "value_betting";
        aggressionLevel = 0.7;
        bluffFrequency = 0.2;
        break;
        
      case "tight":
        
        strategyType = "bluffing";
        aggressionLevel = 0.6;
        bluffFrequency = 0.4;
        break;
        
      case "calling_station":
        
        strategyType = "value_only";
        aggressionLevel = 0.6;
        bluffFrequency = 0.05;
        break;
        
      case "balanced":
      default:
        
        strategyType = "balanced";
        aggressionLevel = 0.5;
        bluffFrequency = 0.2;
        break;
    }
    
    
    if (gameStage === "preflop") {
      
      aggressionLevel = Math.min(aggressionLevel + 0.1, 0.9);
      bluffFrequency = Math.max(bluffFrequency - 0.1, 0.05);
    } else if (gameStage === "river") {
      
      if (opponentPatterns.confidence > 0.5) {
        aggressionLevel = opponentPatterns.type === "aggressive" ? 0.3 : 0.7;
        bluffFrequency = opponentPatterns.type === "tight" ? 0.5 : 0.1;
      }
    }
    
    
    if (opponentPatterns.bluffFrequency > 0.4) {
      strategyType = "bluff_catching";
      aggressionLevel = 0.4;
    }
    
    
    if (opponentPatterns.checkRaiseFrequency > 0.2) {
      aggressionLevel = Math.max(aggressionLevel - 0.2, 0.2);
    }
    
    return {
      type: strategyType,
      aggressionLevel: aggressionLevel,
      bluffFrequency: bluffFrequency
    };
  },
  
  makeDecisionBasedOnPatterns(
    player, 
    callAmount, 
    potSize, 
    handStrength, 
    counterStrategy, 
    opponentPatterns, 
    currentHandActions, 
    gameStage,
    shouldBeUnpredictable
  ) {
    
    let callThreshold = 0.3;
    let raiseThreshold = 0.6;
    let bluffProbability = counterStrategy.bluffFrequency;
    
    
    switch (counterStrategy.type) {
      case "trapping":
        
        callThreshold = 0.2;
        raiseThreshold = 0.8; 
        break;
        
      case "value_betting":
        
        callThreshold = 0.4;
        raiseThreshold = 0.5; 
        break;
        
      case "bluffing":
        
        callThreshold = 0.25;
        raiseThreshold = 0.55;
        bluffProbability = 0.4;
        break;
        
      case "value_only":
        
        callThreshold = 0.4;
        raiseThreshold = 0.6;
        bluffProbability = 0.05;
        break;
        
      case "bluff_catching":
        
        callThreshold = 0.2;
        raiseThreshold = 0.7;
        break;
        
      case "balanced":
      default:
        
        callThreshold = 0.3;
        raiseThreshold = 0.6;
        break;
    }
    
    
    if (shouldBeUnpredictable) {
      const randomAdjustment = Math.random() * 0.2 - 0.1; 
      callThreshold += randomAdjustment;
      raiseThreshold += randomAdjustment;
    }
    
    
    if (callAmount > 0) {
      const potOdds = callAmount / (potSize + callAmount);
      
      callThreshold = Math.min(callThreshold, potOdds * 1.2);
    }
    
    
    if (callAmount === 0) {
      
      
      const shouldBluff = handStrength < 0.3 && Math.random() < bluffProbability;
      
      if (handStrength >= raiseThreshold || shouldBluff) {
        
        let betAmount;
        
        if (shouldBluff) {
          
          betAmount = Math.max(20, Math.floor(potSize * 0.65));
          player.logReasoningStep(`Pattern-based bluff in ${gameStage} against ${opponentPatterns.type} opponent`);
        } else {
          
          if (opponentPatterns.type === "aggressive") {
            
            betAmount = Math.max(20, Math.floor(potSize * 0.5));
          } else if (opponentPatterns.type === "passive" || opponentPatterns.type === "calling_station") {
            
            betAmount = Math.max(20, Math.floor(potSize * 0.8));
          } else {
            
            betAmount = Math.max(20, Math.floor(potSize * 0.65));
          }
          player.logReasoningStep(`Pattern-based value bet in ${gameStage} against ${opponentPatterns.type} opponent`);
        }
        
        return { action: "raise", amount: betAmount };
      } else {
        
        player.logReasoningStep(`Pattern-based check with hand strength ${handStrength.toFixed(2)}`);
        return { action: "check", amount: 0 };
      }
    } else {
      
      
      
      const shouldBluffRaise = handStrength < 0.3 && Math.random() < (bluffProbability / 2);
      
      if (handStrength >= raiseThreshold || shouldBluffRaise) {
        
        
        
        let raiseAmount;
        
        if (shouldBluffRaise) {
          
          raiseAmount = Math.max(callAmount * 2, Math.floor(potSize * 0.75));
          player.logReasoningStep(`Pattern-based bluff raise in ${gameStage} against ${opponentPatterns.type} opponent`);
        } else {
          
          if (opponentPatterns.type === "aggressive") {
            
            raiseAmount = Math.max(callAmount * 2, Math.floor(potSize * 0.9));
          } else if (opponentPatterns.type === "passive" || opponentPatterns.type === "calling_station") {
            
            raiseAmount = Math.max(callAmount * 2, Math.floor(potSize * 0.8));
          } else {
            
            raiseAmount = Math.max(callAmount * 2, Math.floor(potSize * 0.7));
          }
          player.logReasoningStep(`Pattern-based value raise in ${gameStage} against ${opponentPatterns.type} opponent`);
        }
        
        return { action: "raise", amount: raiseAmount };
      } else if (handStrength >= callThreshold) {
        
        player.logReasoningStep(`Pattern-based call with hand strength ${handStrength.toFixed(2)}`);
        return { action: "call", amount: callAmount };
      } else {
        
        player.logReasoningStep(`Pattern-based fold with hand strength ${handStrength.toFixed(2)}`);
        return { action: "fold", amount: 0 };
      }
    }
  }
}; 