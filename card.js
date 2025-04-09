class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
        this.faceUp = false;
    }

    
    get suitSymbol() {
        switch (this.suit) {
            case 'clubs': return '♣';
            case 'diamonds': return '♦';
            case 'hearts': return '♥';
            case 'spades': return '♠';
            default: return '';
        }
    }

    get suitColor() {
        return (this.suit === 'hearts' || this.suit === 'diamonds') ? '#ff0000' : '#000000';
    }

    get valueDisplay() {
        switch (this.value) {
            case 1: return 'A';
            case 11: return 'J';
            case 12: return 'Q';
            case 13: return 'K';
            default: return this.value.toString();
        }
    }

    get fullName() {
        return `${this.valueDisplay} of ${this.suit}`;
    }

    
    draw(x, y, width, height) {
        push();
        translate(x, y);
        
        
        if (!this.faceUp) {
            fill('#0066cc');
            stroke('#003366');
            strokeWeight(2);
            rect(0, 0, width, height, 5);
            
            
            fill('#003366');
            noStroke();
            for (let i = 0; i < 5; i++) {
                for (let j = 0; j < 7; j++) {
                    ellipse(width * 0.25 + i * width * 0.12, 
                            height * 0.15 + j * height * 0.12, 
                            width * 0.05, height * 0.05);
                }
            }
        } 
        
        else {
            
            fill(255);
            stroke(180);
            strokeWeight(2);
            rect(0, 0, width, height, 5);
            
            
            fill(this.suitColor);
            noStroke();
            textAlign(LEFT, TOP);
            textSize(height * 0.2);
            text(this.valueDisplay, width * 0.1, height * 0.1);
            text(this.suitSymbol, width * 0.1, height * 0.25);
            
            
            push();
            translate(width, height);
            rotate(PI);
            text(this.valueDisplay, width * 0.1, height * 0.1);
            text(this.suitSymbol, width * 0.1, height * 0.25);
            pop();
            
            
            textAlign(CENTER, CENTER);
            textSize(height * 0.4);
            text(this.suitSymbol, width * 0.5, height * 0.5);
        }
        
        pop();
    }

    flip() {
        this.faceUp = !this.faceUp;
        return this;
    }
}