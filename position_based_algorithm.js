
const PositionBasedAlgorithm = {
  makePositionBasedDecision(player, callAmount, communityCards, potSize, game) {
    try {
      player.logReasoningStep("Starting Position-based decision making");
      
      const handStrength = player.evaluateCompleteHand(player.cards, communityCards);
      player.logReasoningStep(`Current hand strength: ${handStrength.toFixed(4)}`);
      
      const gameStage = this.determineGameStage(communityCards);
      player.logReasoningStep(`Current game stage: ${gameStage}`);
      
      const position = this.analyzePosition(player, game);
      player.logReasoningStep(`Position: ${position}`);
      
      const potOdds = callAmount > 0 ? callAmount / (potSize + callAmount) : 0;
      player.logReasoningStep(`Pot odds: ${potOdds.toFixed(4)}`);
      
      const draws = this.identifyDraws(player.cards, communityCards);
      if (draws.hasDraw) {
        player.logReasoningStep(`Draw potential: ${draws.type}`);
      }
      
      const adjustedStrength = this.adjustHandStrengthByPosition(handStrength, position, gameStage);
      player.logReasoningStep(`Position-adjusted strength: ${adjustedStrength.toFixed(4)}`);
      
      if (gameStage === "preflop") {
        return this.makePreflopPositionDecision(player, callAmount, potSize, position);
      } else if (gameStage === "flop") {
        return this.makePostflopPositionDecision(player, callAmount, potSize, adjustedStrength, position, draws, "flop");
      } else if (gameStage === "turn") {
        return this.makePostflopPositionDecision(player, callAmount, potSize, adjustedStrength, position, draws, "turn");
      } else {
        return this.makePostflopPositionDecision(player, callAmount, potSize, adjustedStrength, position, draws, "river");
      }
    } catch (error) {
      console.error("Error in Position-based decision making:", error);
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
  
  analyzePosition(player, game) {
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
  
  identifyDraws(holeCards, communityCards) {
    if (communityCards.length === 0 || communityCards.length === 5) {
      return { hasDraw: false, type: "none", strength: 0 };
    }
    
    const allCards = [...holeCards, ...communityCards];
    
    const suitCounts = { 'h': 0, 'd': 0, 'c': 0, 's': 0 };
    allCards.forEach(card => {
      suitCounts[card.suit]++;
    });
    
    const flushDraw = Object.values(suitCounts).some(count => count === 4);
    
    const getValue = (value) => {
      if (value === "A") return 14;
      if (value === "K") return 13;
      if (value === "Q") return 12;
      if (value === "J") return 11;
      if (value === "T") return 10;
      return parseInt(value);
    };
    
    const values = [...new Set(allCards.map(card => getValue(card.value)))].sort((a, b) => a - b);
    
    if (values.includes(14)) {
      values.unshift(1);
    }
    
    let straightDraw = false;
    let gutshot = false;
    
    for (let i = 0; i <= values.length - 4; i++) {
      if (values[i+3] - values[i] === 3) {
        straightDraw = true;
        break;
      }
    }
    
    if (!straightDraw) {
      for (let i = 0; i <= values.length - 4; i++) {
        if (values[i+3] - values[i] === 4) {
          gutshot = true;
          break;
        }
      }
    }
    
    if (flushDraw && straightDraw) {
      return { hasDraw: true, type: "straight_flush_draw", strength: 0.9 };
    } else if (flushDraw) {
      return { hasDraw: true, type: "flush_draw", strength: 0.7 };
    } else if (straightDraw) {
      return { hasDraw: true, type: "open_straight_draw", strength: 0.6 };
    } else if (gutshot) {
      return { hasDraw: true, type: "gutshot", strength: 0.3 };
    }
    
    return { hasDraw: false, type: "none", strength: 0 };
  },
  
  adjustHandStrengthByPosition(handStrength, position, gameStage) {
    let adjustment = 0;
    
    if (position === "button" || position === "late") {
      adjustment = 0.07;
    } else if (position === "middle") {
      adjustment = 0.03;
    } else if (position === "early") {
      adjustment = -0.03;
    } else if (position === "small_blind") {
      adjustment = -0.05;
    } else if (position === "big_blind") {
      adjustment = -0.02;
    }
    
    if (gameStage === "preflop") {
      adjustment *= 1.5;
    } else if (gameStage === "river") {
      adjustment *= 0.7;
    }
    
    let adjustedStrength = handStrength + adjustment;
    
    return Math.max(0, Math.min(1, adjustedStrength));
  },
  
  makePreflopPositionDecision(player, callAmount, potSize, position) {
    const card1 = player.cards[0];
    const card2 = player.cards[1];
    
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
    
    const hasPair = val1 === val2;
    const sameSuit = card1.suit === card2.suit;
    const connected = Math.abs(val1 - val2) === 1;
    const oneGapper = Math.abs(val1 - val2) === 2;
    
    let handScore = this.calculatePreflopHandScore(
      Math.max(val1, val2),
      Math.min(val1, val2),
      hasPair,
      sameSuit,
      connected,
      oneGapper,
      position
    );
    
    player.logReasoningStep(`Preflop hand score: ${handScore.toFixed(2)}`);
    
    if (callAmount === 0) {
      if (handScore >= 0.6) {
        const raiseAmount = Math.max(20, Math.floor(potSize * 0.75));
        player.logReasoningStep(`Strong hand in ${position} position, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (handScore >= 0.4) {
        const raiseAmount = Math.max(20, Math.floor(potSize * 0.5));
        player.logReasoningStep(`Medium hand in ${position} position, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (handScore >= 0.2) {
        player.logReasoningStep(`Marginal hand in ${position} position, checking`);
        return { action: "check", amount: 0 };
      } else {
        player.logReasoningStep(`Weak hand in ${position} position, checking`);
        return { action: "check", amount: 0 };
      }
    } else {
      const potOdds = callAmount / (potSize + callAmount);
      player.logReasoningStep(`Pot odds: ${potOdds.toFixed(4)}`);
      
      if (handScore >= 0.7) {
        const raiseAmount = Math.max(callAmount * 2, Math.floor(potSize * 0.75));
        player.logReasoningStep(`Strong hand in ${position} position, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (handScore >= 0.4 || (handScore >= 0.3 && potOdds <= 0.2)) {
        player.logReasoningStep(`Decent hand in ${position} position, calling ${callAmount}`);
        return { action: "call", amount: callAmount };
      } else if (position === "big_blind" && potOdds <= 0.1 && handScore >= 0.2) {
        player.logReasoningStep(`Getting good pot odds in big blind with marginal hand, calling ${callAmount}`);
        return { action: "call", amount: callAmount };
      } else {
        player.logReasoningStep(`Weak hand in ${position} position, folding`);
        return { action: "fold", amount: 0 };
      }
    }
  },
  
  makePostflopPositionDecision(player, callAmount, potSize, handStrength, position, draws, gameStage) {
    let effectiveHandStrength = handStrength;
    
    if (draws.hasDraw) {
      const remainingCards = gameStage === "flop" ? 2 : gameStage === "turn" ? 1 : 0;
      let drawFactor = draws.strength * remainingCards / 2;
      
      effectiveHandStrength = Math.max(effectiveHandStrength, handStrength + drawFactor);
      player.logReasoningStep(`Adjusted strength with draw potential: ${effectiveHandStrength.toFixed(4)}`);
    }
    
    const potOdds = callAmount > 0 ? callAmount / (potSize + callAmount) : 0;
    
    player.logReasoningStep(`Effective hand strength: ${effectiveHandStrength.toFixed(4)}, Pot odds: ${potOdds.toFixed(4)}`);
    
    if (callAmount === 0) {
      if (effectiveHandStrength >= 0.8) {
        const raiseAmount = Math.max(20, Math.floor(potSize * 0.75));
        player.logReasoningStep(`Strong hand on ${gameStage}, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (effectiveHandStrength >= 0.65) {
        const raiseAmount = Math.max(20, Math.floor(potSize * 0.5));
        player.logReasoningStep(`Good hand on ${gameStage}, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (effectiveHandStrength >= 0.5 && (position === "button" || position === "late")) {
        const raiseAmount = Math.max(20, Math.floor(potSize * 0.5));
        player.logReasoningStep(`Medium hand in position on ${gameStage}, raising to ${raiseAmount} to take advantage of position`);
        return { action: "raise", amount: raiseAmount };
      } else if (effectiveHandStrength >= 0.4 && draws.hasDraw && draws.type !== "gutshot") {
        const raiseAmount = Math.max(20, Math.floor(potSize * 0.5));
        player.logReasoningStep(`Drawing hand on ${gameStage}, semi-bluff raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else {
        player.logReasoningStep(`Checking on ${gameStage} with hand strength ${effectiveHandStrength.toFixed(4)}`);
        return { action: "check", amount: 0 };
      }
    } else {
      if (effectiveHandStrength >= 0.8) {
        const raiseAmount = Math.max(callAmount * 2, Math.floor(potSize * 0.75));
        player.logReasoningStep(`Strong hand on ${gameStage}, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (effectiveHandStrength >= 0.6) {
        if (position === "button" || position === "late") {
          const raiseAmount = Math.max(callAmount * 2, Math.floor(potSize * 0.6));
          player.logReasoningStep(`Good hand in position on ${gameStage}, raising to ${raiseAmount}`);
          return { action: "raise", amount: raiseAmount };
        } else {
          player.logReasoningStep(`Good hand out of position on ${gameStage}, calling ${callAmount}`);
          return { action: "call", amount: callAmount };
        }
      } else if (effectiveHandStrength >= 0.4 && potOdds <= 0.2) {
        player.logReasoningStep(`Medium hand on ${gameStage} with good pot odds, calling ${callAmount}`);
        return { action: "call", amount: callAmount };
      } else if (draws.hasDraw && draws.type !== "gutshot") {
        const drawOdds = draws.type === "flush_draw" ? 0.35 : draws.type === "open_straight_draw" ? 0.31 : 0.17;
        
        if (drawOdds > potOdds) {
          player.logReasoningStep(`Drawing hand on ${gameStage} with favorable odds, calling ${callAmount}`);
          return { action: "call", amount: callAmount };
        } else if (position === "button" || position === "late") {
          const raiseAmount = Math.max(callAmount * 2, Math.floor(potSize * 0.5));
          const raiseChance = 0.3;
          
          if (Math.random() < raiseChance) {
            player.logReasoningStep(`Drawing hand in position on ${gameStage}, semi-bluff raising to ${raiseAmount}`);
            return { action: "raise", amount: raiseAmount };
          } else {
            player.logReasoningStep(`Drawing hand on ${gameStage}, calling ${callAmount}`);
            return { action: "call", amount: callAmount };
          }
        }
      }
      
      player.logReasoningStep(`Weak hand on ${gameStage}, folding`);
      return { action: "fold", amount: 0 };
    }
  },
  
  calculatePreflopHandScore(highCard, lowCard, hasPair, sameSuit, connected, oneGapper, position) {
    let score = 0;
    
    if (hasPair) {
      score = 0.5 + (highCard / 14) * 0.5;
    } else {
      score = (highCard / 14) * 0.5 + (lowCard / 14) * 0.2;
      
      if (sameSuit) {
        score += 0.1;
      }
      
      if (connected) {
        score += 0.1;
      } else if (oneGapper) {
        score += 0.05;
      }
      
      if (highCard >= 13 && lowCard >= 10) {
        score += 0.1;
      }
    }
    
    const isSuitedConnector = sameSuit && connected;
    const isSuitedAce = sameSuit && highCard === 14;
    
    if (position === "button" || position === "late") {
      score += 0.1;
      
      if (isSuitedConnector) {
        score += 0.05;
      }
      
      if (isSuitedAce) {
        score += 0.05;
      }
    } else if (position === "middle") {
      score += 0.05;
    } else if (position === "early") {
      score -= 0.05;
    } else if (position === "small_blind") {
      score -= 0.1;
    } else if (position === "big_blind") {
      score -= 0.05;
    }
    
    return Math.max(0, Math.min(1, score));
  }
}; 