function runAISimulation() {
  
  if (typeof Logger !== "undefined" && Logger.clear) {
    Logger.clear();
  }
  Logger.log("Starting AI simulation...");

  
  let ai1 = new AIPlayer("AI 1", 1, 1000, "advanced");
  let ai2 = new AIPlayer("AI 2", 2, 1000, "intermediate");
  let ai3 = new AIPlayer("AI 3", 3, 1000, "basic");
  let ai4 = new AIPlayer("AI 4", 4, 1000, "monteCarlo");

  
  let players = [ai1, ai2, ai3, ai4];

  
  let game = new PokerGame();
  game.players = players;
  game.gamePhase = "betting";

  
  const simStartTime = performance.now();

  
  game.startNewHand();

  
  const simEndTime = performance.now();
  const simulationTime = simEndTime - simStartTime;
  Logger.log(
    `Simulation finished in ${simulationTime.toFixed(2)} milliseconds.`
  );

  
  players.forEach((player) => {
    
    Logger.log(`${player.name}: Earned ${player.earnings || 0} chips.`);
  });
}
