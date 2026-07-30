import requests, re
r = requests.post('https://bare-lynx-bave-hub-129c3927.koyeb.app/api/appointments/appointments/', json={
    'patient_first_name':'Test', 'patient_last_name':'Testov', 
    'patient_phone':'+998991234567', 'patient_birth_date':'2000-01-01', 
    'doctor':1, 'service':1, 
    'start_time':'2026-07-29T10:00:00Z', 'end_time':'2026-07-29T10:45:00Z', 'notes':''
})
match = re.search(r'(?s)<pre class="exception_value">(.*?)</pre>', r.text)
if match:
    print(match.group(1).encode('ascii', 'ignore').decode())
else:
    print("No exception_value found")
    
title_match = re.search(r'<title>(.*?)</title>', r.text, re.DOTALL)
if title_match:
    print("Title:", title_match.group(1).encode('ascii', 'ignore').decode().strip())
