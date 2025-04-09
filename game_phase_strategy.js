const GamePhaseStrategy = {
  makeGamePhaseDecision(player, callAmount, communityCards, potSize, game) {
    player.logReasoningStep("Starting game phase-based decision process");
    
    
    const gamePhase = communityCards.length === 0 ? "preflop" : 
                      communityCards.length === 3 ? "flop" :
                      communityCards.length === 4 ? "turn" : "river";
    
    player.logReasoningStep(`Current game phase: ${gamePhase}`);
    
    
    switch (gamePhase) {
      case "preflop":
        return this.preflopPhaseStrategy(player, callAmount, potSize, game);
      case "flop":
        return this.flopPhaseStrategy(player, callAmount, communityCards, potSize, game);
      case "turn":
        return this.turnPhaseStrategy(player, callAmount, communityCards, potSize, game);
      case "river":
        return this.riverPhaseStrategy(player, callAmount, communityCards, potSize, game);
      default:
        
        return this.makeBasicDecision(player, callAmount, communityCards);
    }
  },
  
  preflopPhaseStrategy(player, callAmount, potSize, game) {
    player.logReasoningStep("Using preflop phase strategy");
    
    
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
    
    
    const highCard = Math.max(val1, val2);
    const lowCard = Math.min(val1, val2);
    const connected = highCard - lowCard === 1;
    
    
    const oneGapper = highCard - lowCard === 2;
    
    
    const position = this.getRelativePosition(player, game);
    
    
    let playerCount;
    try {
      if (typeof game.getActivePlayers === 'function') {
        playerCount = game.getActivePlayers().length;
      } else {
        // Fallback: count non-folded players
        playerCount = game.players ? game.players.filter(p => !p.folded).length : 2;
      }
    } catch (error) {
      console.warn("Error getting active player count:", error);
      playerCount = game.players ? game.players.length : 2;
    }
    
    
    const handStrength = this.evaluatePreFlopHand(
      player,
      highCard,
      lowCard,
      hasPair,
      sameSuit,
      connected,
      oneGapper,
      position,
      playerCount
    );
    
    player.logReasoningStep(`Preflop hand strength: ${handStrength.toFixed(4)}`);
    
    
    if (callAmount === 0) {
      
      if (handStrength > 0.8) {
        
        const raiseAmount = Math.max(40, potSize * 3);
        player.logReasoningStep(`Premium hand, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (handStrength > 0.6) {
        
        const raiseAmount = Math.max(30, potSize * 2);
        player.logReasoningStep(`Strong hand, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (handStrength > 0.4 && position !== "early") {
        
        const raiseAmount = Math.max(20, potSize);
        player.logReasoningStep(`Medium hand in ${position} position, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else {
        
        player.logReasoningStep(`Weak hand or early position, checking`);
        return { action: "check", amount: 0 };
      }
    } else {
      
      
      const potOdds = callAmount / (potSize + callAmount);
      player.logReasoningStep(`Pot odds: ${potOdds.toFixed(4)}`);
      
      if (handStrength > 0.8) {
        
        const raiseAmount = Math.max(callAmount * 3, potSize);
        player.logReasoningStep(`Premium hand, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (handStrength > 0.6) {
        
        if (callAmount < potSize * 0.2) {
          
          const raiseAmount = Math.max(callAmount * 2.5, potSize * 0.75);
          player.logReasoningStep(`Strong hand, raising to ${raiseAmount}`);
          return { action: "raise", amount: raiseAmount };
        } else {
          
          player.logReasoningStep(`Strong hand, calling ${callAmount}`);
          return { action: "call", amount: callAmount };
        }
      } else if (handStrength > 0.4 && (position === "late" || potOdds < 0.15)) {
        
        player.logReasoningStep(`Medium hand in ${position} position, calling ${callAmount}`);
        return { action: "call", amount: callAmount };
      } else if (handStrength > 0.3 && potOdds < 0.1 && player.chips > callAmount * 15) {
        
        player.logReasoningStep(`Speculative hand, cheap call of ${callAmount}`);
        return { action: "call", amount: callAmount };
      } else {
        
        player.logReasoningStep(`Weak hand or expensive call, folding`);
        return { action: "fold", amount: 0 };
      }
    }
  },
  
  flopPhaseStrategy(player, callAmount, communityCards, potSize, game) {
    player.logReasoningStep("Using flop phase strategy");
    
    // Get hand strength
    const handStrength = player.evaluateCompleteHand(player.cards, communityCards);
    player.logReasoningStep(`Flop hand strength: ${handStrength.toFixed(4)}`);
    
    // Analyze the board
    const boardTexture = this.analyzeBoardTexture(communityCards);
    player.logReasoningStep(`Board texture: ${JSON.stringify(boardTexture)}`);
    
    // Check for draws
    const drawInfo = this.identifyDraws(player, communityCards);
    
    // Get position
    const position = this.getRelativePosition(player, game);
    
    // Get active player count with fallback
    let playerCount;
    try {
      if (typeof game.getActivePlayers === 'function') {
        playerCount = game.getActivePlayers().length;
      } else {
        // Fallback: count non-folded players
        playerCount = game.players ? game.players.filter(p => !p.folded).length : 2;
      }
    } catch (error) {
      console.warn("Error getting active player count in flopPhaseStrategy:", error);
      playerCount = game.players ? game.players.length : 2;
    }
    
    // Calculate pot odds
    const potOdds = callAmount > 0 ? callAmount / (potSize + callAmount) : 0;
    
    let effectiveHandStrength = handStrength;
    
    if (drawInfo.flushDraw) {
      effectiveHandStrength += 0.2; 
      player.logReasoningStep("Hand has flush draw potential");
    }
    
    if (drawInfo.straightDraw === "openEnded") {
      effectiveHandStrength += 0.15; 
      player.logReasoningStep("Hand has open-ended straight draw");
    } else if (drawInfo.straightDraw === "gutshot") {
      effectiveHandStrength += 0.08; 
      player.logReasoningStep("Hand has gutshot straight draw");
    }
    
    
    if (callAmount === 0) {
      
      if (handStrength > 0.7) {
        
        const betSize = this.calculatePostFlopBetSize(potSize, handStrength, boardTexture, playerCount);
        player.logReasoningStep(`Strong hand on flop, betting ${betSize}`);
        return { action: "raise", amount: betSize };
      } else if (effectiveHandStrength > 0.5) {
        
        if (position === "late" || boardTexture.dry) {
          
          const betSize = Math.max(Math.floor(potSize * 0.5), 10);
          player.logReasoningStep(`Medium hand/draw in position or on dry board, betting ${betSize}`);
          return { action: "raise", amount: betSize };
        } else {
          
          player.logReasoningStep("Medium hand out of position on dynamic board, checking");
          return { action: "check", amount: 0 };
        }
      } else {
        
        player.logReasoningStep("Weak hand on flop, checking");
        return { action: "check", amount: 0 };
      }
    } else {
      
      if (handStrength > 0.8) {
        
        const raiseAmount = Math.max(callAmount * 2.5, Math.floor(potSize * 0.75));
        player.logReasoningStep(`Very strong hand on flop, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (handStrength > 0.6 || (effectiveHandStrength > 0.5 && potOdds < 0.2)) {
        
        if (position === "late" && handStrength > 0.65) {
          
          const raiseAmount = Math.max(callAmount * 2, Math.floor(potSize * 0.6));
          player.logReasoningStep(`Strong hand in position, raising to ${raiseAmount}`);
          return { action: "raise", amount: raiseAmount };
        } else {
          
          player.logReasoningStep(`Decent hand/draw, calling ${callAmount}`);
          return { action: "call", amount: callAmount };
        }
      } else if (effectiveHandStrength > potOdds + 0.1) {
        
        player.logReasoningStep(`+EV call with draw, calling ${callAmount}`);
        return { action: "call", amount: callAmount };
      } else {
        
        player.logReasoningStep("Weak hand on flop, folding");
        return { action: "fold", amount: 0 };
      }
    }
  },
  
  turnPhaseStrategy(player, callAmount, communityCards, potSize, game) {
    player.logReasoningStep("Using turn phase strategy");
    
    // Get hand strength
    const handStrength = player.evaluateCompleteHand(player.cards, communityCards);
    player.logReasoningStep(`Turn hand strength: ${handStrength.toFixed(4)}`);
    
    // Analyze the board
    const boardTexture = this.analyzeBoardTexture(communityCards);
    player.logReasoningStep(`Board texture: ${JSON.stringify(boardTexture)}`);
    
    // Check for draws
    const drawInfo = this.identifyDraws(player, communityCards);
    
    // Get position
    const position = this.getRelativePosition(player, game);
    
    // Get active player count with fallback
    let playerCount;
    try {
      if (typeof game.getActivePlayers === 'function') {
        playerCount = game.getActivePlayers().length;
      } else {
        // Fallback: count non-folded players
        playerCount = game.players ? game.players.filter(p => !p.folded).length : 2;
      }
    } catch (error) {
      console.warn("Error getting active player count in turnPhaseStrategy:", error);
      playerCount = game.players ? game.players.length : 2;
    }
    
    // Calculate pot odds
    const potOdds = callAmount > 0 ? callAmount / (potSize + callAmount) : 0;
    
    const potCommitment = this.calculatePotCommitment(player, game);
    player.logReasoningStep(`Pot commitment: ${potCommitment.toFixed(4)}`);
    
    let effectiveHandStrength = handStrength;
    
    if (drawInfo.flushDraw) {
      effectiveHandStrength += 0.12; 
      player.logReasoningStep("Hand has flush draw on turn");
    }
    
    if (drawInfo.straightDraw === "openEnded") {
      effectiveHandStrength += 0.08; 
      player.logReasoningStep("Hand has open-ended straight draw on turn");
    } else if (drawInfo.straightDraw === "gutshot") {
      effectiveHandStrength += 0.04; 
      player.logReasoningStep("Hand has gutshot straight draw on turn");
    }
    
    if (callAmount === 0) {
      
      if (handStrength > 0.75) {
        
        const betSize = this.calculateTurnBetSize(potSize, handStrength, boardTexture, playerCount);
        player.logReasoningStep(`Strong hand on turn, betting ${betSize}`);
        return { action: "raise", amount: betSize };
      } else if (handStrength > 0.6 || (effectiveHandStrength > 0.65 && position === "late")) {
        
        const betSize = Math.max(Math.floor(potSize * 0.6), 20);
        player.logReasoningStep(`Medium-strong hand or draw in position, betting ${betSize}`);
        return { action: "raise", amount: betSize };
      } else {
        
        player.logReasoningStep("Checking with weak/medium hand on turn");
        return { action: "check", amount: 0 };
      }
    } else {
      
      if (handStrength > 0.85) {
        
        const raiseAmount = Math.max(callAmount * 2.5, Math.floor(potSize * 0.75));
        player.logReasoningStep(`Very strong hand on turn, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (handStrength > 0.7) {
        
        if (position === "late" && callAmount < potSize * 0.4) {
          
          const raiseAmount = Math.max(callAmount * 2.2, Math.floor(potSize * 0.7));
          player.logReasoningStep(`Strong hand in position, raising to ${raiseAmount}`);
          return { action: "raise", amount: raiseAmount };
        } else {
          
          player.logReasoningStep(`Strong hand, calling ${callAmount}`);
          return { action: "call", amount: callAmount };
        }
      } else if (effectiveHandStrength > potOdds + 0.05 || 
                (potCommitment > 0.3 && handStrength > 0.5)) {
        
        player.logReasoningStep(`+EV call or committed with decent hand, calling ${callAmount}`);
        return { action: "call", amount: callAmount };
      } else {
        
        player.logReasoningStep("Weak hand on turn, folding");
        return { action: "fold", amount: 0 };
      }
    }
  },
  
  riverPhaseStrategy(player, callAmount, communityCards, potSize, game) {
    player.logReasoningStep("Using river phase strategy");
    
    // Get hand strength
    const handStrength = player.evaluateCompleteHand(player.cards, communityCards);
    player.logReasoningStep(`River hand strength: ${handStrength.toFixed(4)}`);
    
    // Analyze the board
    const boardTexture = this.analyzeBoardTexture(communityCards);
    player.logReasoningStep(`Board texture: ${JSON.stringify(boardTexture)}`);
    
    // Get position
    const position = this.getRelativePosition(player, game);
    
    // Get active player count with fallback
    let playerCount;
    try {
      if (typeof game.getActivePlayers === 'function') {
        playerCount = game.getActivePlayers().length;
      } else {
        // Fallback: count non-folded players
        playerCount = game.players ? game.players.filter(p => !p.folded).length : 2;
      }
    } catch (error) {
      console.warn("Error getting active player count in riverPhaseStrategy:", error);
      playerCount = game.players ? game.players.length : 2;
    }
    
    // Calculate pot odds
    const potOdds = callAmount > 0 ? callAmount / (potSize + callAmount) : 0;
    
    const potCommitment = this.calculatePotCommitment(player, game);
    player.logReasoningStep(`Pot commitment: ${potCommitment.toFixed(4)}`);
    
    const goodBluffSpot = this.isGoodBluffingSpot(player, communityCards, game);
    
    const showdownValue = this.estimateShowdownValue(player, handStrength, communityCards, game);
    player.logReasoningStep(`Estimated showdown value: ${showdownValue.toFixed(4)}`);
    
    if (callAmount === 0) {
      
      if (handStrength > 0.8) {
        
        const betSize = this.calculateRiverBetSize(potSize, handStrength, boardTexture, playerCount, true);
        player.logReasoningStep(`Strong hand on river, value betting ${betSize}`);
        return { action: "raise", amount: betSize };
      } else if (handStrength > 0.6 && position === "late") {
        
        const betSize = Math.max(Math.floor(potSize * 0.5), 20);
        player.logReasoningStep(`Medium-strong hand in position, thin value bet ${betSize}`);
        return { action: "raise", amount: betSize };
      } else if (handStrength < 0.4 && goodBluffSpot) {
        
        const bluffSize = Math.max(Math.floor(potSize * 0.75), 30);
        player.logReasoningStep(`Weak hand in good bluffing spot, bluffing ${bluffSize}`);
        return { action: "raise", amount: bluffSize };
      } else {
        
        player.logReasoningStep("Checking on river");
        return { action: "check", amount: 0 };
      }
    } else {
      
      if (handStrength > 0.85) {
        
        const raiseAmount = Math.max(callAmount * 2, Math.floor(potSize * 0.8));
        player.logReasoningStep(`Very strong hand on river, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (handStrength > 0.7 && callAmount < potSize * 0.7) {
        
        player.logReasoningStep(`Strong hand against reasonable bet, calling ${callAmount}`);
        return { action: "call", amount: callAmount };
      } else if (showdownValue > potOdds + 0.05) {
        
        player.logReasoningStep(`+EV call on river, calling ${callAmount}`);
        return { action: "call", amount: callAmount };
      } else if (handStrength < 0.3 && goodBluffSpot && 
                Math.random() < 0.2 && callAmount < potSize * 0.5) {
        
        const bluffRaiseAmount = Math.max(callAmount * 2.5, Math.floor(potSize * 0.8));
        player.logReasoningStep(`Bluff raising on river to ${bluffRaiseAmount}`);
        return { action: "raise", amount: bluffRaiseAmount };
      } else {
        
        player.logReasoningStep("Folding on river");
        return { action: "fold", amount: 0 };
      }
    }
  },
  
  
  getRelativePosition(player, game) {
    // Add a fallback for getting active players if getActivePlayers isn't available
    let activePlayers;
    let totalPlayers;
    
    try {
      if (typeof game.getActivePlayers === 'function') {
        activePlayers = game.getActivePlayers();
        totalPlayers = activePlayers.length;
      } else {
        // Fallback: find non-folded players manually
        activePlayers = game.players.filter(p => !p.folded);
        totalPlayers = activePlayers.length;
      }
    } catch (error) {
      console.warn("Error getting active players:", error);
      // Fallback to using all players if we can't determine active ones
      activePlayers = game.players || [];
      totalPlayers = activePlayers.length || 2; // Default to 2 if all else fails
    }
    
    if (totalPlayers <= 3) {
      // In small games, simplify positions
      if (player.position === game.dealerPosition) {
        return "late";
      } else {
        return "early";
      }
    }
    
    // Calculate normalized position
    const buttonPos = game.dealerPosition || 0;
    const normalizedPos = (player.position - buttonPos + totalPlayers) % totalPlayers;
    
    // Translate to early/middle/late
    if (normalizedPos < Math.ceil(totalPlayers / 3)) {
      return "early";
    } else if (normalizedPos < Math.ceil(2 * totalPlayers / 3)) {
      return "middle";
    } else {
      return "late";
    }
  },
  
  evaluatePreFlopHand(player, highCardValue, lowCardValue, hasPair, sameSuit, connected, oneGapper, position, playerCount) {
    
    
    let handValue = 0;
    
    if (hasPair) {
      
      if (lowCardValue >= 10) {
        handValue = 0.8 + ((lowCardValue - 10) * 0.05); 
      } else {
        handValue = 0.5 + ((lowCardValue - 2) * 0.04); 
      }
    } else {
      
      
      handValue = 0.2 + (highCardValue - 2) * 0.02; 
      
      
      if (connected) {
        handValue += 0.1;
      } else if (oneGapper) {
        handValue += 0.05;
      }
      
      
      if (sameSuit) {
        handValue += 0.1;
      }
      
      
      if (highCardValue === 14) { 
        if (lowCardValue === 13) { 
          handValue = sameSuit ? 0.85 : 0.8;
        } else if (lowCardValue === 12) { 
          handValue = sameSuit ? 0.75 : 0.7;
        } else if (lowCardValue === 11) { 
          handValue = sameSuit ? 0.7 : 0.65;
        } else if (lowCardValue === 10) { 
          handValue = sameSuit ? 0.65 : 0.6;
        }
      } else if (highCardValue === 13 && lowCardValue === 12) { 
        handValue = sameSuit ? 0.7 : 0.65;
      }
    }
    
    
    if (position === "early") {
      handValue -= 0.05; 
    } else if (position === "late") {
      handValue += 0.05; 
    }
    
    
    if (playerCount <= 3) {
      handValue += 0.05; 
    } else if (playerCount >= 6) {
      handValue -= 0.05; 
    }
    
    
    return Math.max(0, Math.min(1, handValue));
  },
  
  analyzeBoardTexture(communityCards) {
    
    
    
    
    const result = {
      paired: false,      
      threeOfAKind: false, 
      suited: false,      
      connected: false,   
      highCards: false,   
      rainbow: false,     
      dry: false,         
      wet: false          
    };
    
    
    const valueCounts = {};
    const suitCounts = {};
    let highCardCount = 0;
    
    
    const getValue = (value) => {
      if (value === "A") return 14;
      if (value === "K") return 13;
      if (value === "Q") return 12;
      if (value === "J") return 11;
      if (value === "T") return 10;
      return parseInt(value);
    };
    
    
    const numericValues = [];
    
    for (const card of communityCards) {
      const value = card.value;
      const suit = card.suit;
      
      
      valueCounts[value] = (valueCounts[value] || 0) + 1;
      
      
      suitCounts[suit] = (suitCounts[suit] || 0) + 1;
      
      
      const numValue = getValue(value);
      numericValues.push(numValue);
      if (numValue >= 10) {
        highCardCount++;
      }
    }
    
    
    for (const value in valueCounts) {
      if (valueCounts[value] === 2) {
        result.paired = true;
      } else if (valueCounts[value] === 3) {
        result.threeOfAKind = true;
      }
    }
    
    
    const maxSuitCount = Math.max(...Object.values(suitCounts));
    result.suited = maxSuitCount >= 3;
    result.rainbow = Object.keys(suitCounts).length === communityCards.length;
    
    
    numericValues.sort((a, b) => a - b);
    for (let i = 0; i < numericValues.length - 1; i++) {
      if (numericValues[i] + 1 === numericValues[i + 1] || 
          numericValues[i] + 2 === numericValues[i + 1]) {
        result.connected = true;
        break;
      }
    }
    
    
    result.highCards = highCardCount >= 2;
    
    
    result.wet = (result.suited || result.connected) && !result.paired;
    result.dry = !result.suited && !result.connected;
    
    return result;
  },
  
  identifyDraws(player, communityCards) {
    
    
    
    const allCards = [...player.cards, ...communityCards];
    
    
    const result = {
      flushDraw: false,
      straightDraw: null, 
      overCards: 0        
    };
    
    
    const suits = allCards.map(card => card.suit);
    const suitCounts = {};
    for (const suit of suits) {
      suitCounts[suit] = (suitCounts[suit] || 0) + 1;
    }
    
    const maxSuitCount = Math.max(...Object.values(suitCounts));
    result.flushDraw = maxSuitCount === 4;
    
    
    const values = allCards.map(card => {
      if (card.value === "A") return 14;
      if (card.value === "K") return 13;
      if (card.value === "Q") return 12;
      if (card.value === "J") return 11;
      if (card.value === "T") return 10;
      return parseInt(card.value);
    });
    
    
    if (values.includes(14)) {
      values.push(1);
    }
    
    
    const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
    
    
    for (let i = 0; i <= uniqueValues.length - 4; i++) {
      
      if (uniqueValues[i] + 3 === uniqueValues[i + 3]) {
        result.straightDraw = "openEnded";
        break;
      }
    }
    
    
    if (!result.straightDraw) {
      for (let i = 0; i <= uniqueValues.length - 4; i++) {
        
        if (uniqueValues[i + 3] - uniqueValues[i] === 4) {
          result.straightDraw = "gutshot";
          break;
        }
      }
    }
    
    
    if (communityCards.length >= 3) {
      
      const communityValues = communityCards.map(card => {
        if (card.value === "A") return 14;
        if (card.value === "K") return 13;
        if (card.value === "Q") return 12;
        if (card.value === "J") return 11;
        if (card.value === "T") return 10;
        return parseInt(card.value);
      });
      
      const highestCommunityCard = Math.max(...communityValues);
      
      
      result.overCards = player.cards.filter(card => {
        const val = card.value === "A" ? 14 :
                   card.value === "K" ? 13 :
                   card.value === "Q" ? 12 :
                   card.value === "J" ? 11 :
                   card.value === "T" ? 10 :
                   parseInt(card.value);
        return val > highestCommunityCard;
      }).length;
    }
    
    return result;
  },
  
  calculatePotCommitment(player, game) {
    
    const totalPot = game.pot;
    const playerContribution = player.totalBet;
    
    
    if (totalPot === 0) {
      return 0;
    }
    
    
    return playerContribution / totalPot;
  },
  
  calculatePostFlopBetSize(potSize, handStrength, boardTexture, playerCount) {
    
    
    
    let sizeFactor;
    
    if (handStrength > 0.9) {
      
      sizeFactor = boardTexture.dry ? 0.8 : 0.7;
    } else if (handStrength > 0.75) {
      
      sizeFactor = 0.65;
    } else if (handStrength > 0.6) {
      
      sizeFactor = 0.5;
    } else {
      
      sizeFactor = 0.4;
    }
    
    
    if (boardTexture.wet) {
      sizeFactor += 0.1; 
    }
    
    
    if (playerCount > 3) {
      sizeFactor -= 0.05; 
    }
    
    
    return Math.max(Math.floor(potSize * sizeFactor), 10);
  },
  
  calculateTurnBetSize(potSize, handStrength, boardTexture, playerCount) {
    
    
    
    let sizeFactor;
    
    if (handStrength > 0.9) {
      
      sizeFactor = 0.75;
    } else if (handStrength > 0.8) {
      
      sizeFactor = 0.65;
    } else if (handStrength > 0.7) {
      
      sizeFactor = 0.6;
    } else {
      
      sizeFactor = 0.5;
    }
    
    
    if (boardTexture.wet) {
      sizeFactor += 0.05; 
    }
    
    
    return Math.max(Math.floor(potSize * sizeFactor), 20);
  },
  
  calculateRiverBetSize(potSize, handStrength, boardTexture, playerCount, isForValue) {
    
    
    
    let sizeFactor;
    
    if (isForValue) {
      
      if (handStrength > 0.9) {
        
        sizeFactor = boardTexture.paired ? 0.8 : 0.7; 
      } else if (handStrength > 0.8) {
        
        sizeFactor = 0.65;
      } else {
        
        sizeFactor = 0.5;
      }
    } else {
      
      sizeFactor = 0.75; 
    }
    
    
    return Math.max(Math.floor(potSize * sizeFactor), 25);
  },
  
  isGoodBluffingSpot(player, communityCards, game) {
    
    
    
    const position = this.getRelativePosition(player, game);
    
    
    const boardTexture = this.analyzeBoardTexture(communityCards);
    
    
    const goodPosition = position === "late";
    const fewPlayers = game.getActivePlayers().length <= 3;
    const scaryStraightCards = boardTexture.connected && !boardTexture.paired;
    const scaryFlushCards = boardTexture.suited;
    
    
    const drawInfo = this.identifyDraws(player, communityCards);
    const haveMissedDraw = communityCards.length === 5 && 
                          (drawInfo.straightDraw || drawInfo.flushDraw);
    
    
    return (goodPosition && fewPlayers) || 
           (goodPosition && (scaryStraightCards || scaryFlushCards)) ||
           haveMissedDraw;
  },
  
  estimateShowdownValue(player, handStrength, communityCards, game) {
    
    
    
    let showdownValue = handStrength;
    
    
    const playerCount = game.getActivePlayers().length;
    if (playerCount > 2) {
      
      showdownValue *= (1 - (playerCount - 2) * 0.1);
    }
    
    
    const boardTexture = this.analyzeBoardTexture(communityCards);
    
    if (boardTexture.paired && handStrength < 0.7) {
      
      showdownValue -= 0.1;
    }
    
    if (boardTexture.suited && boardTexture.highCards) {
      
      showdownValue -= 0.05;
    }
    
    
    return Math.max(0, Math.min(1, showdownValue));
  }
}; 