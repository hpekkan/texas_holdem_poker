window.HeuristicAlgorithm = {
  makeHeuristicDecision(player, callAmount, communityCards, potSize, game) {
    try {
      player.logReasoningStep("Starting Advanced Heuristic decision making");
      
      // Core evaluation metrics
      const handStrength = player.evaluateCompleteHand(player.cards, communityCards);
      player.logReasoningStep(`Current hand strength: ${handStrength.toFixed(4)}`);
      
      // Game stage identification
      const gameStage = this.determineGameStage(communityCards);
      player.logReasoningStep(`Current game stage: ${gameStage}`);
      
      // Position analysis
      const position = this.analyzePosition(player, game);
      player.logReasoningStep(`Position: ${position}`);
      
      // Pot odds calculation
      const potOdds = callAmount > 0 ? callAmount / (potSize + callAmount) : 0;
      player.logReasoningStep(`Pot odds: ${potOdds.toFixed(4)}`);
      
      // Board analysis
      const boardTexture = this.analyzeBoardTexture(communityCards);
      player.logReasoningStep(`Board texture: ${JSON.stringify(boardTexture)}`);
      
      // Draw potential analysis
      const draws = this.identifyDraws(player.cards, communityCards);
      if (draws.hasFlushDraw) player.logReasoningStep("Has flush draw");
      if (draws.hasStraightDraw) player.logReasoningStep("Has straight draw");
      if (draws.hasOEStraightDraw) player.logReasoningStep("Has open-ended straight draw");
      
      // NEW: Opponent modeling
      const opponentTendencies = this.modelOpponents(player, game);
      player.logReasoningStep(`Opponent tendencies: ${JSON.stringify(opponentTendencies)}`);
      
      // NEW: Implied odds calculation
      const impliedOdds = this.calculateImpliedOdds(player, callAmount, potSize, handStrength, draws, opponentTendencies);
      player.logReasoningStep(`Implied odds ratio: ${impliedOdds.toFixed(2)}`);
      
      // NEW: Stack-to-pot ratio consideration
      const spr = player.chips / potSize;
      player.logReasoningStep(`Stack-to-pot ratio: ${spr.toFixed(2)}`);
      
      // Stage-specific decision making with enhanced logic
      let decision;
      
      switch (gameStage) {
        case "preflop":
          decision = this.makePreflopDecision(player, callAmount, potSize, position, opponentTendencies, spr);
          break;
        case "flop":
          decision = this.makeFlopDecision(player, callAmount, potSize, handStrength, boardTexture, draws, position, opponentTendencies, impliedOdds, spr);
          break;
        case "turn":
          decision = this.makeTurnDecision(player, callAmount, potSize, handStrength, boardTexture, draws, position, opponentTendencies, impliedOdds, spr);
          break;
        case "river":
          decision = this.makeRiverDecision(player, callAmount, potSize, handStrength, boardTexture, position, opponentTendencies, spr);
          break;
        default:
          // Fallback to simple decision
          decision = this.makeSimpleDecision(player, callAmount, potSize, handStrength);
      }
      
      return decision;
    } catch (error) {
      console.error("Error in Advanced Heuristic decision making:", error);
      
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
  
  // NEW: Model opponents based on past actions
  modelOpponents(player, game) {
    let aggressiveness = 0.5; // Neutral default
    let passiveness = 0.5;
    let bluffTendency = 0.5;
    
    try {
      // Use game history if available
      if (game && game.actionHistory && Array.isArray(game.actionHistory)) {
        const recentActions = game.actionHistory.slice(-10); // Last 10 actions
        
        let raiseCount = 0;
        let checkCallCount = 0;
        let foldCount = 0;
        
        for (const action of recentActions) {
          if (action.action === "raise" || action.action === "bet") {
            raiseCount++;
          } else if (action.action === "call" || action.action === "check") {
            checkCallCount++;
          } else if (action.action === "fold") {
            foldCount++;
          }
        }
        
        const totalActions = recentActions.length;
        if (totalActions > 0) {
          aggressiveness = raiseCount / totalActions;
          passiveness = checkCallCount / totalActions;
          bluffTendency = Math.min(0.8, (raiseCount - foldCount) / totalActions + 0.3);
        }
      }
      
      // Check player's recorded opponent models if available
      if (player.gameState && player.gameState.opponentModels) {
        // Take the average of all opponent models
        let modelCount = 0;
        let aggSum = 0;
        let passSum = 0;
        let bluffSum = 0;
        
        for (const opId in player.gameState.opponentModels) {
          const model = player.gameState.opponentModels[opId];
          if (model) {
            modelCount++;
            aggSum += model.aggressiveness || 0.5;
            passSum += model.passiveness || 0.5;
            bluffSum += model.bluffTendency || 0.5;
          }
        }
        
        if (modelCount > 0) {
          // Weight the existing models more heavily than current game observation
          const existingWeight = 0.7;
          const currentWeight = 0.3;
          
          aggressiveness = (aggSum / modelCount) * existingWeight + aggressiveness * currentWeight;
          passiveness = (passSum / modelCount) * existingWeight + passiveness * currentWeight;
          bluffTendency = (bluffSum / modelCount) * existingWeight + bluffTendency * currentWeight;
        }
      }
      
      return {
        aggressiveness,
        passiveness,
        bluffTendency
      };
    } catch (error) {
      console.error("Error modeling opponents:", error);
      return { aggressiveness: 0.5, passiveness: 0.5, bluffTendency: 0.5 };
    }
  },
  
  // NEW: Calculate implied odds for drawing situations
  calculateImpliedOdds(player, callAmount, potSize, handStrength, draws, opponentTendencies) {
    try {
      // Base implied odds ratio
      let impliedOddsRatio = 1.0;
      
      // No draws means no implied odds benefit
      if (!draws.hasFlushDraw && !draws.hasStraightDraw && !draws.hasOEStraightDraw) {
        return impliedOddsRatio;
      }
      
      // Calculate base implied odds from draw strength
      if (draws.hasOEStraightDraw) {
        impliedOddsRatio += 0.8; // Strongest draw type
      } else if (draws.hasFlushDraw) {
        impliedOddsRatio += 0.6; // Strong draw
      } else if (draws.hasStraightDraw) {
        impliedOddsRatio += 0.4; // Decent draw
      }
      
      // Adjust based on opponent tendencies
      // Passive opponents increase implied odds (more likely to pay off when we hit)
      // Aggressive opponents decrease implied odds (harder to extract value)
      impliedOddsRatio *= (1 + (opponentTendencies.passiveness - 0.5));
      
      // Adjust based on stack sizes - deeper stacks mean better implied odds
      const stackToPotRatio = player.chips / potSize;
      if (stackToPotRatio > 5) {
        impliedOddsRatio *= 1.2; // Significant boost for deep stacks
      } else if (stackToPotRatio < 2) {
        impliedOddsRatio *= 0.8; // Reduction for shallow stacks
      }
      
      // Normalize to reasonable values
      return Math.max(0.5, Math.min(3.0, impliedOddsRatio));
    } catch (error) {
      console.error("Error calculating implied odds:", error);
      return 1.0;
    }
  },
  
  // IMPROVED: More advanced board texture analysis
  analyzeBoardTexture(communityCards) {
    if (!communityCards || communityCards.length < 3) {
      return { 
        paired: false, 
        suited: false, 
        connected: false, 
        highCard: false,
        drawHeavy: false,
        wetness: 0.0,
        dangerLevel: 0.0
      };
    }
    
    // Check for paired board
    const values = communityCards.map(card => card.value);
    const uniqueValues = new Set(values);
    const paired = uniqueValues.size < communityCards.length;
    const trips = values.some(v => values.filter(x => x === v).length >= 3);
    
    // Check for flush possibilities
    const suits = communityCards.map(card => card.suit);
    const suitCounts = {};
    suits.forEach(suit => {
      suitCounts[suit] = (suitCounts[suit] || 0) + 1;
    });
    const maxSuitCount = Math.max(...Object.values(suitCounts));
    const suited = maxSuitCount >= 3;
    
    // Convert card values to numeric
    const numericValues = values.map(v => {
      if (v === "A") return 14;
      if (v === "K") return 13;
      if (v === "Q") return 12;
      if (v === "J") return 11;
      if (v === "T") return 10;
      return parseInt(v);
    }).sort((a, b) => a - b);
    
    // Check for connected cards and straight possibilities
    let connected = false;
    let straightPossible = false;
    
    // Count gaps between consecutive cards
    let gapCount = 0;
    for (let i = 0; i < numericValues.length - 1; i++) {
      const gap = numericValues[i + 1] - numericValues[i];
      if (gap <= 2) {
        connected = true;
      }
      if (gap <= 4) {
        straightPossible = true;
      }
      gapCount += Math.min(gap - 1, 4); // Cap large gaps
    }
    
    // Calculate board wetness - higher means more draw potential
    const wetness = (suited ? 0.4 : 0) + 
                   (connected ? 0.3 : 0) + 
                   (straightPossible ? 0.2 : 0) -
                   (paired ? 0.2 : 0) -
                   (trips ? 0.3 : 0);
    
    // High card presence
    const highCard = numericValues.some(v => v >= 10);
    const highCardCount = numericValues.filter(v => v >= 10).length;
    
    // Calculate danger level - how many possible strong hands could exist
    const dangerLevel = (paired ? 0.3 : 0) + 
                       (trips ? 0.5 : 0) + 
                       (suited ? 0.3 : 0) + 
                       (connected ? 0.2 : 0) +
                       (highCardCount * 0.1);
    
    return { 
      paired, 
      suited, 
      connected, 
      highCard,
      drawHeavy: wetness > 0.5,
      wetness: Math.max(0, Math.min(1, wetness)),
      dangerLevel: Math.max(0, Math.min(1, dangerLevel))
    };
  },
  
  // Rest of the original methods
  determineGameStage(communityCards) {
    const count = communityCards.length;
    if (count === 0) return "preflop";
    if (count === 3) return "flop";
    if (count === 4) return "turn";
    if (count === 5) return "river";
    return "unknown";
  },
  
  analyzePosition(player, game) {
    if (!game || !game.players) return "unknown";
    
    try {
      
      let activePlayers = [];
      try {
        
        if (game && typeof game.getActivePlayers === 'function') {
          activePlayers = game.getActivePlayers();
        } else if (game && Array.isArray(game.players)) {
          
          activePlayers = game.players.filter(p => !p.folded);
        } else {
          return "unknown";
        }
      } catch (err) {
        console.error("Error getting active players:", err);
        
        activePlayers = game.players || [];
      }
      
      if (activePlayers.length === 0) return "unknown";
      
      const playerCount = activePlayers.length;
      const buttonIndex = game.buttonIndex || game.dealerIndex || 0;
      
      
      let playerIndex = -1;
      for (let i = 0; i < activePlayers.length; i++) {
        
        if (activePlayers[i].name === player.name && 
            activePlayers[i].position === player.position) {
          playerIndex = i;
          break;
        }
      }
      
      if (playerIndex === -1) return "unknown";
      
      
      let relativePosition = (playerIndex - buttonIndex + playerCount) % playerCount;
      
      
      
      
      
      if (relativePosition <= Math.floor(playerCount / 3)) {
        return "early";
      } else if (relativePosition <= Math.floor(2 * playerCount / 3)) {
        return "middle";
      } else {
        return "late";
      }
    } catch (error) {
      console.error("Error analyzing position:", error);
      return "unknown";
    }
  },
  
  identifyDraws(holeCards, communityCards) {
    if (communityCards.length < 3) {
      return { hasFlushDraw: false, hasStraightDraw: false, hasOEStraightDraw: false };
    }
    
    const allCards = [...holeCards, ...communityCards];
    
    
    const suits = allCards.map(card => card.suit);
    const suitCounts = {};
    suits.forEach(suit => {
      suitCounts[suit] = (suitCounts[suit] || 0) + 1;
    });
    const hasFlushDraw = Object.values(suitCounts).some(count => count === 4);
    
    
    const numericValues = allCards.map(card => {
      if (card.value === "A") return 14;
      if (card.value === "K") return 13;
      if (card.value === "Q") return 12;
      if (card.value === "J") return 11;
      if (card.value === "T") return 10;
      return parseInt(card.value);
    });
    
    
    if (numericValues.includes(14)) {
      numericValues.push(1);
    }
    
    
    const uniqueValues = [...new Set(numericValues)].sort((a, b) => a - b);
    
    
    let maxConsecutive = 1;
    let current = 1;
    for (let i = 1; i < uniqueValues.length; i++) {
      if (uniqueValues[i] === uniqueValues[i-1] + 1) {
        current++;
      } else {
        maxConsecutive = Math.max(maxConsecutive, current);
        current = 1;
      }
    }
    maxConsecutive = Math.max(maxConsecutive, current);
    
    
    let hasOEStraightDraw = false;
    let hasStraightDraw = false;
    
    if (maxConsecutive >= 4) {
      hasOEStraightDraw = true;
    } else if (maxConsecutive === 3) {
      
      for (let i = 0; i < uniqueValues.length - 2; i++) {
        if (uniqueValues[i] + 2 === uniqueValues[i+1] && uniqueValues[i+1] + 1 === uniqueValues[i+2]) {
          hasStraightDraw = true;
          break;
        }
        if (uniqueValues[i] + 1 === uniqueValues[i+1] && uniqueValues[i+1] + 2 === uniqueValues[i+2]) {
          hasStraightDraw = true;
          break;
        }
      }
    }
    
    return { hasFlushDraw, hasStraightDraw, hasOEStraightDraw };
  },
  
  // IMPROVED: Updated makePreflopDecision with more hand values and position adjustments
  makePreflopDecision(player, callAmount, potSize, position, opponentTendencies, spr) {
    // Extract cards
    const card1 = player.cards[0];
    const card2 = player.cards[1];
    
    // Convert to numeric values
    const getValue = (value) => {
      if (value === "A") return 14;
      if (value === "K") return 13;
      if (value === "Q") return 12;
      if (value === "J") return 11;
      if (value === "T") return 10;
      return parseInt(value);
    };
    
    const val1 = getValue(card1.value);
    const val2 = getValue(card2.value);
    
    // Check for pairs
    const hasPair = val1 === val2;
    
    // Check for suited cards
    const suited = card1.suit === card2.suit;
    
    // Order by value
    const highCard = Math.max(val1, val2);
    const lowCard = Math.min(val1, val2);
    
    // Check for connectedness
    const connected = highCard - lowCard === 1;
    const oneGap = highCard - lowCard === 2;
    
    // Hand strength calculation - more nuanced than before
    let handStrength = 0;
    
    // Pairs strength
    if (hasPair) {
      if (lowCard >= 10) {
        // Premium pairs (TT+)
        handStrength = 0.8 + ((lowCard - 10) / 20);
      } else {
        // Medium to small pairs
        handStrength = 0.5 + ((lowCard - 2) / 16);
      }
    } 
    // High cards
    else if (highCard === 14) { // Ace high
      if (lowCard >= 10) {
        // AK, AQ, AJ, AT
        handStrength = 0.7 + ((lowCard - 10) / 40);
        if (suited) handStrength += 0.05;
      } else {
        // Ax suited and unsuited
        handStrength = 0.3 + (lowCard / 24);
        if (suited) handStrength += 0.1;
      }
    } 
    // Face cards
    else if (highCard >= 11 && lowCard >= 10) {
      // KQ, KJ, KT, QJ, QT, JT
      handStrength = 0.5 + ((highCard + lowCard - 20) / 40);
      if (suited) handStrength += 0.08;
    }
    // Connected and suited combinations
    else {
      // Base value from high card
      handStrength = 0.1 + (highCard / 28);
      
      // Adjustments for suitedness and connectedness
      if (suited) handStrength += 0.1;
      if (connected) handStrength += 0.08;
      else if (oneGap) handStrength += 0.04;
    }
    
    // Position adjustments
    if (position === "early") {
      handStrength -= 0.08; // Significant penalty for early position
    } else if (position === "middle") {
      handStrength -= 0.04; // Small penalty for middle position
    } else if (position === "late") {
      handStrength += 0.06; // Bonus for late position
    }
    
    // Opponent tendencies adjustments
    if (opponentTendencies.passiveness > 0.7) {
      // Against passive opponents, we can play more hands
      handStrength += 0.05;
    } else if (opponentTendencies.aggressiveness > 0.7) {
      // Against aggressive opponents, we need stronger hands
      handStrength -= 0.05;
    }
    
    // SPR adjustments for deep or shallow stacks
    if (spr > 20) {
      // Deep stacks favor speculative hands
      if (suited || connected) handStrength += 0.05;
    } else if (spr < 10) {
      // Shallow stacks favor high cards and pairs
      if (hasPair || highCard >= 12) handStrength += 0.03;
      else if (suited || connected) handStrength -= 0.04;
    }
    
    player.logReasoningStep(`Preflop hand strength: ${handStrength.toFixed(4)}`);
    
    // Decision making based on calculated hand strength
    if (callAmount === 0) {
      // Unopened pot
      if (handStrength > 0.8) {
        // Premium hands - raise big
        const raiseAmount = Math.max(40, potSize * 3);
        player.logReasoningStep(`Premium hand, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (handStrength > 0.65) {
        // Strong hands - standard raise
        const raiseAmount = Math.max(30, potSize * 2.5);
        player.logReasoningStep(`Strong hand, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (handStrength > 0.5) {
        // Playable hands - smaller raise
        const raiseAmount = Math.max(20, potSize * 2);
        player.logReasoningStep(`Playable hand, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (handStrength > 0.35 && position === "late") {
        // Speculative hands in late position - min raise
        const raiseAmount = Math.max(10, potSize);
        player.logReasoningStep(`Speculative hand in late position, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else {
        // Weak hands - check/fold
        player.logReasoningStep(`Weak hand, checking`);
        return { action: "check", amount: 0 };
      }
    } else {
      // Facing a bet
      const potOdds = callAmount / (potSize + callAmount);
      
      if (handStrength > 0.85) {
        // Premium hands - raise for value
        const raiseAmount = Math.max(callAmount * 3, potSize);
        player.logReasoningStep(`Premium hand vs bet, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (handStrength > 0.7) {
        // Strong hands - smaller raise
        const raiseAmount = Math.max(callAmount * 2.5, potSize * 0.75);
        player.logReasoningStep(`Strong hand vs bet, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (handStrength > 0.5) {
        // Good hands - call
        player.logReasoningStep(`Good hand, calling ${callAmount}`);
        return { action: "call", amount: callAmount };
      } else if (handStrength > 0.4 && potOdds < 0.15) {
        // Speculative hands with good pot odds - call
        player.logReasoningStep(`Speculative hand with good pot odds, calling ${callAmount}`);
        return { action: "call", amount: callAmount };
      } else if (handStrength > 0.3 && position === "late" && potOdds < 0.1) {
        // Very cheap call in late position
        player.logReasoningStep(`Marginal hand in late position, cheap call of ${callAmount}`);
        return { action: "call", amount: callAmount };
      } else {
        // Fold everything else
        player.logReasoningStep(`Weak hand against bet, folding`);
        return { action: "fold", amount: 0 };
      }
    }
  },
  
  // IMPROVED: Updated flop decision logic with new parameters
  makeFlopDecision(player, callAmount, potSize, handStrength, boardTexture, draws, position, opponentTendencies, impliedOdds, spr) {
    player.logReasoningStep(`Flop decision with hand strength ${handStrength.toFixed(4)}`);
    
    // Calculate effective hand strength with draws
    let effectiveHandStrength = handStrength;
    
    // Add value for draws
    if (draws.hasFlushDraw) {
      effectiveHandStrength += 0.15;
      player.logReasoningStep("Boosting effective hand strength for flush draw");
    }
    
    if (draws.hasOEStraightDraw) {
      effectiveHandStrength += 0.12;
      player.logReasoningStep("Boosting effective hand strength for open-ended straight draw");
    } else if (draws.hasStraightDraw) {
      effectiveHandStrength += 0.08;
      player.logReasoningStep("Boosting effective hand strength for gutshot straight draw");
    }
    
    // Adjust for board texture
    if (boardTexture.paired && handStrength < 0.6) {
      effectiveHandStrength -= 0.05; // Reduce strength on paired boards with mediocre hands
    }
    
    if (boardTexture.dangerLevel > 0.7 && handStrength < 0.7) {
      effectiveHandStrength -= 0.1; // Dangerous board with medium hand
    }
    
    // Position adjustments
    if (position === "late") {
      effectiveHandStrength += 0.05; // Bonus for position
    } else if (position === "early") {
      effectiveHandStrength -= 0.03; // Penalty for early position
    }
    
    // Pot odds calculation
    const potOdds = callAmount > 0 ? callAmount / (potSize + callAmount) : 0;
    
    // Calculate draw odds
    let drawEquity = 0;
    if (draws.hasFlushDraw) drawEquity = Math.max(drawEquity, 0.35);
    if (draws.hasOEStraightDraw) drawEquity = Math.max(drawEquity, 0.31);
    if (draws.hasStraightDraw) drawEquity = Math.max(drawEquity, 0.17);
    
    // Apply implied odds multiplier to draw equity for decision making
    const adjustedDrawEquity = drawEquity * impliedOdds;
    
    // Opponent modeling adjustments
    let bluffFrequency = 0.1; // Base bluff frequency
    if (opponentTendencies.passiveness > 0.7) {
      bluffFrequency += 0.1; // Bluff more vs passive opponents
    }
    if (boardTexture.wetness > 0.7) {
      bluffFrequency -= 0.05; // Bluff less on wet boards
    }
    
    // Decision making based on calculated values
    if (callAmount === 0) {
      // We're first to act or checked to
      if (effectiveHandStrength > 0.7) {
        // Strong hand - value bet
        const betSize = Math.max(Math.floor(potSize * 0.7), 20);
        player.logReasoningStep(`Strong hand on flop, betting ${betSize}`);
        return { action: "raise", amount: betSize };
      } else if (effectiveHandStrength > 0.5 || 
                (draws.hasFlushDraw || draws.hasOEStraightDraw)) {
        // Medium hand or strong draw - smaller bet
        const betSize = Math.max(Math.floor(potSize * 0.5), 15);
        player.logReasoningStep(`Medium hand or draw on flop, betting ${betSize}`);
        return { action: "raise", amount: betSize };
      } else if (boardTexture.wetness < 0.3 && position === "late" && Math.random() < bluffFrequency) {
        // Bluff on dry boards in position sometimes
        const betSize = Math.max(Math.floor(potSize * 0.6), 15);
        player.logReasoningStep(`Bluffing on dry flop in position, betting ${betSize}`);
        return { action: "raise", amount: betSize };
      } else {
        // Check with weak hands
        player.logReasoningStep("Checking with weak hand or out of position");
        return { action: "check", amount: 0 };
      }
    } else {
      // Facing a bet
      if (effectiveHandStrength > 0.75) {
        // Strong hand - raise for value
        const raiseAmount = Math.min(player.chips, Math.max(callAmount * 2.5, Math.floor(potSize * 0.8)));
        player.logReasoningStep(`Strong hand vs bet on flop, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (effectiveHandStrength > 0.6) {
        // Good hand - call
        player.logReasoningStep(`Good hand, calling ${callAmount}`);
        return { action: "call", amount: callAmount };
      } else if (adjustedDrawEquity > potOdds + 0.05) {
        // +EV draw with implied odds
        player.logReasoningStep(`+EV draw with implied odds, calling ${callAmount}`);
        return { action: "call", amount: callAmount };
      } else if (effectiveHandStrength > 0.4 && potOdds < 0.2) {
        // Marginal hand with decent pot odds
        player.logReasoningStep(`Marginal hand with acceptable pot odds, calling ${callAmount}`);
        return { action: "call", amount: callAmount };
      } else if (position === "late" && opponentTendencies.bluffTendency > 0.7 && 
                Math.random() < 0.3 && callAmount < potSize * 0.3) {
        // Float against likely bluffers in position occasionally
        player.logReasoningStep(`Floating against likely bluff in position, calling ${callAmount}`);
        return { action: "call", amount: callAmount };
      } else {
        // Fold everything else
        player.logReasoningStep("Folding weak hand against bet");
        return { action: "fold", amount: 0 };
      }
    }
  },
  
  // You can similarly update the makeTurnDecision and makeRiverDecision methods
  // ... existing code ...
// ... existing code ...
  
  makeSimpleDecision(player, callAmount, potSize, handStrength) {
    
    
    
    const potOdds = callAmount > 0 ? callAmount / (potSize + callAmount) : 0;
    
    if (handStrength > 0.8) {
      
      if (callAmount === 0) {
        const betAmount = Math.floor(potSize * 0.75);
        return { action: "raise", amount: betAmount };
      } else {
        const raiseAmount = Math.min(player.chips, Math.max(callAmount * 2.5, potSize));
        return { action: "raise", amount: raiseAmount };
      }
    } else if (handStrength > 0.6) {
      
      if (callAmount === 0) {
        const betAmount = Math.floor(potSize * 0.5);
        return { action: "raise", amount: betAmount };
      } else if (potOdds <= 0.3) {
        return { action: "call", amount: callAmount };
      } else {
        return { action: "fold", amount: 0 };
      }
    } else if (handStrength > 0.4) {
      
      if (callAmount === 0) {
        return { action: "check", amount: 0 };
      } else if (potOdds <= 0.15) {
        return { action: "call", amount: callAmount };
      } else {
        return { action: "fold", amount: 0 };
      }
    } else {
      
      if (callAmount === 0) {
        return { action: "check", amount: 0 };
      } else {
        return { action: "fold", amount: 0 };
      }
    }
  }
}; 