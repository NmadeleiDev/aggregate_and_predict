FROM python:3.8

WORKDIR /usr/application/

RUN pip install pandas requests pymongo kafka-python

ADD main /usr/application/

CMD [ "python3", "-u", "main.py" ]