class HandEvaluator {
    static cardValues = {
        'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9,
        '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
    };
    
    static handRanks = {
        'high card': 0,
        'pair': 1,
        'two pair': 2,
        'three of a kind': 3,
        'straight': 4,
        'flush': 5,
        'full house': 6,
        'four of a kind': 7,
        'straight flush': 8,
        'royal flush': 9
    };
    
    
    static evaluate(cards) {
        if (cards.length < 5) {
            return { type: 'incomplete', rank: -1, cards: [], description: 'Not enough cards' };
        }
        
        
        const evaluationCards = cards.map(card => {
            let value = card.value === 1 ? 14 : card.value; 
            return {
                suit: card.suit,
                value: value,
                displayValue: card.valueDisplay,
                originalCard: card
            };
        });
        
        
        evaluationCards.sort((a, b) => b.value - a.value);
        
        
        let result = this.checkRoyalFlush(evaluationCards);
        if (result) return result;
        
        result = this.checkStraightFlush(evaluationCards);
        if (result) return result;
        
        result = this.checkFourOfAKind(evaluationCards);
        if (result) return result;
        
        result = this.checkFullHouse(evaluationCards);
        if (result) return result;
        
        result = this.checkFlush(evaluationCards);
        if (result) return result;
        
        result = this.checkStraight(evaluationCards);
        if (result) return result;
        
        result = this.checkThreeOfAKind(evaluationCards);
        if (result) return result;
        
        result = this.checkTwoPair(evaluationCards);
        if (result) return result;
        
        result = this.checkPair(evaluationCards);
        if (result) return result;
        
        
        return {
            type: 'high card',
            rank: this.handRanks['high card'],
            cards: evaluationCards.slice(0, 5),
            description: `High Card: ${evaluationCards[0].displayValue}`
        };
    }
    
    
    static checkRoyalFlush(cards) {
        
        const suits = ['clubs', 'diamonds', 'hearts', 'spades'];
        
        for (let suit of suits) {
            const suitCards = cards.filter(card => card.suit === suit);
            
            if (suitCards.length >= 5) {
                const royalValues = [14, 13, 12, 11, 10]; 
                const hasAllRoyalValues = royalValues.every(value => 
                    suitCards.some(card => card.value === value)
                );
                
                if (hasAllRoyalValues) {
                    const royalCards = royalValues.map(value => 
                        suitCards.find(card => card.value === value)
                    );
                    
                    return {
                        type: 'royal flush',
                        rank: this.handRanks['royal flush'],
                        cards: royalCards,
                        description: `Royal Flush of ${suit}`
                    };
                }
            }
        }
        
        return null;
    }
    
    static checkStraightFlush(cards) {
        
        const suits = ['clubs', 'diamonds', 'hearts', 'spades'];
        
        for (let suit of suits) {
            const suitCards = cards.filter(card => card.suit === suit);
            
            if (suitCards.length >= 5) {
                const straightResult = this.checkStraight(suitCards);
                
                if (straightResult) {
                    return {
                        type: 'straight flush',
                        rank: this.handRanks['straight flush'],
                        cards: straightResult.cards,
                        description: `Straight Flush, ${straightResult.cards[0].displayValue} high`
                    };
                }
            }
        }
        
        return null;
    }
    
    static checkFourOfAKind(cards) {
        
        const groups = this.groupByValue(cards);
        
        
        for (let value in groups) {
            if (groups[value].length === 4) {
                
                const kickers = cards.filter(card => card.value !== parseInt(value))
                                    .slice(0, 1);
                
                return {
                    type: 'four of a kind',
                    rank: this.handRanks['four of a kind'],
                    cards: [...groups[value], ...kickers],
                    description: `Four of a Kind, ${groups[value][0].displayValue}s`
                };
            }
        }
        
        return null;
    }
    
    static checkFullHouse(cards) {
        
        const groups = this.groupByValue(cards);
        
        
        let threeOfAKind = null;
        let pair = null;
        
        
        const sortedGroups = Object.entries(groups)
            .sort((a, b) => {
                
                if (b[1].length !== a[1].length) {
                    return b[1].length - a[1].length;
                }
                
                return parseInt(b[0]) - parseInt(a[0]);
            });
        
        
        for (let [value, group] of sortedGroups) {
            if (group.length >= 3 && !threeOfAKind) {
                threeOfAKind = { value, cards: group.slice(0, 3) };
            } else if (group.length >= 2 && !pair) {
                pair = { value, cards: group.slice(0, 2) };
            }
            
            if (threeOfAKind && pair) {
                return {
                    type: 'full house',
                    rank: this.handRanks['full house'],
                    cards: [...threeOfAKind.cards, ...pair.cards],
                    description: `Full House, ${threeOfAKind.cards[0].displayValue}s over ${pair.cards[0].displayValue}s`
                };
            }
        }
        
        return null;
    }
    
    static checkFlush(cards) {
        
        const suits = {};
        
        for (let card of cards) {
            if (!suits[card.suit]) {
                suits[card.suit] = [];
            }
            suits[card.suit].push(card);
        }
        
        
        for (let suit in suits) {
            if (suits[suit].length >= 5) {
                const flushCards = suits[suit].slice(0, 5);
                return {
                    type: 'flush',
                    rank: this.handRanks['flush'],
                    cards: flushCards,
                    description: `Flush, ${flushCards[0].displayValue} high`
                };
            }
        }
        
        return null;
    }
    
    static checkStraight(cards) {
        
        const uniqueValueCards = [];
        const seenValues = new Set();
        
        for (let card of cards) {
            if (!seenValues.has(card.value)) {
                uniqueValueCards.push(card);
                seenValues.add(card.value);
            }
        }
        
        if (uniqueValueCards.length < 5) {
            return null;
        }
        
        
        if (seenValues.has(14) && seenValues.has(2) && seenValues.has(3) && 
            seenValues.has(4) && seenValues.has(5)) {
            
            const aceLowStraight = [
                uniqueValueCards.find(card => card.value === 14),
                uniqueValueCards.find(card => card.value === 5),
                uniqueValueCards.find(card => card.value === 4),
                uniqueValueCards.find(card => card.value === 3),
                uniqueValueCards.find(card => card.value === 2)
            ];
            
            return {
                type: 'straight',
                rank: this.handRanks['straight'],
                cards: aceLowStraight,
                description: 'Straight, Five high'
            };
        }
        
        
        for (let i = 0; i <= uniqueValueCards.length - 5; i++) {
            if (uniqueValueCards[i].value - uniqueValueCards[i + 4].value === 4) {
                return {
                    type: 'straight',
                    rank: this.handRanks['straight'],
                    cards: uniqueValueCards.slice(i, i + 5),
                    description: `Straight, ${uniqueValueCards[i].displayValue} high`
                };
            }
        }
        
        return null;
    }
    
    static checkThreeOfAKind(cards) {
        const groups = this.groupByValue(cards);
        
        for (let value in groups) {
            if (groups[value].length === 3) {
                
                const kickers = cards.filter(card => card.value !== parseInt(value))
                                    .slice(0, 2);
                
                return {
                    type: 'three of a kind',
                    rank: this.handRanks['three of a kind'],
                    cards: [...groups[value], ...kickers],
                    description: `Three of a Kind, ${groups[value][0].displayValue}s`
                };
            }
        }
        
        return null;
    }
    
    static checkTwoPair(cards) {
        const groups = this.groupByValue(cards);
        const pairs = [];
        
        for (let value in groups) {
            if (groups[value].length >= 2) {
                pairs.push({
                    value: parseInt(value),
                    cards: groups[value].slice(0, 2)
                });
            }
        }
        
        if (pairs.length >= 2) {
            
            pairs.sort((a, b) => b.value - a.value);
            
            
            const topPairs = pairs.slice(0, 2);
            
            
            const usedValues = new Set(topPairs.map(pair => pair.value));
            const kickers = cards.filter(card => !usedValues.has(card.value))
                                .slice(0, 1);
            
            return {
                type: 'two pair',
                rank: this.handRanks['two pair'],
                cards: [...topPairs[0].cards, ...topPairs[1].cards, ...kickers],
                description: `Two Pair, ${topPairs[0].cards[0].displayValue}s and ${topPairs[1].cards[0].displayValue}s`
            };
        }
        
        return null;
    }
    
    static checkPair(cards) {
        const groups = this.groupByValue(cards);
        
        for (let value in groups) {
            if (groups[value].length === 2) {
                
                const kickers = cards.filter(card => card.value !== parseInt(value))
                                    .slice(0, 3);
                
                return {
                    type: 'pair',
                    rank: this.handRanks['pair'],
                    cards: [...groups[value], ...kickers],
                    description: `Pair of ${groups[value][0].displayValue}s`
                };
            }
        }
        
        return null;
    }
    
    
    static groupByValue(cards) {
        const groups = {};
        
        for (let card of cards) {
            if (!groups[card.value]) {
                groups[card.value] = [];
            }
            groups[card.value].push(card);
        }
        
        return groups;
    }
    
    
    static compareHands(hand1, hand2) {
        
        if (hand1.rank !== hand2.rank) {
            return hand1.rank - hand2.rank;
        }
        
        
        for (let i = 0; i < Math.min(hand1.cards.length, hand2.cards.length); i++) {
            if (hand1.cards[i].value !== hand2.cards[i].value) {
                return hand1.cards[i].value - hand2.cards[i].value;
            }
        }
        
        
        return 0;
    }
    
    
    static calculateWinProbability(handResult, communityCards) {
        
        const baseProb = {
            'royal flush': 0.99,
            'straight flush': 0.98,
            'four of a kind': 0.95,
            'full house': 0.90,
            'flush': 0.85,
            'straight': 0.80,
            'three of a kind': 0.70,
            'two pair': 0.60,
            'pair': 0.45,
            'high card': 0.25
        };
        
        const stageMultiplier = {
            0: 0.5,  
            3: 0.8,  
            4: 0.9,  
            5: 1.0   
        };
        
        return baseProb[handResult.type] * stageMultiplier[communityCards.length];
    }
}