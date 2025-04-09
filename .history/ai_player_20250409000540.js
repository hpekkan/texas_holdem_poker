class AIPlayer extends Player {
  constructor(name, position, initialChips = 1000, strategy = "basic") {
    super(name, position, initialChips);
    this.strategy = strategy; // AI strategy type
    this.decisionDelay = 1000; // Time in ms to simulate "thinking"

    // Track historical decisions for pattern-based strategies
    this.decisionHistory = [];

    // Initialize state for stateful strategies
    this.gameState = {
      handCount: 0,
      opponentModels: {},
      bettingPatterns: {},
      lastHandResult: null,
    };

    // Decision process tracking for logging
    this.decisionProcess = null;
  }

  // Make a decision based on current game state
  makeDecision(game) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Record the high-resolution start time as soon as the decision function begins execution.
        const decisionStartTime = performance.now();

        // Reset decision process object for logging, including our new timing fields.
        this.decisionProcess = {
          strategy: this.strategy,
          startTime: new Date().toISOString(), // Human-readable start time.
          decisionStartTimestamp: decisionStartTime, // High-resolution start timestamp.
          nodesExplored: 0,
          maxDepth: 0,
          simulationsRun: 0,
          bestPath: [],
          evaluation: {},
          reasoningSteps: [],
        };

        // Get necessary game information.

        const currentBet = game.currentBet;
        const callAmount = currentBet - this.currentBet;
        const communityCards = game.communityCards;
        const potSize = game.pot;

        // Record game state for stateful strategies.
        this.updateGameState(game);

        // Decision based on AI strategy.
        let decision;
        switch (this.strategy) {
          // Tree-based strategies.
          case "minimax":
            decision = this.makeMinimaxDecision(
              callAmount,
              communityCards,
              potSize,
              game
            );
            break;
          case "alphaBeta":
            decision = this.makeAlphaBetaDecision(
              callAmount,
              communityCards,
              potSize,
              game
            );
            break;
          case "expectimax":
            decision = this.makeExpectimaxDecision(
              callAmount,
              communityCards,
              potSize,
              game
            );
            break;

          // Simulation-based strategies.
          case "monteCarlo":
            decision = this.makeMonteCarloDecision(
              callAmount,
              communityCards,
              potSize,
              game
            );
            break;
          case "simulation":
            decision = this.makeSimulationBasedDecision(
              callAmount,
              communityCards,
              potSize,
              game
            );
            break;

          // Other strategies.
          case "bayesian":
            decision = this.makeBayesianDecision(
              callAmount,
              communityCards,
              potSize,
              game
            );
            break;
          case "heuristic":
            decision = this.makeHeuristicDecision(
              callAmount,
              communityCards,
              potSize,
              game
            );
            break;
          case "pattern":
            decision = this.makePatternBasedDecision(
              callAmount,
              communityCards,
              potSize,
              game
            );
            break;
          case "positionBased":
            decision = this.makePositionBasedDecision(
              callAmount,
              communityCards,
              potSize,
              game
            );
            break;
          case "kelly":
            decision = this.makeKellyCriterionDecision(
              callAmount,
              communityCards,
              potSize,
              game
            );
            break;
          case "adaptiveState":
            decision = this.makeAdaptiveStateDecision(
              callAmount,
              communityCards,
              potSize,
              game
            );
            break;
          case "gamephase":
            decision = this.makeGamePhaseDecision(
              callAmount,
              communityCards,
              potSize,
              game
            );
            break;
          case "random":
            decision = this.makeRandomDecision(callAmount);
            break;
          case "conservative":
            decision = this.makeConservativeDecision(
              callAmount,
              communityCards
            );
            break;
          case "aggressive":
            decision = this.makeAggressiveDecision(
              callAmount,
              communityCards,
              potSize
            );
            break;
          case "advanced":
            decision = this.makeAdvancedDecision(
              callAmount,
              communityCards,
              potSize
            );
            break;
          case "intermediate":
            decision = this.makeIntermediateDecision(
              callAmount,
              communityCards,
              potSize
            );
            break;
          case "basic":
          default:
            decision = this.makeBasicDecision(callAmount, communityCards);
            break;
        }

        // Record the high-resolution end time.
        const decisionEndTime = performance.now();
        // Calculate elapsed decision-making time in milliseconds.
        const decisionTimeElapsed = decisionEndTime - decisionStartTime;

        // Update decision process object with timing and result details.
        this.decisionProcess.endTime = new Date().toISOString(); // Human-readable end time.
        this.decisionProcess.decisionTimeMs = decisionTimeElapsed; // Elapsed time in ms.
        this.decisionProcess.decision = decision;

        // Log the decision using aiLogger if available.
        if (typeof aiLogger !== "undefined") {
          try {
            console.log(`Logging decision for ${this.name}:`, decision.action);
            aiLogger.logDecision(this, decision, game, this.decisionProcess);
          } catch (error) {
            console.error("Error logging AI decision:", error);
          }
        }

        // Record the decision for future pattern analysis.
        this.recordDecision(decision, game);

        resolve(decision);
      }, this.decisionDelay);
    });
  }

  // Record decision for stateful strategies
  recordDecision(decision, game) {
    this.decisionHistory.push({
      action: decision.action,
      amount: decision.amount || 0,
      gamePhase: game.roundName,
      pot: game.pot,
      handStrength:
        game.communityCards.length > 0
          ? this.getHandStrength(game.communityCards).rank
          : -1,
      communityCardCount: game.communityCards.length,
    });

    // Limit history size to prevent memory issues
    if (this.decisionHistory.length > 50) {
      this.decisionHistory.shift();
    }
  }

  // Update game state for stateful strategies
  updateGameState(game) {
    // Update opponent models based on their actions
    game.players.forEach((player) => {
      if (player.position !== this.position) {
        if (!this.gameState.opponentModels[player.position]) {
          this.gameState.opponentModels[player.position] = {
            aggression: 0.5, // 0 to 1 scale
            tightness: 0.5, // 0 to 1 scale
            bluffFrequency: 0.5, // 0 to 1 scale
            actions: [],
          };
        }

        // Update models based on recent actions
        // This would be more sophisticated in a real implementation
      }
    });
  }

  // Helper method for logging reasoning steps
  logReasoningStep(message) {
    if (this.decisionProcess) {
      this.decisionProcess.reasoningSteps.push(message);
    }
  }

  // ------------------------
  // TREE-BASED ALGORITHMS
  // ------------------------

  // Enhanced Minimax implementation with detailed logging
  makeMinimaxDecision(callAmount, communityCards, potSize, game) {
    this.decisionProcess.algorithmName = "Minimax";
    this.decisionProcess.maxDepth = 10; // Maximum depth to explore

    // Log the start of the decision process
    this.logReasoningStep("Starting Minimax decision process");
    this.logReasoningStep(
      `Current pot: ${potSize}, Call amount: ${callAmount}`
    );

    // Evaluate current hand strength
    const handStrength =
      communityCards.length > 0
        ? this.getHandStrength(communityCards)
        : this.evaluateHoleCards();

    const scaledStrength =
      communityCards.length > 0 ? handStrength.rank / 9 : handStrength / 100;

    this.logReasoningStep(
      `Current hand strength: ${scaledStrength.toFixed(2)}`
    );

    // Start minimax exploration
    const nodeValues = {};

    // Evaluate 'fold' action
    this.logReasoningStep("Evaluating FOLD action");
    nodeValues.fold = this.minimaxEvaluate(
      "fold",
      0,
      scaledStrength,
      callAmount,
      potSize,
      1
    );
    this.logReasoningStep(`Fold value: ${nodeValues.fold.toFixed(2)}`);

    // Evaluate 'call' action
    this.logReasoningStep("Evaluating CALL action");
    nodeValues.call = this.minimaxEvaluate(
      "call",
      callAmount,
      scaledStrength,
      callAmount,
      potSize,
      1
    );
    this.logReasoningStep(`Call value: ${nodeValues.call.toFixed(2)}`);

    // Evaluate 'raise' action
    this.logReasoningStep("Evaluating RAISE action");
    const raiseAmount = Math.min(potSize, this.chips);
    nodeValues.raise = this.minimaxEvaluate(
      "raise",
      raiseAmount,
      scaledStrength,
      callAmount,
      potSize,
      1
    );
    this.logReasoningStep(`Raise value: ${nodeValues.raise.toFixed(2)}`);

    // Find best action
    let bestAction = "fold";
    let bestValue = nodeValues.fold;

    if (nodeValues.call > bestValue) {
      bestAction = "call";
      bestValue = nodeValues.call;
    }

    if (nodeValues.raise > bestValue) {
      bestAction = "raise";
      bestValue = nodeValues.raise;
    }

    this.logReasoningStep(
      `Selected best action: ${bestAction.toUpperCase()} with value ${bestValue.toFixed(
        2
      )}`
    );

    // Record decision for logging
    this.decisionProcess.nodeValue = bestValue;
    this.decisionProcess.evaluation = nodeValues;
    this.decisionProcess.bestPath = [bestAction];

    // Return the decision
    if (bestAction === "fold") {
      return { action: "fold" };
    } else if (bestAction === "call") {
      return { action: "call" };
    } else {
      return { action: "raise", amount: raiseAmount };
    }
  }

  // Minimax evaluation function (simplified for logging example)
  minimaxEvaluate(
    action,
    actionAmount,
    handStrength,
    callAmount,
    potSize,
    depth
  ) {
    this.decisionProcess.nodesExplored++;

    if (depth >= this.decisionProcess.maxDepth) {
      // Leaf node evaluation
      let value = 0;

      switch (action) {
        case "fold":
          // Folding always results in 0 value (we lose what we've already put in)
          value = 0;
          break;

        case "call":
          // Value of calling depends on hand strength vs pot odds
          const potOdds = callAmount / (potSize + callAmount);
          value = handStrength > potOdds ? handStrength * potSize : -callAmount;
          break;

        case "raise":
          // Value of raising depends on hand strength and potential fold equity
          const raiseEV =
            handStrength * (potSize + actionAmount) -
            (1 - handStrength) * actionAmount;
          const foldEquity = Math.max(0, 0.3 - handStrength * 0.2); // Opponents may fold
          value = raiseEV * (1 - foldEquity) + potSize * foldEquity;
          break;
      }

      this.logReasoningStep(
        `  Depth ${depth}, evaluating ${action}: ${value.toFixed(2)}`
      );
      return value;
    }

    // Internal node - simulate opponent's move
    this.logReasoningStep(`  Depth ${depth}, exploring ${action} subtree`);

    // Simplified opponent model for demo
    const opponentFoldChance = 0.3;
    const opponentRaiseChance = handStrength < 0.5 ? 0.4 : 0.2;
    const opponentCallChance = 1 - opponentFoldChance - opponentRaiseChance;

    // Simulate opponent's possible actions
    let expectedValue = 0;

    // Opponent folds
    if (opponentFoldChance > 0) {
      const foldValue = this.minimaxEvaluateOpponent(
        "fold",
        0,
        handStrength,
        actionAmount,
        potSize + actionAmount,
        depth + 1
      );
      expectedValue += opponentFoldChance * foldValue;
      this.logReasoningStep(
        `    Opponent FOLD (${opponentFoldChance.toFixed(
          2
        )} prob): ${foldValue.toFixed(2)}`
      );
    }

    // Opponent calls
    if (opponentCallChance > 0) {
      const callValue = this.minimaxEvaluateOpponent(
        "call",
        actionAmount,
        handStrength,
        0,
        potSize + actionAmount * 2,
        depth + 1
      );
      expectedValue += opponentCallChance * callValue;
      this.logReasoningStep(
        `    Opponent CALL (${opponentCallChance.toFixed(
          2
        )} prob): ${callValue.toFixed(2)}`
      );
    }

    // Opponent raises
    if (opponentRaiseChance > 0) {
      const opponentRaiseAmount = Math.min(potSize, this.chips / 2);
      const raiseValue = this.minimaxEvaluateOpponent(
        "raise",
        opponentRaiseAmount,
        handStrength,
        opponentRaiseAmount - actionAmount,
        potSize + actionAmount + opponentRaiseAmount,
        depth + 1
      );
      expectedValue += opponentRaiseChance * raiseValue;
      this.logReasoningStep(
        `    Opponent RAISE (${opponentRaiseChance.toFixed(
          2
        )} prob): ${raiseValue.toFixed(2)}`
      );
    }

    this.logReasoningStep(
      `  Depth ${depth}, ${action} expected value: ${expectedValue.toFixed(2)}`
    );
    return expectedValue;
  }

  // Evaluate opponent's move in minimax tree
  minimaxEvaluateOpponent(
    action,
    actionAmount,
    handStrength,
    callAmount,
    potSize,
    depth
  ) {
    this.decisionProcess.nodesExplored++;

    // At max depth, evaluate based on hand strength
    if (depth >= this.decisionProcess.maxDepth) {
      let value = 0;

      switch (action) {
        case "fold":
          // If opponent folds, we win the pot
          value = potSize;
          break;

        case "call":
          // If showdown, win based on hand strength
          value = handStrength * potSize - (1 - handStrength) * (potSize / 2);
          break;

        case "raise":
          // If opponent raises and we call, win based on hand strength minus call amount
          value = handStrength * (potSize + actionAmount) - callAmount;
          break;
      }

      return value;
    }

    // This would continue the tree exploration, but we'll simplify for the demo
    return handStrength * potSize;
  }

  makeAlphaBetaDecision(callAmount, communityCards, potSize, game) {
    this.decisionProcess.algorithmName = "Alpha-Beta Pruning";
    this.decisionProcess.maxDepth = 5; // Alpha-Beta can search deeper than minimax

    this.logReasoningStep("Starting Alpha-Beta decision process");
    this.logReasoningStep(
      `Current pot: ${potSize}, Call amount: ${callAmount}`
    );

    // Evaluate current hand strength
    const handStrength =
      communityCards.length > 0
        ? this.getHandStrength(communityCards)
        : this.evaluateHoleCards();

    const scaledStrength =
      communityCards.length > 0 ? handStrength.rank / 9 : handStrength / 100;

    this.logReasoningStep(
      `Current hand strength: ${scaledStrength.toFixed(2)}`
    );

    // Start alpha-beta search
    const nodeValues = {};
    let alpha = -Infinity;
    let beta = Infinity;

    // Evaluate 'fold' action
    this.logReasoningStep("Evaluating FOLD action with alpha-beta pruning");
    nodeValues.fold = this.alphaBetaEvaluate(
      "fold",
      0,
      scaledStrength,
      callAmount,
      potSize,
      1,
      alpha,
      beta,
      true
    );
    alpha = Math.max(alpha, nodeValues.fold);
    this.logReasoningStep(
      `Fold value: ${nodeValues.fold.toFixed(2)}, alpha: ${alpha.toFixed(2)}`
    );

    // Evaluate 'call' action
    this.logReasoningStep("Evaluating CALL action with alpha-beta pruning");
    nodeValues.call = this.alphaBetaEvaluate(
      "call",
      callAmount,
      scaledStrength,
      callAmount,
      potSize,
      1,
      alpha,
      beta,
      true
    );
    alpha = Math.max(alpha, nodeValues.call);
    this.logReasoningStep(
      `Call value: ${nodeValues.call.toFixed(2)}, alpha: ${alpha.toFixed(2)}`
    );

    // Evaluate 'raise' action
    this.logReasoningStep("Evaluating RAISE action with alpha-beta pruning");
    const raiseAmount = Math.min(potSize, this.chips);
    nodeValues.raise = this.alphaBetaEvaluate(
      "raise",
      raiseAmount,
      scaledStrength,
      callAmount,
      potSize,
      1,
      alpha,
      beta,
      true
    );
    alpha = Math.max(alpha, nodeValues.raise);
    this.logReasoningStep(
      `Raise value: ${nodeValues.raise.toFixed(2)}, alpha: ${alpha.toFixed(2)}`
    );

    // Find best action
    let bestAction = "fold";
    let bestValue = nodeValues.fold;

    if (nodeValues.call > bestValue) {
      bestAction = "call";
      bestValue = nodeValues.call;
    }

    if (nodeValues.raise > bestValue) {
      bestAction = "raise";
      bestValue = nodeValues.raise;
    }

    this.logReasoningStep(
      `Selected best action: ${bestAction.toUpperCase()} with value ${bestValue.toFixed(
        2
      )}`
    );

    // Record decision for logging
    this.decisionProcess.nodeValue = bestValue;
    this.decisionProcess.evaluation = nodeValues;
    this.decisionProcess.bestPath = [bestAction];
    this.decisionProcess.nodesExplored =
      this.decisionProcess.nodesExplored || 0;
    this.decisionProcess.nodesPruned = this.decisionProcess.nodesPruned || 0;

    // Return the decision
    if (bestAction === "fold") {
      return { action: "fold" };
    } else if (bestAction === "call") {
      return { action: "call" };
    } else {
      return { action: "raise", amount: raiseAmount };
    }
  }

  // Alpha-Beta evaluation function
  alphaBetaEvaluate(
    action,
    actionAmount,
    handStrength,
    callAmount,
    potSize,
    depth,
    alpha,
    beta,
    isMaximizingPlayer
  ) {
    this.decisionProcess.nodesExplored =
      (this.decisionProcess.nodesExplored || 0) + 1;

    if (depth >= this.decisionProcess.maxDepth) {
      // Leaf node evaluation
      let value = 0;

      switch (action) {
        case "fold":
          // Folding always results in 0 value (we lose what we've already put in)
          value = 0;
          break;

        case "call":
          // Value of calling depends on hand strength vs pot odds
          const potOdds = callAmount / (potSize + callAmount);
          value = handStrength > potOdds ? handStrength * potSize : -callAmount;
          break;

        case "raise":
          // Value of raising depends on hand strength and potential fold equity
          const raiseEV =
            handStrength * (potSize + actionAmount) -
            (1 - handStrength) * actionAmount;
          const foldEquity = Math.max(0, 0.3 - handStrength * 0.2); // Opponents may fold
          value = raiseEV * (1 - foldEquity) + potSize * foldEquity;
          break;
      }

      this.logReasoningStep(
        `  Depth ${depth}, evaluating ${action}: ${value.toFixed(2)}`
      );
      return value;
    }

    if (isMaximizingPlayer) {
      // Maximizing player (us)
      let maxEval = -Infinity;

      // Possible actions for us: fold, call, raise
      const possibleActions = ["fold", "call", "raise"];

      for (const possibleAction of possibleActions) {
        let evalValue;
        let nextActionAmount = 0;

        if (possibleAction === "fold") {
          evalValue = this.alphaBetaEvaluate(
            possibleAction,
            0,
            handStrength,
            callAmount,
            potSize,
            depth + 1,
            alpha,
            beta,
            false
          );
        } else if (possibleAction === "call") {
          nextActionAmount = callAmount;
          evalValue = this.alphaBetaEvaluate(
            possibleAction,
            nextActionAmount,
            handStrength,
            callAmount,
            potSize + nextActionAmount,
            depth + 1,
            alpha,
            beta,
            false
          );
        } else {
          // raise
          nextActionAmount = Math.min(potSize, this.chips / 2);
          evalValue = this.alphaBetaEvaluate(
            possibleAction,
            nextActionAmount,
            handStrength,
            nextActionAmount,
            potSize + nextActionAmount,
            depth + 1,
            alpha,
            beta,
            false
          );
        }

        maxEval = Math.max(maxEval, evalValue);
        alpha = Math.max(alpha, evalValue);

        if (beta <= alpha) {
          this.decisionProcess.nodesPruned =
            (this.decisionProcess.nodesPruned || 0) + 1;
          this.logReasoningStep(
            `  Pruning at depth ${depth}, alpha: ${alpha}, beta: ${beta}`
          );
          break; // Beta cutoff
        }
      }

      return maxEval;
    } else {
      // Minimizing player (opponent)
      let minEval = Infinity;

      // Opponent's possible responses: fold, call, raise
      const opponentFoldChance = 0.3;
      const opponentRaiseChance = handStrength < 0.5 ? 0.4 : 0.2;
      const opponentCallChance = 1 - opponentFoldChance - opponentRaiseChance;

      // Only explore moves with non-zero probability
      let possibleResponses = [];
      if (opponentFoldChance > 0)
        possibleResponses.push({ action: "fold", prob: opponentFoldChance });
      if (opponentCallChance > 0)
        possibleResponses.push({ action: "call", prob: opponentCallChance });
      if (opponentRaiseChance > 0)
        possibleResponses.push({ action: "raise", prob: opponentRaiseChance });

      for (const response of possibleResponses) {
        let evalValue;
        const responseAction = response.action;

        if (responseAction === "fold") {
          evalValue =
            this.alphaBetaEvaluate(
              responseAction,
              0,
              handStrength,
              0,
              potSize,
              depth + 1,
              alpha,
              beta,
              true
            ) * response.prob;
        } else if (responseAction === "call") {
          evalValue =
            this.alphaBetaEvaluate(
              responseAction,
              actionAmount,
              handStrength,
              0,
              potSize + actionAmount,
              depth + 1,
              alpha,
              beta,
              true
            ) * response.prob;
        } else {
          // raise
          const opponentRaiseAmount = Math.min(potSize, this.chips / 3);
          evalValue =
            this.alphaBetaEvaluate(
              responseAction,
              opponentRaiseAmount,
              handStrength,
              opponentRaiseAmount - actionAmount,
              potSize + actionAmount + opponentRaiseAmount,
              depth + 1,
              alpha,
              beta,
              true
            ) * response.prob;
        }

        minEval = Math.min(minEval, evalValue);
        beta = Math.min(beta, evalValue);

        if (beta <= alpha) {
          this.decisionProcess.nodesPruned =
            (this.decisionProcess.nodesPruned || 0) + 1;
          this.logReasoningStep(
            `  Pruning at depth ${depth}, alpha: ${alpha}, beta: ${beta}`
          );
          break; // Alpha cutoff
        }
      }

      return minEval;
    }
  }
  // Expectimax implementation with detailed logging
  makeExpectimaxDecision(callAmount, communityCards, potSize, game) {
    this.decisionProcess.algorithmName = "Expectimax";
    this.decisionProcess.maxDepth = 1000;

    this.logReasoningStep("Starting Expectimax decision process");

    // Similar to minimax but incorporates probability distributions
    // Simplified for demo purposes

    // Calculate expected values of different actions
    const handStrength =
      communityCards.length > 0
        ? this.getHandStrength(communityCards)
        : { rank: -1, description: "unknown" };

    const winProbability =
      communityCards.length > 0
        ? handStrength.rank / 9
        : this.estimatePreFlopEquity();

    this.logReasoningStep(`Hand strength: ${winProbability.toFixed(2)}`);

    // Calculate EVs for different actions
    const evFold = 0; // EV of folding is always 0
    const evCall = this.calculateCallEV(winProbability, potSize, callAmount);
    const smallRaise = Math.min(potSize * 0.5, this.chips);
    const mediumRaise = Math.min(potSize, this.chips);
    const largeRaise = Math.min(potSize * 2, this.chips);

    const evSmallRaise = this.calculateRaiseEV(
      winProbability,
      potSize,
      smallRaise
    );
    const evMediumRaise = this.calculateRaiseEV(
      winProbability,
      potSize,
      mediumRaise
    );
    const evLargeRaise = this.calculateRaiseEV(
      winProbability,
      potSize,
      largeRaise
    );

    this.logReasoningStep(`EV Fold: ${evFold.toFixed(2)}`);
    this.logReasoningStep(`EV Call: ${evCall.toFixed(2)}`);
    this.logReasoningStep(`EV Small Raise: ${evSmallRaise.toFixed(2)}`);
    this.logReasoningStep(`EV Medium Raise: ${evMediumRaise.toFixed(2)}`);
    this.logReasoningStep(`EV Large Raise: ${evLargeRaise.toFixed(2)}`);

    // Find best action
    const actions = [
      { action: "fold", ev: evFold },
      { action: "call", ev: evCall },
      { action: "small_raise", ev: evSmallRaise, amount: smallRaise },
      { action: "medium_raise", ev: evMediumRaise, amount: mediumRaise },
      { action: "large_raise", ev: evLargeRaise, amount: largeRaise },
    ];

    // Sort by expected value
    actions.sort((a, b) => b.ev - a.ev);

    const bestAction = actions[0];
    this.logReasoningStep(
      `Best action: ${bestAction.action} with EV: ${bestAction.ev.toFixed(2)}`
    );

    // Record decision details for logging
    this.decisionProcess.evaluation = {
      evFold,
      evCall,
      evSmallRaise,
      evMediumRaise,
      evLargeRaise,
    };
    this.decisionProcess.bestPath = [bestAction.action];
    this.decisionProcess.nodeValue = bestAction.ev;

    // Return decision
    if (bestAction.action === "fold") {
      return { action: "fold" };
    } else if (bestAction.action === "call") {
      return { action: "call" };
    } else {
      return { action: "raise", amount: bestAction.amount };
    }
  }

  // Helper method to calculate EV of calling
  calculateCallEV(winProbability, potSize, callAmount) {
    // EV = (probability of winning * amount won) - (probability of losing * amount lost)
    return winProbability * potSize - (1 - winProbability) * callAmount;
  }

  // Helper method to calculate EV of raising
  calculateRaiseEV(winProbability, potSize, raiseAmount) {
    // Simplified model assuming opponent call/fold based on our raise
    const opponentFoldProbability = Math.max(0.1, 0.4 - winProbability);
    const opponentCallProbability = 1 - opponentFoldProbability;

    // If opponent folds, we win the current pot
    const evOpponentFolds = potSize;

    // If opponent calls, we win or lose based on hand strength
    const newPot = potSize + raiseAmount;
    const evOpponentCalls =
      winProbability * newPot - (1 - winProbability) * raiseAmount;

    // Combined EV
    return (
      opponentFoldProbability * evOpponentFolds +
      opponentCallProbability * evOpponentCalls
    );
  }

  // Helper method to estimate pre-flop equity
  estimatePreFlopEquity() {
    const card1Value = this.hand[0].value === 1 ? 14 : this.hand[0].value;
    const card2Value = this.hand[1].value === 1 ? 14 : this.hand[1].value;
    const hasPair = card1Value === card2Value;
    const sameSuit = this.hand[0].suit === this.hand[1].suit;

    // Basic equity estimate based on card values
    let equity = 0;

    if (hasPair) {
      // Pairs
      equity = 0.5 + (card1Value - 2) / 24;
    } else {
      // Non-pairs
      const highCard = Math.max(card1Value, card2Value);
      const lowCard = Math.min(card1Value, card2Value);

      // Base equity on high card and gap
      equity = 0.3 + highCard / 28 - (highCard - lowCard) / 28;

      // Bonus for suited
      if (sameSuit) equity += 0.05;

      // Bonus for connectedness
      if (highCard - lowCard <= 2) equity += 0.05;
    }

    return Math.min(0.9, Math.max(0.1, equity));
  }

  // ------------------------
  // SIMULATION-BASED ALGORITHMS
  // ------------------------

  // Monte Carlo strategy - simulates random outcomes to find best move
  makeMonteCarloDecision(callAmount, communityCards, potSize, game) {
    this.decisionProcess.algorithmName = "Monte Carlo Simulation";
    const NUM_SIMULATIONS = 10000; // Number of simulations to run
    this.decisionProcess.simulationsRun = NUM_SIMULATIONS;

    this.logReasoningStep("Starting Monte Carlo simulation");

    // If pre-flop, use pre-computed equity tables (running full sims is expensive)
    if (communityCards.length === 0) {
      this.logReasoningStep("Pre-flop situation, using pre-computed equity");
      return this.makePreFlopDecision(callAmount);
    }

    // Get our current hand
    const myHand = this.hand;

    // Calculate active player count
    const activePlayers = game.players.filter(
      (p) => !p.folded && p.isActive
    ).length;
    this.logReasoningStep(
      `Running ${NUM_SIMULATIONS} simulations against ${
        activePlayers - 1
      } opponents`
    );

    // Create a deck excluding known cards (our hand + community cards)
    let deck = this.createDeckWithoutKnownCards(myHand, communityCards);

    // Run simulations
    let wins = 0;
    let ties = 0;

    for (let i = 0; i < NUM_SIMULATIONS; i++) {
      const simResult = this.runHandSimulation(
        myHand,
        communityCards,
        deck,
        activePlayers
      );
      if (simResult === "win") wins++;
      if (simResult === "tie") ties += 0.5; // Count ties as half-wins
    }

    // Calculate win probability
    const winProbability = (wins + ties) / NUM_SIMULATIONS;
    this.logReasoningStep(
      `Simulation results: ${wins} wins, ${ties} ties in ${NUM_SIMULATIONS} hands`
    );
    this.logReasoningStep(
      `Estimated win probability: ${winProbability.toFixed(4)}`
    );

    // Calculate pot odds
    const potOdds = callAmount / (potSize + callAmount);
    this.logReasoningStep(`Pot odds: ${potOdds.toFixed(4)}`);

    // Record simulation results for logging
    this.decisionProcess.simulationResults = {
      simulationsRun: NUM_SIMULATIONS,
      wins: wins,
      ties: ties,
      winProbability: winProbability,
      potOdds: potOdds,
    };

    // Make decision based on simulation results
    if (winProbability > 0.8) {
      // Strong hand - raise
      const raiseAmount = Math.min(potSize, this.chips);
      this.logReasoningStep(
        `Strong win probability (${winProbability.toFixed(2)}), raising`
      );
      return { action: "raise", amount: raiseAmount };
    } else if (winProbability > potOdds * 1.2) {
      // Positive expected value - call or raise
      if (winProbability > 0.6 && Math.random() > 0.5) {
        const raiseAmount = Math.min(potSize / 2, this.chips);
        this.logReasoningStep(
          `Good EV (${winProbability.toFixed(2)} > ${potOdds.toFixed(
            2
          )} * 1.2), raising`
        );
        return { action: "raise", amount: raiseAmount };
      } else {
        this.logReasoningStep(
          `Good EV (${winProbability.toFixed(2)} > ${potOdds.toFixed(
            2
          )} * 1.2), calling`
        );
        return { action: "call" };
      }
    } else if (winProbability > potOdds) {
      // Marginal expected value - call
      this.logReasoningStep(
        `Marginal EV (${winProbability.toFixed(2)} > ${potOdds.toFixed(
          2
        )}), calling`
      );
      return { action: "call" };
    } else if (callAmount === 0) {
      // Free to see next card - check
      this.logReasoningStep(`Free check`);
      return { action: "call" };
    } else {
      // Negative expected value - fold
      this.logReasoningStep(
        `Negative EV (${winProbability.toFixed(2)} < ${potOdds.toFixed(
          2
        )}), folding`
      );
      return { action: "fold" };
    }
  }

  // Create a deck without cards we already know are in play
  createDeckWithoutKnownCards(myHand, communityCards) {
    // Create a standard 52-card deck
    const suits = ["hearts", "diamonds", "clubs", "spades"];
    const values = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 1]; // Jack=11, Queen=12, King=13, Ace=1

    let deck = [];
    for (const suit of suits) {
      for (const value of values) {
        deck.push({ suit, value });
      }
    }

    // Remove cards that are in my hand
    myHand.forEach((card) => {
      deck = deck.filter(
        (c) => !(c.suit === card.suit && c.value === card.value)
      );
    });

    // Remove cards that are in community cards
    communityCards.forEach((card) => {
      deck = deck.filter(
        (c) => !(c.suit === card.suit && c.value === card.value)
      );
    });

    return deck;
  }

  // Run a single hand simulation
  runHandSimulation(myHand, communityCards, deck, playerCount) {
    // Create a copy of the deck for this simulation
    let simDeck = [...deck];

    // Shuffle the deck (Fisher-Yates algorithm)
    for (let i = simDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [simDeck[i], simDeck[j]] = [simDeck[j], simDeck[i]];
    }

    // Create a copy of the current community cards
    let simCommunityCards = [...communityCards];

    // Deal remaining community cards to reach 5
    while (simCommunityCards.length < 5) {
      simCommunityCards.push(simDeck.pop());
    }

    // Deal hands to opponents
    let opponentHands = [];
    for (let i = 0; i < playerCount - 1; i++) {
      opponentHands.push([simDeck.pop(), simDeck.pop()]);
    }

    // Evaluate all hands
    const myHandStrength = this.evaluateCompleteHand(myHand, simCommunityCards);

    // Check if we win
    let isWinner = true;
    let isTied = false;
    console.log("opponentHandssize", opponentHands.length);
    for (const opponentHand of opponentHands) {
      const oppHandStrength = this.evaluateCompleteHand(
        opponentHand,
        simCommunityCards
      );

      if (oppHandStrength.rank > myHandStrength.rank) {
        isWinner = false;
        isTied = false;
        break;
      } else if (oppHandStrength.rank === myHandStrength.rank) {
        // If ranks are equal, compare kickers
        if (
          this.compareKickers(myHandStrength.kickers, oppHandStrength.kickers) <
          0
        ) {
          isWinner = false;
          isTied = false;
          break;
        } else if (
          this.compareKickers(
            myHandStrength.kickers,
            oppHandStrength.kickers
          ) === 0
        ) {
          isWinner = false;
          isTied = true;
        }
      }
    }

    if (isWinner) return "win";
    if (isTied) return "tie";
    return "loss";
  }

  // Evaluate a complete hand (hole cards + community cards)
  evaluateCompleteHand(holeCards, communityCards) {
    const allCards = [...holeCards, ...communityCards];

    // Check for straight flush
    const straightFlush = this.checkStraightFlush(allCards);
    if (straightFlush)
      return { rank: 8, description: "Straight Flush", kickers: straightFlush };

    // Check for four of a kind
    const fourOfAKind = this.checkFourOfAKind(allCards);
    if (fourOfAKind)
      return { rank: 7, description: "Four of a Kind", kickers: fourOfAKind };

    // Check for full house
    const fullHouse = this.checkFullHouse(allCards);
    if (fullHouse)
      return { rank: 6, description: "Full House", kickers: fullHouse };

    // Check for flush
    const flush = this.checkFlush(allCards);
    if (flush) return { rank: 5, description: "Flush", kickers: flush };

    // Check for straight
    const straight = this.checkStraight(allCards);
    if (straight)
      return { rank: 4, description: "Straight", kickers: straight };

    // Check for three of a kind
    const threeOfAKind = this.checkThreeOfAKind(allCards);
    if (threeOfAKind)
      return { rank: 3, description: "Three of a Kind", kickers: threeOfAKind };

    // Check for two pair
    const twoPair = this.checkTwoPair(allCards);
    if (twoPair) return { rank: 2, description: "Two Pair", kickers: twoPair };

    // Check for pair
    const pair = this.checkPair(allCards);
    if (pair) return { rank: 1, description: "Pair", kickers: pair };

    // High card
    return {
      rank: 0,
      description: "High Card",
      kickers: this.getHighCards(allCards, 5),
    };
  }

  // Helper functions for hand evaluation
  checkStraightFlush(cards) {
    // Group cards by suit
    const suitGroups = {};
    cards.forEach((card) => {
      if (!suitGroups[card.suit]) suitGroups[card.suit] = [];
      suitGroups[card.suit].push(card);
    });

    // Check each suit group for a straight
    for (const suit in suitGroups) {
      if (suitGroups[suit].length >= 5) {
        const straightValues = this.checkStraight(suitGroups[suit]);
        if (straightValues) return straightValues;
      }
    }

    return null;
  }

  checkFourOfAKind(cards) {
    // Group cards by value
    const valueGroups = {};
    cards.forEach((card) => {
      const value = card.value === 1 ? 14 : card.value; // Convert Ace to high
      if (!valueGroups[value]) valueGroups[value] = [];
      valueGroups[value].push(card);
    });

    // Find four of a kind
    for (const value in valueGroups) {
      if (valueGroups[value].length === 4) {
        // Find highest kicker
        const kickers = this.getHighCards(
          cards.filter(
            (card) => (card.value === 1 ? 14 : card.value) !== parseInt(value)
          ),
          1
        );

        return [parseInt(value), ...kickers];
      }
    }

    return null;
  }

  checkFullHouse(cards) {
    // Group cards by value
    const valueGroups = {};
    cards.forEach((card) => {
      const value = card.value === 1 ? 14 : card.value; // Convert Ace to high
      if (!valueGroups[value]) valueGroups[value] = [];
      valueGroups[value].push(card);
    });

    // Find three of a kind and pair
    let threeValue = null;
    let pairValue = null;

    // First, find the highest three of a kind
    const valueKeys = Object.keys(valueGroups).sort(
      (a, b) => parseInt(b) - parseInt(a)
    );

    for (const value of valueKeys) {
      if (valueGroups[value].length >= 3) {
        threeValue = parseInt(value);
        break;
      }
    }

    // Then, find the highest pair (different from the three of a kind)
    if (threeValue !== null) {
      for (const value of valueKeys) {
        if (parseInt(value) !== threeValue && valueGroups[value].length >= 2) {
          pairValue = parseInt(value);
          break;
        }
      }
    }

    if (threeValue !== null && pairValue !== null) {
      return [threeValue, pairValue];
    }

    return null;
  }

  checkFlush(cards) {
    // Group cards by suit
    const suitGroups = {};
    cards.forEach((card) => {
      if (!suitGroups[card.suit]) suitGroups[card.suit] = [];
      suitGroups[card.suit].push(card);
    });

    // Find a flush
    for (const suit in suitGroups) {
      if (suitGroups[suit].length >= 5) {
        return this.getHighCards(suitGroups[suit], 5);
      }
    }

    return null;
  }

  checkStraight(cards) {
    // Convert card values to array of unique values (with Ace as both high and low)
    const values = cards.map((card) => (card.value === 1 ? 14 : card.value));

    // Add Ace as low card (1) if we have an Ace
    if (values.includes(14)) values.push(1);

    // Sort and remove duplicates
    const uniqueValues = [...new Set(values)].sort((a, b) => b - a);

    // Check for 5 consecutive values
    for (let i = 0; i < uniqueValues.length - 4; i++) {
      if (uniqueValues[i] - uniqueValues[i + 4] === 4) {
        return [uniqueValues[i]]; // Return high card of straight
      }
    }

    return null;
  }

  checkThreeOfAKind(cards) {
    // Group cards by value
    const valueGroups = {};
    cards.forEach((card) => {
      const value = card.value === 1 ? 14 : card.value; // Convert Ace to high
      if (!valueGroups[value]) valueGroups[value] = [];
      valueGroups[value].push(card);
    });

    // Find three of a kind
    for (const value in valueGroups) {
      if (valueGroups[value].length === 3) {
        // Find highest kickers
        const kickers = this.getHighCards(
          cards.filter(
            (card) => (card.value === 1 ? 14 : card.value) !== parseInt(value)
          ),
          2
        );

        return [parseInt(value), ...kickers];
      }
    }

    return null;
  }

  checkTwoPair(cards) {
    // Group cards by value
    const valueGroups = {};
    cards.forEach((card) => {
      const value = card.value === 1 ? 14 : card.value; // Convert Ace to high
      if (!valueGroups[value]) valueGroups[value] = [];
      valueGroups[value].push(card);
    });

    // Find pairs
    const pairs = [];

    for (const value in valueGroups) {
      if (valueGroups[value].length >= 2) {
        pairs.push(parseInt(value));
      }
    }

    // Sort pairs by value (descending)
    pairs.sort((a, b) => b - a);

    if (pairs.length >= 2) {
      // Get top two pairs and one kicker
      const kickers = this.getHighCards(
        cards.filter(
          (card) =>
            !pairs.slice(0, 2).includes(card.value === 1 ? 14 : card.value)
        ),
        1
      );

      return [pairs[0], pairs[1], ...kickers];
    }

    return null;
  }

  checkPair(cards) {
    // Group cards by value
    const valueGroups = {};
    cards.forEach((card) => {
      const value = card.value === 1 ? 14 : card.value; // Convert Ace to high
      if (!valueGroups[value]) valueGroups[value] = [];
      valueGroups[value].push(card);
    });

    // Find a pair
    for (const value in valueGroups) {
      if (valueGroups[value].length === 2) {
        // Find highest kickers
        const kickers = this.getHighCards(
          cards.filter(
            (card) => (card.value === 1 ? 14 : card.value) !== parseInt(value)
          ),
          3
        );

        return [parseInt(value), ...kickers];
      }
    }

    return null;
  }

  // Get high cards for kickers
  getHighCards(cards, count) {
    return cards
      .map((card) => (card.value === 1 ? 14 : card.value)) // Convert Ace to high
      .sort((a, b) => b - a) // Sort descending
      .slice(0, count); // Take top 'count' cards
  }

  // Compare kickers to break ties
  compareKickers(kickers1, kickers2) {
    for (let i = 0; i < kickers1.length && i < kickers2.length; i++) {
      if (kickers1[i] > kickers2[i]) return 1;
      if (kickers1[i] < kickers2[i]) return -1;
    }
    return 0;
  }

  makePreFlopDecision(callAmount) {
    const card1Value = this.hand[0].value === 1 ? 14 : this.hand[0].value;
    const card2Value = this.hand[1].value === 1 ? 14 : this.hand[1].value;
    const sameSuit = this.hand[0].suit === this.hand[1].suit;
    const hasPair = card1Value === card2Value;
    const hasHighCard = card1Value > 10 || card2Value > 10;
    const hasAce = card1Value === 14 || card2Value === 14;
    const connected = Math.abs(card1Value - card2Value) <= 2; // Include one-gappers
    const highCard = Math.max(card1Value, card2Value);
    const lowCard = Math.min(card1Value, card2Value);

    this.logReasoningStep(
      `Pre-flop hand: ${this.hand[0].valueDisplay}${this.hand[0].suitSymbol}, ${this.hand[1].valueDisplay}${this.hand[1].suitSymbol}`
    );

    // Get position for more aggressive play in late position
    let position = "unknown";
    if (typeof this.getRelativePosition === "function") {
      position = this.getRelativePosition(game);
    }
    const isLatePosition = position === "late";

    // Premium hands - very aggressive
    if (
      (hasPair && card1Value >= 10) ||
      (card1Value >= 13 && card2Value >= 13) ||
      (hasAce && card2Value >= 12 && sameSuit)
    ) {
      // Premium hand - raise big
      const raiseAmount = Math.min(callAmount * 4, this.chips);
      this.logReasoningStep(`Premium hand, raising aggressively`);
      return { action: "raise", amount: raiseAmount };
    }

    // Strong hands - aggressive
    else if (
      (hasPair && card1Value >= 7) ||
      (hasAce && card2Value >= 10) ||
      (card1Value >= 11 && card2Value >= 11) ||
      (sameSuit && hasAce && card2Value >= 8)
    ) {
      // Strong hand - raise
      const raiseAmount = Math.min(callAmount * 3, this.chips);
      this.logReasoningStep(`Strong hand, raising`);
      return { action: "raise", amount: raiseAmount };
    }

    // Playable hands - aggressive with position
    else if (
      hasPair ||
      (hasHighCard && Math.random() > 0.3) ||
      (connected && sameSuit) ||
      (isLatePosition && hasAce)
    ) {
      // In late position, raise more often with playable hands
      if (isLatePosition && Math.random() > 0.4) {
        const raiseAmount = Math.min(callAmount * 2.5, this.chips);
        this.logReasoningStep(
          `Playable hand in late position, raising opportunistically`
        );
        return { action: "raise", amount: raiseAmount };
      }

      // Otherwise call if not too expensive
      if (callAmount > this.chips / 3) {
        this.logReasoningStep(`Playable hand but bet too large, folding`);
        return { action: "fold" };
      }
      this.logReasoningStep(`Playable hand, calling`);
      return { action: "call" };
    }

    // Speculative hands - play more in position
    else if ((connected || sameSuit || hasHighCard) && Math.random() > 0.4) {
      // With position, occasionally raise as a bluff
      if (
        isLatePosition &&
        Math.random() > 0.7 &&
        callAmount < this.chips / 10
      ) {
        const raiseAmount = Math.min(callAmount * 2, this.chips);
        this.logReasoningStep(`Speculative hand in position, bluff raising`);
        return { action: "raise", amount: raiseAmount };
      }

      // Call small bets with speculative hands
      if (callAmount < this.chips / 15) {
        this.logReasoningStep(`Speculative hand, calling small bet`);
        return { action: "call" };
      }
    }

    // Free checks
    if (callAmount === 0) {
      // Always check if free
      this.logReasoningStep(`Free check`);
      return { action: "call" };
    }

    // Small bets - call more often
    else if (callAmount < this.chips / 20 && Math.random() > 0.4) {
      // More willing to call very small bets
      this.logReasoningStep(`Small bet, calling more aggressively`);
      return { action: "call" };
    }

    // Random bluff raises with garbage hands (very occasionally)
    else if (Math.random() > 0.9 && callAmount <= this.chips / 25) {
      const raiseAmount = Math.min(callAmount * 2.5, this.chips);
      this.logReasoningStep(`Random bluff with weak hand`);
      return { action: "raise", amount: raiseAmount };
    }

    // Fold the truly terrible hands
    this.logReasoningStep(`Weak hand, folding`);
    return { action: "fold" };
  }

  // Simulation-based Strategy - runs deterministic simulations
  makeSimulationBasedDecision(callAmount, communityCards, potSize, game) {
    this.decisionProcess.algorithmName = "Deterministic Simulation";
    this.decisionProcess.simulationsRun = 200; // Simulated number of runs

    this.logReasoningStep("Starting simulation-based decision process");

    // For pre-flop, use pre-computed ranges
    if (communityCards.length === 0) {
      this.logReasoningStep("Pre-flop: using pre-computed equities");
      return this.makePreFlopSimulationDecision(callAmount, potSize);
    }

    // Simplified simulation result (would run actual simulations in real implementation)
    // In a complete implementation, we would create a deck excluding known cards,
    // then run multiple simulations of dealing the remaining community cards and
    // estimate our win probability

    const handStrength = this.getHandStrength(communityCards);
    this.logReasoningStep(`Current hand: ${handStrength.description}`);

    // Estimated win probability (simplified)
    let winProbability;

    switch (communityCards.length) {
      case 3: // Flop
        winProbability = handStrength.rank * 0.11;
        break;
      case 4: // Turn
        winProbability = handStrength.rank * 0.12;
        break;
      case 5: // River
        winProbability = handStrength.rank * 0.13;
        break;
      default:
        winProbability = 0.3;
    }

    // Add some noise to simulate variance in outcomes
    winProbability += Math.random() * 0.1 - 0.05;
    winProbability = Math.max(0.05, Math.min(0.95, winProbability));

    this.logReasoningStep(
      `Simulated win probability: ${winProbability.toFixed(2)}`
    );

    // Record simulation data for logging
    this.decisionProcess.winProbability = winProbability;

    // Calculate pot odds
    const potOdds = callAmount / (potSize + callAmount);
    this.logReasoningStep(`Pot odds: ${potOdds.toFixed(2)}`);

    // Decision based on pot odds vs win probability
    if (winProbability > potOdds * 1.5) {
      // Strong advantage - raise
      const raiseAmount = Math.min(potSize, this.chips);
      this.logReasoningStep(
        `Strong advantage (${winProbability.toFixed(2)} > ${potOdds.toFixed(
          2
        )} * 1.5), raising`
      );
      return { action: "raise", amount: raiseAmount };
    } else if (winProbability > potOdds * 1.1) {
      // Small advantage - sometimes raise, sometimes call
      if (Math.random() > 0.6) {
        const raiseAmount = Math.min(potSize / 2, this.chips);
        this.logReasoningStep(`Small advantage with raise chance, raising`);
        return { action: "raise", amount: raiseAmount };
      }
      this.logReasoningStep(`Small advantage, calling`);
      return { action: "call" };
    } else if (winProbability > potOdds || callAmount === 0) {
      // Marginal advantage or free check - call
      this.logReasoningStep(`Marginal advantage or free check, calling`);
      return { action: "call" };
    } else {
      // Disadvantage - fold
      this.logReasoningStep(
        `Disadvantage (${winProbability.toFixed(2)} < ${potOdds.toFixed(
          2
        )}), folding`
      );
      return { action: "fold" };
    }
  }

  makePreFlopSimulationDecision(callAmount, potSize) {
    // For pre-flop, use pre-computed equity tables rather than simulation
    const card1Value = this.hand[0].value === 1 ? 14 : this.hand[0].value;
    const card2Value = this.hand[1].value === 1 ? 14 : this.hand[1].value;
    const sameSuit = this.hand[0].suit === this.hand[1].suit;

    this.logReasoningStep(
      `Pre-flop cards: ${this.hand[0].valueDisplay}${this.hand[0].suitSymbol}, ${this.hand[1].valueDisplay}${this.hand[1].suitSymbol}`
    );

    // Ensure high card is first for easier table lookup
    const highCard = Math.max(card1Value, card2Value);
    const lowCard = Math.min(card1Value, card2Value);

    // Simplified equity approximation (would use actual pre-computed table)
    let equity = 0;

    // Pairs
    if (highCard === lowCard) {
      equity = 0.5 + (highCard - 2) / 24;
    }
    // Suited cards
    else if (sameSuit) {
      equity = 0.33 + (highCard - 2) / 40 + (lowCard - 2) / 80;
    }
    // Unsuited cards
    else {
      equity = 0.28 + (highCard - 2) / 50 + (lowCard - 2) / 100;
    }

    // Connected cards bonus
    if (highCard - lowCard <= 2) {
      equity += 0.05;
    }

    this.logReasoningStep(`Pre-flop equity: ${equity.toFixed(2)}`);

    // Calculate pot odds
    const potOdds = callAmount / (potSize + callAmount);
    this.logReasoningStep(`Pot odds: ${potOdds.toFixed(2)}`);

    // Decision based on equity vs pot odds
    if (equity > 0.6) {
      // Premium hand - raise
      const raiseAmount = Math.min(potSize * 1.5, this.chips);
      this.logReasoningStep(
        `Premium hand (${equity.toFixed(2)} > 0.6), raising`
      );
      return { action: "raise", amount: raiseAmount };
    } else if (equity > 0.45) {
      // Strong hand - call or raise
      if (Math.random() > 0.5) {
        const raiseAmount = Math.min(potSize, this.chips);
        this.logReasoningStep(`Strong hand with raise chance, raising`);
        return { action: "raise", amount: raiseAmount };
      }
      this.logReasoningStep(`Strong hand, calling`);
      return { action: "call" };
    } else if (equity > potOdds + 0.1) {
      // Hand with edge - call
      this.logReasoningStep(`Hand with edge, calling`);
      return { action: "call" };
    } else if (callAmount === 0) {
      // Free check
      this.logReasoningStep(`Free check`);
      return { action: "call" };
    } else {
      // Fold weak hands
      this.logReasoningStep(`Weak hand, folding`);
      return { action: "fold" };
    }
  }

  // ------------------------
  // PROBABILITY-BASED ALGORITHMS
  // ------------------------

  // Bayesian Decision Making - updates beliefs based on observed actions
  makeBayesianDecision(callAmount, communityCards, potSize, game) {
    this.decisionProcess.algorithmName = "Bayesian Decision Making";

    this.logReasoningStep("Starting Bayesian decision process");

    // Use Bayesian updating to model opponent behavior
    // Make decisions based on these models

    // Evaluate current hand
    const handStrength =
      communityCards.length > 0
        ? this.getHandStrength(communityCards)
        : { rank: -1, description: "unknown" };

    this.logReasoningStep(
      `Current hand: ${
        communityCards.length > 0 ? handStrength.description : "Hole cards only"
      }`
    );

    // Get opponent models
    const opponents = Object.values(this.gameState.opponentModels);

    // Calculate average opponent aggression
    const avgAggression =
      opponents.length > 0
        ? opponents.reduce((sum, opp) => sum + opp.aggression, 0) /
          opponents.length
        : 0.5;

    this.logReasoningStep(
      `Average opponent aggression: ${avgAggression.toFixed(2)}`
    );

    // Update opponent models based on recent actions
    this.updateOpponentModels(game);

    // Get current game phase
    const gamePhase =
      communityCards.length === 0
        ? "preflop"
        : communityCards.length === 3
        ? "flop"
        : communityCards.length === 4
        ? "turn"
        : "river";

    // Calculate pot odds
    const potOdds = callAmount > 0 ? callAmount / (potSize + callAmount) : 0;
    this.logReasoningStep(`Pot odds: ${potOdds.toFixed(2)}`);

    // Adjust strategy based on opponent models
    let aggressionAdjustment = (0.5 - avgAggression) * 0.5; // Negative if opponents are aggressive

    // Bayesian adjustments based on current situation
    let bayesianStrength = this.estimateHandStrengthBayesian(
      handStrength,
      communityCards,
      game
    );

    this.logReasoningStep(
      `Bayesian hand strength estimate: ${bayesianStrength.toFixed(2)}`
    );
    this.logReasoningStep(
      `Opponent-based adjustment: ${aggressionAdjustment.toFixed(2)}`
    );

    // Conditional probability adjustments based on game state
    let gameStateAdjustment = 0;

    // Adjust based on position
    const position = this.getRelativePosition(game);
    if (position === "late") {
      gameStateAdjustment += 0.1; // Better position increases equity
      this.logReasoningStep(
        `Position adjustment: +0.1 (late position advantage)`
      );
    } else if (position === "early") {
      gameStateAdjustment -= 0.05; // Worse position decreases equity
      this.logReasoningStep(
        `Position adjustment: -0.05 (early position disadvantage)`
      );
    }

    // Adjust based on player count
    const activePlayers = game.players.filter(
      (p) => !p.folded && p.isActive
    ).length;
    if (activePlayers <= 2) {
      gameStateAdjustment += 0.05; // Heads-up increases equity
      this.logReasoningStep(
        `Player count adjustment: +0.05 (heads-up advantage)`
      );
    } else if (activePlayers >= 5) {
      gameStateAdjustment -= 0.1; // More players decreases equity
      this.logReasoningStep(`Player count adjustment: -0.1 (many players)`);
    }

    // Adjust for stack size implications
    const stackToPotRatio = this.chips / potSize;
    if (stackToPotRatio < 3 && bayesianStrength > 0.5) {
      gameStateAdjustment += 0.1; // Low SPR increases value of strong hands
      this.logReasoningStep(
        `Stack-to-pot adjustment: +0.1 (low SPR with strong hand)`
      );
    } else if (stackToPotRatio > 10 && bayesianStrength > 0.6) {
      gameStateAdjustment += 0.05; // Deep stacks increase value of very strong hands
      this.logReasoningStep(
        `Stack-to-pot adjustment: +0.05 (deep stack with very strong hand)`
      );
    }

    // Make decision based on adjusted strength
    const adjustedStrength =
      bayesianStrength + aggressionAdjustment + gameStateAdjustment;
    this.logReasoningStep(
      `Final adjusted strength: ${adjustedStrength.toFixed(2)}`
    );

    // Record Bayesian analysis for logging
    this.decisionProcess.bayesianAnalysis = {
      baseStrength: bayesianStrength,
      opponentAggression: avgAggression,
      adjustments: {
        aggression: aggressionAdjustment,
        gameState: gameStateAdjustment,
      },
      finalStrength: adjustedStrength,
    };

    // Decision thresholds
    if (adjustedStrength > 0.75) {
      // Strong hand with Bayesian adjustment
      const raiseAmount = Math.min(potSize, this.chips);
      this.logReasoningStep(
        `Strong adjusted hand (${adjustedStrength.toFixed(2)} > 0.75), raising`
      );
      return { action: "raise", amount: raiseAmount };
    } else if (adjustedStrength > 0.5) {
      // Medium-strong hand
      if (Math.random() > 0.6) {
        const raiseAmount = Math.min(potSize / 2, this.chips);
        this.logReasoningStep(`Medium-strong hand with raise chance, raising`);
        return { action: "raise", amount: raiseAmount };
      }
      this.logReasoningStep(`Medium-strong hand, calling`);
      return { action: "call" };
    } else if (adjustedStrength > potOdds * 1.2) {
      // Has equity against pot odds
      this.logReasoningStep(`Sufficient equity vs pot odds, calling`);
      return { action: "call" };
    } else if (adjustedStrength > 0.3 || callAmount === 0) {
      // Medium-weak hand or check
      this.logReasoningStep(`Medium-weak hand or free check, calling`);
      return { action: "call" };
    } else {
      // Weak hand
      this.logReasoningStep(`Weak hand, folding`);
      return { action: "fold" };
    }
  }

  updateOpponentModels(game) {
    // More sophisticated opponent modeling using Bayesian updates

    // Track active players for this hand
    const activePlayers = game.players.filter((p) => p.isActive && !p.folded);

    // For each active opponent, update our model
    activePlayers.forEach((player) => {
      if (player.position === this.position) return; // Skip self

      // Ensure opponent model exists
      if (!this.gameState.opponentModels[player.position]) {
        this.gameState.opponentModels[player.position] = {
          aggression: 0.5, // 0 to 1 scale
          tightness: 0.5, // 0 to 1 scale
          bluffFrequency: 0.5, // 0 to 1 scale
          actions: [],
          priorActionProbs: {
            raise: { strong: 0.7, medium: 0.4, weak: 0.1 },
            call: { strong: 0.25, medium: 0.5, weak: 0.3 },
            fold: { strong: 0.05, medium: 0.1, weak: 0.6 },
          },
        };
      }

      const model = this.gameState.opponentModels[player.position];

      // Get player's latest action for this round
      const playerAction =
        player.currentBet > 0
          ? player.currentBet > game.bigBlindAmount
            ? "raise"
            : "call"
          : "fold";

      // Skip if no clear action
      if (!playerAction) return;

      // Update action history
      model.actions.push({
        action: playerAction,
        gamePhase: game.roundName,
        potSize: game.pot,
        betSize: player.currentBet,
      });

      // Limit history size
      if (model.actions.length > 20) {
        model.actions.shift();
      }

      // Calculate action frequencies for Bayesian update
      const actionCounts = {
        raise: model.actions.filter((a) => a.action === "raise").length,
        call: model.actions.filter((a) => a.action === "call").length,
        fold: model.actions.filter((a) => a.action === "fold").length,
      };

      const totalActions = model.actions.length;

      if (totalActions > 0) {
        // Update aggression model
        model.aggression =
          (actionCounts.raise * 1.0 + actionCounts.call * 0.5) / totalActions;

        // Update tightness model (higher means plays fewer hands)
        model.tightness = actionCounts.fold / totalActions;

        // Estimate bluff frequency (simplified)
        // A more sophisticated model would compare actions to showdowns
        const raiseFrequency = actionCounts.raise / totalActions;
        model.bluffFrequency = Math.min(
          0.8,
          raiseFrequency * (1 - model.tightness) * 2
        );
      }

      this.logReasoningStep(
        `Updated model for player ${
          player.position
        }: aggression=${model.aggression.toFixed(
          2
        )}, tightness=${model.tightness.toFixed(
          2
        )}, bluffFrequency=${model.bluffFrequency.toFixed(2)}`
      );
    });
  }

  estimateHandStrengthBayesian(handStrength, communityCards, game) {
    // Sophisticated Bayesian estimate that considers:
    // 1. Current hand strength
    // 2. Potential for improvement
    // 3. Betting patterns
    // 4. Historical performance

    // Basic strength based on hand rank
    let baseStrength = communityCards.length > 0 ? handStrength.rank / 8 : 0; // 0 to 1 scale

    if (communityCards.length === 0) {
      // Pre-flop strength estimation
      const card1Value = this.hand[0].value === 1 ? 14 : this.hand[0].value;
      const card2Value = this.hand[1].value === 1 ? 14 : this.hand[1].value;
      const hasPair = card1Value === card2Value;
      const sameSuit = this.hand[0].suit === this.hand[1].suit;

      baseStrength = 0;

      // High pocket pairs
      if (hasPair && card1Value >= 10) baseStrength = 0.8;
      // Medium pocket pairs
      else if (hasPair && card1Value >= 7) baseStrength = 0.6;
      // Low pocket pairs
      else if (hasPair) baseStrength = 0.4;
      // High card combinations
      else if (card1Value >= 10 && card2Value >= 10) baseStrength = 0.7;
      // Ace with high card
      else if (
        (card1Value === 14 && card2Value >= 10) ||
        (card2Value === 14 && card1Value >= 10)
      )
        baseStrength = 0.65;
      // Suited connectors
      else if (sameSuit && Math.abs(card1Value - card2Value) === 1)
        baseStrength = 0.55;
      // High cards
      else if (card1Value >= 10 || card2Value >= 10) baseStrength = 0.5;
      // Medium connectors
      else if (Math.abs(card1Value - card2Value) <= 2) baseStrength = 0.4;
      // Suited cards
      else if (sameSuit) baseStrength = 0.35;
      // Everything else
      else baseStrength = 0.2;

      this.logReasoningStep(
        `Base pre-flop strength: ${baseStrength.toFixed(2)}`
      );
    } else {
      this.logReasoningStep(
        `Base post-flop strength: ${baseStrength.toFixed(2)} (${
          handStrength.description
        })`
      );
    }

    // Potential for improvement (drawing to better hands)
    let improvementPotential = 0;

    if (communityCards.length < 5) {
      // Calculate draw potential
      const draws = this.calculateDrawPotential(communityCards);

      if (draws.flushDraw) {
        improvementPotential += 0.2;
        this.logReasoningStep(`Flush draw detected: +0.2 potential`);
      }

      if (draws.straightDraw) {
        improvementPotential += 0.15;
        this.logReasoningStep(`Straight draw detected: +0.15 potential`);
      }

      if (draws.oesd) {
        improvementPotential += 0.1;
        this.logReasoningStep(`Open-ended straight draw: +0.1 potential`);
      }

      if (draws.gutshot) {
        improvementPotential += 0.05;
        this.logReasoningStep(`Gutshot draw: +0.05 potential`);
      }

      if (draws.overcards) {
        improvementPotential += 0.1;
        this.logReasoningStep(`Overcards detected: +0.1 potential`);
      }

      // Scale down potential based on remaining cards
      improvementPotential *= (5 - communityCards.length) / 2;
      this.logReasoningStep(
        `Scaled improvement potential: ${improvementPotential.toFixed(2)}`
      );
    }

    // Adjust for player population tendencies
    let populationAdjustment = 0;

    // More players = less equity
    const playerCount = game.players.filter(
      (p) => !p.folded && p.isActive
    ).length;
    if (playerCount > 4) {
      populationAdjustment -= 0.1;
      this.logReasoningStep(`Population adjustment: -0.1 (many players)`);
    } else if (playerCount <= 2) {
      populationAdjustment += 0.1;
      this.logReasoningStep(`Population adjustment: +0.1 (heads-up)`);
    }

    // Betting patterns adjustment
    let bettingPatternAdjustment = 0;
    const bettingRounds =
      communityCards.length > 0 ? communityCards.length - 2 : 0;

    // If there's been heavy betting with a weak hand, reduce expected value
    if (
      bettingRounds > 0 &&
      baseStrength < 0.4 &&
      game.pot > game.bigBlindAmount * 10
    ) {
      bettingPatternAdjustment -= 0.15;
      this.logReasoningStep(
        `Betting pattern adjustment: -0.15 (heavy betting with weak hand)`
      );
    }

    // If we have a very strong hand and there's been little betting, reduce expected value
    if (
      bettingRounds > 1 &&
      baseStrength > 0.7 &&
      game.pot < game.bigBlindAmount * 5
    ) {
      bettingPatternAdjustment -= 0.1;
      this.logReasoningStep(
        `Betting pattern adjustment: -0.1 (little betting with strong hand)`
      );
    }

    // Final Bayesian estimate
    const finalStrength = Math.min(
      1,
      baseStrength +
        improvementPotential +
        populationAdjustment +
        bettingPatternAdjustment
    );
    this.logReasoningStep(
      `Final Bayesian strength estimate: ${finalStrength.toFixed(2)}`
    );

    return finalStrength;
  }

  calculateDrawPotential(communityCards) {
    // Calculate drawing potential to various hands
    const allCards = [...this.hand, ...communityCards];

    // Result object
    const draws = {
      flushDraw: false,
      straightDraw: false,
      oesd: false, // Open-ended straight draw
      gutshot: false,
      overcards: false,
    };

    // Check for flush draw
    const suitCounts = {};
    allCards.forEach((card) => {
      suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    });

    draws.flushDraw = Object.values(suitCounts).some((count) => count === 4);

    // Create sorted values array for straight detection
    const values = allCards
      .map((card) => (card.value === 1 ? 14 : card.value))
      .sort((a, b) => a - b);

    // Add Ace as low card (1) if we have an Ace
    if (values.includes(14)) values.push(1);

    // Get unique values
    const uniqueValues = [...new Set(values)].sort((a, b) => a - b);

    // Check for straight draws (consecutive cards)
    // OESD: Open-ended straight draw (e.g., 7-8-9-10)
    // Gutshot: Inside straight draw (e.g., 7-8-10-J)

    // Find longest consecutive sequence
    let maxConsecutive = 1;
    let currentConsecutive = 1;

    for (let i = 1; i < uniqueValues.length; i++) {
      if (uniqueValues[i] === uniqueValues[i - 1] + 1) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else if (uniqueValues[i] === uniqueValues[i - 1] + 2) {
        // Potential gutshot
        draws.gutshot = true;
        currentConsecutive = 1;
      } else {
        currentConsecutive = 1;
      }
    }

    // Straight draw detection
    if (maxConsecutive >= 4) {
      draws.straightDraw = true;
      draws.oesd = true;
    } else if (maxConsecutive === 3 && draws.gutshot) {
      draws.straightDraw = true;
    }

    // Overcard detection (hole cards higher than community cards)
    if (communityCards.length > 0) {
      const highestCommunity = Math.max(
        ...communityCards.map((c) => (c.value === 1 ? 14 : c.value))
      );
      const holeCardValues = this.hand.map((c) =>
        c.value === 1 ? 14 : c.value
      );
      draws.overcards =
        holeCardValues.filter((v) => v > highestCommunity).length > 0;
    }

    return draws;
  }

  makeKellyCriterionDecision(callAmount, communityCards, potSize, game) {
    this.decisionProcess.algorithmName = "Kelly Criterion";

    this.logReasoningStep("Starting Kelly Criterion decision process");

    // For pre-flop, use a simplified approach
    if (communityCards.length === 0) {
      this.logReasoningStep("Pre-flop: using simplified Kelly approach");
      return this.makePreFlopKellyDecision(callAmount, potSize);
    }

    const handStrength = this.getHandStrength(communityCards);
    this.logReasoningStep(`Current hand: ${handStrength.description}`);

    // Calculate more accurate win probability based on hand strength and game state
    let winProbability = this.calculateWinProbability(
      handStrength,
      communityCards,
      game
    );
    this.logReasoningStep(
      `Estimated win probability: ${winProbability.toFixed(2)}`
    );

    // Calculate pot odds and implied odds
    const potOdds = callAmount > 0 ? callAmount / (potSize + callAmount) : 0;
    this.logReasoningStep(`Pot odds: ${potOdds.toFixed(2)}`);

    // Calculate implied odds
    const impliedOddsMultiplier = this.calculateImpliedOddsMultiplier(
      communityCards,
      game
    );
    const effectivePotSize = potSize * impliedOddsMultiplier;
    this.logReasoningStep(
      `Implied odds multiplier: ${impliedOddsMultiplier.toFixed(
        2
      )}, effective pot size: ${effectivePotSize.toFixed(2)}`
    );

    // Calculate Kelly bet fraction: f* = (bp - q)/b
    // where b = odds received, p = win probability, q = loss probability
    const b = effectivePotSize / Math.max(1, callAmount);
    const p = winProbability;
    const q = 1 - p;

    // Kelly fraction
    const kellyFraction = (b * p - q) / b;
    this.logReasoningStep(`Kelly fraction: ${kellyFraction.toFixed(2)}`);

    // Record Kelly analysis for logging
    this.decisionProcess.kellyAnalysis = {
      winProbability: p,
      odds: b,
      impliedOddsMultiplier,
      effectivePotSize,
      kellyFraction: kellyFraction,
    };

    // Apply risk adjustment - usually use half-Kelly or quarter-Kelly for more conservative play
    const riskAdjustedKelly = kellyFraction / 2; // Half-Kelly
    this.logReasoningStep(
      `Risk-adjusted Kelly (half-Kelly): ${riskAdjustedKelly.toFixed(2)}`
    );

    // Zero or negative Kelly means no edge - fold
    if (kellyFraction <= 0 && callAmount > 0) {
      this.logReasoningStep(`No edge (Kelly ≤ 0), folding`);
      return { action: "fold" };
    }

    // For small or zero Kelly, just call
    if (kellyFraction < 0.15) {
      if (callAmount === 0) {
        this.logReasoningStep(`Small Kelly but free check`);
        return { action: "call" }; // Check if free
      }
      if (callAmount > this.chips / 10) {
        this.logReasoningStep(`Small Kelly and bet too large, folding`);
        return { action: "fold" }; // Too expensive relative to stack
      }
      this.logReasoningStep(`Small Kelly, calling`);
      return { action: "call" };
    }

    // For significant Kelly, raise according to the fraction
    // Calculate optimal bet size using Kelly (percentage of bankroll)
    const kellyBetSize = this.chips * riskAdjustedKelly;

    // Raise to the optimal size
    const raiseAmount = Math.min(kellyBetSize, this.chips);

    this.logReasoningStep(
      `Significant Kelly (${kellyFraction.toFixed(2)}), raising optimal amount`
    );
    return { action: "raise", amount: Math.max(raiseAmount, callAmount * 2) };
  }

  calculateWinProbability(handStrength, communityCards, game) {
    // Estimate win probability based on hand strength and game state
    let baseWinProbability = handStrength.rank / 9;

    // Adjust for number of players
    const playerCount = game.players.filter(
      (p) => !p.folded && p.isActive
    ).length;
    let playerAdjustment = 0;

    if (playerCount > 3) {
      // Reduce win probability with more players
      playerAdjustment = -0.1 * (playerCount - 3);
    } else if (playerCount === 2) {
      // Increase win probability heads up
      playerAdjustment = 0.1;
    }

    // Adjust for community card count
    let stageAdjustment = 0;
    switch (communityCards.length) {
      case 3: // Flop
        stageAdjustment = -0.05; // More uncertainty
        break;
      case 4: // Turn
        stageAdjustment = -0.02; // Less uncertainty
        break;
      case 5: // River
        stageAdjustment = 0; // No adjustment needed
        break;
    }

    // Adjust for draw potential
    let drawAdjustment = 0;
    const suitCounts = {};
    const allCards = [...this.hand, ...communityCards];

    // Check for flush draws
    allCards.forEach((card) => {
      suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    });

    const flushDraw = Object.values(suitCounts).some((count) => count === 4);
    if (flushDraw && communityCards.length < 5) {
      drawAdjustment += 0.05;
    }

    // Check for straight draws (simplified)
    const values = allCards
      .map((card) => (card.value === 1 ? 14 : card.value))
      .sort((a, b) => a - b);
    const uniqueValues = [...new Set(values)];

    // Check for open-ended straight draw or gutshot
    for (let i = 0; i < uniqueValues.length - 3; i++) {
      if (uniqueValues[i + 3] - uniqueValues[i] <= 4) {
        drawAdjustment += 0.05;
        break;
      }
    }

    // Calculate final win probability
    const finalWinProbability = Math.min(
      0.95,
      Math.max(
        0.05,
        baseWinProbability + playerAdjustment + stageAdjustment + drawAdjustment
      )
    );

    this.logReasoningStep(
      `Win probability calculation: base=${baseWinProbability.toFixed(
        2
      )}, playerAdj=${playerAdjustment.toFixed(
        2
      )}, stageAdj=${stageAdjustment.toFixed(
        2
      )}, drawAdj=${drawAdjustment.toFixed(
        2
      )}, final=${finalWinProbability.toFixed(2)}`
    );

    return finalWinProbability;
  }

  calculateImpliedOddsMultiplier(communityCards, game) {
    // Calculate implied odds multiplier based on:
    // 1. Hand strength
    // 2. Position
    // 3. Opponent stack sizes
    // 4. Game phase

    // Base multiplier
    let multiplier = 1.0;

    // Adjust based on position
    const position = this.getRelativePosition(game);
    if (position === "late") {
      multiplier *= 1.2; // Better implied odds in position
    }

    // Adjust based on hand type (drawing hands have better implied odds)
    const handType = this.determineHandType(communityCards);
    if (handType.isDrawing) {
      multiplier *= 1.3; // Drawing hands have better implied odds
    } else if (handType.isMade) {
      multiplier *= 0.9; // Made hands have worse implied odds
    }

    // Adjust based on stack-to-pot ratio
    const averageStack =
      game.players.reduce((sum, p) => sum + p.chips, 0) / game.players.length;
    const stackToPotRatio = averageStack / game.pot;

    if (stackToPotRatio > 10) {
      multiplier *= 1.3; // Deep stacks improve implied odds
    } else if (stackToPotRatio < 3) {
      multiplier *= 0.8; // Shallow stacks reduce implied odds
    }

    // Adjust based on game phase
    switch (communityCards.length) {
      case 3: // Flop
        multiplier *= 1.2; // More streets to get paid
        break;
      case 4: // Turn
        multiplier *= 1.1; // One more street to get paid
        break;
      case 5: // River
        multiplier = 1.0; // No more implied odds on river
        break;
    }

    return multiplier;
  }

  determineHandType(communityCards) {
    // Determine if we have a made hand or a drawing hand
    if (communityCards.length === 0) {
      // Pre-flop
      const card1Value = this.hand[0].value === 1 ? 14 : this.hand[0].value;
      const card2Value = this.hand[1].value === 1 ? 14 : this.hand[1].value;
      const hasPair = card1Value === card2Value;

      if (hasPair && card1Value >= 7) {
        return { isMade: true, isDrawing: false };
      }

      const sameSuit = this.hand[0].suit === this.hand[1].suit;
      const connected = Math.abs(card1Value - card2Value) <= 2;

      if (sameSuit || connected) {
        return { isMade: false, isDrawing: true };
      }

      if (card1Value === 14 || card2Value === 14) {
        return { isMade: true, isDrawing: false };
      }

      return { isMade: false, isDrawing: false };
    }

    // Post-flop
    const handStrength = this.getHandStrength(communityCards);

    // Made hands
    if (handStrength.rank >= 3) {
      return { isMade: true, isDrawing: false };
    }

    // Drawing hands detection
    const allCards = [...this.hand, ...communityCards];

    // Check for flush draw
    const suitCounts = {};
    allCards.forEach((card) => {
      suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    });

    const flushDraw = Object.values(suitCounts).some((count) => count === 4);

    // Check for straight draw (simplified)
    const values = allCards
      .map((card) => (card.value === 1 ? 14 : card.value))
      .sort((a, b) => a - b);
    const uniqueValues = [...new Set(values)];

    let straightDraw = false;
    for (let i = 0; i < uniqueValues.length - 3; i++) {
      if (uniqueValues[i + 3] - uniqueValues[i] <= 4) {
        straightDraw = true;
        break;
      }
    }

    if (flushDraw || straightDraw) {
      return { isMade: false, isDrawing: true };
    }

    // Weak made hand
    if (handStrength.rank >= 1) {
      return { isMade: true, isDrawing: false };
    }

    // Nothing significant
    return { isMade: false, isDrawing: false };
  }

  makePreFlopKellyDecision(callAmount, potSize) {
    const card1Value = this.hand[0].value === 1 ? 14 : this.hand[0].value;
    const card2Value = this.hand[1].value === 1 ? 14 : this.hand[1].value;
    const hasPair = card1Value === card2Value;
    const sameSuit = this.hand[0].suit === this.hand[1].suit;

    this.logReasoningStep(
      `Pre-flop cards: ${this.hand[0].valueDisplay}${this.hand[0].suitSymbol}, ${this.hand[1].valueDisplay}${this.hand[1].suitSymbol}`
    );

    // More accurate pre-flop equity calculation
    let winProbability = this.calculatePreFlopEquity(
      card1Value,
      card2Value,
      hasPair,
      sameSuit
    );
    this.logReasoningStep(`Pre-flop equity: ${winProbability.toFixed(2)}`);

    // Calculate Kelly bet fraction
    const b = potSize / Math.max(1, callAmount);
    const p = winProbability;
    const q = 1 - p;

    // Kelly fraction
    const kellyFraction = (b * p - q) / b;
    this.logReasoningStep(`Kelly fraction: ${kellyFraction.toFixed(2)}`);

    // Apply quarter-Kelly for more conservative pre-flop play
    const quarterKelly = kellyFraction / 4;
    this.logReasoningStep(
      `Conservative quarter-Kelly: ${quarterKelly.toFixed(2)}`
    );

    if (kellyFraction <= 0 && callAmount > 0) {
      this.logReasoningStep(`No edge (Kelly ≤ 0), folding`);
      return { action: "fold" };
    }

    if (kellyFraction < 0.1) {
      if (callAmount === 0) {
        this.logReasoningStep(`Very small Kelly but free check`);
        return { action: "call" }; // Check if free
      }
      this.logReasoningStep(`Very small Kelly, folding`);
      return { action: "fold" };
    }

    if (kellyFraction < 0.2) {
      this.logReasoningStep(`Small Kelly, calling`);
      return { action: "call" };
    }

    // For significant Kelly, raise according to the fraction
    const kellyBetSize = this.chips * quarterKelly;

    // Raise to the optimal size
    const raiseAmount = Math.min(kellyBetSize, this.chips);

    this.logReasoningStep(
      `Significant Kelly (${kellyFraction.toFixed(2)}), raising optimal amount`
    );
    return { action: "raise", amount: Math.max(raiseAmount, callAmount * 2) };
  }

  calculatePreFlopEquity(card1Value, card2Value, hasPair, sameSuit) {
    // More accurate pre-flop equity calculation based on poker statistics

    // Order the cards for consistency (higher card first)
    const highCard = Math.max(card1Value, card2Value);
    const lowCard = Math.min(card1Value, card2Value);

    // Starting equity based on hand type
    let equity;

    // Premium pocket pairs (AA, KK, QQ, JJ, TT)
    if (hasPair && highCard >= 10) {
      equity = 0.85 - (14 - highCard) * 0.02; // AA: 0.85, KK: 0.83, etc.
    }
    // Medium pocket pairs (99, 88, 77)
    else if (hasPair && highCard >= 7) {
      equity = 0.75 - (10 - highCard) * 0.02; // 99: 0.75, 88: 0.73, etc.
    }
    // Small pocket pairs (66, 55, 44, 33, 22)
    else if (hasPair) {
      equity = 0.65 - (7 - highCard) * 0.02; // 66: 0.65, 55: 0.63, etc.
    }
    // Big suited connectors (AKs, AQs, KQs)
    else if (sameSuit && highCard >= 11 && lowCard >= 10) {
      equity = 0.65 - (14 - highCard) * 0.02 - (13 - lowCard) * 0.01;
    }
    // Ace with big card suited (A9s+)
    else if (sameSuit && highCard === 14 && lowCard >= 9) {
      equity = 0.6 - (13 - lowCard) * 0.02;
    }
    // King with big card suited (K9s+)
    else if (sameSuit && highCard === 13 && lowCard >= 9) {
      equity = 0.55 - (12 - lowCard) * 0.02;
    }
    // Medium suited connectors (T9s, 98s, 87s)
    else if (
      sameSuit &&
      highCard >= 7 &&
      lowCard >= 6 &&
      highCard - lowCard === 1
    ) {
      equity = 0.5 - (10 - highCard) * 0.01;
    }
    // Big offsuit broadway (AKo, AQo, KQo)
    else if (!sameSuit && highCard >= 11 && lowCard >= 10) {
      equity = 0.6 - (14 - highCard) * 0.02 - (13 - lowCard) * 0.01;
    }
    // Ace with big card offsuit (A9o+)
    else if (!sameSuit && highCard === 14 && lowCard >= 9) {
      equity = 0.55 - (13 - lowCard) * 0.02;
    }
    // Small suited connectors and one-gappers
    else if (sameSuit && highCard - lowCard <= 2) {
      equity = 0.45 - (10 - highCard) * 0.02;
    }
    // Any suited ace
    else if (sameSuit && highCard === 14) {
      equity = 0.5 - (8 - Math.min(8, lowCard)) * 0.02;
    }
    // Any suited king
    else if (sameSuit && highCard === 13) {
      equity = 0.45 - (8 - Math.min(8, lowCard)) * 0.02;
    }
    // Medium offsuit connectors
    else if (!sameSuit && highCard - lowCard === 1 && highCard >= 9) {
      equity = 0.45 - (10 - highCard) * 0.02;
    }
    // Any suited cards
    else if (sameSuit) {
      equity = 0.4 - (10 - Math.min(10, highCard)) * 0.01;
    }
    // Any ace
    else if (highCard === 14) {
      equity = 0.4 - (7 - Math.min(7, lowCard)) * 0.03;
    }
    // Any face cards
    else if (highCard >= 11) {
      equity = 0.35 - (11 - Math.min(11, lowCard)) * 0.02;
    }
    // Everything else
    else {
      equity =
        0.35 -
        (9 - Math.min(9, highCard)) * 0.02 -
        (8 - Math.min(8, lowCard)) * 0.01;
    }

    // Ensure equity is within reasonable bounds
    return Math.min(0.9, Math.max(0.3, equity));
  }

  // ------------------------
  // HEURISTIC-BASED ALGORITHMS
  // ------------------------

  // Heuristic-based Strategy - expert rules for different situations
  makeHeuristicDecision(callAmount, communityCards, potSize, game) {
    this.decisionProcess.algorithmName = "Heuristic Rules";

    this.logReasoningStep("Starting heuristic-based decision process");

    // If pre-flop, use pre-flop heuristics
    if (communityCards.length === 0) {
      this.logReasoningStep("Using pre-flop heuristics");
      return this.applyPreFlopHeuristics(callAmount, potSize, game);
    }

    // Post-flop heuristics
    this.logReasoningStep("Using post-flop heuristics");
    return this.applyPostFlopHeuristics(
      callAmount,
      communityCards,
      potSize,
      game
    );
  }

  applyPreFlopHeuristics(callAmount, potSize, game) {
    const card1Value = this.hand[0].value === 1 ? 14 : this.hand[0].value;
    const card2Value = this.hand[1].value === 1 ? 14 : this.hand[1].value;
    const hasPair = card1Value === card2Value;
    const sameSuit = this.hand[0].suit === this.hand[1].suit;
    const connected = Math.abs(card1Value - card2Value) <= 1;

    this.logReasoningStep(
      `Pre-flop cards: ${this.hand[0].valueDisplay}${this.hand[0].suitSymbol}, ${this.hand[1].valueDisplay}${this.hand[1].suitSymbol}`
    );

    // Position-based play (early, middle, late)
    const position = this.getRelativePosition(game);
    this.logReasoningStep(`Position: ${position}`);

    // Heuristic 1: Premium hands - raise in any position
    if (
      (hasPair && card1Value >= 10) ||
      (card1Value >= 13 && card2Value >= 13) ||
      (card1Value === 14 && card2Value >= 10 && sameSuit)
    ) {
      const raiseAmount = Math.min(potSize * 1.5, this.chips);
      this.logReasoningStep(`Heuristic 1: Premium hand, raising`);
      return { action: "raise", amount: raiseAmount };
    }

    // Heuristic 2: Strong hands - call or raise depending on position
    if (
      (hasPair && card1Value >= 7) ||
      (card1Value >= 10 && card2Value >= 10) ||
      (card1Value === 14 && card2Value >= 10) ||
      (connected && sameSuit && card1Value >= 9 && card2Value >= 9)
    ) {
      if (position === "late") {
        const raiseAmount = Math.min(potSize, this.chips);
        this.logReasoningStep(
          `Heuristic 2: Strong hand in late position, raising`
        );
        return { action: "raise", amount: raiseAmount };
      } else {
        if (callAmount > this.chips / 4) {
          this.logReasoningStep(
            `Heuristic 2: Strong hand but bet too large, folding`
          );
          return { action: "fold" };
        }
        this.logReasoningStep(`Heuristic 2: Strong hand, calling`);
        return { action: "call" };
      }
    }

    // Heuristic 3: Playable hands - play in middle/late position
    if (
      hasPair ||
      (connected && sameSuit) ||
      (card1Value >= 10 && card2Value >= 8) ||
      card1Value === 14 ||
      card2Value === 14
    ) {
      if (position === "early") {
        if (callAmount === 0) {
          this.logReasoningStep(
            `Heuristic 3: Playable hand in early position, checking`
          );
          return { action: "call" };
        }
        this.logReasoningStep(
          `Heuristic 3: Playable hand in early position, folding`
        );
        return { action: "fold" };
      } else if (callAmount <= this.chips / 10) {
        this.logReasoningStep(
          `Heuristic 3: Playable hand in middle/late position, calling`
        );
        return { action: "call" };
      } else {
        this.logReasoningStep(
          `Heuristic 3: Playable hand but bet too large, folding`
        );
        return { action: "fold" };
      }
    }

    // Heuristic 4: Speculative hands - play only in late position and cheap
    if (
      (connected || sameSuit) &&
      position === "late" &&
      callAmount <= this.chips / 20
    ) {
      this.logReasoningStep(
        `Heuristic 4: Speculative hand in late position, calling`
      );
      return { action: "call" };
    }

    // Heuristic 5: Check if free
    if (callAmount === 0) {
      this.logReasoningStep(`Heuristic 5: Weak hand but free check`);
      return { action: "call" };
    }

    // Otherwise fold
    this.logReasoningStep(`Default heuristic: Weak hand, folding`);
    return { action: "fold" };
  }

  applyPostFlopHeuristics(callAmount, communityCards, potSize, game) {
    const handStrength = this.getHandStrength(communityCards);
    const draws = this.identifyDraws(communityCards);
    const potOdds = callAmount / (potSize + callAmount);
    const position = this.getRelativePosition(game);

    this.logReasoningStep(`Post-flop hand: ${handStrength.description}`);
    this.logReasoningStep(
      `Position: ${position}, Pot odds: ${potOdds.toFixed(2)}`
    );

    if (draws.strongFlushDraw) {
      this.logReasoningStep(`Identified strong flush draw`);
    }
    if (draws.straightDraw) {
      this.logReasoningStep(`Identified straight draw`);
    }

    // Heuristic 1: Strong made hands - bet for value
    if (handStrength.rank >= 5) {
      // Flush or better
      const valueRaiseAmount = Math.min(potSize * 0.75, this.chips);
      this.logReasoningStep(
        `Heuristic 1: Strong made hand (${handStrength.description}), value betting`
      );
      return { action: "raise", amount: valueRaiseAmount };
    }

    // Heuristic 2: Medium strength hands - bet or call depending on position
    if (handStrength.rank >= 2) {
      // Two pair or better
      if (position === "late" && Math.random() > 0.3) {
        const raiseAmount = Math.min(potSize / 2, this.chips);
        this.logReasoningStep(
          `Heuristic 2: Medium strength hand in late position, raising`
        );
        return { action: "raise", amount: raiseAmount };
      }
      this.logReasoningStep(`Heuristic 2: Medium strength hand, calling`);
      return { action: "call" };
    }

    // Heuristic 3: Strong draws - semi-bluff
    if (draws.strongFlushDraw || draws.straightDraw) {
      if (position === "late" && Math.random() > 0.5) {
        const semiBluffAmount = Math.min(potSize / 2, this.chips);
        this.logReasoningStep(
          `Heuristic 3: Strong draw in late position, semi-bluffing`
        );
        return { action: "raise", amount: semiBluffAmount };
      }
      // Call if pot odds are favorable
      if (potOdds < draws.drawStrength) {
        this.logReasoningStep(
          `Heuristic 3: Strong draw with favorable odds, calling`
        );
        return { action: "call" };
      }
    }

    // Heuristic 4: Weak made hands - call small bets
    if (handStrength.rank >= 1 && callAmount <= this.chips / 15) {
      // Pair
      this.logReasoningStep(
        `Heuristic 4: Weak made hand with small bet, calling`
      );
      return { action: "call" };
    }

    // Heuristic 5: Pure bluff occasionally in late position
    if (
      position === "late" &&
      communityCards.length >= 4 &&
      Math.random() > 0.9
    ) {
      const bluffAmount = Math.min(potSize / 3, this.chips);
      this.logReasoningStep(
        `Heuristic 5: Bluff opportunity in late position, bluffing`
      );
      return { action: "raise", amount: bluffAmount };
    }

    // Heuristic 6: Check if free
    if (callAmount === 0) {
      this.logReasoningStep(`Heuristic 6: Weak hand but free check`);
      return { action: "call" };
    }

    // Otherwise fold
    this.logReasoningStep(`Default heuristic: Weak hand, folding`);
    return { action: "fold" };
  }

  identifyDraws(communityCards) {
    const allCards = [...this.hand, ...communityCards];

    // Count suits
    const suitCounts = {};
    allCards.forEach((card) => {
      suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    });

    // Check for flush draw
    const flushDrawSuit = Object.entries(suitCounts).find(
      ([suit, count]) => count === 4
    )?.[0];
    const strongFlushDraw = !!flushDrawSuit;

    // Map card values and sort for straight checks
    const values = allCards
      .map((card) => (card.value === 1 ? 14 : card.value))
      .sort((a, b) => a - b);
    const uniqueValues = [...new Set(values)];

    // Check for straight draw (simplified)
    let straightDraw = false;

    // Check for open-ended straight draw or gutshot
    for (let i = 0; i < uniqueValues.length - 3; i++) {
      if (uniqueValues[i + 3] - uniqueValues[i] <= 4) {
        straightDraw = true;
        break;
      }
    }

    // Calculate draw strength (probability)
    let drawStrength = 0;
    if (strongFlushDraw) drawStrength = Math.max(drawStrength, 0.19); // ~9/47 chance
    if (straightDraw) drawStrength = Math.max(drawStrength, 0.17); // ~8/47 chance

    return {
      strongFlushDraw,
      straightDraw,
      drawStrength,
    };
  }

  getRelativePosition(game) {
    const totalPlayers = game.players.filter(
      (p) => !p.folded && p.isActive
    ).length;
    const dealerPos = game.dealerIndex;
    const myPos = this.position;

    // Calculate relative position (distance from dealer)
    let relativePos =
      (myPos - dealerPos + game.players.length) % game.players.length;

    // Categorize position
    if (relativePos <= Math.floor(totalPlayers / 3)) {
      return "early";
    } else if (relativePos <= Math.floor((2 * totalPlayers) / 3)) {
      return "middle";
    } else {
      return "late";
    }
  }

  // Position-based Strategy - heavily emphasizes table position
  makePositionBasedDecision(callAmount, communityCards, potSize, game) {
    this.decisionProcess.algorithmName = "Position-Based Strategy";

    this.logReasoningStep("Starting position-based decision process");

    const position = this.getDetailedPosition(game);
    this.logReasoningStep(`Detailed position: ${position}`);

    const handStrength =
      communityCards.length > 0
        ? this.getHandStrength(communityCards)
        : this.evaluateHoleCards();

    // Scale hand strength (0-1)
    const scaledStrength =
      communityCards.length > 0 ? handStrength.rank / 9 : handStrength / 100;

    this.logReasoningStep(`Hand strength: ${scaledStrength.toFixed(2)}`);

    // Position weights for different actions
    const positionWeights = {
      early: {
        raiseThreshold: 0.7, // Only raise with very strong hands
        callThreshold: 0.5, // Call with medium+ hands
        minStrength: 0.3, // Minimum strength to play
      },
      middle: {
        raiseThreshold: 0.6, // Raise with strong hands
        callThreshold: 0.4, // Call with medium hands
        minStrength: 0.2, // Minimum strength to play
      },
      cutoff: {
        raiseThreshold: 0.5, // More liberal raising
        callThreshold: 0.3, // More liberal calling
        minStrength: 0.15, // Can play more hands
      },
      button: {
        raiseThreshold: 0.4, // Most aggressive position
        callThreshold: 0.2, // Call with many hands
        minStrength: 0.1, // Can play wide range
      },
      smallBlind: {
        raiseThreshold: 0.55, // Slightly more aggressive than early
        callThreshold: 0.35, // More liberal calling than early
        minStrength: 0.2, // Similar to middle position
      },
      bigBlind: {
        raiseThreshold: 0.6, // Similar to middle position
        callThreshold: 0.25, // Can defend more widely
        minStrength: 0.1, // Can defend with many hands if cheap
      },
    };

    const weights = positionWeights[position];

    this.logReasoningStep(
      `Position thresholds - Raise: ${weights.raiseThreshold}, Call: ${weights.callThreshold}, Min: ${weights.minStrength}`
    );

    // Record position analysis for logging
    this.decisionProcess.positionAnalysis = {
      position: position,
      handStrength: scaledStrength,
      weights: weights,
    };

    // Apply position-based adjustments
    if (scaledStrength >= weights.raiseThreshold) {
      const raiseAmount = Math.min(potSize, this.chips);
      this.logReasoningStep(
        `Hand strength (${scaledStrength.toFixed(
          2
        )}) exceeds raise threshold for ${position}, raising`
      );
      return { action: "raise", amount: raiseAmount };
    } else if (scaledStrength >= weights.callThreshold) {
      this.logReasoningStep(
        `Hand strength (${scaledStrength.toFixed(
          2
        )}) exceeds call threshold for ${position}, calling`
      );
      return { action: "call" };
    } else if (scaledStrength >= weights.minStrength || callAmount === 0) {
      // Play marginal hands or check if free
      this.logReasoningStep(
        `Hand strength (${scaledStrength.toFixed(
          2
        )}) exceeds minimum threshold for ${position} or free check, calling`
      );
      return { action: "call" };
    } else {
      this.logReasoningStep(
        `Hand strength (${scaledStrength.toFixed(
          2
        )}) below minimum threshold for ${position}, folding`
      );
      return { action: "fold" };
    }
  }

  getDetailedPosition(game) {
    const dealerPos = game.dealerIndex;
    const smallBlindPos = game.smallBlindIndex;
    const bigBlindPos = game.bigBlindIndex;
    const myPos = this.position;

    if (myPos === smallBlindPos) return "smallBlind";
    if (myPos === bigBlindPos) return "bigBlind";
    if (myPos === dealerPos) return "button";

    // Determine cutoff (one before button)
    const cutoffPos =
      (dealerPos - 1 + game.players.length) % game.players.length;
    if (myPos === cutoffPos) return "cutoff";

    // Early vs middle is determined by relative position
    const totalPlayers = game.players.filter((p) => p.isActive).length;

    // Calculate relative position (distance from dealer)
    let relativePos =
      (myPos - dealerPos + game.players.length) % game.players.length;

    // Categorize remaining positions
    if (relativePos < Math.floor(totalPlayers / 3)) {
      return "early";
    } else {
      return "middle";
    }
  }

  evaluateHoleCards() {
    // Returns a value 0-100 representing hand strength
    const card1Value = this.hand[0].value === 1 ? 14 : this.hand[0].value;
    const card2Value = this.hand[1].value === 1 ? 14 : this.hand[1].value;
    const hasPair = card1Value === card2Value;
    const sameSuit = this.hand[0].suit === this.hand[1].suit;

    // Base score table
    let score = 0;

    // Premium pairs
    if (hasPair && card1Value >= 10) score = 90;
    // Medium pairs
    else if (hasPair && card1Value >= 7) score = 75;
    // Small pairs
    else if (hasPair) score = 60;
    // Big cards
    else if (card1Value >= 11 && card2Value >= 11) score = 70;
    // Ace with face card
    else if (
      (card1Value === 14 && card2Value >= 10) ||
      (card2Value === 14 && card1Value >= 10)
    )
      score = 65;
    // Ace with medium card
    else if (card1Value === 14 || card2Value === 14) score = 50;
    // Face cards
    else if (card1Value >= 10 && card2Value >= 10) score = 55;
    // Connected cards 9+
    else if (
      Math.abs(card1Value - card2Value) === 1 &&
      Math.min(card1Value, card2Value) >= 9
    )
      score = 45;
    // Other high connectors
    else if (
      Math.abs(card1Value - card2Value) === 1 &&
      Math.min(card1Value, card2Value) >= 5
    )
      score = 40;
    // Medium cards
    else if (card1Value >= 8 && card2Value >= 8) score = 35;
    // Everything else
    else score = 20;

    // Adjustments
    if (sameSuit) score += 5;
    if (Math.abs(card1Value - card2Value) <= 2) score += 5;
    if (Math.abs(card1Value - card2Value) <= 3) score += 2;

    return score;
  }

  // Pattern Recognition - identifies patterns in betting
  makePatternBasedDecision(callAmount, communityCards, potSize, game) {
    this.decisionProcess.algorithmName = "Pattern Recognition";

    this.logReasoningStep("Starting pattern-based decision process");

    // Analyze betting patterns of other players
    const activeOpponents = game.players.filter(
      (p) => p.position !== this.position && !p.folded && p.isActive
    );

    this.logReasoningStep(`Active opponents: ${activeOpponents.length}`);

    // Detect patterns in opponent behavior
    const patternAnalysis = this.analyzePatterns(game);

    // Hand strength evaluation
    const handStrength =
      communityCards.length > 0
        ? this.getHandStrength(communityCards)
        : { rank: -1, description: "unknown" };

    this.logReasoningStep(
      `Current hand: ${
        communityCards.length > 0 ? handStrength.description : "Hole cards only"
      }`
    );

    // Record pattern analysis for logging
    this.decisionProcess.patternAnalysis = patternAnalysis;

    // Adjust strategy based on observed patterns
    if (patternAnalysis.passiveTable && handStrength.rank >= 1) {
      // More aggressive against passive players
      const raiseAmount = Math.min(potSize * 0.7, this.chips);
      this.logReasoningStep(
        `Passive table detected with decent hand, being more aggressive`
      );
      return { action: "raise", amount: raiseAmount };
    }

    if (patternAnalysis.aggressiveTable && handStrength.rank < 3) {
      // More cautious against aggressive players
      if (callAmount > this.chips / 10) {
        this.logReasoningStep(
          `Aggressive table detected with weak hand, folding to large bet`
        );
        return { action: "fold" };
      }
      this.logReasoningStep(
        `Aggressive table detected with weak hand, calling small bet`
      );
      return { action: "call" };
    }

    // Detect player-specific patterns
    const currentBettor = this.identifyCurrentBettor(game);
    if (currentBettor && patternAnalysis.playerPatterns[currentBettor]) {
      const pattern = patternAnalysis.playerPatterns[currentBettor];

      if (pattern.frequentBluffer && handStrength.rank >= 1) {
        // Call more often against frequent bluffers
        this.logReasoningStep(
          `Current bettor identified as frequent bluffer, calling with medium hand`
        );
        return { action: "call" };
      }

      if (pattern.onlyBetsStrong && handStrength.rank < 4) {
        // Fold more often against tight players
        this.logReasoningStep(
          `Current bettor identified as tight player, folding with medium hand`
        );
        return { action: "fold" };
      }
    }

    // Fallback to basic strategy
    this.logReasoningStep(
      `No specific pattern to exploit, falling back to basic strategy`
    );
    return this.makeBasicDecision(callAmount, communityCards);
  }

  analyzePatterns(game) {
    // Pattern analysis for player behavior
    const result = {
      passiveTable: false,
      aggressiveTable: false,
      playerPatterns: {},
    };

    // Analyze recent actions across all players
    let raiseCount = 0;
    let callCount = 0;
    let foldCount = 0;
    let totalActions = 0;

    // Analyze player-specific actions
    const playerActions = {};

    // Initialize tracking for all players
    game.players.forEach((player) => {
      if (player.position !== this.position) {
        playerActions[player.position] = {
          raises: 0,
          calls: 0,
          folds: 0,
          total: 0,
          preflop: { raises: 0, calls: 0, folds: 0, total: 0 },
          postflop: { raises: 0, calls: 0, folds: 0, total: 0 },
        };
      }
    });

    // Process decision history to populate player actions
    // Only use recent history
    const recentHistory = this.decisionHistory.slice(-30); // Look at last 30 decisions

    // First pass: collect global stats
    recentHistory.forEach((decision) => {
      if (decision.action === "raise") raiseCount++;
      else if (decision.action === "call") callCount++;
      else if (decision.action === "fold") foldCount++;
      totalActions++;
    });

    // Calculate table tendencies
    result.aggressiveTable =
      totalActions > 0 && raiseCount / totalActions > 0.4;
    result.passiveTable = totalActions > 0 && raiseCount / totalActions < 0.2;

    // Enrich with player-specific patterns based on observed gameplay
    // In a real implementation, we would have player-specific histories
    // For this example, we'll use decision history and game state to infer patterns

    // Check current betting round positions
    const currentBettors = game.players.filter(
      (p) => p.position !== this.position && p.currentBet > 0 && !p.folded
    );

    // For each active player, analyze recent actions and game context
    game.players.forEach((player) => {
      if (player.position === this.position || !player.isActive) return;

      // Calculate frequencies and patterns
      const playerPos = player.position;
      const playerBetting = player.currentBet > 0;
      const playerIsAggressive =
        playerBetting &&
        currentBettors.length > 0 &&
        player.currentBet ===
          Math.max(...currentBettors.map((p) => p.currentBet));

      // Calculate implied player tendencies
      // These would normally be based on historical data
      // For now, we'll use position information and current game state
      const positionIndex =
        (player.position - game.dealerIndex + game.players.length) %
        game.players.length;
      const isLatePosition =
        positionIndex >= Math.floor(game.players.length * 0.7);
      const isEarlyPosition =
        positionIndex <= Math.floor(game.players.length * 0.3);

      // Create pattern profile
      result.playerPatterns[playerPos] = {
        frequentBluffer:
          isLatePosition && playerIsAggressive && Math.random() > 0.5,
        onlyBetsStrong:
          isEarlyPosition && playerIsAggressive && Math.random() > 0.3,
        aggressive: playerIsAggressive || Math.random() > 0.7,
        passive: !playerIsAggressive && Math.random() > 0.3,
        positionalAwareness: isLatePosition
          ? "high"
          : isEarlyPosition
          ? "low"
          : "medium",
      };
    });

    return result;
  }

  identifyCurrentBettor(game) {
    // Identify the player who made the largest bet
    const currentBet = game.currentBet;

    // Find the player who matches the current bet
    for (const player of game.players) {
      if (
        player.position !== this.position &&
        player.currentBet === currentBet &&
        player.currentBet > 0 &&
        !player.folded
      ) {
        return player.position;
      }
    }

    // If no single bettor found (e.g., multiple players called), find the last aggressive player
    let lastRaiser = null;
    let highestBet = 0;

    for (const player of game.players) {
      if (
        player.position !== this.position &&
        player.currentBet > highestBet &&
        !player.folded
      ) {
        highestBet = player.currentBet;
        lastRaiser = player.position;
      }
    }

    return lastRaiser;
  }

  makePatternBasedDecision(callAmount, communityCards, potSize, game) {
    this.decisionProcess.algorithmName = "Pattern Recognition";

    this.logReasoningStep("Starting pattern-based decision process");

    // Analyze betting patterns of other players
    const activeOpponents = game.players.filter(
      (p) => p.position !== this.position && !p.folded && p.isActive
    );

    this.logReasoningStep(`Active opponents: ${activeOpponents.length}`);

    // Detect patterns in opponent behavior
    const patternAnalysis = this.analyzePatterns(game);

    // Hand strength evaluation
    const handStrength =
      communityCards.length > 0
        ? this.getHandStrength(communityCards)
        : { rank: -1, description: "unknown" };

    this.logReasoningStep(
      `Current hand: ${
        communityCards.length > 0 ? handStrength.description : "Hole cards only"
      }`
    );

    // Record pattern analysis for logging
    this.decisionProcess.patternAnalysis = patternAnalysis;

    // Game phase determination for context
    const gamePhase =
      communityCards.length === 0
        ? "preflop"
        : communityCards.length === 3
        ? "flop"
        : communityCards.length === 4
        ? "turn"
        : "river";

    this.logReasoningStep(`Current game phase: ${gamePhase}`);

    // Get position information for strategic context
    const position = this.getRelativePosition(game);
    this.logReasoningStep(`Our position: ${position}`);

    // Adjust strategy based on observed patterns
    if (patternAnalysis.passiveTable && handStrength.rank >= 1) {
      // More aggressive against passive players
      const raiseAmount = Math.min(potSize * 0.7, this.chips);
      this.logReasoningStep(
        `Passive table detected with decent hand, being more aggressive`
      );
      return { action: "raise", amount: raiseAmount };
    }

    if (patternAnalysis.aggressiveTable && handStrength.rank < 3) {
      // More cautious against aggressive players
      if (callAmount > this.chips / 10) {
        this.logReasoningStep(
          `Aggressive table detected with weak hand, folding to large bet`
        );
        return { action: "fold" };
      }
      this.logReasoningStep(
        `Aggressive table detected with weak hand, calling small bet`
      );
      return { action: "call" };
    }

    // Detect player-specific patterns
    const currentBettor = this.identifyCurrentBettor(game);
    if (currentBettor && patternAnalysis.playerPatterns[currentBettor]) {
      const pattern = patternAnalysis.playerPatterns[currentBettor];
      this.logReasoningStep(
        `Current bettor: Player ${currentBettor}, pattern identified: ${JSON.stringify(
          pattern
        )}`
      );

      if (pattern.frequentBluffer && handStrength.rank >= 1) {
        // Call more often against frequent bluffers
        this.logReasoningStep(
          `Current bettor identified as frequent bluffer, calling with medium hand`
        );
        return { action: "call" };
      }

      if (pattern.onlyBetsStrong && handStrength.rank < 4) {
        // Fold more often against tight players
        this.logReasoningStep(
          `Current bettor identified as tight player, folding with medium hand`
        );
        return { action: "fold" };
      }

      // Additional pattern-based adjustments
      if (
        pattern.aggressive &&
        gamePhase === "river" &&
        handStrength.rank < 2
      ) {
        this.logReasoningStep(
          `Aggressive player betting on river, likely has a hand, folding`
        );
        return { action: "fold" };
      }

      if (pattern.passive && pattern.aggressive && gamePhase === "river") {
        this.logReasoningStep(
          `Typically passive player being aggressive on river, strong hand signal, folding`
        );
        return { action: "fold" };
      }
    }

    // Position-based pattern adjustments
    if (
      position === "late" &&
      communityCards.length >= 3 &&
      handStrength.rank >= 1
    ) {
      // More aggressive in late position with medium hands
      const raiseAmount = Math.min(potSize * 0.5, this.chips);
      this.logReasoningStep(
        `Position-based pattern: raising in late position with decent hand`
      );
      return { action: "raise", amount: raiseAmount };
    }

    // Game phase pattern adjustments
    if (gamePhase === "preflop" && patternAnalysis.passiveTable) {
      // More aggressive pre-flop stealing against passive table
      if (position === "late" && callAmount <= game.bigBlindAmount * 2) {
        const raiseAmount = Math.min(game.bigBlindAmount * 3, this.chips);
        this.logReasoningStep(
          `Game phase pattern: stealing blinds against passive table`
        );
        return { action: "raise", amount: raiseAmount };
      }
    }

    // Fallback to basic strategy
    this.logReasoningStep(
      `No specific pattern to exploit, falling back to basic strategy`
    );
    return this.makeBasicDecision(callAmount, communityCards);
  }

  makeGamePhaseDecision(callAmount, communityCards, potSize, game) {
    this.decisionProcess.algorithmName = "Game Phase Strategy";

    this.logReasoningStep(
      `Starting game phase strategy for phase: ${game.roundName}`
    );

    // Different strategies based on the current phase of the hand
    switch (game.roundName) {
      case "preflop":
        return this.preflopPhaseStrategy(callAmount, potSize, game);
      case "flop":
        return this.flopPhaseStrategy(
          callAmount,
          communityCards,
          potSize,
          game
        );
      case "turn":
        return this.turnPhaseStrategy(
          callAmount,
          communityCards,
          potSize,
          game
        );
      case "river":
        return this.riverPhaseStrategy(
          callAmount,
          communityCards,
          potSize,
          game
        );
      default:
        this.logReasoningStep(`Unknown phase, falling back to basic strategy`);
        return this.makeBasicDecision(callAmount, communityCards);
    }
  }

  preflopPhaseStrategy(callAmount, potSize, game) {
    // Pre-flop is primarily about position and starting hand strength
    const position = this.getDetailedPosition(game);
    const card1Value = this.hand[0].value === 1 ? 14 : this.hand[0].value;
    const card2Value = this.hand[1].value === 1 ? 14 : this.hand[1].value;
    const hasPair = card1Value === card2Value;
    const sameSuit = this.hand[0].suit === this.hand[1].suit;
    const connected = Math.abs(card1Value - card2Value) <= 1;
    const oneGapper = Math.abs(card1Value - card2Value) === 2;

    this.logReasoningStep(
      `Pre-flop cards: ${this.hand[0].valueDisplay}${this.hand[0].suitSymbol}, ${this.hand[1].valueDisplay}${this.hand[1].suitSymbol}`
    );
    this.logReasoningStep(`Position: ${position}`);

    // Player count affects strategy
    const playerCount = game.players.filter(
      (p) => !p.folded && p.isActive
    ).length;
    this.logReasoningStep(`Active players: ${playerCount}`);

    // Previous action context
    let facingRaise = callAmount > game.bigBlindAmount;
    let facingLargeRaise = callAmount > game.bigBlindAmount * 3;

    if (facingRaise) {
      this.logReasoningStep(
        `Facing raise: ${callAmount} (${
          facingLargeRaise ? "large" : "standard"
        })`
      );
    }

    // Calculate stack-to-pot ratio for context
    const spr = this.chips / Math.max(1, potSize);
    this.logReasoningStep(`Stack-to-pot ratio: ${spr.toFixed(1)}`);

    // Hand strength calculation (0-1 scale) using structured starting hand evaluation
    let handStrength = this.evaluatePreFlopHand(
      card1Value,
      card2Value,
      hasPair,
      sameSuit,
      connected,
      oneGapper,
      position,
      playerCount
    );
    this.logReasoningStep(`Pre-flop hand strength: ${handStrength.toFixed(2)}`);

    // Decision thresholds adjusted for position and game context
    let raiseThreshold, callThreshold, minPlayableThreshold;

    // Different position-based thresholds
    switch (position) {
      case "early":
        raiseThreshold = 0.7;
        callThreshold = 0.5;
        minPlayableThreshold = 0.4;
        break;
      case "middle":
        raiseThreshold = 0.65;
        callThreshold = 0.45;
        minPlayableThreshold = 0.35;
        break;
      case "cutoff":
        raiseThreshold = 0.6;
        callThreshold = 0.4;
        minPlayableThreshold = 0.3;
        break;
      case "button":
        raiseThreshold = 0.55;
        callThreshold = 0.35;
        minPlayableThreshold = 0.25;
        break;
      case "smallBlind":
        raiseThreshold = 0.6;
        callThreshold = 0.4;
        minPlayableThreshold = 0.3;
        break;
      case "bigBlind":
        raiseThreshold = 0.65;
        callThreshold = 0.35; // Can defend wider
        minPlayableThreshold = 0.2; // Can defend BB with weaker hands
        break;
      default:
        raiseThreshold = 0.65;
        callThreshold = 0.45;
        minPlayableThreshold = 0.35;
    }

    // Adjust thresholds based on context
    if (facingLargeRaise) {
      // Tighter against large raises
      raiseThreshold += 0.1;
      callThreshold += 0.1;
      minPlayableThreshold += 0.15;
    } else if (playerCount > 5) {
      // Tighter in multi-way pots
      raiseThreshold += 0.05;
      callThreshold += 0.05;
      minPlayableThreshold += 0.05;
    } else if (playerCount <= 2) {
      // Looser heads-up
      raiseThreshold -= 0.1;
      callThreshold -= 0.1;
      minPlayableThreshold -= 0.1;
    }

    this.logReasoningStep(
      `Adjusted thresholds - Raise: ${raiseThreshold.toFixed(
        2
      )}, Call: ${callThreshold.toFixed(
        2
      )}, Min: ${minPlayableThreshold.toFixed(2)}`
    );

    // Decision logic
    if (handStrength >= raiseThreshold) {
      // Raise with strong hands
      const raiseAmount = this.calculateRaiseAmount(
        potSize,
        callAmount,
        handStrength
      );
      this.logReasoningStep(
        `Strong hand (${handStrength.toFixed(2)} >= ${raiseThreshold.toFixed(
          2
        )}), raising to ${raiseAmount}`
      );
      return { action: "raise", amount: raiseAmount };
    } else if (handStrength >= callThreshold) {
      // Call with decent hands
      if (callAmount > this.chips / 4) {
        this.logReasoningStep(
          `Medium hand but bet too large relative to stack, folding`
        );
        return { action: "fold" };
      }
      this.logReasoningStep(
        `Medium hand (${handStrength.toFixed(2)} >= ${callThreshold.toFixed(
          2
        )}), calling`
      );
      return { action: "call" };
    } else if (handStrength >= minPlayableThreshold) {
      // Call small bets with marginal hands
      if (
        callAmount === 0 ||
        (position === "bigBlind" && callAmount === game.bigBlindAmount)
      ) {
        this.logReasoningStep(`Marginal hand with free/cheap option, calling`);
        return { action: "call" };
      } else if (
        callAmount <= game.bigBlindAmount * 2 &&
        position === "button"
      ) {
        this.logReasoningStep(
          `Marginal hand on button with small raise, calling`
        );
        return { action: "call" };
      } else {
        this.logReasoningStep(`Marginal hand facing significant bet, folding`);
        return { action: "fold" };
      }
    } else if (callAmount === 0) {
      // Check if free
      this.logReasoningStep(`Weak hand but free check`);
      return { action: "call" };
    } else if (position === "bigBlind" && callAmount === game.bigBlindAmount) {
      // Complete in BB with any hand if just the minimum
      this.logReasoningStep(`Completing from BB with weak hand`);
      return { action: "call" };
    } else {
      // Fold weak hands
      this.logReasoningStep(`Weak hand, folding`);
      return { action: "fold" };
    }
  }

  evaluatePreFlopHand(
    card1Value,
    card2Value,
    hasPair,
    sameSuit,
    connected,
    oneGapper,
    position,
    playerCount
  ) {
    // Advanced pre-flop hand evaluation system

    // Base hand strength
    let strength = 0;

    // High card values
    const highCard = Math.max(card1Value, card2Value);
    const lowCard = Math.min(card1Value, card2Value);

    // Premium pocket pairs (AA, KK, QQ, JJ)
    if (hasPair && highCard >= 11) {
      strength = 0.9 - (14 - highCard) * 0.03;
    }
    // Medium pocket pairs (TT, 99, 88, 77)
    else if (hasPair && highCard >= 7) {
      strength = 0.75 - (11 - highCard) * 0.02;
    }
    // Small pocket pairs (66, 55, 44, 33, 22)
    else if (hasPair) {
      strength = 0.6 - (7 - highCard) * 0.02;
    }
    // Premium Broadway cards (AK, AQ, AJ, KQ)
    else if (highCard >= 11 && lowCard >= 11) {
      let baseStrength = 0.7 - (14 - highCard) * 0.03 - (13 - lowCard) * 0.02;
      strength = sameSuit ? baseStrength + 0.05 : baseStrength;
    }
    // Ace with Broadway (AT)
    else if (highCard === 14 && lowCard === 10) {
      strength = sameSuit ? 0.65 : 0.6;
    }
    // Ace with medium (A9-A2)
    else if (highCard === 14) {
      strength = 0.55 - (10 - Math.min(10, lowCard)) * 0.04;
      if (sameSuit) strength += 0.05;
    }
    // King with Broadway or medium (KJ, KT, K9)
    else if (highCard === 13 && lowCard >= 9) {
      strength = 0.55 - (13 - lowCard) * 0.03;
      if (sameSuit) strength += 0.05;
    }
    // Connected cards 10+ (QJ, JT, T9)
    else if (connected && lowCard >= 9) {
      strength = 0.5 - (10 - lowCard) * 0.02;
      if (sameSuit) strength += 0.1;
    }
    // Medium suited connectors (98s-54s)
    else if (connected && sameSuit && lowCard >= 4) {
      strength = 0.55 - (9 - lowCard) * 0.03;
    }
    // Medium offsuit connectors (98o-76o)
    else if (connected && lowCard >= 6) {
      strength = 0.4 - (9 - lowCard) * 0.02;
    }
    // Face cards (QT, J9, etc.)
    else if (highCard >= 11 && lowCard >= 5) {
      strength =
        0.4 - (11 - highCard) * 0.03 - (10 - Math.min(lowCard, 10)) * 0.02;
      if (sameSuit) strength += 0.05;
    }
    // One-gappers suited (J9s, T8s, etc.)
    else if (oneGapper && sameSuit && lowCard >= 6) {
      strength = 0.45 - (10 - lowCard) * 0.03;
    }
    // Suited with high card
    else if (sameSuit && highCard >= 10) {
      strength = 0.4 - (13 - highCard) * 0.02;
    }
    // Any other suited cards
    else if (sameSuit) {
      strength = 0.35 - (10 - Math.min(highCard, 10)) * 0.02;
    }
    // Everything else
    else {
      strength = 0.2 + highCard / 56 + lowCard / 112; // Very marginal hands
    }

    // Position-based adjustments
    if (position === "button" || position === "cutoff") {
      strength += 0.05; // Better position increases hand value
    } else if (position === "early") {
      strength -= 0.05; // Worse position decreases hand value
    }

    // Player count adjustments
    if (playerCount > 5) {
      strength -= 0.05; // Many players decrease value of marginal hands
    } else if (playerCount <= 2) {
      strength += 0.1; // Heads-up increases value of all hands
    }

    // Ensure strength is within valid range
    return Math.min(0.95, Math.max(0.05, strength));
  }

  calculateRaiseAmount(potSize, callAmount, handStrength) {
    // Intelligent pre-flop raise sizing
    const minRaise = callAmount * 2;

    // Base raise size as a function of hand strength and pot
    let raiseSize;

    if (handStrength > 0.85) {
      // Premium hands - larger raise
      raiseSize = Math.max(minRaise, potSize * 3);
    } else if (handStrength > 0.7) {
      // Strong hands - standard raise
      raiseSize = Math.max(minRaise, potSize * 2.5);
    } else if (handStrength > 0.6) {
      // Good hands - smaller raise
      raiseSize = Math.max(minRaise, potSize * 2);
    } else {
      // Marginal hands - minimum raise
      raiseSize = Math.max(minRaise, potSize * 1.5);
    }

    // Cap raise size based on stack size
    return Math.min(raiseSize, this.chips);
  }

  flopPhaseStrategy(callAmount, communityCards, potSize, game) {
    // Flop strategy - focus on draws and made hands
    const handStrength = this.getHandStrength(communityCards);
    const draws = this.identifyDraws(communityCards);
    const position = this.getRelativePosition(game);
    const potOdds = callAmount > 0 ? callAmount / (potSize + callAmount) : 0;

    // Player count and betting context
    const playerCount = game.players.filter(
      (p) => !p.folded && p.isActive
    ).length;
    const facingBet = callAmount > 0;

    this.logReasoningStep(`Flop hand: ${handStrength.description}`);
    this.logReasoningStep(
      `Position: ${position}, Players: ${playerCount}, Pot odds: ${potOdds.toFixed(
        2
      )}`
    );

    // Log draw information
    if (draws.strongFlushDraw) this.logReasoningStep(`Flush draw detected`);
    if (draws.straightDraw) this.logReasoningStep(`Straight draw detected`);
    if (draws.oesd) this.logReasoningStep(`Open-ended straight draw detected`);
    if (draws.gutshot) this.logReasoningStep(`Gutshot draw detected`);
    if (draws.overcards) this.logReasoningStep(`Overcard outs detected`);

    // Calculate the stack-to-pot ratio
    const spr = this.chips / Math.max(1, potSize);
    this.logReasoningStep(`Stack-to-pot ratio: ${spr.toFixed(1)}`);

    // Current pot context - multiway pots require stronger hands
    const isMultiwayPot = playerCount > 2;
    this.logReasoningStep(
      `Pot context: ${isMultiwayPot ? "multiway" : "heads-up"}`
    );

    // Made hand strength (0-1 scale)
    const madeHandStrength = handStrength.rank / 9;

    // Analyze board texture
    const boardTexture = this.analyzeBoardTexture(communityCards);
    this.logReasoningStep(`Board texture: ${JSON.stringify(boardTexture)}`);

    // Combined strength including draws
    let combinedStrength = madeHandStrength;

    // Add value for draws with adjustment for board texture
    if (draws.strongFlushDraw) {
      combinedStrength = Math.max(combinedStrength, 0.6);
    }

    if (draws.oesd) {
      combinedStrength = Math.max(combinedStrength, 0.55);
    } else if (draws.straightDraw) {
      combinedStrength = Math.max(combinedStrength, 0.5);
    }

    // Additional points for combination draws
    if (draws.strongFlushDraw && draws.straightDraw) {
      combinedStrength += 0.15; // Combo draw is very strong
    }

    // Adjust for board texture
    if (boardTexture.isPaired && madeHandStrength < 0.4) {
      combinedStrength -= 0.1; // Paired boards devalue weak hands
    }

    if (boardTexture.isConnected && !draws.straightDraw) {
      combinedStrength -= 0.05; // Connected boards are dangerous without a straight draw
    }

    if (boardTexture.isSuited && !draws.strongFlushDraw) {
      combinedStrength -= 0.05; // Suited boards are dangerous without a flush draw
    }

    // Adjust strength based on SPR
    if (spr < 3 && madeHandStrength > 0.5) {
      combinedStrength += 0.1; // Low SPR increases value of strong made hands
    } else if (spr > 10 && combinedStrength < 0.6 && combinedStrength > 0.4) {
      combinedStrength -= 0.05; // High SPR decreases value of medium hands
    }

    this.logReasoningStep(
      `Made hand strength: ${madeHandStrength.toFixed(
        2
      )}, Combined with draws and texture: ${combinedStrength.toFixed(2)}`
    );

    // Position influence
    let positionAdjustment = 0;
    if (position === "late") {
      positionAdjustment = 0.1;
      this.logReasoningStep(`Position adjustment: +0.1 (late position)`);
    } else if (position === "early") {
      positionAdjustment = -0.05;
      this.logReasoningStep(`Position adjustment: -0.05 (early position)`);
    }

    // Final adjusted strength
    const adjustedStrength = Math.min(
      0.95,
      Math.max(0.05, combinedStrength + positionAdjustment)
    );
    this.logReasoningStep(
      `Final adjusted strength: ${adjustedStrength.toFixed(2)}`
    );

    // Context-specific decision thresholds
    let raiseThreshold = isMultiwayPot ? 0.75 : 0.65;
    let callThreshold = isMultiwayPot ? 0.6 : 0.45;
    let drawCallThreshold = potOdds * 1.1; // Need better than pot odds

    // Decision based on combined strength
    if (adjustedStrength >= raiseThreshold) {
      // Strong made hand or strong draw - bet/raise
      const raiseAmount = this.calculatePostFlopBetSize(
        potSize,
        adjustedStrength,
        boardTexture,
        playerCount
      );
      this.logReasoningStep(
        `Strong hand/draw (${adjustedStrength.toFixed(
          2
        )} >= ${raiseThreshold.toFixed(2)}), raising to ${raiseAmount}`
      );
      return { action: "raise", amount: raiseAmount };
    } else if (adjustedStrength >= callThreshold) {
      // Medium strength hand or decent draw
      if (!facingBet && position === "late") {
        // In position with medium hand - bet
        const betAmount = this.calculatePostFlopBetSize(
          potSize,
          adjustedStrength,
          boardTexture,
          playerCount
        );
        this.logReasoningStep(
          `Medium hand/draw in position without prior action, betting ${betAmount}`
        );
        return { action: "raise", amount: betAmount };
      }
      this.logReasoningStep(
        `Medium hand/draw (${adjustedStrength.toFixed(
          2
        )} >= ${callThreshold.toFixed(2)}), calling`
      );
      return { action: "call" };
    } else if (
      (draws.strongFlushDraw || draws.oesd) &&
      draws.drawStrength > drawCallThreshold
    ) {
      // Draw with favorable odds
      this.logReasoningStep(
        `Draw with favorable odds (${draws.drawStrength.toFixed(
          2
        )} > ${drawCallThreshold.toFixed(2)}), calling`
      );
      return { action: "call" };
    } else if (!facingBet && position === "late" && Math.random() > 0.6) {
      // Sometimes bet as bluff in position
      const bluffAmount = Math.min(potSize * 0.5, this.chips);
      this.logReasoningStep(
        `Position bet opportunity, betting as bluff ${bluffAmount}`
      );
      return { action: "raise", amount: bluffAmount };
    } else if (adjustedStrength >= 0.3 || callAmount === 0) {
      // Weak hand with some potential
      this.logReasoningStep(
        `Weak hand but some potential or free check, calling`
      );
      return { action: "call" };
    } else {
      // Very weak hand
      this.logReasoningStep(`Very weak hand, folding`);
      return { action: "fold" };
    }
  }

  analyzeBoardTexture(communityCards) {
    // Analyze the board texture to inform decision making
    const result = {
      isPaired: false, // Board has a pair
      isConnected: false, // Board has connected cards
      isSuited: false, // Board has 3 cards of same suit
      isHighCard: false, // Board has high cards (A, K, Q)
      isLowCard: false, // Board is all low cards
      isDry: false, // Board has few draws
      isWet: false, // Board has many draws
      highestCard: 0, // Highest card on board
      suitDistribution: {}, // Count of each suit
      valueDistribution: {}, // Count of each value
    };

    // Count card suits and values
    communityCards.forEach((card) => {
      // Track suits
      result.suitDistribution[card.suit] =
        (result.suitDistribution[card.suit] || 0) + 1;

      // Track values
      const cardValue = card.value === 1 ? 14 : card.value;
      result.valueDistribution[cardValue] =
        (result.valueDistribution[cardValue] || 0) + 1;

      // Track highest card
      result.highestCard = Math.max(result.highestCard, cardValue);
    });

    // Check for paired board
    result.isPaired = Object.values(result.valueDistribution).some(
      (count) => count >= 2
    );

    // Check for suited board
    result.isSuited = Object.values(result.suitDistribution).some(
      (count) => count >= 3
    );

    // Check for connected board
    const values = Object.keys(result.valueDistribution)
      .map(Number)
      .sort((a, b) => a - b);
    for (let i = 0; i < values.length - 1; i++) {
      if (values[i + 1] - values[i] <= 2) {
        result.isConnected = true;
        break;
      }
    }

    // Check for high cards
    result.isHighCard = result.highestCard >= 13; // K or higher

    // Check for low card board
    result.isLowCard = result.highestCard < 10;

    // Determine wet vs dry
    result.isWet = result.isConnected || result.isSuited;
    result.isDry = !result.isWet && !result.isPaired;

    return result;
  }

  calculatePostFlopBetSize(potSize, handStrength, boardTexture, playerCount) {
    // Intelligent post-flop bet sizing

    // Base bet size as a percentage of pot
    let betSizePercent;

    if (handStrength > 0.8) {
      // Strong value hands - bet bigger
      betSizePercent = 0.75;
    } else if (handStrength > 0.6) {
      // Medium value hands - standard bet
      betSizePercent = 0.66;
    } else if (handStrength > 0.4) {
      // Weak value hands or draws - smaller bet
      betSizePercent = 0.5;
    } else {
      // Bluffs - minimum effective bet
      betSizePercent = 0.5;
    }

    // Adjust for board texture
    if (boardTexture.isWet) {
      betSizePercent += 0.1; // Bet bigger on wet boards
    } else if (boardTexture.isDry) {
      betSizePercent -= 0.1; // Bet smaller on dry boards
    }

    // Adjust for player count
    if (playerCount > 3) {
      betSizePercent += 0.1; // Bet bigger in multiway pots
    }

    // Calculate final bet size
    const betSize = Math.max(10, Math.round(potSize * betSizePercent));

    // Cap bet size based on stack size
    return Math.min(betSize, this.chips);
  }

  turnPhaseStrategy(callAmount, communityCards, potSize, game) {
    // Turn strategy - more commitment with made hands, less with draws
    const handStrength = this.getHandStrength(communityCards);
    const draws = this.identifyDraws(communityCards);
    const position = this.getRelativePosition(game);
    const potOdds = callAmount > 0 ? callAmount / (potSize + callAmount) : 0;
    const playerCount = game.players.filter(
      (p) => !p.folded && p.isActive
    ).length;
    const facingBet = callAmount > 0;

    this.logReasoningStep(`Turn hand: ${handStrength.description}`);
    this.logReasoningStep(
      `Position: ${position}, Players: ${playerCount}, Pot odds: ${potOdds.toFixed(
        2
      )}`
    );

    if (draws.strongFlushDraw) {
      this.logReasoningStep(`Flush draw detected (one card to come)`);
    }
    if (draws.straightDraw) {
      this.logReasoningStep(`Straight draw detected (one card to come)`);
    }

    // Calculate pot commitment
    const potCommitment = this.calculatePotCommitment(game);
    this.logReasoningStep(`Pot commitment: ${potCommitment.toFixed(2)}`);

    // Analysis of board and betting pattern
    const boardTexture = this.analyzeBoardTexture(communityCards);
    const bettingPattern = this.analyzeBettingPattern(game);

    this.logReasoningStep(`Board texture: ${JSON.stringify(boardTexture)}`);
    this.logReasoningStep(`Betting pattern: ${JSON.stringify(bettingPattern)}`);

    // Made hand strength
    const madeHandStrength = handStrength.rank / 9; // 0 to 1 scale

    // Value draws less on the turn (only one card to come)
    let drawValue = 0;
    if (draws.strongFlushDraw) drawValue = 0.3; // Lower value than on flop
    if (draws.straightDraw) drawValue = 0.25;
    if (draws.gutshot) drawValue = 0.15;

    // Combined strength
    let combinedStrength = Math.max(madeHandStrength, drawValue);

    // Adjust for board texture
    if (
      boardTexture.isPaired &&
      madeHandStrength < 0.6 &&
      madeHandStrength > 0
    ) {
      combinedStrength -= 0.1; // Paired boards devalue medium-weak hands
    }

    if (boardTexture.isHighCard && madeHandStrength < 0.3) {
      combinedStrength -= 0.1; // High card boards bad for weak hands
    }

    // Adjust for betting patterns
    if (bettingPattern.isAggressive && madeHandStrength < 0.6) {
      combinedStrength -= 0.1; // Aggressive action devalues medium hands
    }

    if (bettingPattern.isPassive && madeHandStrength > 0.7) {
      combinedStrength += 0.1; // Passive action increases value of strong hands
    }

    // Adjust for pot commitment
    if (potCommitment > 0.3 && combinedStrength > 0.5) {
      combinedStrength += 0.1; // When committed with a decent hand, increase value
    }

    this.logReasoningStep(
      `Made hand strength: ${madeHandStrength.toFixed(
        2
      )}, Draw value: ${drawValue.toFixed(
        2
      )}, Combined: ${combinedStrength.toFixed(2)}`
    );

    // Position adjustment
    let positionAdjustment = 0;
    if (position === "late") {
      positionAdjustment = 0.05;
      this.logReasoningStep(`Position adjustment: +0.05 (late position)`);
    } else if (position === "early") {
      positionAdjustment = -0.05;
      this.logReasoningStep(`Position adjustment: -0.05 (early position)`);
    }

    // Final adjusted strength
    const adjustedStrength = Math.min(
      0.95,
      Math.max(0.05, combinedStrength + positionAdjustment)
    );
    this.logReasoningStep(
      `Final adjusted strength: ${adjustedStrength.toFixed(2)}`
    );

    // Decision thresholds
    const isMultiwayPot = playerCount > 2;
    let raiseThreshold = isMultiwayPot ? 0.7 : 0.6;
    let callThreshold = isMultiwayPot ? 0.55 : 0.4;
    let drawCallThreshold = potOdds * 1.2; // Needs better odds on turn

    // Decision
    if (adjustedStrength >= raiseThreshold) {
      // Strong hand - bet/raise
      const raiseAmount = this.calculateTurnBetSize(
        potSize,
        adjustedStrength,
        boardTexture,
        playerCount
      );
      this.logReasoningStep(
        `Strong hand (${adjustedStrength.toFixed(
          2
        )} >= ${raiseThreshold.toFixed(2)}), raising to ${raiseAmount}`
      );
      return { action: "raise", amount: raiseAmount };
    } else if (adjustedStrength >= callThreshold) {
      // Medium strength
      if (!facingBet && position === "late") {
        // In position with medium hand - bet
        const betAmount = this.calculateTurnBetSize(
          potSize,
          adjustedStrength,
          boardTexture,
          playerCount
        );
        this.logReasoningStep(
          `Medium strength in position, betting ${betAmount}`
        );
        return { action: "raise", amount: betAmount };
      }
      this.logReasoningStep(
        `Medium strength hand (${adjustedStrength.toFixed(
          2
        )} >= ${callThreshold.toFixed(2)}), calling`
      );
      return { action: "call" };
    } else if (
      (draws.strongFlushDraw || draws.oesd) &&
      draws.drawStrength > drawCallThreshold
    ) {
      // Draw with correct pot odds
      this.logReasoningStep(
        `Draw with correct pot odds (${draws.drawStrength.toFixed(
          2
        )} > ${drawCallThreshold.toFixed(2)}), calling small bet`
      );
      if (callAmount > this.chips / 5) {
        this.logReasoningStep(
          `But bet is too large relative to stack, folding`
        );
        return { action: "fold" };
      }
      return { action: "call" };
    } else if (!facingBet && position === "late" && Math.random() > 0.7) {
      // Occasionally bluff in position
      const bluffAmount = Math.min(potSize * 0.6, this.chips);
      this.logReasoningStep(
        `Turn bluff opportunity in position, betting ${bluffAmount}`
      );
      return { action: "raise", amount: bluffAmount };
    } else if (callAmount === 0) {
      // Check if free
      this.logReasoningStep(`Weak hand but free check`);
      return { action: "call" };
    } else {
      // Fold weak hands and draws without odds
      this.logReasoningStep(`Weak hand without proper odds, folding`);
      return { action: "fold" };
    }
  }

  calculateTurnBetSize(potSize, handStrength, boardTexture, playerCount) {
    // Turn bet sizing is typically larger than flop

    // Base bet size as a percentage of pot
    let betSizePercent;

    if (handStrength > 0.8) {
      // Strong value hands - larger bet
      betSizePercent = 0.85;
    } else if (handStrength > 0.6) {
      // Medium value hands - standard bet
      betSizePercent = 0.75;
    } else if (handStrength > 0.4) {
      // Weak value hands or draws - smaller bet
      betSizePercent = 0.6;
    } else {
      // Bluffs - polarized sizing
      betSizePercent = 0.8;
    }

    // Adjust for board texture
    if (boardTexture.isWet) {
      betSizePercent += 0.1; // Bet bigger on wet boards
    } else if (boardTexture.isDry && handStrength < 0.6) {
      betSizePercent -= 0.1; // Bet smaller on dry boards with bluffs
    }

    // Adjust for player count
    if (playerCount > 2) {
      betSizePercent += 0.1; // Bet bigger in multiway pots
    }

    // Calculate final bet size
    const betSize = Math.max(20, Math.round(potSize * betSizePercent));

    // Cap bet size based on stack size
    return Math.min(betSize, this.chips);
  }

  calculatePotCommitment(game) {
    // Calculate how committed we are to the pot
    const totalPot = game.pot;
    const myContribution = this.currentBet;

    // Avoid division by zero
    if (totalPot === 0) return 0;

    // Return our contribution as a percentage of the pot
    return myContribution / totalPot;
  }

  analyzeBettingPattern(game) {
    // Analyze betting patterns in the current hand
    const result = {
      isAggressive: false, // Lots of raising
      isPassive: false, // Mostly calling
      isFlopBet: false, // Was there a bet on the flop
      isFlopRaise: false, // Was there a raise on the flop
      betSizeRelativeToPot: 0, // Current bet relative to pot
    };

    // Get active players
    const activePlayers = game.players.filter((p) => !p.folded && p.isActive);

    // Count raises vs calls
    let raiseCount = 0;
    let callCount = 0;

    activePlayers.forEach((player) => {
      if (player.currentBet > game.bigBlindAmount * 2) {
        raiseCount++;
      } else if (player.currentBet > 0) {
        callCount++;
      }
    });

    // Determine if aggressive or passive
    result.isAggressive = raiseCount > callCount;
    result.isPassive = callCount > raiseCount * 2;

    // Analysis of previous rounds would require game history
    // For now we'll just use current bets

    // Calculate bet size relative to pot
    if (game.currentBet > 0) {
      result.betSizeRelativeToPot =
        game.currentBet / Math.max(1, game.pot - game.currentBet);
    }

    return result;
  }

  riverPhaseStrategy(callAmount, communityCards, potSize, game) {
    // River strategy - made hands only, potential for bluffs
    const handStrength = this.getHandStrength(communityCards);
    const madeHandStrength = handStrength.rank / 9; // 0-1 scale
    const position = this.getRelativePosition(game);
    const isLatePosition = position === "late";
    const potOdds = callAmount > 0 ? callAmount / (potSize + callAmount) : 0;
    const playerCount = game.players.filter(
      (p) => !p.folded && p.isActive
    ).length;
    const facingBet = callAmount > 0;

    this.logReasoningStep(
      `River hand: ${handStrength.description} (${madeHandStrength.toFixed(2)})`
    );
    this.logReasoningStep(
      `Position: ${position}, Players: ${playerCount}, Pot odds: ${potOdds.toFixed(
        2
      )}`
    );

    // Advanced river-specific analysis
    const boardTexture = this.analyzeBoardTexture(communityCards);
    const bettingPattern = this.analyzeBettingPattern(game);
    const handShowdownValue = this.estimateShowdownValue(
      handStrength,
      communityCards,
      game
    );

    this.logReasoningStep(`Board texture: ${JSON.stringify(boardTexture)}`);
    this.logReasoningStep(`Betting pattern: ${JSON.stringify(bettingPattern)}`);
    this.logReasoningStep(
      `Estimated showdown value: ${handShowdownValue.toFixed(2)}`
    );

    // Position is important for bluffing
    if (isLatePosition) {
      this.logReasoningStep(`In late position (good for potential bluffs)`);
    }

    // Pot size relative to stack for pot commitment
    const potCommitment = this.calculatePotCommitment(game);
    this.logReasoningStep(`Pot commitment: ${potCommitment.toFixed(2)}`);

    // Adjust hand strength based on showdown value
    let adjustedStrength = Math.max(madeHandStrength, handShowdownValue);

    // Adjust for pot commitment
    if (potCommitment > 0.4 && adjustedStrength > 0.4) {
      adjustedStrength += 0.1; // When committed with a decent hand, increase value
      this.logReasoningStep(`Commitment adjustment: +0.1 (pot committed)`);
    }

    // Position adjustment
    if (isLatePosition) {
      adjustedStrength += 0.05;
      this.logReasoningStep(`Position adjustment: +0.05 (late position)`);
    }

    // Adjust for multiway pot
    if (playerCount > 2 && adjustedStrength < 0.7) {
      adjustedStrength -= 0.1; // Weaker hands lose value in multiway pots
      this.logReasoningStep(`Multiway adjustment: -0.1 (more players)`);
    }

    this.logReasoningStep(
      `Final adjusted strength: ${adjustedStrength.toFixed(2)}`
    );

    // Decision thresholds for river
    const isMultiwayPot = playerCount > 2;
    let valueRaiseThreshold = isMultiwayPot ? 0.75 : 0.65;
    let callThreshold = isMultiwayPot ? 0.6 : 0.5;
    let bluffThreshold = 0.85; // Only bluff in the right spots

    // Value betting with strong hands
    if (adjustedStrength >= valueRaiseThreshold) {
      const valueRaiseAmount = this.calculateRiverBetSize(
        potSize,
        adjustedStrength,
        boardTexture,
        playerCount,
        true
      );
      this.logReasoningStep(
        `Strong hand (${adjustedStrength.toFixed(
          2
        )} >= ${valueRaiseThreshold.toFixed(
          2
        )}), value betting ${valueRaiseAmount}`
      );
      return { action: "raise", amount: valueRaiseAmount };
    }

    // Medium-strong hands
    if (adjustedStrength >= callThreshold) {
      // In position without a bet, bet for thin value
      if (
        !facingBet &&
        isLatePosition &&
        adjustedStrength >= callThreshold + 0.05
      ) {
        const thinValueBet = this.calculateRiverBetSize(
          potSize,
          adjustedStrength,
          boardTexture,
          playerCount,
          false
        );
        this.logReasoningStep(
          `Medium-strong hand in position, thin value betting ${thinValueBet}`
        );
        return { action: "raise", amount: thinValueBet };
      }

      // Call most bets
      if (callAmount > this.chips / 2) {
        // Big bet might indicate a very strong hand
        this.logReasoningStep(
          `Medium hand (${adjustedStrength.toFixed(
            2
          )} >= ${callThreshold.toFixed(2)}) but large bet, folding`
        );
        return { action: "fold" };
      }

      if (callAmount > potSize * 0.7 && adjustedStrength < 0.6) {
        // Big bet relative to pot with medium hand
        this.logReasoningStep(
          `Medium hand but large bet relative to pot, folding`
        );
        return { action: "fold" };
      }

      this.logReasoningStep(
        `Medium hand (${adjustedStrength.toFixed(2)} >= ${callThreshold.toFixed(
          2
        )}), calling`
      );
      return { action: "call" };
    }

    // Bluffing with weak hands in late position
    if (
      adjustedStrength < 0.3 &&
      isLatePosition &&
      !facingBet &&
      Math.random() > 1 - bluffThreshold
    ) {
      // Conditions for bluff: late position, no action yet, good board for bluffing
      if (this.isGoodBluffingSpot(communityCards, game)) {
        const bluffAmount = this.calculateRiverBetSize(
          potSize,
          0.8,
          boardTexture,
          playerCount,
          false
        ); // Use strong sizing
        this.logReasoningStep(
          `Weak hand but identified good bluffing spot, bluffing ${bluffAmount}`
        );
        return { action: "raise", amount: bluffAmount };
      }
    }

    // Check if free
    if (callAmount === 0) {
      this.logReasoningStep(`Weak hand but free check`);
      return { action: "call" };
    }

    // Fold weak hands
    this.logReasoningStep(`Weak hand, folding`);
    return { action: "fold" };
  }

  isGoodBluffingSpot(communityCards, game) {
    // Determine if this is a good spot to bluff

    // Check board texture
    const boardTexture = this.analyzeBoardTexture(communityCards);

    // Check player tendencies
    const activePlayers = game.players.filter(
      (p) => !p.folded && p.isActive && p.position !== this.position
    );

    // Only bluff against 1 or 2 opponents
    if (activePlayers.length > 2) return false;

    // Better bluffing on high card or uncoordinated boards
    const goodBluffBoard = boardTexture.isHighCard || boardTexture.isDry;

    // Don't bluff on paired boards (trips are common)
    if (boardTexture.isPaired) return false;

    // Don't bluff when we've shown weakness earlier
    if (
      this.decisionHistory.some(
        (d) => d.gamePhase === "flop" || d.gamePhase === "turn"
      ) &&
      this.decisionHistory[this.decisionHistory.length - 1].action === "call"
    ) {
      return false;
    }

    // Calculate a bluff probability
    let bluffProbability = goodBluffBoard ? 0.7 : 0.3;

    // Randomize to prevent predictability
    return Math.random() < bluffProbability;
  }

  estimateShowdownValue(handStrength, communityCards, game) {
    // Estimate the showdown value of our hand

    // Start with raw hand strength
    let showdownValue = handStrength.rank / 9;

    // Analyze active players
    const activePlayers = game.players.filter((p) => !p.folded && p.isActive);

    // More players = need stronger hand
    if (activePlayers.length > 2) {
      showdownValue -= 0.1 * (activePlayers.length - 2);
    }

    // Analyze board texture
    const boardTexture = this.analyzeBoardTexture(communityCards);

    // Adjust for board texture
    if (boardTexture.isPaired && handStrength.rank < 3) {
      // Paired boards devalue one pair hands significantly
      showdownValue -= 0.2;
    }

    if (boardTexture.isConnected && handStrength.rank < 4) {
      // Connected boards devalue weak hands (more straight possibilities)
      showdownValue -= 0.15;
    }

    if (boardTexture.isSuited && handStrength.rank < 5) {
      // Suited boards devalue hands below flush
      showdownValue -= 0.15;
    }

    // Adjust for betting pattern
    const bettingPattern = this.analyzeBettingPattern(game);

    if (bettingPattern.isAggressive && handStrength.rank < 4) {
      // Aggressive betting devalues weaker hands
      showdownValue -= 0.2;
    }

    // Ensure showdown value is within bounds
    return Math.min(1, Math.max(0, showdownValue));
  }

  calculateRiverBetSize(
    potSize,
    handStrength,
    boardTexture,
    playerCount,
    isForValue
  ) {
    // River bet sizing is more polarized

    // Base bet size as a percentage of pot
    let betSizePercent;

    if (isForValue) {
      if (handStrength > 0.8) {
        // Very strong value hands - larger bet for maximum value
        betSizePercent = 0.9;
      } else if (handStrength > 0.7) {
        // Strong hands - standard value bet
        betSizePercent = 0.75;
      } else {
        // Medium-strong hands - smaller value bet
        betSizePercent = 0.6;
      }
    } else {
      // Bluffs should mirror value bets
      betSizePercent = 0.75;
    }

    // Adjust for board texture
    if (boardTexture.isWet && isForValue && handStrength > 0.7) {
      betSizePercent += 0.15; // Bet bigger for value on wet boards with strong hands
    } else if (boardTexture.isDry && !isForValue) {
      betSizePercent += 0.15; // Bluff bigger on dry boards
    }

    // Adjust for player count (in multiway pots, polarize more)
    if (playerCount > 2) {
      if (isForValue && handStrength > 0.7) {
        betSizePercent += 0.1; // Bet bigger for value in multiway
      } else if (!isForValue) {
        betSizePercent -= 0.1; // Bluff smaller in multiway (more likely to get called)
      }
    }

    // Calculate final bet size
    const betSize = Math.max(20, Math.round(potSize * betSizePercent));

    // Cap bet size based on stack size
    return Math.min(betSize, this.chips);
  }

  makeAdaptiveStateDecision(callAmount, communityCards, potSize, game) {
    this.decisionProcess.algorithmName = "Adaptive State Machine";

    // Determine current game state
    const gameState = this.determineGameState(communityCards, game);
    this.logReasoningStep(`Current game state detected: ${gameState}`);

    // Record game state analysis for logging
    this.decisionProcess.gameStateAnalysis = {
      state: gameState,
      activePlayers: game.players.filter((p) => p.isActive && !p.folded).length,
      avgStack:
        game.players.reduce((sum, p) => sum + p.chips, 0) / game.players.length,
      stackToBlindRatio: this.chips / game.bigBlindAmount,
      tournamentPhase: this.determineTournamentPhase(game),
    };

    // Adapt strategy based on game state
    switch (gameState) {
      case "early":
        return this.earlyGameStrategy(
          callAmount,
          communityCards,
          potSize,
          game
        );
      case "middle":
        return this.middleGameStrategy(
          callAmount,
          communityCards,
          potSize,
          game
        );
      case "late":
        return this.lateGameStrategy(callAmount, communityCards, potSize, game);
      case "heads_up":
        return this.headsUpStrategy(callAmount, communityCards, potSize, game);
      case "bubble":
        return this.bubbleStrategy(callAmount, communityCards, potSize, game);
      case "icm_pressure":
        return this.icmPressureStrategy(
          callAmount,
          communityCards,
          potSize,
          game
        );
      case "final_table":
        return this.finalTableStrategy(
          callAmount,
          communityCards,
          potSize,
          game
        );
      default:
        this.logReasoningStep(
          `Unknown game state, falling back to basic strategy`
        );
        return this.makeBasicDecision(callAmount, communityCards);
    }
  }

  determineGameState(communityCards, game) {
    // Comprehensive game state identification

    // Count active players
    const activePlayers = game.players.filter(
      (p) => p.isActive && !p.folded
    ).length;
    this.logReasoningStep(`Active players: ${activePlayers}`);

    // Check if we're heads-up (1v1)
    if (activePlayers === 2) {
      return "heads_up";
    }

    // Check stack sizes relative to blinds
    const avgStack =
      game.players.reduce((sum, p) => sum + p.chips, 0) / game.players.length;
    const bbRatio = avgStack / game.bigBlindAmount;
    const ourBBRatio = this.chips / game.bigBlindAmount;

    this.logReasoningStep(
      `Average stack: ${avgStack}, BB ratio: ${bbRatio.toFixed(1)}`
    );
    this.logReasoningStep(
      `Our stack: ${this.chips}, Our BB ratio: ${ourBBRatio.toFixed(1)}`
    );

    // Assess tournament phase
    const tournamentPhase = this.determineTournamentPhase(game);
    this.logReasoningStep(`Tournament phase: ${tournamentPhase}`);

    // Check if we're under ICM pressure
    if (this.isUnderICMPressure(game)) {
      return "icm_pressure";
    }

    // Final table dynamics
    if (tournamentPhase === "final_table") {
      return "final_table";
    }

    // Check if we're on the bubble
    if (this.isOnBubble(game)) {
      return "bubble";
    }

    // Late game (short stacks)
    if (bbRatio < 20 || ourBBRatio < 15) {
      return "late";
    }

    // Early game (deep stacks)
    if (bbRatio > 50) {
      return "early";
    }

    // Default to middle game
    return "middle";
  }

  determineTournamentPhase(game) {
    // Determine tournament phase based on player count and blind levels
    // This is a simplified implementation - in a real tournament there would be structured data

    const totalPlayers = game.players.length;
    const activePlayers = game.players.filter((p) => p.isActive).length;
    const bigBlind = game.bigBlindAmount;
    const avgStack =
      game.players.reduce((sum, p) => sum + p.chips, 0) / activePlayers;
    const avgBBs = avgStack / bigBlind;

    // Final table (9 or fewer players)
    if (activePlayers <= 9) {
      return "final_table";
    }

    // Late phase (high blinds, short stacks)
    if (avgBBs < 25) {
      return "late";
    }

    // Middle phase
    if (avgBBs < 50) {
      return "middle";
    }

    // Early phase (deep stacks)
    return "early";
  }

  isOnBubble(game) {
    // Determine if we're on the bubble (just before money)
    // This is a simplified implementation - in a real tournament there would be payout structure data

    const activePlayers = game.players.filter((p) => p.isActive).length;

    // Assuming top 15-20% of field gets paid
    // This is a greatly simplified bubble detection - real tournaments would have exact payout spots
    if (activePlayers > 9 && activePlayers <= 12) {
      return true; // Approximating the bubble
    }

    return false;
  }

  isUnderICMPressure(game) {
    // Check if we're in a situation where ICM considerations are significant
    // ICM = Independent Chip Model - chips aren't worth linear value in tournaments

    const activePlayers = game.players.filter((p) => p.isActive).length;
    const ourStackInBBs = this.chips / game.bigBlindAmount;

    // ICM pressure is highest when:
    // 1. We're near the bubble
    // 2. We have a medium stack
    // 3. There are short stacks at the table

    const nearBubble = this.isOnBubble(game);
    const mediumStack = ourStackInBBs > 15 && ourStackInBBs < 30;

    // Check for shorter stacks at the table
    const shorterStackCount = game.players.filter(
      (p) =>
        p.isActive && p.position !== this.position && p.chips < this.chips * 0.6
    ).length;

    const significantPayJump = activePlayers <= 6; // Final table or near final table

    // ICM pressure exists when we're in a position to ladder up by avoiding confrontation
    return (
      (nearBubble && mediumStack && shorterStackCount >= 1) ||
      (significantPayJump && shorterStackCount >= 1)
    );
  }

  earlyGameStrategy(callAmount, communityCards, potSize, game) {
    // Early game - play tight and value-oriented
    const handStrength =
      communityCards.length > 0
        ? this.getHandStrength(communityCards)
        : this.evaluateHoleCards();

    // Scale hand strength
    const scaledStrength =
      communityCards.length > 0 ? handStrength.rank / 9 : handStrength / 100;

    this.logReasoningStep(
      `Early game strategy with hand strength: ${scaledStrength.toFixed(2)}`
    );

    // Position considerations
    const position = this.getRelativePosition(game);
    this.logReasoningStep(`Our position: ${position}`);

    // More specific pre-flop vs post-flop strategy
    if (communityCards.length === 0) {
      return this.earlyGamePreFlopStrategy(
        callAmount,
        potSize,
        game,
        scaledStrength,
        position
      );
    } else {
      return this.earlyGamePostFlopStrategy(
        callAmount,
        communityCards,
        potSize,
        game,
        scaledStrength,
        position
      );
    }
  }

  earlyGamePreFlopStrategy(callAmount, potSize, game, handStrength, position) {
    // Early game pre-flop strategy - conservative

    // Get specific hand details
    const card1Value = this.hand[0].value === 1 ? 14 : this.hand[0].value;
    const card2Value = this.hand[1].value === 1 ? 14 : this.hand[1].value;
    const hasPair = card1Value === card2Value;
    const hasAce = card1Value === 14 || card2Value === 14;
    const bothBroadway = card1Value >= 10 && card2Value >= 10;

    // Assess fold equity
    const isOpenRaise =
      game.players.filter((p) => p.currentBet > game.bigBlindAmount).length ===
      0;

    this.logReasoningStep(
      `Hand details: Pair=${hasPair}, Ace=${hasAce}, Broadway=${bothBroadway}`
    );
    this.logReasoningStep(
      `Table action: Open raise opportunity=${isOpenRaise}`
    );

    // Early game - play premium hands strongly, fold marginal hands
    if (handStrength > 0.7) {
      // Strong hand - raise for value
      const raiseAmount = Math.min(potSize * 3, this.chips);
      this.logReasoningStep(
        `Strong hand in early game (${handStrength.toFixed(
          2
        )} > 0.7), raising for value`
      );
      return { action: "raise", amount: raiseAmount };
    } else if (handStrength > 0.5) {
      // Medium hand - call or raise in position
      if (position === "late" && isOpenRaise) {
        const raiseAmount = Math.min(potSize * 2.5, this.chips);
        this.logReasoningStep(`Medium hand in late position, opening raise`);
        return { action: "raise", amount: raiseAmount };
      }

      if (callAmount > this.chips / 10) {
        this.logReasoningStep(
          `Medium hand but significant bet, folding to preserve chips`
        );
        return { action: "fold" };
      }

      this.logReasoningStep(
        `Medium hand in early game (${handStrength.toFixed(2)} > 0.5), calling`
      );
      return { action: "call" };
    } else if (handStrength > 0.3 && callAmount === 0) {
      // Weak hand - check if free
      this.logReasoningStep(`Weak hand in early game but free check`);
      return { action: "call" };
    } else if (position === "late" && handStrength > 0.4 && isOpenRaise) {
      // Stealing opportunity with marginal hand
      const raiseAmount = Math.min(potSize * 2, this.chips);
      this.logReasoningStep(
        `Stealing opportunity with marginal hand in late position`
      );
      return { action: "raise", amount: raiseAmount };
    } else {
      // Fold weak hands
      this.logReasoningStep(
        `Weak hand in early game, folding to preserve chips`
      );
      return { action: "fold" };
    }
  }

  earlyGamePostFlopStrategy(
    callAmount,
    communityCards,
    potSize,
    game,
    handStrength,
    position
  ) {
    // Early game post-flop strategy - value-oriented

    // Get hand details
    const actualHand = this.getHandStrength(communityCards);
    this.logReasoningStep(`Post-flop hand: ${actualHand.description}`);

    // Analyze draws
    const draws = this.identifyDraws(communityCards);
    if (draws.strongFlushDraw) this.logReasoningStep(`Flush draw detected`);
    if (draws.straightDraw) this.logReasoningStep(`Straight draw detected`);

    // Pot odds calculation
    const potOdds = callAmount > 0 ? callAmount / (potSize + callAmount) : 0;
    this.logReasoningStep(`Pot odds: ${potOdds.toFixed(2)}`);

    // In early game, focus on made hands, play draws cautiously
    if (handStrength > 0.6) {
      // Strong hand - value bet
      const raiseAmount = Math.min(potSize * 0.7, this.chips);
      this.logReasoningStep(`Strong hand post-flop, value betting`);
      return { action: "raise", amount: raiseAmount };
    } else if (handStrength > 0.4) {
      // Medium hand - call or small raise in position
      if (position === "late" && callAmount === 0) {
        const raiseAmount = Math.min(potSize * 0.5, this.chips);
        this.logReasoningStep(`Medium hand in position, making a probe bet`);
        return { action: "raise", amount: raiseAmount };
      }

      if (callAmount > this.chips / 15) {
        this.logReasoningStep(
          `Medium hand facing significant bet, folding in early game`
        );
        return { action: "fold" };
      }

      this.logReasoningStep(`Medium hand, calling small bet`);
      return { action: "call" };
    } else if ((draws.strongFlushDraw || draws.straightDraw) && potOdds < 0.2) {
      // Strong draw with good odds
      this.logReasoningStep(`Strong draw with favorable odds, calling`);
      return { action: "call" };
    } else if (callAmount === 0) {
      // Free check
      this.logReasoningStep(`Weak hand/draw but free check`);
      return { action: "call" };
    } else {
      // Fold weak hands and marginally +EV draws to preserve stack
      this.logReasoningStep(
        `Weak hand/draw, folding to preserve stack in early game`
      );
      return { action: "fold" };
    }
  }

  middleGameStrategy(callAmount, communityCards, potSize, game) {
    // Middle game - more balanced approach with position awareness

    // Get hand strength and position
    const handStrength =
      communityCards.length > 0
        ? this.getHandStrength(communityCards)
        : this.evaluateHoleCards();

    // Scale hand strength
    const scaledStrength =
      communityCards.length > 0 ? handStrength.rank / 9 : handStrength / 100;

    const position = this.getRelativePosition(game);

    this.logReasoningStep(
      `Middle game strategy with hand strength: ${scaledStrength.toFixed(
        2
      )}, position: ${position}`
    );

    // Player count affects strategy
    const playerCount = game.players.filter(
      (p) => !p.folded && p.isActive
    ).length;
    this.logReasoningStep(`Active players: ${playerCount}`);

    // Position adjustment
    let positionAdjustment = 0;
    if (position === "late") positionAdjustment = 0.1;
    if (position === "early") positionAdjustment = -0.1;

    const adjustedStrength = scaledStrength + positionAdjustment;
    this.logReasoningStep(
      `Position adjustment: ${positionAdjustment.toFixed(
        2
      )}, adjusted strength: ${adjustedStrength.toFixed(2)}`
    );

    // Split pre-flop and post-flop play
    if (communityCards.length === 0) {
      return this.middleGamePreFlopStrategy(
        callAmount,
        potSize,
        game,
        adjustedStrength,
        position,
        playerCount
      );
    } else {
      return this.middleGamePostFlopStrategy(
        callAmount,
        communityCards,
        potSize,
        game,
        adjustedStrength,
        position,
        playerCount
      );
    }
  }

  middleGamePreFlopStrategy(
    callAmount,
    potSize,
    game,
    adjustedStrength,
    position,
    playerCount
  ) {
    // Middle game pre-flop - balanced with positional awareness

    // Check if we're facing a raise
    const facingRaise = callAmount > game.bigBlindAmount;

    // Get specific hand details
    const card1Value = this.hand[0].value === 1 ? 14 : this.hand[0].value;
    const card2Value = this.hand[1].value === 1 ? 14 : this.hand[1].value;

    this.logReasoningStep(
      `Pre-flop cards: ${this.hand[0].valueDisplay}${this.hand[0].suitSymbol}, ${this.hand[1].valueDisplay}${this.hand[1].suitSymbol}`
    );
    this.logReasoningStep(
      `Facing raise: ${facingRaise}, call amount: ${callAmount}`
    );

    // Specific stack size considerations
    const stackToBlinds = this.chips / game.bigBlindAmount;
    this.logReasoningStep(`Stack in blinds: ${stackToBlinds.toFixed(1)}`);

    // Decision thresholds based on position and context
    let raiseThreshold, callThreshold;

    if (position === "late") {
      raiseThreshold = 0.55;
      callThreshold = 0.35;
    } else if (position === "middle") {
      raiseThreshold = 0.6;
      callThreshold = 0.4;
    } else {
      // early
      raiseThreshold = 0.65;
      callThreshold = 0.45;
    }

    // Adjust thresholds based on table dynamics
    if (playerCount > 5) {
      // Tighter with more players
      raiseThreshold += 0.05;
      callThreshold += 0.05;
    } else if (playerCount <= 2) {
      // Looser heads-up
      raiseThreshold -= 0.1;
      callThreshold -= 0.1;
    }

    // Facing raise requires stronger hands
    if (facingRaise) {
      raiseThreshold += 0.1;
      callThreshold += 0.05;
    }

    this.logReasoningStep(
      `Decision thresholds - Raise: ${raiseThreshold.toFixed(
        2
      )}, Call: ${callThreshold.toFixed(2)}`
    );

    if (adjustedStrength > raiseThreshold) {
      // Strong hand - raise
      const raiseAmount = Math.min(potSize, this.chips);
      this.logReasoningStep(
        `Strong hand in middle game (${adjustedStrength.toFixed(
          2
        )} > ${raiseThreshold.toFixed(2)}), raising`
      );
      return { action: "raise", amount: raiseAmount };
    } else if (adjustedStrength > callThreshold) {
      // Medium hand - call or small raise in position
      if (position === "late" && Math.random() > 0.6 && !facingRaise) {
        const raiseAmount = Math.min(potSize / 2, this.chips);
        this.logReasoningStep(
          `Medium hand in late position with random raise chance, raising`
        );
        return { action: "raise", amount: raiseAmount };
      }

      if (callAmount > this.chips / 5) {
        this.logReasoningStep(`Medium hand but large bet, folding`);
        return { action: "fold" };
      }

      this.logReasoningStep(
        `Medium hand in middle game (${adjustedStrength.toFixed(
          2
        )} > ${callThreshold.toFixed(2)}), calling`
      );
      return { action: "call" };
    } else if (adjustedStrength > 0.25 || callAmount === 0) {
      // Weak hand - check or fold
      if (callAmount > this.chips / 20) {
        this.logReasoningStep(
          `Weak hand in middle game with significant bet, folding`
        );
        return { action: "fold" };
      }
      this.logReasoningStep(
        `Weak hand in middle game but small bet or free check, calling`
      );
      return { action: "call" };
    } else {
      this.logReasoningStep(`Very weak hand in middle game, folding`);
      return { action: "fold" };
    }
  }

  middleGamePostFlopStrategy(
    callAmount,
    communityCards,
    potSize,
    game,
    adjustedStrength,
    position,
    playerCount
  ) {
    // Middle game post-flop - more strategic with board texture awareness

    // Get detailed hand info
    const actualHand = this.getHandStrength(communityCards);
    this.logReasoningStep(`Post-flop hand: ${actualHand.description}`);

    // Analyze draws
    const draws = this.identifyDraws(communityCards);

    // Log draw information if present
    if (draws.strongFlushDraw) this.logReasoningStep(`Flush draw detected`);
    if (draws.straightDraw) this.logReasoningStep(`Straight draw detected`);

    // Analyze board texture
    const boardTexture = this.analyzeBoardTexture(communityCards);
    this.logReasoningStep(`Board texture: ${JSON.stringify(boardTexture)}`);

    // Pot odds for draw considerations
    const potOdds = callAmount > 0 ? callAmount / (potSize + callAmount) : 0;
    this.logReasoningStep(`Pot odds: ${potOdds.toFixed(2)}`);

    // Check if we're facing a significant bet
    const facingSignificantBet = callAmount > potSize * 0.5;

    // Consider hand strength and drawing potential together
    let effectiveStrength = adjustedStrength;

    // Add equity from draws
    if (draws.strongFlushDraw)
      effectiveStrength = Math.max(effectiveStrength, 0.55);
    if (draws.straightDraw)
      effectiveStrength = Math.max(effectiveStrength, 0.45);

    // Adjust based on board texture
    if (boardTexture.isWet && actualHand.rank < 3) {
      effectiveStrength -= 0.1; // Downgrade weak hands on wet boards
    }

    if (boardTexture.isPaired && actualHand.rank === 1) {
      effectiveStrength -= 0.15; // One pair is weak on paired boards
    }

    this.logReasoningStep(
      `Effective hand strength: ${effectiveStrength.toFixed(2)}`
    );

    // Middle game decision thresholds
    const valueThreshold = playerCount > 3 ? 0.65 : 0.6;
    const callThreshold = playerCount > 3 ? 0.45 : 0.4;

    if (effectiveStrength >= valueThreshold) {
      // Strong hand/draw - bet for value or semi-bluff
      const betAmount = Math.min(potSize * 0.7, this.chips);
      this.logReasoningStep(`Strong hand/draw, betting for value`);
      return { action: "raise", amount: betAmount };
    } else if (effectiveStrength >= callThreshold) {
      // Medium strength - call or small bet in position
      if (position === "late" && callAmount === 0) {
        const betAmount = Math.min(potSize * 0.5, this.chips);
        this.logReasoningStep(
          `Medium strength in position, making a probe bet`
        );
        return { action: "raise", amount: betAmount };
      }

      if (facingSignificantBet && effectiveStrength < 0.55) {
        this.logReasoningStep(`Medium strength but facing large bet, folding`);
        return { action: "fold" };
      }

      this.logReasoningStep(`Medium strength, calling`);
      return { action: "call" };
    } else if (
      (draws.strongFlushDraw || draws.straightDraw) &&
      draws.drawStrength > potOdds
    ) {
      // Draw with correct odds
      if (callAmount > this.chips / 6) {
        this.logReasoningStep(
          `Draw with odds but bet too large relative to stack, folding`
        );
        return { action: "fold" };
      }

      this.logReasoningStep(`Draw with favorable odds, calling`);
      return { action: "call" };
    } else if (callAmount === 0) {
      // Free check
      this.logReasoningStep(`Weak hand but free check`);
      return { action: "call" };
    } else {
      // Fold weak hands and draws without proper odds
      this.logReasoningStep(`Weak hand without proper odds, folding`);
      return { action: "fold" };
    }
  }

  lateGameStrategy(callAmount, communityCards, potSize, game) {
    // Late game - ICM considerations, more push/fold

    // Calculate M-ratio (stack size to blinds)
    const M = this.chips / (game.smallBlindAmount + game.bigBlindAmount);
    this.logReasoningStep(`Late game strategy, M-ratio: ${M.toFixed(1)}`);

    // Get position and player count
    const position = this.getRelativePosition(game);
    const playerCount = game.players.filter(
      (p) => !p.folded && p.isActive
    ).length;

    this.logReasoningStep(`Position: ${position}, Players: ${playerCount}`);

    // Push/fold strategy for short stacks
    if (M < 10) {
      this.logReasoningStep(
        `Short stack detected (M < 10), using push/fold strategy`
      );
      return this.pushFoldStrategy(
        callAmount,
        communityCards,
        M,
        position,
        playerCount
      );
    }

    // For medium stacks (10 < M < 20), use a more conservative approach
    if (M < 20) {
      this.logReasoningStep(
        `Medium stack (10 < M < 20), using conservative approach`
      );
      return this.conservativeLateGameStrategy(
        callAmount,
        communityCards,
        potSize,
        game,
        M,
        position
      );
    }

    // Otherwise use middle game strategy but more aggressive with decent hands
    const middleGameDecision = this.middleGameStrategy(
      callAmount,
      communityCards,
      potSize,
      game
    );

    // Be more willing to raise with decent hands
    if (middleGameDecision.action === "call" && Math.random() > 0.6) {
      const handStrength =
        communityCards.length > 0
          ? this.getHandStrength(communityCards)
          : this.evaluateHoleCards();

      const scaledStrength =
        communityCards.length > 0 ? handStrength.rank / 9 : handStrength / 100;

      if (scaledStrength > 0.4) {
        const raiseAmount = Math.min(potSize, this.chips);
        this.logReasoningStep(
          `Medium hand in late game with increased aggression, raising instead of calling`
        );
        return { action: "raise", amount: raiseAmount };
      }
    }

    return middleGameDecision;
  }

  conservativeLateGameStrategy(
    callAmount,
    communityCards,
    potSize,
    game,
    M,
    position
  ) {
    // Conservative approach for medium stacks in late game

    // Hand evaluation
    const handStrength =
      communityCards.length > 0
        ? this.getHandStrength(communityCards)
        : this.evaluateHoleCards();

    const scaledStrength =
      communityCards.length > 0 ? handStrength.rank / 9 : handStrength / 100;

    this.logReasoningStep(`Hand strength: ${scaledStrength.toFixed(2)}`);

    // Consider position more carefully in late game
    let positionAdjustment = 0;
    if (position === "late") positionAdjustment = 0.1;
    if (position === "early") positionAdjustment = -0.1;

    // Consider stack preservation due to blinds pressure
    const adjustedStrength = scaledStrength + positionAdjustment;

    // Thresholds based on stack size
    const raiseThreshold = 15 <= M && M < 20 ? 0.55 : 0.65;
    const callThreshold = 15 <= M && M < 20 ? 0.4 : 0.5;

    this.logReasoningStep(
      `Adjusted strength: ${adjustedStrength.toFixed(
        2
      )}, Thresholds - Raise: ${raiseThreshold.toFixed(
        2
      )}, Call: ${callThreshold.toFixed(2)}`
    );

    // Decision based on adjusted strength and stack size
    if (adjustedStrength >= raiseThreshold) {
      // Strong hand - raise, but be more conservative with sizing
      const raiseAmount =
        communityCards.length === 0
          ? Math.min(potSize * 2.5, this.chips) // Pre-flop raise
          : Math.min(potSize * 0.7, this.chips); // Post-flop raise

      this.logReasoningStep(
        `Strong hand in conservative late game approach, raising`
      );
      return { action: "raise", amount: raiseAmount };
    } else if (adjustedStrength >= callThreshold) {
      // Medium hand - call if cheap
      if (callAmount > this.chips / 6) {
        this.logReasoningStep(
          `Medium hand but bet too large, preserving chips`
        );
        return { action: "fold" };
      }

      this.logReasoningStep(
        `Medium hand in conservative late game approach, calling`
      );
      return { action: "call" };
    } else if (callAmount === 0) {
      // Check if free
      this.logReasoningStep(`Weak hand but free check`);
      return { action: "call" };
    } else {
      // Fold weak hands
      this.logReasoningStep(
        `Weak hand in conservative late game approach, folding`
      );
      return { action: "fold" };
    }
  }

  pushFoldStrategy(callAmount, communityCards, M, position, playerCount) {
    // Classic push/fold strategy for short stacks
    const card1Value = this.hand[0].value === 1 ? 14 : this.hand[0].value;
    const card2Value = this.hand[1].value === 1 ? 14 : this.hand[1].value;
    const hasPair = card1Value === card2Value;
    const sameSuit = this.hand[0].suit === this.hand[1].suit;
    const hasAce = card1Value === 14 || card2Value === 14;
    const hasKing = card1Value === 13 || card2Value === 13;
    const hasQueen = card1Value === 12 || card2Value === 12;

    this.logReasoningStep(
      `Push/fold strategy with cards: ${this.hand[0].valueDisplay}${this.hand[0].suitSymbol}, ${this.hand[1].valueDisplay}${this.hand[1].suitSymbol}`
    );

    // If post-flop, evaluate hand strength
    if (communityCards.length > 0) {
      const handStrength = this.getHandStrength(communityCards);
      const scaledStrength = handStrength.rank / 9;

      // Post-flop push/fold is simpler
      if (scaledStrength > 0.5) {
        this.logReasoningStep(`Strong hand post-flop, pushing`);
        return { action: "raise", amount: this.chips };
      } else if (callAmount === 0) {
        this.logReasoningStep(`Free check post-flop`);
        return { action: "call" };
      } else if (scaledStrength > 0.3 && callAmount < this.chips / 5) {
        this.logReasoningStep(`Medium hand post-flop with small bet, calling`);
        return { action: "call" };
      } else {
        this.logReasoningStep(`Weak hand post-flop, folding`);
        return { action: "fold" };
      }
    }

    // Pre-flop push/fold chart based on M, position, and hand strength

    // Hand strength requirement decreases as M decreases and position improves
    let strengthThreshold = 0.5; // Base threshold

    // Adjust threshold based on M
    if (M < 5) strengthThreshold -= 0.2;
    else if (M < 7) strengthThreshold -= 0.15;
    else if (M < 10) strengthThreshold -= 0.1;

    // Adjust threshold based on position
    if (position === "late") strengthThreshold -= 0.1;
    else if (position === "middle") strengthThreshold -= 0.05;

    // Adjust threshold based on player count
    if (playerCount <= 3) strengthThreshold -= 0.1;

    this.logReasoningStep(
      `Strength threshold for M=${M.toFixed(
        1
      )}, position=${position}, players=${playerCount}: ${strengthThreshold.toFixed(
        2
      )}`
    );

    // Calculate hand strength for push/fold decision
    let handStrength = 0;

    // Premium pocket pairs (AA-JJ)
    if (hasPair && card1Value >= 11)
      handStrength = 0.9 - (14 - card1Value) * 0.03;
    // Medium pocket pairs (TT-77)
    else if (hasPair && card1Value >= 7)
      handStrength = 0.7 - (11 - card1Value) * 0.02;
    // Small pocket pairs (66-22)
    else if (hasPair) handStrength = 0.6 - (7 - card1Value) * 0.02;
    // Ace with King
    else if (hasAce && hasKing) handStrength = sameSuit ? 0.8 : 0.75;
    // Ace with Queen/Jack/Ten
    else if (
      hasAce &&
      (hasQueen ||
        card2Value === 11 ||
        card2Value === 10 ||
        card1Value === 11 ||
        card1Value === 10)
    )
      handStrength = sameSuit ? 0.7 : 0.65;
    // Any other Ace
    else if (hasAce) handStrength = sameSuit ? 0.6 : 0.5;
    // King with Queen/Jack
    else if (hasKing && (hasQueen || card1Value === 11 || card2Value === 11))
      handStrength = sameSuit ? 0.65 : 0.55;
    // Any other King
    else if (hasKing) handStrength = sameSuit ? 0.5 : 0.4;
    // Connected high cards
    else if (
      Math.abs(card1Value - card2Value) <= 1 &&
      Math.min(card1Value, card2Value) >= 10
    )
      handStrength = sameSuit ? 0.6 : 0.5;
    // Suited connectors
    else if (sameSuit && Math.abs(card1Value - card2Value) <= 1)
      handStrength = 0.45;
    // Other broadway cards
    else if (card1Value >= 10 && card2Value >= 10) handStrength = 0.45;
    // Everything else
    else handStrength = 0.3;

    // Adjust for very short stack desperation
    if (M <= 3) handStrength += 0.2;

    this.logReasoningStep(
      `Push/fold hand strength: ${handStrength.toFixed(2)}`
    );

    // Decision
    if (handStrength >= strengthThreshold) {
      // Push (all-in)
      this.logReasoningStep(
        `Hand strength (${handStrength.toFixed(
          2
        )}) meets threshold (${strengthThreshold.toFixed(2)}), pushing all-in`
      );
      return { action: "raise", amount: this.chips };
    } else {
      // Fold
      if (callAmount === 0) {
        this.logReasoningStep(`Hand strength below threshold but free check`);
        return { action: "call" }; // Check if free
      }
      this.logReasoningStep(
        `Hand strength (${handStrength.toFixed(
          2
        )}) below threshold (${strengthThreshold.toFixed(2)}), folding`
      );
      return { action: "fold" };
    }
  }

  headsUpStrategy(callAmount, communityCards, potSize, game) {
    // Heads-up play - much wider range, more aggressive

    // Start with position-based approach
    const position = this.getRelativePosition(game);
    const handStrength =
      communityCards.length > 0
        ? this.getHandStrength(communityCards)
        : this.evaluateHoleCards();

    const scaledStrength =
      communityCards.length > 0 ? handStrength.rank / 9 : handStrength / 100;

    this.logReasoningStep(
      `Heads-up strategy with hand strength: ${scaledStrength.toFixed(
        2
      )}, position: ${position}`
    );

    // Stack size considerations
    const M = this.chips / (game.smallBlindAmount + game.bigBlindAmount);
    this.logReasoningStep(`Stack in blinds (M): ${M.toFixed(1)}`);

    // Significantly adjust based on position in heads-up
    let positionAdjustment = 0;
    if (position === "late") positionAdjustment = 0.2; // Button is very powerful in heads-up

    // Adjust based on stack size
    let stackAdjustment = 0;
    if (M < 10) stackAdjustment = 0.1; // Short stack = more aggressive

    const adjustedStrength =
      scaledStrength + positionAdjustment + stackAdjustment;
    this.logReasoningStep(
      `Position adjustment: ${positionAdjustment.toFixed(
        2
      )}, Stack adjustment: ${stackAdjustment.toFixed(
        2
      )}, Final: ${adjustedStrength.toFixed(2)}`
    );

    // Split pre-flop and post-flop play
    if (communityCards.length === 0) {
      return this.headsUpPreFlopStrategy(
        callAmount,
        potSize,
        game,
        adjustedStrength,
        position,
        M
      );
    } else {
      return this.headsUpPostFlopStrategy(
        callAmount,
        communityCards,
        potSize,
        game,
        adjustedStrength,
        position,
        M
      );
    }
  }

  headsUpPreFlopStrategy(
    callAmount,
    potSize,
    game,
    adjustedStrength,
    position,
    M
  ) {
    // Heads-up pre-flop strategy - very aggressive on button

    // Get specific hand details
    const card1Value = this.hand[0].value === 1 ? 14 : this.hand[0].value;
    const card2Value = this.hand[1].value === 1 ? 14 : this.hand[1].value;

    this.logReasoningStep(
      `Pre-flop cards: ${this.hand[0].valueDisplay}${this.hand[0].suitSymbol}, ${this.hand[1].valueDisplay}${this.hand[1].suitSymbol}`
    );

    // Check if we're on button (late) or BB (early)
    const onButton = position === "late";

    // More aggressive thresholds for heads-up pre-flop
    let raiseThreshold, callThreshold, minPlayableThreshold;

    if (onButton) {
      // Very aggressive on button
      raiseThreshold = 0.3;
      callThreshold = 0.2;
      minPlayableThreshold = 0.1;
    } else {
      // Out of position - tighter
      raiseThreshold = 0.4;
      callThreshold = 0.25;
      minPlayableThreshold = 0.15;
    }

    // Adjust for very short stack
    if (M < 7) {
      raiseThreshold -= 0.1;
      callThreshold -= 0.05;
    }

    this.logReasoningStep(
      `Heads-up thresholds - Raise: ${raiseThreshold.toFixed(
        2
      )}, Call: ${callThreshold.toFixed(
        2
      )}, Min: ${minPlayableThreshold.toFixed(2)}`
    );

    // Decision
    if (adjustedStrength > raiseThreshold) {
      // Raise with many hands
      const raiseAmount = onButton
        ? Math.min(potSize * 3, this.chips) // Larger raise on button
        : Math.min(potSize * 2, this.chips); // Standard raise out of position

      this.logReasoningStep(
        `Hand exceeds heads-up raise threshold (${adjustedStrength.toFixed(
          2
        )} > ${raiseThreshold.toFixed(2)}), raising`
      );
      return { action: "raise", amount: raiseAmount };
    } else if (adjustedStrength > callThreshold || onButton) {
      // Call with most hands on the button
      if (callAmount > this.chips / 3) {
        this.logReasoningStep(
          `Marginal hand with large bet, folding even in heads-up`
        );
        return { action: "fold" };
      }

      this.logReasoningStep(
        `Hand meets heads-up call threshold or on button, calling`
      );
      return { action: "call" };
    } else if (callAmount === 0) {
      // Check if free
      this.logReasoningStep(`Free check in heads-up`);
      return { action: "call" };
    } else if (callAmount <= this.chips / 20) {
      // Call very small bets
      this.logReasoningStep(`Very small bet in heads-up, calling`);
      return { action: "call" };
    } else {
      this.logReasoningStep(
        `Weak hand in heads-up with significant bet, folding`
      );
      return { action: "fold" };
    }
  }

  headsUpPostFlopStrategy(
    callAmount,
    communityCards,
    potSize,
    game,
    adjustedStrength,
    position,
    M
  ) {
    // Heads-up post-flop strategy - aggressive with position, cautious without

    // Get detailed hand info
    const actualHand = this.getHandStrength(communityCards);
    this.logReasoningStep(`Post-flop hand: ${actualHand.description}`);

    // Analyze draws
    const draws = this.identifyDraws(communityCards);
    if (draws.strongFlushDraw || draws.straightDraw) {
      this.logReasoningStep(`Draw detected in heads-up`);
    }

    // Analyze board texture
    const boardTexture = this.analyzeBoardTexture(communityCards);
    this.logReasoningStep(`Board texture: ${JSON.stringify(boardTexture)}`);

    // On button vs off button
    const onButton = position === "late";
    this.logReasoningStep(
      `Position: ${onButton ? "On button" : "Out of position"}`
    );

    // In heads-up, continuation betting is very important
    const isCBettingOpportunity =
      onButton && callAmount === 0 && communityCards.length === 3;

    // Adjust strength for draws in heads-up
    let effectiveStrength = adjustedStrength;
    if (draws.strongFlushDraw || draws.straightDraw) effectiveStrength += 0.1;

    // More aggressive thresholds in heads-up
    const valueThreshold = onButton ? 0.45 : 0.55;
    const bluffThreshold = onButton ? 0.7 : 0.85; // Probability threshold for bluffs

    this.logReasoningStep(
      `Effective strength: ${effectiveStrength.toFixed(
        2
      )}, Thresholds - Value: ${valueThreshold.toFixed(
        2
      )}, Bluff prob: ${bluffThreshold.toFixed(2)}`
    );

    // Decision logic
    if (effectiveStrength >= valueThreshold) {
      // Bet with many hands heads-up
      const betAmount = Math.min(potSize * 0.75, this.chips);
      this.logReasoningStep(`Value betting in heads-up with decent hand`);
      return { action: "raise", amount: betAmount };
    } else if (isCBettingOpportunity && Math.random() > 0.3) {
      // Continuation bet frequently
      const cBetAmount = Math.min(potSize * 0.6, this.chips);
      this.logReasoningStep(`Continuation betting opportunity in heads-up`);
      return { action: "raise", amount: cBetAmount };
    } else if (callAmount === 0) {
      // Check if free
      this.logReasoningStep(`Free check in heads-up`);
      return { action: "call" };
    } else if (
      onButton &&
      Math.random() > 1 - bluffThreshold &&
      effectiveStrength < 0.3
    ) {
      // Occasionally bluff as defender
      const bluffRaiseAmount = Math.min(potSize * 2, this.chips);
      this.logReasoningStep(`Bluff raising in heads-up`);
      return { action: "raise", amount: bluffRaiseAmount };
    } else if (callAmount <= potSize * 0.3) {
      // Call small bets with many hands
      this.logReasoningStep(`Calling small bet in heads-up`);
      return { action: "call" };
    } else {
      // Fold to large bets with weak hands
      this.logReasoningStep(`Folding to large bet with weak hand in heads-up`);
      return { action: "fold" };
    }
  }

  bubbleStrategy(callAmount, communityCards, potSize, game) {
    // Bubble strategy - tighter with medium stack, aggressive with big stack

    // Calculate relative stack size
    const myStack = this.chips;
    const avgStack =
      game.players.reduce((sum, p) => sum + p.chips, 0) / game.players.length;
    const stackRatio = myStack / avgStack;

    this.logReasoningStep(
      `Bubble strategy, stack ratio: ${stackRatio.toFixed(2)}`
    );

    // Big stack - exploit bubble
    if (stackRatio > 1.5) {
      this.logReasoningStep(
        `Big stack detected (${stackRatio.toFixed(
          2
        )} > 1.5), using bubble exploitation strategy`
      );
      return this.bubbleBigStackStrategy(
        callAmount,
        communityCards,
        potSize,
        game
      );
    }

    // Short stack - push/fold
    if (stackRatio < 0.5) {
      // Similar to push/fold but with tighter requirements
      const M = this.chips / (game.smallBlindAmount + game.bigBlindAmount);
      this.logReasoningStep(
        `Short stack detected (${stackRatio.toFixed(
          2
        )} < 0.5), using conservative push/fold`
      );
      return this.pushFoldStrategy(
        callAmount,
        communityCards,
        M - 2,
        this.getRelativePosition(game),
        game.players.filter((p) => !p.folded && p.isActive).length
      ); // More conservative
    }

    // Medium stack - play tight
    this.logReasoningStep(`Medium stack detected, using tight bubble strategy`);
    return this.bubbleMediumStackStrategy(
      callAmount,
      communityCards,
      potSize,
      game
    );
  }

  bubbleBigStackStrategy(callAmount, communityCards, potSize, game) {
    // As big stack on the bubble, we can put pressure on medium stacks
    const position = this.getRelativePosition(game);
    const isButtonOrCutoff = position === "late";
    const handStrength =
      communityCards.length > 0
        ? this.getHandStrength(communityCards)
        : this.evaluateHoleCards();

    const scaledStrength =
      communityCards.length > 0 ? handStrength.rank / 9 : handStrength / 100;

    this.logReasoningStep(
      `Big stack bubble strategy, position: ${position}, hand strength: ${scaledStrength.toFixed(
        2
      )}`
    );

    // Identify weaker stacks that we can pressure
    const vulnerableStacks = game.players.filter(
      (p) =>
        p.position !== this.position &&
        p.isActive &&
        !p.folded &&
        p.chips < this.chips * 0.7
    );

    this.logReasoningStep(
      `Vulnerable stacks identified: ${vulnerableStacks.length}`
    );

    // Aggressive play on bubble, especially against medium stacks

    // If we're in position and no strong action before us
    if (isButtonOrCutoff && callAmount <= game.bigBlindAmount * 2) {
      // Raise with a wide range
      if (Math.random() > 0.4 || scaledStrength > 0.4) {
        const raiseAmount = Math.min(potSize * 1.5, this.chips);
        this.logReasoningStep(
          `In position with minimal action, applying bubble pressure with raise`
        );
        return { action: "raise", amount: raiseAmount };
      }
    }

    // With strong hands, play more straightforwardly
    if (scaledStrength > 0.6) {
      const raiseAmount = Math.min(potSize, this.chips);
      this.logReasoningStep(
        `Strong hand on bubble as big stack, raising for value`
      );
      return { action: "raise", amount: raiseAmount };
    }

    // With medium hands, apply pressure selectively
    if (scaledStrength > 0.4 && vulnerableStacks.length > 0) {
      if (callAmount === 0 || callAmount <= game.bigBlindAmount) {
        const raiseAmount = Math.min(potSize, this.chips);
        this.logReasoningStep(
          `Medium hand targeting vulnerable stacks, raising`
        );
        return { action: "raise", amount: raiseAmount };
      }

      if (callAmount <= this.chips / 10) {
        this.logReasoningStep(
          `Medium hand on bubble as big stack, calling small bet`
        );
        return { action: "call" };
      }
    }

    // Otherwise play standard
    this.logReasoningStep(
      `No clear bubble exploitation spot, using intermediate strategy`
    );
    return this.makeIntermediateDecision(callAmount, communityCards, potSize);
  }

  bubbleMediumStackStrategy(callAmount, communityCards, potSize, game) {
    // As medium stack on the bubble, we want to avoid confrontation
    const handStrength =
      communityCards.length > 0
        ? this.getHandStrength(communityCards)
        : this.evaluateHoleCards();

    const scaledStrength =
      communityCards.length > 0 ? handStrength.rank / 9 : handStrength / 100;

    this.logReasoningStep(
      `Medium stack bubble strategy, hand strength: ${scaledStrength.toFixed(
        2
      )}`
    );

    // Identify bigger stacks that might pressure us
    const biggerStacks = game.players.filter(
      (p) =>
        p.position !== this.position && p.isActive && p.chips > this.chips * 1.3
    );

    this.logReasoningStep(
      `Bigger stacks that might apply pressure: ${biggerStacks.length}`
    );

    // Position is important on the bubble
    const position = this.getRelativePosition(game);
    const isLatePosition = position === "late";

    this.logReasoningStep(`Position: ${position}`);

    // Play very tight on bubble with medium stack
    if (scaledStrength > 0.7) {
      // Only raise with very strong hands
      const raiseAmount = Math.min(potSize, this.chips);
      this.logReasoningStep(
        `Very strong hand on bubble (${scaledStrength.toFixed(
          2
        )} > 0.7), raising`
      );
      return { action: "raise", amount: raiseAmount };
    } else if (scaledStrength > 0.5) {
      // Call with strong hands
      if (callAmount > this.chips / 4) {
        this.logReasoningStep(
          `Strong hand but large bet on bubble, folding to preserve tournament life`
        );
        return { action: "fold" };
      }

      this.logReasoningStep(
        `Strong hand on bubble (${scaledStrength.toFixed(2)} > 0.5), calling`
      );
      return { action: "call" };
    } else if (
      isLatePosition &&
      callAmount === 0 &&
      scaledStrength > 0.4 &&
      biggerStacks.length === 0
    ) {
      // Occasionally raise in late position if no big stacks left to act
      const raiseAmount = Math.min(potSize, this.chips);
      this.logReasoningStep(
        `Medium hand in late position with no big stacks left, raising`
      );
      return { action: "raise", amount: raiseAmount };
    } else if (callAmount === 0) {
      // Check if free
      this.logReasoningStep(`Free check on bubble`);
      return { action: "call" };
    } else if (callAmount <= game.bigBlindAmount && position === "bigBlind") {
      // Defend big blind with slightly wider range
      if (scaledStrength > 0.3) {
        this.logReasoningStep(`Defending big blind on bubble with decent hand`);
        return { action: "call" };
      }
    } else {
      // Fold everything else
      this.logReasoningStep(
        `Weak hand on bubble, folding to preserve tournament life`
      );
      return { action: "fold" };
    }
  }

  icmPressureStrategy(callAmount, communityCards, potSize, game) {
    // ICM pressure strategy - very tight with significant pay jumps pending

    // Hand evaluation
    const handStrength =
      communityCards.length > 0
        ? this.getHandStrength(communityCards)
        : this.evaluateHoleCards();

    const scaledStrength =
      communityCards.length > 0 ? handStrength.rank / 9 : handStrength / 100;

    this.logReasoningStep(
      `ICM pressure strategy, hand strength: ${scaledStrength.toFixed(2)}`
    );

    // Stack analysis
    const shortStackCount = game.players.filter(
      (p) =>
        p.isActive && p.position !== this.position && p.chips < this.chips * 0.7
    ).length;

    const M = this.chips / (game.smallBlindAmount + game.bigBlindAmount);

    this.logReasoningStep(
      `Stack in blinds (M): ${M.toFixed(1)}, Shorter stacks: ${shortStackCount}`
    );

    // Position
    const position = this.getRelativePosition(game);
    this.logReasoningStep(`Position: ${position}`);

    // If we're in severe ICM pressure (multiple shorter stacks, near bubble)
    if (shortStackCount >= 2 && M > 15) {
      this.logReasoningStep(
        `Significant ICM pressure detected (multiple shorter stacks)`
      );

      // Only play very premium hands
      if (scaledStrength > 0.8) {
        const raiseAmount = Math.min(potSize, this.chips);
        this.logReasoningStep(
          `Premium hand under ICM pressure, raising for value`
        );
        return { action: "raise", amount: raiseAmount };
      } else if (scaledStrength > 0.6) {
        if (callAmount > this.chips / 5) {
          this.logReasoningStep(
            `Strong hand but large bet under ICM pressure, folding to avoid bubble elimination`
          );
          return { action: "fold" };
        }

        this.logReasoningStep(
          `Strong hand under ICM pressure, calling small bet`
        );
        return { action: "call" };
      } else if (callAmount === 0) {
        this.logReasoningStep(`Free check under ICM pressure`);
        return { action: "call" };
      } else {
        this.logReasoningStep(`Folding non-premium hand under ICM pressure`);
        return { action: "fold" };
      }
    }
    // Less severe ICM pressure (one shorter stack or we're shorter)
    else {
      // If we're the short stack under ICM pressure, switch to push/fold
      if (M < 15) {
        this.logReasoningStep(
          `Short stack under ICM pressure, using tighter push/fold`
        );
        return this.pushFoldStrategy(
          callAmount,
          communityCards,
          M - 1,
          position,
          game.players.filter((p) => !p.folded && p.isActive).length
        );
      }

      // Otherwise play tight but not ultra-tight
      if (scaledStrength > 0.7) {
        const raiseAmount = Math.min(potSize, this.chips);
        this.logReasoningStep(
          `Strong hand under moderate ICM pressure, raising`
        );
        return { action: "raise", amount: raiseAmount };
      } else if (scaledStrength > 0.5) {
        if (callAmount > this.chips / 5) {
          this.logReasoningStep(
            `Medium hand but large bet under ICM pressure, folding`
          );
          return { action: "fold" };
        }

        this.logReasoningStep(
          `Medium hand under moderate ICM pressure, calling`
        );
        return { action: "call" };
      } else if (callAmount === 0) {
        this.logReasoningStep(`Free check under ICM pressure`);
        return { action: "call" };
      } else {
        this.logReasoningStep(`Folding weak hand under ICM pressure`);
        return { action: "fold" };
      }
    }
  }

  finalTableStrategy(callAmount, communityCards, potSize, game) {
    // Final table strategy - combines ICM awareness with aggressive play

    // Hand evaluation
    const handStrength =
      communityCards.length > 0
        ? this.getHandStrength(communityCards)
        : this.evaluateHoleCards();

    const scaledStrength =
      communityCards.length > 0 ? handStrength.rank / 9 : handStrength / 100;

    this.logReasoningStep(
      `Final table strategy, hand strength: ${scaledStrength.toFixed(2)}`
    );

    // Stack size analysis
    const myStack = this.chips;
    const activePlayers = game.players.filter((p) => p.isActive);
    const avgStack =
      activePlayers.reduce((sum, p) => sum + p.chips, 0) / activePlayers.length;
    const stackRatio = myStack / avgStack;
    const M = myStack / (game.smallBlindAmount + game.bigBlindAmount);

    this.logReasoningStep(
      `Stack ratio: ${stackRatio.toFixed(2)}, M: ${M.toFixed(1)}`
    );

    // Position
    const position = this.getRelativePosition(game);
    this.logReasoningStep(`Position: ${position}`);

    // Final table strategy varies based on stack size and player count
    const playerCount = activePlayers.length;

    // Big stack strategy
    if (stackRatio > 1.5) {
      this.logReasoningStep(`Big stack at final table, playing aggressively`);

      // Apply pressure, especially from late position
      if (
        position === "late" &&
        callAmount <= game.bigBlindAmount * 2 &&
        scaledStrength > 0.3
      ) {
        const raiseAmount = Math.min(potSize * 2, this.chips);
        this.logReasoningStep(
          `Applying pressure from late position as big stack`
        );
        return { action: "raise", amount: raiseAmount };
      }

      // Play strong hands strongly
      if (scaledStrength > 0.6) {
        const raiseAmount = Math.min(potSize * 1.5, this.chips);
        this.logReasoningStep(
          `Strong hand as big stack at final table, raising`
        );
        return { action: "raise", amount: raiseAmount };
      }

      // Call with medium hands
      if (scaledStrength > 0.4) {
        if (callAmount > this.chips / 5) {
          this.logReasoningStep(
            `Medium hand but large bet, folding even as big stack`
          );
          return { action: "fold" };
        }

        this.logReasoningStep(
          `Medium hand as big stack at final table, calling`
        );
        return { action: "call" };
      }

      if (callAmount === 0) {
        this.logReasoningStep(`Free check at final table`);
        return { action: "call" };
      }

      this.logReasoningStep(`Weak hand as big stack at final table, folding`);
      return { action: "fold" };
    }
    // Short stack strategy
    else if (stackRatio < 0.6 || M < 10) {
      this.logReasoningStep(`Short stack at final table, using push/fold`);
      return this.pushFoldStrategy(
        callAmount,
        communityCards,
        M,
        position,
        playerCount
      );
    }
    // Medium stack strategy
    else {
      this.logReasoningStep(`Medium stack at final table, playing selectively`);

      // With strong hands, play aggressively
      if (scaledStrength > 0.65) {
        const raiseAmount = Math.min(potSize, this.chips);
        this.logReasoningStep(
          `Strong hand as medium stack at final table, raising`
        );
        return { action: "raise", amount: raiseAmount };
      }

      // With medium hands, consider position carefully
      if (scaledStrength > 0.45) {
        if (position === "late" && callAmount <= game.bigBlindAmount) {
          const raiseAmount = Math.min(potSize, this.chips);
          this.logReasoningStep(
            `Medium hand in late position at final table, raising`
          );
          return { action: "raise", amount: raiseAmount };
        }

        if (callAmount > this.chips / 5) {
          this.logReasoningStep(
            `Medium hand but large bet at final table, folding`
          );
          return { action: "fold" };
        }

        this.logReasoningStep(`Medium hand at final table, calling small bet`);
        return { action: "call" };
      }

      // With weak hands, check when free or fold
      if (callAmount === 0) {
        this.logReasoningStep(`Free check with weak hand at final table`);
        return { action: "call" };
      }

      this.logReasoningStep(`Weak hand at final table, folding`);
      return { action: "fold" };
    }
  }

  // ------------------------
  // ORIGINAL STRATEGY IMPLEMENTATIONS
  // ------------------------

  // Basic AI - Simple decision based on hand strength only
  makeBasicDecision(callAmount, communityCards) {
    this.decisionProcess.algorithmName = "Basic";

    // If no community cards yet, decide based on hole cards only
    if (communityCards.length === 0) {
      // Pre-flop decision
      // Check for pairs or high cards in hole cards
      const card1Value = this.hand[0].value;
      const card2Value = this.hand[1].value;
      const hasPair = card1Value === card2Value;
      const hasHighCard = card1Value > 10 || card2Value > 10;

      this.logReasoningStep(
        `Pre-flop cards: ${this.hand[0].valueDisplay}${this.hand[0].suitSymbol}, ${this.hand[1].valueDisplay}${this.hand[1].suitSymbol}`
      );

      if (hasPair) {
        // Raise with pairs
        const raiseAmount = Math.min(callAmount * 2 + 20, this.chips);
        this.logReasoningStep(`Pair detected, raising`);
        return { action: "raise", amount: raiseAmount };
      } else if (hasHighCard && Math.random() > 0.3) {
        // Call with high cards (with some randomness)
        if (callAmount > this.chips / 4) {
          this.logReasoningStep(`High card but bet too large, folding`);
          return { action: "fold" };
        }
        this.logReasoningStep(`High card, calling`);
        return { action: "call" };
      } else if (callAmount === 0) {
        // Check if possible
        this.logReasoningStep(`Weak hand but free check`);
        return { action: "call" };
      } else if (callAmount < 20 && Math.random() > 0.7) {
        // Sometimes call small bets randomly
        this.logReasoningStep(`Small bet with random call chance, calling`);
        return { action: "call" };
      } else {
        // Fold weak hands
        this.logReasoningStep(`Weak hand, folding`);
        return { action: "fold" };
      }
    } else {
      // Post-flop decision
      const handStrength = this.getHandStrength(communityCards);

      this.logReasoningStep(`Post-flop hand: ${handStrength.description}`);

      // Basic strategy based on hand strength
      if (handStrength.rank >= 3) {
        // Three of a kind or better
        // Bet aggressively
        const raiseAmount = Math.min(callAmount * 2 + 50, this.chips);
        this.logReasoningStep(
          `Strong hand (${handStrength.description}), raising`
        );
        return { action: "raise", amount: raiseAmount };
      } else if (handStrength.rank >= 1) {
        // Pair or better
        if (callAmount > this.chips / 3) {
          this.logReasoningStep(`Medium hand but bet too large, folding`);
          return { action: "fold" };
        }
        // Call moderate bets
        this.logReasoningStep(
          `Medium hand (${handStrength.description}), calling`
        );
        return { action: "call" };
      } else {
        // Weak hand
        if (callAmount === 0) {
          this.logReasoningStep(`Weak hand but free check`);
          return { action: "call" }; // Check
        } else if (callAmount < 40 && Math.random() > 0.6) {
          // Occasionally call small bets with weak hands
          this.logReasoningStep(`Small bet with weak hand, occasional call`);
          return { action: "call" };
        } else {
          this.logReasoningStep(`Weak hand with significant bet, folding`);
          return { action: "fold" };
        }
      }
    }
  }

  // Intermediate AI - Considers pot odds and position
  makeIntermediateDecision(callAmount, communityCards, potSize) {
    this.decisionProcess.algorithmName = "Intermediate";

    // Start with basic decision
    const basicDecision = this.makeBasicDecision(callAmount, communityCards);

    // If our basic strategy says to fold, check pot odds
    if (basicDecision.action === "fold" && callAmount > 0) {
      const potOdds = callAmount / (potSize + callAmount);
      this.logReasoningStep(`Checking pot odds: ${potOdds.toFixed(2)}`);

      const handStrength =
        communityCards.length > 0
          ? this.getHandStrength(communityCards)
          : { rank: 0, winProbability: 0.2 }; // Estimated win probability

      const winProbability =
        communityCards.length > 0 ? handStrength.rank / 9 : 0.2;

      this.logReasoningStep(
        `Estimated win probability: ${winProbability.toFixed(2)}`
      );

      // If pot odds are favorable, call instead of fold
      if (winProbability > potOdds) {
        this.logReasoningStep(
          `Favorable pot odds (${winProbability.toFixed(2)} > ${potOdds.toFixed(
            2
          )}), calling instead of folding`
        );
        return { action: "call" };
      }
    }

    // Sometimes bluff (more likely with fewer community cards)
    const bluffProbability = 0.1 - communityCards.length * 0.02;
    if (Math.random() < bluffProbability) {
      const bluffAmount = Math.min(potSize / 2, this.chips);
      this.logReasoningStep(
        `Random bluff opportunity (${bluffProbability.toFixed(
          2
        )} probability), raising`
      );
      return { action: "raise", amount: bluffAmount };
    }

    this.logReasoningStep(`Using basic decision: ${basicDecision.action}`);
    return basicDecision;
  }

  // Advanced AI - Implement more sophisticated strategy
  makeAdvancedDecision(callAmount, communityCards, potSize) {
    this.decisionProcess.algorithmName = "Advanced";

    // Placeholder for advanced AI - would typically include:
    // - More sophisticated hand strength evaluation
    // - Player modeling (tracking betting patterns)
    // - Game theory optimal play
    // - Dynamic adjustment based on stack sizes

    // For now, just use intermediate decision with more aggression
    const decision = this.makeIntermediateDecision(
      callAmount,
      communityCards,
      potSize
    );

    // More aggressive raising
    if (decision.action === "raise") {
      decision.amount = Math.min(decision.amount * 1.5, this.chips);
      this.logReasoningStep(`Increasing raise amount for more aggression`);
    }

    // More strategic bluffing on the turn and river
    if (communityCards.length >= 4 && Math.random() < 0.15) {
      const semibleffAmount = Math.min(potSize * 0.75, this.chips);
      this.logReasoningStep(
        `Strategic turn/river semi-bluff opportunity, raising`
      );
      return { action: "raise", amount: semibleffAmount };
    }

    return decision;
  }

  // Random strategy - makes random decisions
  makeRandomDecision(callAmount) {
    this.decisionProcess.algorithmName = "Random";

    const randomValue = Math.random();
    this.logReasoningStep(`Random value: ${randomValue.toFixed(2)}`);

    if (randomValue < 0.2) {
      // 20% chance to fold (unless checking is free)
      if (callAmount === 0) {
        this.logReasoningStep(
          `Random action: check (would fold but it's free)`
        );
        return { action: "call" }; // Check instead of fold
      }
      this.logReasoningStep(`Random action: fold (20% chance)`);
      return { action: "fold" };
    } else if (randomValue < 0.7) {
      // 50% chance to call/check
      this.logReasoningStep(`Random action: call (50% chance)`);
      return { action: "call" };
    } else {
      // 30% chance to raise
      const raiseAmount =
        Math.floor(Math.random() * this.chips * 0.3) + callAmount + 1;
      this.logReasoningStep(
        `Random action: raise (30% chance) to ${raiseAmount}`
      );
      return { action: "raise", amount: raiseAmount };
    }
  }

  // Conservative strategy - only plays strong hands
  makeConservativeDecision(callAmount, communityCards) {
    this.decisionProcess.algorithmName = "Conservative";

    // Pre-flop conservative play
    if (communityCards.length === 0) {
      const card1Value = this.hand[0].value === 1 ? 14 : this.hand[0].value;
      const card2Value = this.hand[1].value === 1 ? 14 : this.hand[1].value;
      const hasPair = card1Value === card2Value;
      const hasHighPair = hasPair && card1Value >= 10;
      const hasAce = card1Value === 14 || card2Value === 14;
      const hasFaceWithAce = hasAce && (card1Value >= 10 || card2Value >= 10);

      this.logReasoningStep(
        `Conservative pre-flop with cards: ${this.hand[0].valueDisplay}${this.hand[0].suitSymbol}, ${this.hand[1].valueDisplay}${this.hand[1].suitSymbol}`
      );

      if (hasHighPair) {
        // Raise with high pairs
        const raiseAmount = Math.min(callAmount * 3, this.chips);
        this.logReasoningStep(`High pair detected, raising`);
        return { action: "raise", amount: raiseAmount };
      } else if (hasFaceWithAce) {
        // Call with Ace+face card
        if (callAmount > this.chips / 5) {
          this.logReasoningStep(`Ace+face but bet too large, folding`);
          return { action: "fold" };
        }
        this.logReasoningStep(`Ace+face, calling`);
        return { action: "call" };
      } else if (hasPair) {
        // Call with any pair
        if (callAmount > this.chips / 10) {
          this.logReasoningStep(`Pair but bet too large, folding`);
          return { action: "fold" };
        }
        this.logReasoningStep(`Pair, calling`);
        return { action: "call" };
      } else if (callAmount === 0) {
        // Check if free
        this.logReasoningStep(`Weak hand but free check`);
        return { action: "call" };
      } else {
        // Fold everything else
        this.logReasoningStep(`Weak hand, folding`);
        return { action: "fold" };
      }
    } else {
      // Post-flop conservative play
      const handStrength = this.getHandStrength(communityCards);

      this.logReasoningStep(
        `Conservative post-flop with hand: ${handStrength.description}`
      );

      if (handStrength.rank >= 5) {
        // Straight or better
        // Raise with strong hands
        const raiseAmount = Math.min(callAmount * 3, this.chips);
        this.logReasoningStep(
          `Strong hand (${handStrength.description}), raising`
        );
        return { action: "raise", amount: raiseAmount };
      } else if (handStrength.rank >= 3) {
        // Three of a kind or better
        // Call with decent hands
        if (callAmount > this.chips / 3) {
          this.logReasoningStep(`Medium hand but bet too large, folding`);
          return { action: "fold" };
        }
        this.logReasoningStep(
          `Medium hand (${handStrength.description}), calling`
        );
        return { action: "call" };
      } else if (handStrength.rank >= 1 && callAmount < 20) {
        // Pair or better with small bet
        // Call small bets with weak hands
        this.logReasoningStep(`Weak hand with small bet, calling`);
        return { action: "call" };
      } else if (callAmount === 0) {
        // Check if free
        this.logReasoningStep(`Very weak hand but free check`);
        return { action: "call" };
      } else {
        // Fold weak hands
        this.logReasoningStep(`Very weak hand, folding`);
        return { action: "fold" };
      }
    }
  }

  // Aggressive strategy - plays many hands aggressively
  makeAggressiveDecision(callAmount, communityCards, potSize) {
    this.decisionProcess.algorithmName = "Aggressive";

    // Apply randomized aggressive play
    const randomFactor = Math.random();
    this.logReasoningStep(
      `Aggressive strategy random factor: ${randomFactor.toFixed(2)}`
    );

    // Pre-flop aggressive play
    if (communityCards.length === 0) {
      const card1Value = this.hand[0].value === 1 ? 14 : this.hand[0].value;
      const card2Value = this.hand[1].value === 1 ? 14 : this.hand[1].value;
      const highCard = Math.max(card1Value, card2Value);

      this.logReasoningStep(
        `Aggressive pre-flop with cards: ${this.hand[0].valueDisplay}${this.hand[0].suitSymbol}, ${this.hand[1].valueDisplay}${this.hand[1].suitSymbol}`
      );

      if (highCard >= 10 || randomFactor > 0.7) {
        // Raise with good cards or bluff 30% of the time
        const raiseAmount = Math.min(potSize, this.chips);
        this.logReasoningStep(`High card or bluff opportunity, raising`);
        return { action: "raise", amount: raiseAmount };
      } else if (randomFactor > 0.4) {
        // Call 30% of the time
        this.logReasoningStep(
          `Medium strength with aggressive call chance, calling`
        );
        return { action: "call" };
      } else {
        // Fold 40% of the time pre-flop
        if (callAmount === 0) {
          this.logReasoningStep(`Weak hand but free check`);
          return { action: "call" }; // Check if free
        }
        this.logReasoningStep(
          `Weak hand, one of the rare folds for aggressive strategy`
        );
        return { action: "fold" };
      }
    } else {
      // Post-flop aggressive play
      const handStrength = this.getHandStrength(communityCards);

      this.logReasoningStep(
        `Aggressive post-flop with hand: ${handStrength.description}`
      );

      if (handStrength.rank >= 2 || randomFactor > 0.8) {
        // Raise with decent hands or bluff 20% of the time
        const raiseAmount = Math.min(potSize * 1.5, this.chips);

        if (handStrength.rank >= 2) {
          this.logReasoningStep(
            `Decent hand (${handStrength.description}), raising aggressively`
          );
        } else {
          this.logReasoningStep(`Weak hand but bluffing, raising aggressively`);
        }

        return { action: "raise", amount: raiseAmount };
      } else if (handStrength.rank >= 1 || randomFactor > 0.5) {
        // Call with weak hands or semi-bluff 30% of the time
        this.logReasoningStep(`Weak hand or semi-bluff, calling aggressively`);
        return { action: "call" };
      } else {
        // Fold 50% of the time post-flop with very weak hands
        if (callAmount === 0) {
          this.logReasoningStep(`Very weak hand but free check`);
          return { action: "call" }; // Check if free
        }
        this.logReasoningStep(
          `Very weak hand, rare fold for aggressive strategy`
        );
        return { action: "fold" };
      }
    }
  }
}
