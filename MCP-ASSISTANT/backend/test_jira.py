import requests
from requests.auth import HTTPBasicAuth
import os
from dotenv import load_dotenv

load_dotenv()

auth = HTTPBasicAuth(os.getenv('JIRA_EMAIL'), os.getenv('JIRA_API_TOKEN'))
headers = {'Accept': 'application/json'}
domain = os.getenv('JIRA_DOMAIN')

# Test myself endpoint
url = f'https://{domain}/rest/api/3/myself'
r = requests.get(url, auth=auth, headers=headers)
print('myself status:', r.status_code)
print('myself response:', r.text[:200])

# Test projects endpoint
url2 = f'https://{domain}/rest/api/3/project'
r2 = requests.get(url2, auth=auth, headers=headers)
print('projects status:', r2.status_code)
print('projects response:', r2.text[:500])

# Test search with GET
url3 = f'https://{domain}/rest/api/3/search'
r3 = requests.get(url3, auth=auth, headers=headers, 
                  params={'jql': 'project is not EMPTY', 'maxResults': 5})
print('search status:', r3.status_code)
print('search response:', r3.text[:500])