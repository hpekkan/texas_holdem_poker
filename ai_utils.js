const AIUtils = {
  
  FOLD_PENALTY: 12, 
  CALL_BONUS: 8,    
  RAISE_BONUS: 15,  
  
  calculateCallEV(winProbability, potSize, callAmount) {
    
    const isSmallBet = callAmount <= 20; 
    const smallBetBonus = isSmallBet ? this.CALL_BONUS : 0;
    
    return (winProbability * potSize) - ((1 - winProbability) * callAmount) + smallBetBonus;
  },
  
  calculateRaiseEV(winProbability, potSize, raiseAmount) {
    
    const newPot = potSize + raiseAmount;
    
    
    const aggressionBonus = this.RAISE_BONUS;
    
    return (winProbability * newPot) - ((1 - winProbability) * raiseAmount) + aggressionBonus;
  },
  
  
  calculateFoldEV(currentBet) {
    
    
    return -currentBet - this.FOLD_PENALTY;
  },
  
  
  shouldFold(foldEV, callEV, raiseEV) {
    
    return foldEV > callEV && foldEV > raiseEV && foldEV < -20;
  },
  
  estimatePreFlopEquity() {
    
    const card1 = this.cards[0];
    const card2 = this.cards[1];
    
    
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
    
    
    return this.calculatePreFlopEquity(
      Math.max(val1, val2),
      Math.min(val1, val2),
      hasPair,
      sameSuit
    );
  },
  
  calculatePreFlopEquity(highCard, lowCard, hasPair, sameSuit) {
    
    
    
    
    let equity = 0;
    
    if (hasPair) {
      
      if (lowCard >= 10) {
        
        equity = 0.85 - (14 - lowCard) * 0.01; 
      } else {
        
        equity = 0.60 + (lowCard - 2) * 0.025; 
      }
    } else {
      
      if (sameSuit) {
        
        if (highCard === 14) {
          
          if (lowCard >= 10) {
            
            equity = 0.60 + (lowCard - 10) * 0.015; 
          } else {
            
            equity = 0.55 - (10 - lowCard) * 0.01; 
          }
        } else if (highCard === 13 && lowCard >= 10) {
          
          equity = 0.55 + (lowCard - 10) * 0.015; 
        } else if (highCard - lowCard <= 3) {
          
          if (highCard >= 10) {
            
            equity = 0.52 + (highCard - 10) * 0.01; 
          } else {
            
            equity = 0.50 - (10 - highCard) * 0.01; 
          }
        } else {
          
          equity = 0.45;
        }
      } else {
        
        if (highCard === 14) {
          
          if (lowCard >= 10) {
            
            equity = 0.57 + (lowCard - 10) * 0.015; 
          } else {
            
            equity = 0.51 - (10 - lowCard) * 0.01; 
          }
        } else if (highCard === 13 && lowCard >= 10) {
          
          equity = 0.52 + (lowCard - 10) * 0.01; 
        } else if (highCard - lowCard <= 2) {
          
          if (highCard >= 10) {
            
            equity = 0.50 + (highCard - 10) * 0.005; 
          } else {
            
            equity = 0.45 - (10 - highCard) * 0.01; 
          }
        } else {
          
          equity = 0.40;
        }
      }
    }
    
    
    return Math.min(Math.max(equity, 0.35), 0.90); 
  }
}; 