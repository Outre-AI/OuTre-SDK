import requests

wallet_address = "YourWalletAddress"
api_url = f"https://api.outre.app/portfolio?wallet={wallet_address}"

response = requests.get(api_url)
portfolio_data = response.json()

print("Your Portfolio Overview:", portfolio_data)
