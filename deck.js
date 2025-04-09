class Deck {
    constructor() {
        this.cards = [];
        this.reset();
    }
    
    reset() {
        this.cards = [];
        const suits = ['clubs', 'diamonds', 'hearts', 'spades'];
        
        
        for (let suit of suits) {
            for (let value = 1; value <= 13; value++) {
                this.cards.push(new Card(suit, value));
            }
        }
        
        return this;
    }
    
    shuffle() {
        
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
        
        return this;
    }
    
    deal(faceUp = false) {
        if (this.cards.length === 0) {
            return null;
        }
        
        const card = this.cards.pop();
        if (faceUp) {
            card.flip();
        }
        
        return card;
    }
    
    dealMultiple(count, faceUp = false) {
        const cards = [];
        for (let i = 0; i < count; i++) {
            const card = this.deal(faceUp);
            if (card) {
                cards.push(card);
            }
        }
        
        return cards;
    }
}
