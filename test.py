import requests
from bs4 import BeautifulSoup

response = requests.get('https://www.amazon.co.jp/gp/goldbox')
soup = BeautifulSoup(response.text, 'html.parser')
list = soup.find_all(attrs={'data-testid': 'deal-card'})
print(list)