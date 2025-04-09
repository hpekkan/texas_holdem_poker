class AILogger {
    constructor() {
        this.enabled = false;
        this.logPath = 'logs';
        this.currentGameFolder = '';
        this.loggers = {}; 
        this.treeVisualizations = {}; 
    }
    
    
    initializeGameLog() {
        
        
        this.enabled = true;
        const now = new Date();
        const dateTimeStr = now.toISOString().replace(/:/g, '-').replace(/\..+/, '');
        this.currentGameFolder = `${this.logPath}/${dateTimeStr}`;
        
        
        this.logContent = {
            gameInfo: {
                startTime: now.toString(),
                gameId: dateTimeStr
            },
            players: {}
        };
        
        console.log(`Game logging initialized: ${this.currentGameFolder}`);
        return this.currentGameFolder;
    }
    
    
    initializePlayerLog(player) {
        if (!this.enabled) return;
        
        const playerId = player.position;
        const playerName = player.name;
        const strategy = player instanceof AIPlayer ? player.strategy : 'human';
        
        
        this.loggers[playerId] = {
            playerId,
            playerName,
            strategy,
            decisions: [],
            trees: [],
            gameStates: [],
            handHistory: []
        };
        
        this.logContent.players[playerId] = this.loggers[playerId];
        
        console.log(`Initialized log for Player ${playerName} (${strategy})`);
    }
    
    
    logDecision(player, decision, gameState, decisionDetails = {}) {
        if (!this.enabled) {
            console.log("Logger disabled, not logging decision");
            return;
        }
        
        if (!this.loggers[player.position]) {
            console.log("No logger for player position", player.position);
            return;
        }
        
        const logger = this.loggers[player.position];
        const timestamp = new Date().toISOString();
        
        console.log(`Logging decision for ${player.name} (${player.position}):`, decision.action);
        
        
        const decisionLog = {
            timestamp,
            action: decision.action,
            amount: decision.amount || 0,
            gamePhase: gameState.roundName,
            pot: gameState.pot,
            callAmount: gameState.currentBet - player.currentBet,
            handStrength: gameState.communityCards.length > 0 ? 
                this.summarizeHandStrength(player.getHandStrength(gameState.communityCards)) :
                this.summarizeHoleCards(player.hand),
            communityCards: gameState.communityCards.map(card => this.cardToString(card)),
            playerChips: player.chips,
            potOdds: gameState.pot > 0 ? 
                ((gameState.currentBet - player.currentBet) / (gameState.pot + (gameState.currentBet - player.currentBet))).toFixed(2) : 
                0
        };
        
        
        if (decisionDetails && typeof decisionDetails === 'object') {
            
            if (decisionDetails.reasoningSteps && Array.isArray(decisionDetails.reasoningSteps)) {
                decisionLog.reasoningSteps = decisionDetails.reasoningSteps;
            }
            
            
            if (decisionDetails.algorithmName) {
                decisionLog.algorithmName = decisionDetails.algorithmName;
            }
        }
        
        logger.decisions.push(decisionLog);
        console.log("Decision logged successfully", decisionLog);
        
        
        if (player.position === 0) {
            return;
        }
        
        
        switch (player.strategy) {
            case 'minimax':
            case 'alphaBeta':
            case 'expectimax':
                this.logTreeBasedDecision(player, decision, gameState, decisionDetails);
                break;
            case 'monteCarlo':
            case 'simulation':
                this.logSimulationBasedDecision(player, decision, gameState, decisionDetails);
                break;
            default:
                
                break;
        }
    }
    
    
    logTreeBasedDecision(player, decision, gameState, decisionDetails) {
        const logger = this.loggers[player.position];
        const treeId = `${player.position}_${gameState.roundName}_${logger.trees.length}`;
        
        
        const treeVisualization = {
            id: treeId,
            timestamp: new Date().toISOString(),
            gamePhase: gameState.roundName,
            algorithm: player.strategy,
            rootNode: this.createDecisionTreeNode(decision, gameState, decisionDetails, 0),
            maxDepth: decisionDetails.maxDepth || 2,
            nodesExplored: decisionDetails.nodesExplored || 1,
            evaluationFunction: player.strategy,
            bestPath: decisionDetails.bestPath || [decision.action]
        };
        
        logger.trees.push(treeVisualization);
        
        
        const treeText = this.renderDecisionTree(treeVisualization);
        console.log(`Decision tree for Player ${player.name} (${player.strategy}):\n${treeText}`);
    }
    
    
    createDecisionTreeNode(decision, gameState, details, depth) {
        
        
        
        
        const node = {
            action: decision.action,
            value: details.nodeValue || (decision.action === 'fold' ? 0 : (decision.action === 'call' ? 0.5 : 0.7)),
            depth: depth,
            children: []
        };
        
        
        if (depth < (details.maxDepth || 2)) {
            const possibleActions = ['fold', 'call', 'raise'];
            possibleActions.forEach(action => {
                
                
                if (depth === 0 && action === decision.action) return;
                
                const childValue = this.getSimulatedNodeValue(action, depth, details);
                const childNode = {
                    action: action,
                    value: childValue,
                    depth: depth + 1,
                    isLeaf: depth + 1 >= (details.maxDepth || 2),
                    children: []
                };
                
                
                if (!childNode.isLeaf) {
                    const grandchildActions = ['fold', 'call', 'raise'];
                    grandchildActions.forEach(grandchildAction => {
                        const grandchildValue = this.getSimulatedNodeValue(grandchildAction, depth + 1, details);
                        childNode.children.push({
                            action: grandchildAction,
                            value: grandchildValue,
                            depth: depth + 2,
                            isLeaf: true,
                            children: []
                        });
                    });
                }
                
                node.children.push(childNode);
            });
        }
        
        return node;
    }
    
    
    getSimulatedNodeValue(action, depth, details) {
        
        
        const baseValue = {
            'fold': 0,
            'call': 0.5,
            'raise': 0.7
        }[action];
        
        
        const depthAdjustment = (Math.random() * 0.3) - (0.1 * depth);
        
        
        const bestPathBonus = (details.bestPath && details.bestPath[depth] === action) ? 0.1 : 0;
        
        return Math.min(1, Math.max(0, baseValue + depthAdjustment + bestPathBonus));
    }
    
    
    logSimulationBasedDecision(player, decision, gameState, decisionDetails) {
        const logger = this.loggers[player.position];
        
        
        const simulationLog = {
            timestamp: new Date().toISOString(),
            gamePhase: gameState.roundName,
            algorithm: player.strategy,
            handStrength: gameState.communityCards.length > 0 ? 
                this.summarizeHandStrength(player.getHandStrength(gameState.communityCards)) :
                this.summarizeHoleCards(player.hand),
            simulationsRun: decisionDetails.simulationsRun || 100,
            winProbability: decisionDetails.winProbability || 0.5,
            actionProbabilities: decisionDetails.actionProbabilities || {
                fold: 0.2,
                call: 0.5,
                raise: 0.3
            },
            expectedValues: decisionDetails.expectedValues || {
                fold: 0,
                call: gameState.pot * 0.5,
                raise: gameState.pot * 0.7
            },
            selectedAction: decision.action,
            reasonForSelection: decisionDetails.reason || "Highest expected value"
        };
        
        logger.gameStates.push(simulationLog);
        console.log(`Simulation results for Player ${player.name} (${player.strategy}):`, simulationLog);
    }
    
    
    logGameState(gameState) {
        if (!this.enabled) return;
        
        
        const gameStateLog = {
            timestamp: new Date().toISOString(),
            gamePhase: gameState.gamePhase,
            roundName: gameState.roundName,
            pot: gameState.pot,
            communityCards: gameState.communityCards.map(card => this.cardToString(card)),
            currentBet: gameState.currentBet,
            dealerPosition: gameState.dealerIndex,
            smallBlindPosition: gameState.smallBlindIndex,
            bigBlindPosition: gameState.bigBlindIndex,
            activePlayerCount: gameState.players.filter(p => !p.folded && p.isActive).length,
            playerStates: gameState.players.map(player => ({
                position: player.position,
                chips: player.chips,
                folded: player.folded,
                currentBet: player.currentBet,
                isAllIn: player.isAllIn
            }))
        };
        
        
        Object.values(this.loggers).forEach(logger => {
            logger.gameStates.push(gameStateLog);
        });
    }
    
    
    logHandResult(gameState, winners) {
        if (!this.enabled) return;
        
        const handResultLog = {
            timestamp: new Date().toISOString(),
            gamePhase: 'handComplete',
            pot: gameState.pot,
            communityCards: gameState.communityCards.map(card => this.cardToString(card)),
            winners: winners.map(winner => ({
                position: winner.player.position,
                name: winner.player.name,
                amount: winner.amount,
                handDescription: winner.hand ? winner.hand.description : 'N/A'
            })),
            playerHands: gameState.players
                .filter(p => !p.folded && p.isActive)
                .map(player => ({
                    position: player.position,
                    name: player.name,
                    hand: player.hand.map(card => this.cardToString(card)),
                    handStrength: this.summarizeHandStrength(player.getHandStrength(gameState.communityCards))
                }))
        };
        
        
        Object.values(this.loggers).forEach(logger => {
            logger.handHistory.push(handResultLog);
        });
    }
    
    
    renderDecisionTree(tree) {
        let result = `Decision Tree (${tree.algorithm}, Depth: ${tree.maxDepth}):\n`;
        
        const renderNode = (node, prefix = '') => {
            const valueStr = node.value.toFixed(2);
            const actionStr = node.action.toUpperCase();
            const isBestPath = tree.bestPath.includes(node.action);
            const marker = isBestPath ? '*' : ' ';
            
            result += `${prefix}${marker} ${actionStr} (${valueStr})\n`;
            
            if (node.children && node.children.length > 0) {
                node.children.forEach((child, i) => {
                    const isLast = i === node.children.length - 1;
                    const childPrefix = prefix + (isLast ? '└── ' : '├── ');
                    const grandchildPrefix = prefix + (isLast ? '    ' : '│   ');
                    renderNode(child, childPrefix, grandchildPrefix);
                });
            }
        };
        
        renderNode(tree.rootNode);
        return result;
    }
    
    
    cardToString(card) {
        return `${card.valueDisplay}${card.suitSymbol}`;
    }
    
    
    summarizeHandStrength(handStrength) {
        if (!handStrength) return 'Unknown';
        return {
            type: handStrength.type,
            rank: handStrength.rank,
            description: handStrength.description
        };
    }
    
    
    summarizeHoleCards(cards) {
        return {
            cards: cards.map(card => this.cardToString(card)),
            isPair: cards[0].value === cards[1].value,
            isSuited: cards[0].suit === cards[1].suit,
            highCard: Math.max(cards[0].value === 1 ? 14 : cards[0].value, 
                              cards[1].value === 1 ? 14 : cards[1].value),
            lowCard: Math.min(cards[0].value === 1 ? 14 : cards[0].value, 
                             cards[1].value === 1 ? 14 : cards[1].value)
        };
    }
    
    
    exportLogs() {
        if (!this.enabled) return null;
        
        
        return JSON.stringify(this.logContent, null, 2);
    }
    
    
    saveLogsToFile() {
        if (!this.enabled) return false;
        
        const logs = this.exportLogs();
        if (!logs) return false;
        
        
        const blob = new Blob([logs], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `poker_ai_log_${this.logContent.gameInfo.gameId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return true;
    }
    
    
    getTreeVisualization(playerId, treeId) {
        if (!this.enabled || !this.loggers[playerId]) return null;
        
        const logger = this.loggers[playerId];
        const tree = logger.trees.find(t => t.id === treeId);
        
        if (!tree) return null;
        
        return this.renderDecisionTree(tree);
    }
    
    
    getTreeData(playerId, treeId) {
        console.log("DEBUGGING: getTreeData called with playerId:", playerId, "treeId:", treeId);
        
        if (!this.enabled) {
            console.log("DEBUGGING: Logger not enabled");
            return null;
        }
        
        if (!this.loggers) {
            console.log("DEBUGGING: No loggers available");
            return null;
        }
        
        if (!this.loggers[playerId]) {
            console.log("DEBUGGING: Logger for player", playerId, "not found");
            console.log("DEBUGGING: Available loggers:", Object.keys(this.loggers));
            return null;
        }
        
        const logger = this.loggers[playerId];
        console.log("DEBUGGING: Found logger for player", playerId);
        
        if (!logger.trees || logger.trees.length === 0) {
            console.log("DEBUGGING: No trees available for player", playerId);
            return null;
        }
        
        console.log("DEBUGGING: Number of trees available:", logger.trees.length);
        const tree = logger.trees.find(t => t.id === treeId);
        
        if (!tree) {
            console.log("DEBUGGING: Tree with ID", treeId, "not found");
            console.log("DEBUGGING: Available tree IDs:", logger.trees.map(t => t.id));
            return null;
        }
        
        console.log("DEBUGGING: Found tree with ID", treeId);
        return tree;
    }
}


const aiLogger = new AILogger();


window.aiLogger = aiLogger;