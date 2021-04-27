import pandas as pd
import os
import json
import requests
from db.mongo import MongoDbManager
import datetime

def get_bool_mask_for_trigger(trigger, dataframe):
    if (trigger['valueType'] == 'number'):
        value = trigger['value']
    else:
        value = dataframe[trigger['metric']].quantile(trigger['value'])
        
    if (trigger['filterType'] == 'negative'):
        result = dataframe[trigger['metric']] <= value
    else:
        result = dataframe[trigger['metric']] >= value
        
    return result.astype(bool)

def apply_value_corrections(df, corrections):
    for correction in corrections:
        if (isinstance(correction, dict) is False):
            print("Invalid correction: ", correction)
            continue
        if ('metric' not in correction.keys() or 'by' not in correction.keys()):
            print("Invalid correction: ", correction)
            continue
        df[correction['metric']].where(df[correction['metric']] > df[correction['by']], df[correction['by']], inplace=True)

def emit_events_for_df(df, triggers,
            user_id_field='user_id', app_id_field='app_id', 
            af_event_name='smartevent', predictor_event_name='smart_event_name', 
            af_dev_key_android=None, af_dev_key_ios=None,
            field_to_set_as_event_revenue=None,
            value_correction_directives=None,
            version='0.0.1', db_client=None):
    if (db_client is None): 
        db_client = MongoDbManager()

    if ((af_dev_key_android is None) or (af_dev_key_ios is None) or
     (len(af_dev_key_android) < 2) or (len(af_dev_key_ios) < 2)):
        print("Dev keys are not set! ", af_dev_key_android, af_dev_key_ios)
        return

    predicted_fields = [trigger['metric'] for trigger in triggers]
    triggers_filter = pd.DataFrame(data=dict(list(map(
                    lambda filt: (filt["metric"], get_bool_mask_for_trigger(filt, df)), triggers))))
    mask_from_triggers = triggers_filter.all(axis=1).to_numpy()

    df = df[mask_from_triggers]

    emitted_users_ids = db_client.find_users_with_emitted_event([f for f in df[user_id_field].values], predictor_event_name, version)
    
    df = df[(df[user_id_field].apply(lambda val: val not in emitted_users_ids) == True)]

    if (isinstance(value_correction_directives, list) is True):
        apply_value_corrections(df, value_correction_directives)

    if (field_to_set_as_event_revenue is not None and str(field_to_set_as_event_revenue) in df.columns):
        event_revenue_vals = df[field_to_set_as_event_revenue]
    else:
        event_revenue_vals = None

    event_reciever_url = os.getenv('EVENT_RECIEVER_URL')

    for idx in range(0, df.shape[0]):
        app_id = str(df.iloc[idx][app_id_field])
        user_id = df.iloc[idx][user_id_field]

        if (len(app_id) < 5):
            print("App id is not set: ", df.iloc[idx])
            continue

        if (len(user_id) < 5):
            print("Af id is not set: ", df.iloc[idx])
            continue

        event_value = {
                'name': predictor_event_name,
                'version': version,
                'triggers': triggers,
                'metric_values': df.iloc[idx][predicted_fields].to_json(orient='records')
            }

        if (event_revenue_vals is not None):
            event_value['af_revenue'] = event_revenue_vals.iloc[idx]

        request_body = {
            'user_id': user_id,
            'eventName': af_event_name,
            'eventValue': json.dumps(event_value)
        }

        if (event_revenue_vals is not None):
            request_body['eventCurrency'] = 'RUB'
        
        url = '{}/{}'.format(event_reciever_url, app_id)

        if (app_id.index('id') == 0):
            key = af_dev_key_ios
        elif (app_id.index('com') == 0):
            key = af_dev_key_android
        else:
            print("App_id is not recongized: ", app_id)
            continue

        response = requests.post(url, json=request_body, headers={'authentication': key})

        db_client.save_request_log({'user_id': user_id, 'app_id': app_id, 'eventName': af_event_name, 'eventValue': event_value, 'response': response.text, 'time': str(datetime.datetime.now())})
    