
const ExpectimaxAlgorithm = {
  makeExpectimaxDecision(player, callAmount, communityCards, potSize, game) {
    const handStrength = player.evaluateCompleteHand(player.cards, communityCards);
    
    player.logReasoningStep(`Starting Expectimax decision process with hand strength: ${handStrength}`);
    player.decisionProcess.nodesExplored = 0;
    player.decisionProcess.maxDepth = 0;
    
    player.decisionProcess.treeRoot = {
      type: 'root',
      children: []
    };
    
    let bestAction = "fold";
    let bestValue = -Infinity;
    let bestAmount = 0;
    
    const canCheck = callAmount === 0;
    
    if (!canCheck) {
      const foldNode = {
        action: 'fold',
        amount: 0,
        children: []
      };
      player.decisionProcess.treeRoot.children.push(foldNode);
      
      const foldValue = this.expectimaxEvaluate(
        player, handStrength, callAmount, potSize, 0, 10, true, foldNode
      );
      foldNode.value = foldValue;
      
      player.logReasoningStep(`Evaluated FOLD option with Expectimax: ${foldValue}`);
      
      if (foldValue > bestValue) {
        bestValue = foldValue;
        bestAction = "fold";
        bestAmount = 0;
      }
    }
    
    const checkCallNode = {
      action: canCheck ? 'check' : 'call',
      amount: callAmount,
      children: []
    };
    player.decisionProcess.treeRoot.children.push(checkCallNode);
    
    const checkCallValue = this.expectimaxEvaluate(
      player, handStrength, callAmount, potSize + callAmount, 0, 10, false, checkCallNode
    );
    checkCallNode.value = checkCallValue;
    
    player.logReasoningStep(`Evaluated ${canCheck ? "CHECK" : "CALL"} option with Expectimax: ${checkCallValue}`);
    
    if (checkCallValue > bestValue) {
      bestValue = checkCallValue;
      bestAction = canCheck ? "check" : "call";
      bestAmount = callAmount;
    }
    
    const minRaiseAmount = Math.max(game.minRaise || 10, callAmount * 2);
    const possibleRaises = [
      minRaiseAmount,
      Math.floor(potSize * 0.5),
      Math.floor(potSize * 0.75),
      potSize,
      Math.floor(potSize * 1.5)
    ].filter(amount => amount > callAmount && amount <= player.chips);
    
    for (const raiseAmount of possibleRaises) {
      const raiseNode = {
        action: 'raise',
        amount: raiseAmount,
        children: []
      };
      player.decisionProcess.treeRoot.children.push(raiseNode);
      
      const newPot = potSize + raiseAmount;
      const raiseValue = this.expectimaxEvaluate(
        player, handStrength, raiseAmount, newPot, 0, 10, false, raiseNode
      );
      raiseNode.value = raiseValue;
      
      player.logReasoningStep(`Evaluated RAISE ${raiseAmount} option with Expectimax: ${raiseValue}`);
      
      if (raiseValue > bestValue) {
        bestValue = raiseValue;
        bestAction = "raise";
        bestAmount = raiseAmount;
      }
    }
    
    player.decisionProcess.evaluation = { bestAction, bestValue, bestAmount };
    player.logReasoningStep(`Final Expectimax decision: ${bestAction} ${bestAmount > 0 ? bestAmount : ""}`);
    
    this.markBestPath(player.decisionProcess.treeRoot.children, bestAction, bestAmount);
    
    const treeVisualization = this.renderDecisionTree(player.decisionProcess.treeRoot);
    console.log("Expectimax Decision Tree:\n" + treeVisualization);
    
    const treeId = Date.now().toString();
    if (player.recordTreeDecision) {
      player.recordTreeDecision({
        id: treeId,
        algorithm: 'expectimax',
        gamePhase: game.roundName || 'unknown',
        rootNode: this.prepareTreeForLogging(player.decisionProcess.treeRoot),
        bestPath: [bestAction],
        maxDepth: player.decisionProcess.maxDepth,
        nodesExplored: player.decisionProcess.nodesExplored
      });
    }
    
    return {
      action: bestAction,
      amount: bestAmount
    };
  },
  
  
  expectimaxEvaluate(player, handStrength, betAmount, potSize, depth, maxDepth, isFolding, node) {
    player.decisionProcess.nodesExplored++;
    player.decisionProcess.maxDepth = Math.max(player.decisionProcess.maxDepth, depth);
    
    if (depth >= maxDepth) {
      const leafValue = this.calculateLeafValue(player, handStrength, betAmount, potSize, isFolding);
      node.isLeaf = true;
      node.leafValue = leafValue;
      return leafValue;
    }
    
    if (isFolding) {
      node.isLeaf = true;
      node.leafValue = -betAmount;
      return -betAmount;
    }
    
    if (depth % 2 === 0) {
      let value = -Infinity;
      
      const foldProb = 0.3;
      const foldValue = potSize;
      
      const foldNode = {
        action: 'opp_fold',
        probability: foldProb,
        value: foldValue,
        isLeaf: true,
        leafValue: foldValue
      };
      node.children.push(foldNode);
      
      const callProb = 0.5;
      const callValue = this.calculateShowdownValue(handStrength, potSize);
      
      const callNode = {
        action: 'opp_call',
        probability: callProb,
        value: callValue,
        isLeaf: true,
        leafValue: callValue
      };
      node.children.push(callNode);
      
      const raiseProb = 0.2;
      
      let expectedValue = foldProb * foldValue + callProb * callValue;
      
      const possibleRaises = [
        betAmount * 2,
        Math.floor(potSize * 0.5),
        potSize
      ];
      
      const raiseProbPerAmount = raiseProb / possibleRaises.length;
      
      for (const raiseAmount of possibleRaises) {
        const newPot = potSize + raiseAmount;
        
        const raiseNode = {
          action: 'opp_raise',
          amount: raiseAmount,
          probability: raiseProbPerAmount,
          children: []
        };
        node.children.push(raiseNode);
        
        const raiseValue = this.expectimaxEvaluate(
          player, handStrength, raiseAmount, newPot, depth + 1, maxDepth, false, raiseNode
        );
        raiseNode.value = raiseValue;
        
        expectedValue += raiseProbPerAmount * raiseValue;
      }
      
      return expectedValue;
    }
    else {
      const foldProb = Math.min(0.7, Math.max(0.1, handStrength - 0.2));
      const callProb = Math.min(0.6, Math.max(0.2, 0.5 - Math.abs(handStrength - 0.5)));
      const raiseProb = 1.0 - foldProb - callProb;
      
      const foldValue = -betAmount;
      
      const foldNode = {
        action: 'we_fold',
        probability: foldProb,
        value: foldValue,
        isLeaf: true,
        leafValue: foldValue
      };
      node.children.push(foldNode);
      
      const potRatio = Math.min(1.0, potSize / (betAmount * 10));
      const opponentStrengthBase = 0.3 + (potRatio * 0.4);
      const opponentHandStrength = opponentStrengthBase + (Math.random() * 0.3);
      
      const callValue = this.calculateOpponentShowdownValue(handStrength, opponentHandStrength, potSize);
      
      const callNode = {
        action: 'we_call',
        probability: callProb,
        value: callValue,
        isLeaf: true,
        leafValue: callValue
      };
      node.children.push(callNode);
      
      const possibleRaises = [
        betAmount * 2,
        Math.floor(potSize * 0.5),
        potSize
      ];
      
      let expectedValue = (foldProb * foldValue) + (callProb * callValue);
      
      if (raiseProb > 0) {
        const raiseProbPerAmount = raiseProb / possibleRaises.length;
        
        for (const raiseAmount of possibleRaises) {
          const newPot = potSize + raiseAmount;
          
          const raiseNode = {
            action: 'we_raise',
            amount: raiseAmount,
            probability: raiseProbPerAmount,
            children: []
          };
          node.children.push(raiseNode);
          
          const raiseValue = this.expectimaxEvaluate(
            player, handStrength, raiseAmount, newPot, depth + 1, maxDepth, false, raiseNode
          );
          raiseNode.value = raiseValue;
          
          expectedValue += raiseProbPerAmount * raiseValue;
        }
      }
      
      return expectedValue;
    }
  },
  
  
  calculateLeafValue(player, handStrength, betAmount, potSize, isFolding) {
    if (isFolding) {
      return -betAmount;
    }
    
    const winProbability = handStrength;
    const EV = (winProbability * potSize) - ((1 - winProbability) * betAmount);
    
    const aggressionBonus = handStrength > 0.7 ? 0.1 * potSize : 0;
    const positionBonus = player.position === 'button' ? 0.05 * potSize : 0;
    
    return EV + aggressionBonus + positionBonus;
  },
  
  calculateShowdownValue(handStrength, potSize) {
    const winProbability = handStrength;
    return (winProbability * potSize) - ((1 - winProbability) * potSize);
  },
  
  calculateOpponentShowdownValue(ourHandStrength, opponentHandStrength, potSize) {
    if (ourHandStrength > opponentHandStrength) {
      return potSize;
    } else if (ourHandStrength < opponentHandStrength) {
      return -potSize;
    } else {
      return 0;
    }
  },
  
  
  markBestPath(nodes, bestAction, bestAmount) {
    for (const node of nodes) {
      if (node.action === bestAction && (!bestAmount || node.amount === bestAmount)) {
        node.isBestPath = true;
        break;
      }
    }
  },
  
  renderDecisionTree(rootNode, prefix = "", isLast = true, depth = 0) {
    if (!rootNode) return "";
    
    let result = "";
    
    const nodePrefix = depth === 0 ? "" : prefix + (isLast ? "└── " : "├── ");
    const nodeValue = rootNode.value !== undefined ? ` (${rootNode.value.toFixed(2)})` : "";
    const nodeProb = rootNode.probability !== undefined ? ` [${(rootNode.probability * 100).toFixed(1)}%]` : "";
    const bestPathMarker = rootNode.isBestPath ? "*" : " ";
    
    let nodeText = "";
    if (rootNode.type === 'root') {
      nodeText = "ROOT";
    } else {
      nodeText = rootNode.action.toUpperCase();
      if (rootNode.amount) nodeText += ` ${rootNode.amount}`;
    }
    
    result += `${nodePrefix}${bestPathMarker} ${nodeText}${nodeValue}${nodeProb}\n`;
    
    if (rootNode.children && rootNode.children.length > 0) {
      const childPrefix = depth === 0 ? "" : prefix + (isLast ? "    " : "│   ");
      
      rootNode.children.forEach((child, i) => {
        const isLastChild = i === rootNode.children.length - 1;
        result += this.renderDecisionTree(child, childPrefix, isLastChild, depth + 1);
      });
    }
    
    return result;
  },
  
  prepareTreeForLogging(rootNode) {
    if (!rootNode) return null;
    
    const cleanNode = {
      action: rootNode.type === 'root' ? 'ROOT' : rootNode.action,
      value: rootNode.value,
      isBestPath: rootNode.isBestPath || false
    };
    
    if (rootNode.amount) cleanNode.amount = rootNode.amount;
    if (rootNode.probability) cleanNode.probabilityOfReaching = rootNode.probability;
    
    if (rootNode.children && rootNode.children.length > 0) {
      cleanNode.children = rootNode.children.map(child => this.prepareTreeForLogging(child));
      
      const bestChildIndex = rootNode.children.findIndex(child => child.isBestPath);
      if (bestChildIndex >= 0) {
        cleanNode.bestChildIndex = bestChildIndex;
      }
    }
    
    return cleanNode;
  }
}; 