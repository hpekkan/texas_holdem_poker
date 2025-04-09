
const MonteCarloAlgorithm = {
  makeMonteCarloDecision(player, callAmount, communityCards, potSize, game) {
    try {
      player.logReasoningStep("Starting Monte Carlo simulation decision");
      
      const handStrength = player.evaluateCompleteHand(player.cards, communityCards);
      player.logReasoningStep(`Current hand strength: ${handStrength.toFixed(4)}`);
      
      const simulations = 100000;
      player.decisionProcess.simulationsRun = simulations;
      
      let activePlayers = 4;
      try {
        if (game && typeof game.getActivePlayers === 'function') {
          activePlayers = game.getActivePlayers().length;
        } else if (game && Array.isArray(game.players)) {
          activePlayers = game.players.filter(p => !p.folded).length;
        }
      } catch (err) {
        console.error("Error getting active player count in Monte Carlo simulation:", err);
      }
      
      player.logReasoningStep(`Running ${simulations} simulations against ${activePlayers - 1} opponents`);
      
      const simulationDeck = this.createDeckWithoutKnownCards(player, player.cards, communityCards);
      
      let wins = 0;
      try {
        for (let i = 0; i < simulations; i++) {
          const deckCopy = [...simulationDeck];
          
          const result = this.runHandSimulation(player, player.cards, communityCards, deckCopy, activePlayers);
          
          if (result) {
            wins++;
          }
        }
      } catch (error) {
        console.error("Error during Monte Carlo simulation:", error);
        if (wins === 0 && simulations > 0) {
          wins = Math.floor(simulations * 0.25);
        }
      }
      
      const winProbability = wins / simulations;
      player.logReasoningStep(`Win probability from simulations: ${winProbability.toFixed(4)} (${wins}/${simulations})`);
      
      const potOdds = callAmount / (potSize + callAmount);
      player.logReasoningStep(`Pot odds: ${potOdds.toFixed(4)}`);
      
      const callEV = player.calculateCallEV(winProbability, potSize, callAmount);
      
      const smallBetThreshold = game && game.bigBlindAmount ? game.bigBlindAmount * 2 : 20;
      const isSmallBet = callAmount <= smallBetThreshold;
      const smallBetCallBonus = isSmallBet ? Math.min(10, potSize * 0.15) : 0;
      
      const adjustedCallEV = callEV + smallBetCallBonus;
      player.logReasoningStep(`Call EV: ${adjustedCallEV.toFixed(2)}${smallBetCallBonus > 0 ? ` (with small bet bonus: ${smallBetCallBonus.toFixed(2)})` : ''}`);
      
      let bestRaiseEV = -Infinity;
      let bestRaiseAmount = 0;
      
      const minRaiseAmount = game && game.minRaise ? game.minRaise : Math.max(20, callAmount * 2);
      const possibleRaises = [
        minRaiseAmount,
        Math.floor(potSize * 0.5),
        Math.floor(potSize * 0.75),
        potSize,
        Math.floor(potSize * 1.5)
      ].filter(amount => amount > callAmount && amount <= player.chips);
      
      for (const raiseAmount of possibleRaises) {
        const raiseWinProbability = winProbability * 0.95;
        
        const raiseEV = player.calculateRaiseEV(raiseWinProbability, potSize, raiseAmount);
        player.logReasoningStep(`Raise ${raiseAmount} EV: ${raiseEV.toFixed(2)}`);
        
        if (raiseEV > bestRaiseEV) {
          bestRaiseEV = raiseEV;
          bestRaiseAmount = raiseAmount;
        }
      }
      
      if (callAmount === 0) {
        if (bestRaiseEV > 0 && bestRaiseEV > adjustedCallEV) {
          player.logReasoningStep(`Decided to raise ${bestRaiseAmount} (EV: ${bestRaiseEV.toFixed(2)})`);
          return { action: "raise", amount: bestRaiseAmount };
        } else {
          player.logReasoningStep("Decided to check");
          return { action: "check", amount: 0 };
        }
      } else {
        const foldThreshold = isSmallBet ? -25 : -15;
        
        if (adjustedCallEV <= foldThreshold) {
          player.logReasoningStep(`Decided to fold, very negative call EV: ${adjustedCallEV.toFixed(2)}`);
          return { action: "fold", amount: 0 };
        } else if (bestRaiseEV > adjustedCallEV && bestRaiseEV > 0) {
          player.logReasoningStep(`Decided to raise ${bestRaiseAmount} (EV: ${bestRaiseEV.toFixed(2)})`);
          return { action: "raise", amount: bestRaiseAmount };
        } else {
          player.logReasoningStep(`Decided to call (EV: ${adjustedCallEV.toFixed(2)})`);
          return { action: "call", amount: callAmount };
        }
      }
    } catch (error) {
      console.error("Critical error in Monte Carlo decision making:", error);
      player.logReasoningStep("Error in Monte Carlo algorithm, defaulting to less conservative decision");
      if (callAmount === 0) {
        return { action: "check", amount: 0 };
      } else if (callAmount <= 30) {
        return { action: "call", amount: callAmount };
      } else {
        return { action: "fold", amount: 0 };
      }
    }
  },
  
  createDeckWithoutKnownCards(player, myHand, communityCards) {
    const deck = [];
    const suits = ["h", "d", "c", "s"];
    const values = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
    
    for (const suit of suits) {
      for (const value of values) {
        deck.push({ value, suit });
      }
    }
    
    const knownCards = [...myHand, ...communityCards];
    
    return deck.filter(card => {
      return !knownCards.some(knownCard => 
        knownCard.value === card.value && knownCard.suit === card.suit
      );
    });
  },
  
  runHandSimulation(player, myHand, communityCards, deck, playerCount) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    const cardsNeeded = 5 - communityCards.length;
    const fullCommunityCards = [...communityCards];
    
    for (let i = 0; i < cardsNeeded; i++) {
      fullCommunityCards.push(deck.pop());
    }
    
    const myHandValue = player.evaluateCompleteHand(myHand, fullCommunityCards);
    
    let won = true;
    for (let i = 0; i < playerCount - 1; i++) {
      if (deck.length < 2) {
        console.error("Not enough cards in the deck for opponent hands");
        break;
      }
      
      const opponentHand = [deck.pop(), deck.pop()];
      const opponentHandValue = player.evaluateCompleteHand(opponentHand, fullCommunityCards);
      
      if (opponentHandValue > myHandValue) {
        won = false;
        break;
      }
    }
    
    return won;
  }
}; 