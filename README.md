# Texas Hold'em Poker: AI Strategies and Comparative Analysis

## Project Overview
This repository contains research on artificial intelligence strategies for Texas Hold'em Poker, comparing various algorithms for decision-making effectiveness, risk management, and performance across different game phases. The project implements and analyzes seven different AI approaches and provides comprehensive performance metrics.

## Research Highlights

### Algorithms Implemented
- **Monte Carlo Simulation**: Probability estimation through random simulations
- **Minimax and Alpha-Beta Pruning**: Game tree search with optimization
- **Expectimax**: Extension of Minimax for probabilistic outcomes
- **Bayesian Approach**: Opponent modeling with probability updates
- **Heuristic Method**: Rule-based decision making
- **Kelly Criterion**: Bankroll management optimization

### Key Findings
- **Best Overall Performance**: Bayesian approach (8.3 bb/100 hands)
- **Best Risk-Reward Ratio**: Kelly Criterion (0.134)
- **Fastest Decision-Making**: Heuristic method (3.2 ms)
- **Best Position-Phase Performance**: Bayesian in late game phases (87.1% correct decisions on river)
- **Most Memory Efficient**: Heuristic method (2.3 MB)

### Application Areas
The research has potential applications in:
- Financial investment strategies
- Decision-making under uncertainty
- Real-time strategic systems

## Technical Implementation
- **Core Engine**: JavaScript implementation of Texas Hold'em rules and mechanics
- **Visualization**: p5.js library for game state display
- **AI Module**: Implementation of all algorithms with configurable parameters
- **Analysis Tools**: Performance tracking and comparison metrics

## Presentation Materials
This repository includes a complete PowerPoint presentation of the research findings, created from markdown files:

### Presentation Structure
1. Introduction and research background
2. Literature review (2019-2024)
3. Methodology and experimental design
4. Poker mechanics and implementation
5. Algorithm explanations and mathematical foundations
6. Performance comparisons and analysis
7. Technical details and implementation
8. Conclusions and future work directions

## Creating the PowerPoint Presentation

### Requirements
- Python 3.x
- Pandoc (for markdown to PowerPoint conversion)

### Method 1: Using the Conversion Script (Windows)
1. Install Pandoc from [pandoc.org](https://pandoc.org/installing.html)
2. Navigate to the `presentation` directory
3. Run `prepare_presentation_manual.bat`
4. The script will generate a PowerPoint presentation from the markdown files

### Method 2: Manual Conversion
If you encounter issues with the automatic conversion:

1. Install Pandoc: `pip install pandoc`
2. Run the conversion manually:
   ```
   cd presentation
   python convert_manually.py
   ```

### Method 3: Online Conversion
1. Use online markdown to PPTX converters like:
   - [Slides.com](https://slides.com/)
   - [GitPitch](https://gitpitch.com/)
   - [Marp](https://marp.app/)

## Repository Structure
```
/
├── % IEEE Conference Template.tex   # LaTeX research paper
├── README.md                        # This file
└── presentation/                    # Presentation materials
    ├── 01-title.md                  # Title slide
    ├── 02-abstract.md               # Abstract slide
    ├── ...                          # Other slide content
    ├── presentation.md              # Main presentation file with includes
    ├── convert_to_pptx.py           # Original conversion script
    ├── convert_manually.py          # Alternative conversion script
    ├── prepare_presentation.bat     # Windows batch file for conversion
    └── prepare_presentation_manual.bat # Alternative batch file
```

## Future Work
Future research directions include:
- Hybrid algorithm approaches combining multiple strategies
- Deep learning integration for improved opponent modeling
- Online learning and real-time adaptation
- Interface and visualization improvements

## License
This project is for academic and research purposes.

## Contact
For questions or collaboration opportunities, please contact: [Your Contact Information]