const BasicStrategies = {
  makeBasicDecision(player, callAmount, communityCards) {
    
    player.logReasoningStep("Using basic decision strategy");
    
    
    const handStrength = player.evaluateCompleteHand(player.cards, communityCards);
    player.logReasoningStep(`Hand strength: ${handStrength.toFixed(4)}`);
    
    
    if (callAmount === 0) {
      
      if (handStrength > 0.5) {
        
        const betAmount = 30;
        player.logReasoningStep(`Decent hand, betting ${betAmount}`);
        return { action: "raise", amount: betAmount };
      } else {
        
        player.logReasoningStep("Weak hand, checking");
        return { action: "check", amount: 0 };
      }
    } else {
      
      if (handStrength > 0.7) {
        
        const raiseAmount = callAmount * 3;
        player.logReasoningStep(`Strong hand, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (handStrength > 0.4) {
        
        player.logReasoningStep("Decent hand, calling");
        return { action: "call", amount: callAmount };
      } else if (handStrength > 0.2 && callAmount <= 30) {
        
        player.logReasoningStep("Mediocre hand, calling small bet");
        return { action: "call", amount: callAmount };
      } else {
        
        player.logReasoningStep("Very weak hand or big bet, folding");
        return { action: "fold", amount: 0 };
      }
    }
  },
  
  makeIntermediateDecision(player, callAmount, communityCards, potSize) {
    
    player.logReasoningStep("Using intermediate decision strategy");
    
    
    const handStrength = player.evaluateCompleteHand(player.cards, communityCards);
    player.logReasoningStep(`Hand strength: ${handStrength.toFixed(4)}`);
    
    
    const potOdds = callAmount > 0 ? callAmount / (potSize + callAmount) : 0;
    player.logReasoningStep(`Pot odds: ${potOdds.toFixed(4)}`);
    
    
    let drawPotential = 0;
    if (communityCards.length < 5) {
      
      const allCards = [...player.cards, ...communityCards];
      
      
      const suits = allCards.map(card => card.suit);
      const suitCounts = {};
      for (const suit of suits) {
        suitCounts[suit] = (suitCounts[suit] || 0) + 1;
      }
      
      if (Math.max(...Object.values(suitCounts)) === 4) {
        drawPotential = 0.25;
        player.logReasoningStep("Detected flush draw");
      }
      
      
      const values = allCards.map(card => {
        if (card.value === "A") return 14;
        if (card.value === "K") return 13;
        if (card.value === "Q") return 12;
        if (card.value === "J") return 11;
        if (card.value === "T") return 10;
        return parseInt(card.value);
      }).sort((a, b) => a - b);
      
      
      let consecutive = 1;
      let maxConsecutive = 1;
      for (let i = 1; i < values.length; i++) {
        if (values[i] === values[i-1] + 1) {
          consecutive++;
          maxConsecutive = Math.max(maxConsecutive, consecutive);
        } else if (values[i] !== values[i-1]) {
          consecutive = 1;
        }
      }
      
      if (maxConsecutive >= 4) {
        drawPotential = Math.max(drawPotential, 0.25);
        player.logReasoningStep("Detected straight draw");
      }
    }
    
    
    if (callAmount === 0) {
      
      if (handStrength > 0.5 || (handStrength > 0.3 && drawPotential > 0)) {
        
        const betAmount = Math.max(30, Math.floor(potSize * 0.6));
        player.logReasoningStep(`Decent hand/draw, betting ${betAmount}`);
        return { action: "raise", amount: betAmount };
      } else {
        
        player.logReasoningStep("Weak hand, checking");
        return { action: "check", amount: 0 };
      }
    } else {
      
      if (handStrength > 0.7) {
        
        const raiseAmount = Math.max(callAmount * 2.5, Math.floor(potSize * 0.8));
        player.logReasoningStep(`Strong hand, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (handStrength > 0.4 || (handStrength + drawPotential > potOdds)) {
        
        if (handStrength > 0.6 && callAmount < potSize * 0.4) {
          
          const raiseAmount = Math.max(callAmount * 2, Math.floor(potSize * 0.6));
          player.logReasoningStep(`Good hand, raising to ${raiseAmount}`);
          return { action: "raise", amount: raiseAmount };
        } else {
          
          player.logReasoningStep("Decent hand/draw, calling");
          return { action: "call", amount: callAmount };
        }
      } else if (callAmount <= potSize * 0.2 && handStrength > 0.2) {
        
        player.logReasoningStep("Small bet, calling with weak hand");
        return { action: "call", amount: callAmount };
      } else {
        
        player.logReasoningStep("Very weak hand with significant bet, folding");
        return { action: "fold", amount: 0 };
      }
    }
  },
  
  makeAdvancedDecision(player, callAmount, communityCards, potSize) {
    
    player.logReasoningStep("Using advanced decision strategy");
    
    
    const handStrength = player.evaluateCompleteHand(player.cards, communityCards);
    player.logReasoningStep(`Hand strength: ${handStrength.toFixed(4)}`);
    
    
    const gameStage = communityCards.length === 0 ? "preflop" : 
                    communityCards.length === 3 ? "flop" :
                    communityCards.length === 4 ? "turn" : "river";
    
    player.logReasoningStep(`Game stage: ${gameStage}`);
    
    
    if (gameStage === "preflop") {
      return this.makePreflopDecision(player, callAmount, potSize);
    } else {
      return this.makePostflopDecision(player, callAmount, communityCards, potSize, gameStage, handStrength);
    }
  },
  
  makePreflopDecision(player, callAmount, potSize) {
    
    
    
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
    
    
    const isPair = val1 === val2;
    const isSuited = card1.suit === card2.suit;
    const highCard = Math.max(val1, val2);
    const lowCard = Math.min(val1, val2);
    const gapSize = highCard - lowCard - 1;
    
    
    let handCategory;
    if (isPair) {
      if (val1 >= 10) handCategory = "premium"; 
      else if (val1 >= 7) handCategory = "strong"; 
      else handCategory = "medium"; 
    } else if (val1 >= 13 && val2 >= 13) {
      handCategory = "premium"; 
    } else if (val1 >= 12 && val2 >= 10) {
      handCategory = "strong"; 
    } else if (isSuited) {
      if (val1 >= 12 && val2 >= 9) handCategory = "strong"; 
      else if (val1 >= 10 && val2 >= 9) handCategory = "medium"; 
      else if (gapSize <= 1 && lowCard >= 5) handCategory = "medium"; 
      else handCategory = "weak";
    } else if (gapSize <= 1 && lowCard >= 9) {
      handCategory = "medium"; 
    } else {
      handCategory = "weak";
    }
    
    player.logReasoningStep(`Preflop hand category: ${handCategory}`);
    
    
    if (callAmount === 0) {
      
      if (handCategory === "premium") {
        
        const raiseAmount = Math.max(40, potSize * 3);
        player.logReasoningStep(`Premium hand, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (handCategory === "strong") {
        
        const raiseAmount = Math.max(30, potSize * 2);
        player.logReasoningStep(`Strong hand, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (handCategory === "medium") {
        
        const raiseAmount = Math.max(20, potSize);
        player.logReasoningStep(`Medium hand, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else {
        
        player.logReasoningStep("Weak hand, checking");
        return { action: "check", amount: 0 };
      }
    } else {
      
      if (handCategory === "premium") {
        
        const raiseAmount = Math.max(callAmount * 3, potSize);
        player.logReasoningStep(`Premium hand, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (handCategory === "strong") {
        
        if (callAmount < potSize * 0.2) {
          const raiseAmount = Math.max(callAmount * 2.5, potSize * 0.75);
          player.logReasoningStep(`Strong hand, raising to ${raiseAmount}`);
          return { action: "raise", amount: raiseAmount };
        } else {
          player.logReasoningStep("Strong hand, calling");
          return { action: "call", amount: callAmount };
        }
      } else if (handCategory === "medium" && callAmount < potSize * 0.15) {
        
        player.logReasoningStep("Medium hand, calling small bet");
        return { action: "call", amount: callAmount };
      } else {
        
        player.logReasoningStep("Weak hand or big bet, folding");
        return { action: "fold", amount: 0 };
      }
    }
  },
  
  makePostflopDecision(player, callAmount, communityCards, potSize, gameStage, handStrength) {
    
    
    
    const potOdds = callAmount > 0 ? callAmount / (potSize + callAmount) : 0;
    player.logReasoningStep(`Pot odds: ${potOdds.toFixed(4)}`);
    
    
    let drawStrength = 0;
    if (gameStage !== "river") {
      
      const allCards = [...player.cards, ...communityCards];
      
      
      const suits = allCards.map(card => card.suit);
      const suitCounts = {};
      for (const suit of suits) {
        suitCounts[suit] = (suitCounts[suit] || 0) + 1;
      }
      
      if (Math.max(...Object.values(suitCounts)) === 4) {
        drawStrength = gameStage === "flop" ? 0.3 : 0.15; 
        player.logReasoningStep("Detected flush draw");
      }
      
      
      const values = allCards.map(card => {
        if (card.value === "A") return 14;
        if (card.value === "K") return 13;
        if (card.value === "Q") return 12;
        if (card.value === "J") return 11;
        if (card.value === "T") return 10;
        return parseInt(card.value);
      }).sort((a, b) => a - b);
      
      
      let consecutive = 1;
      let maxConsecutive = 1;
      for (let i = 1; i < values.length; i++) {
        if (values[i] === values[i-1] + 1) {
          consecutive++;
          maxConsecutive = Math.max(maxConsecutive, consecutive);
        } else if (values[i] !== values[i-1]) {
          consecutive = 1;
        }
      }
      
      if (maxConsecutive === 4) {
        const straightDrawStrength = gameStage === "flop" ? 0.35 : 0.2;
        drawStrength = Math.max(drawStrength, straightDrawStrength);
        player.logReasoningStep("Detected open-ended straight draw");
      }
    }
    
    
    const effectiveHandValue = handStrength + drawStrength;
    player.logReasoningStep(`Effective hand value: ${effectiveHandValue.toFixed(4)}`);
    
    
    if (callAmount === 0) {
      
      if (handStrength > 0.8) {
        
        const betAmount = Math.max(Math.floor(potSize * 0.75), 20);
        player.logReasoningStep(`Very strong hand, betting ${betAmount}`);
        return { action: "raise", amount: betAmount };
      } else if (handStrength > 0.6 || (effectiveHandValue > 0.7 && gameStage !== "river")) {
        
        const betAmount = Math.max(Math.floor(potSize * 0.5), 15);
        player.logReasoningStep(`Strong hand/draw, betting ${betAmount}`);
        return { action: "raise", amount: betAmount };
      } else if (handStrength > 0.4 || drawStrength > 0.25) {
        
        const betAmount = Math.max(Math.floor(potSize * 0.3), 10);
        player.logReasoningStep(`Medium hand/draw, betting ${betAmount}`);
        return { action: "raise", amount: betAmount };
      } else {
        
        player.logReasoningStep("Weak hand, checking");
        return { action: "check", amount: 0 };
      }
    } else {
      
      if (handStrength > 0.8) {
        
        const raiseAmount = Math.max(callAmount * 2.5, Math.floor(potSize * 0.75));
        player.logReasoningStep(`Very strong hand, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if ((handStrength > 0.6 || effectiveHandValue > 0.7) && callAmount < potSize * 0.5) {
        
        const raiseAmount = Math.max(callAmount * 2, Math.floor(potSize * 0.6));
        player.logReasoningStep(`Strong hand/draw, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (effectiveHandValue > potOdds + 0.1) {
        
        player.logReasoningStep(`+EV call, calling ${callAmount}`);
        return { action: "call", amount: callAmount };
      } else {
        
        player.logReasoningStep("-EV call, folding");
        return { action: "fold", amount: 0 };
      }
    }
  },
  
  makeRandomDecision(player, callAmount) {
    player.logReasoningStep("Using random decision strategy");
    
    
    const actions = [];
    
    
    if (callAmount === 0) {
      actions.push({ action: "check", amount: 0 });
      
      
      if (Math.random() < 0.5) {
        const betAmount = Math.max(10, Math.floor(Math.random() * 50) + 10);
        actions.push({ action: "raise", amount: betAmount });
      }
    } else {
      
      if (Math.random() < 0.25) {
        actions.push({ action: "fold", amount: 0 });
      }
      
      
      actions.push({ action: "call", amount: callAmount });
      
      
      if (Math.random() < 0.4) {
        const raiseAmount = callAmount * (1 + Math.floor(Math.random() * 3) + 1);
        actions.push({ action: "raise", amount: raiseAmount });
      }
    }
    
    
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    player.logReasoningStep(`Randomly selected: ${randomAction.action} ${randomAction.amount > 0 ? randomAction.amount : ''}`);
    
    return randomAction;
  },
  
  makeConservativeDecision(player, callAmount, communityCards) {
    
    player.logReasoningStep("Using conservative decision strategy");
    
    
    const handStrength = player.evaluateCompleteHand(player.cards, communityCards);
    player.logReasoningStep(`Hand strength: ${handStrength.toFixed(4)}`);
    
    if (callAmount === 0) {
      
      if (handStrength > 0.6) { 
        
        const betAmount = 20;
        player.logReasoningStep(`Strong hand, betting ${betAmount}`);
        return { action: "raise", amount: betAmount };
      } else {
        
        player.logReasoningStep("Weak/medium hand, checking");
        return { action: "check", amount: 0 };
      }
    } else {
      
      if (handStrength > 0.75) {
        
        const raiseAmount = callAmount * 2;
        player.logReasoningStep(`Very strong hand, raising to ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (handStrength > 0.5) { 
        
        player.logReasoningStep("Strong hand, calling");
        return { action: "call", amount: callAmount };
      } else if (handStrength > 0.35 && callAmount <= 20) { 
        
        player.logReasoningStep("Medium hand, calling small bet");
        return { action: "call", amount: callAmount };
      } else if (callAmount <= 10) { 
        player.logReasoningStep("Very small bet, calling with weak hand");
        return { action: "call", amount: callAmount };
      } else {
        
        player.logReasoningStep("Weak hand or big bet, folding");
        return { action: "fold", amount: 0 };
      }
    }
  },
  
  makeAggressiveDecision(player, callAmount, communityCards, potSize) {
    
    player.logReasoningStep("Using aggressive decision strategy");
    
    
    const handStrength = player.evaluateCompleteHand(player.cards, communityCards);
    player.logReasoningStep(`Hand strength: ${handStrength.toFixed(4)}`);
    
    
    const inflatedStrength = Math.min(1, handStrength * 1.5);
    player.logReasoningStep(`Inflated hand strength: ${inflatedStrength.toFixed(4)}`);
    
    if (callAmount === 0) {
      
      if (handStrength > 0.2 || Math.random() < 0.7) { 
        
        const betAmount = Math.max(40, Math.floor(potSize * 0.7)); 
        player.logReasoningStep(`Aggressive bet: ${betAmount}`);
        return { action: "raise", amount: betAmount };
      } else {
        
        player.logReasoningStep("Checking with very weak hand");
        return { action: "check", amount: 0 };
      }
    } else {
      
      if (inflatedStrength > 0.4 || potSize > 100) { 
        
        const raiseAmount = Math.max(callAmount * 3, Math.floor(potSize * 0.8)); 
        player.logReasoningStep(`Aggressive raise: ${raiseAmount}`);
        return { action: "raise", amount: raiseAmount };
      } else if (inflatedStrength > 0.2 || callAmount <= potSize * 0.3) {
        
        player.logReasoningStep("Calling with mediocre hand");
        return { action: "call", amount: callAmount };
      } else {
        
        player.logReasoningStep("Folding weak hand to large bet");
        return { action: "fold", amount: 0 };
      }
    }
  }
}; 