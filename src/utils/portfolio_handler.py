import json

class PortfolioHandler:
    def __init__(self, json_file):
        with open(json_file, "r") as f:
            self.portfolio = json.load(f)

    def get_total_value(self):
        return sum(asset["amount"] * asset["entry_price"] for asset in self.portfolio["assets"])
    
    def get_risk_profile(self):
        return self.portfolio["performance"]["risk_profile"]
