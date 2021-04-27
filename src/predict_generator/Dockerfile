# FROM tensorflow/tensorflow:2.4.1
FROM tensorflow/tensorflow

WORKDIR /usr/application/

RUN /usr/bin/python3 -m pip install --upgrade pip && pip install pandas scikit-learn==0.24.1 joblib kafka-python pymongo

ADD . /usr/application/

CMD [ "python3", "-u", "main.py" ]