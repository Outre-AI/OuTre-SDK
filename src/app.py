from utils.solana_connector import SolanaConnector
from agents.momentum_agent import MomentumAgent

def main():
    agent_config = MomentumAgent.load_config("config.json")
    solana = SolanaConnector(agent_config["wallet_address"])
    agent = MomentumAgent(solana, agent_config)
    agent.run()

if __name__ == "__main__":
    main()
