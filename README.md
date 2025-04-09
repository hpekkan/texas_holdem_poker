# Texas Hold'em Poker Game with AI Strategies

## Game Overview
This repository contains a full implementation of Texas Hold'em Poker with multiple AI opponents using different strategy algorithms. Challenge yourself against various AI opponents, each employing different decision-making approaches, from probability-based calculations to opponent modeling.

## Game Features

### AI Opponents
- **Monte Carlo**: Uses random simulations to calculate probabilities and make decisions
- **Minimax/Alpha-Beta**: Employs game tree search to look ahead several moves
- **Expectimax**: Handles probabilistic outcomes for a more realistic playing style
- **Bayesian**: Adapts to your playing style through opponent modeling
- **Heuristic**: Makes fast decisions using pre-defined poker rules
- **Kelly**: Uses bankroll management strategy for optimal betting

### Game Modes
- Single player against multiple AI opponents
- Customizable table size (2-9 players)
- Tournament mode with increasing blinds
- Cash game mode with fixed blinds
- Configurable starting chips and blind levels

### Gameplay Features
- Realistic card evaluation and hand strength calculations
- Professional-looking poker table visualization using p5.js
- Complete Texas Hold'em rules implementation including:
  - Blinds, antes, and betting rounds
  - Check, call, raise, fold actions
  - Side pots calculation
  - All hand rankings from high card to royal flush

## AI Performance Characteristics
- **Bayesian AI**: Strongest overall (8.3 bb/100 hands), particularly effective in late game phases
- **Monte Carlo AI**: Good all-round performer (7.2 bb/100 hands), but slower decision-making
- **Kelly AI**: Best at managing bankroll over time (0.134 risk-reward ratio)
- **Heuristic AI**: Fastest decisions (3.2 ms) but weaker strategy (2.4 bb/100 hands)

## Technical Details
- **Frontend**: JavaScript with p5.js for visualizations
- **Core Engine**: Full poker game logic and mechanics
- **AI Module**: Implementation of all algorithms with configurable parameters
- **Analytics**: Performance tracking during gameplay

## How to Play
1. Clone the repository
2. Open index.html in your browser
3. Configure the game settings (table size, opponent types, starting chips)
4. Start playing!

## Controls
- **Call/Check**: Click the Call/Check button
- **Raise**: Use the slider to select bet amount, then click Raise
- **Fold**: Click the Fold button
- **Game Speed**: Adjust AI thinking time with the speed slider

## Repository Structure
```
/
├── index.html                 # Main game entry point
├── css/                       # Styling files
├── js/                        # JavaScript implementation
│   ├── game/                  # Core poker game logic
│   ├── ai/                    # AI algorithms implementation
│   ├── ui/                    # User interface elements
│   └── utils/                 # Utility functions
├── assets/                    # Images and sounds
└── README.md                  # This file
```

## Future Features
- Additional AI strategies including neural network-based opponents
- Online multiplayer mode
- Advanced statistics and hand analysis
- Customizable card decks and table themes

## License
This project is for educational and entertainment purposes.

## Contact
For questions or feedback, please contact: [Your Contact Information]