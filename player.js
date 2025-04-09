class Player {
    constructor(name, position, initialChips = 1000) {
        this.name = name;
        this.position = position; 
        this.chips = initialChips;
        this.hand = [];
        this.currentBet = 0;
        this.totalBet = 0; 
        this.folded = false;
        this.isAllIn = false;
        this.isActive = true;
    }
    
    reset() {
        this.hand = [];
        this.currentBet = 0;
        this.totalBet = 0;
        this.folded = false;
        this.isAllIn = false;
        return this;
    }
    
    receiveCard(card) {
        this.hand.push(card);
        return this;
    }
    
    placeBet(amount) {
        amount = Math.min(amount, this.chips);
        this.chips -= amount;
        this.currentBet += amount;
        this.totalBet += amount;
        
        if (this.chips === 0) {
            this.isAllIn = true;
        }
        
        return amount;
    }
    
    fold() {
        this.folded = true;
        return this;
    }
    
    receiveChips(amount) {
        this.chips += amount;
        return this;
    }
    
    getHandStrength(communityCards) {
        
        return HandEvaluator.evaluate(this.hand.concat(communityCards));
    }
    
    
    draw(x, y, width, height, isCurrentPlayer) {
        push();
        
        
        strokeWeight(3);
        if (isCurrentPlayer) {
            fill(60, 100, 60, 220);
            stroke(255, 255, 0); 
        } else if (this.folded) {
            fill(100, 60, 60, 220);
            stroke(200, 50, 50);
        } else {
            fill(40, 100, 180, 220); 
            stroke(200);
        }
        
        
        rect(x, y, width, height, 10);
        
        
        fill(20, 50, 90, 230);
        noStroke();
        rect(x, y, width, 30, 10, 10, 0, 0);
        
        
        fill(255);
        noStroke();
        textAlign(CENTER, TOP);
        textSize(16);
        
        
        if (this instanceof AIPlayer) {
            
            let nameColor;
            const strategyLower = this.strategy.toLowerCase();
            
            
            if (['minimax', 'alphaBeta', 'expectimax'].includes(strategyLower)) {
                nameColor = color(100, 180, 255); 
            }
            
            else if (['montecarlo', 'simulation'].includes(strategyLower)) {
                nameColor = color(100, 255, 150); 
            }
            
            else if (['bayesian', 'kelly'].includes(strategyLower)) {
                nameColor = color(200, 130, 255); 
            }
            
            else if (['heuristic', 'pattern', 'positionbased'].includes(strategyLower)) {
                nameColor = color(255, 200, 100); 
            }
            
            else if (['adaptivestate', 'gamephase'].includes(strategyLower)) {
                nameColor = color(255, 130, 130); 
            }
            
            else {
                nameColor = color(230, 230, 230); 
            }
            
            fill(nameColor);
        }
        
        
        text(this.name, x + width/2, y + 7);
        
        
        fill(255);
        textSize(14);
        text(`${this.chips}`, x + width/2, y + 40);
        
        
        if (this.currentBet > 0) {
            fill(255, 255, 0);
            text(`Bet: ${this.currentBet}`, x + width/2, y + 60);
        }
        
        
        if (this.isAllIn) {
            textSize(18);
            fill(255, 255, 100);
            text("ALL IN", x + width/2, y + height/2);
        }
        
        
        const cardWidth = 70;
        const cardHeight = 100;
        const cardSpacing = 10;
        
        if (this.hand.length > 0) {
            this.hand[0].draw(x + width/2 - cardWidth - cardSpacing/2, y + height - cardHeight - 10, cardWidth, cardHeight);
            
            if (this.hand.length > 1) {
                this.hand[1].draw(x + width/2 + cardSpacing/2, y + height - cardHeight - 10, cardWidth, cardHeight);
            }
        }
        
        
        if (this.folded) {
            
            fill(0, 0, 0, 100);
            noStroke();
            rect(x, y, width, height, 10);
            
            
            stroke(255, 0, 0);
            strokeWeight(8);
            line(x + 15, y + 15, x + width - 15, y + height - 15);
            line(x + width - 15, y + 15, x + 15, y + height - 15);
            
            
            textSize(24);
            textAlign(CENTER, CENTER);
            fill(255, 50, 50);
            stroke(0);
            strokeWeight(2);
            text("FOLDED", x + width/2, y + height/2);
        }
        
        pop();
    }
}