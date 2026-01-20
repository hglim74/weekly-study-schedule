py -m pip install flet
py -m pip install -r requirements.txt
py manage.py migrate
py manage.py createsuperuser
py manage.py runsslserver
