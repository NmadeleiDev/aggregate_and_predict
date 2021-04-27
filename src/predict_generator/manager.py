import pandas as pd
import os
from os import path
from tensorflow import keras
from joblib import load
import numpy as np

models_dir = os.getenv("MODELS_DIR")

def get_model_name(model_dir):
    for name in os.listdir(path.join(models_dir, model_dir)):
        if (name.split(".")[0].split("_")[-1] == "model"):
            return name
    return None

def get_pipeline_name(model_dir):
    for name in os.listdir(path.join(models_dir, model_dir)):
        if (name.split(".")[0].split("_")[-1] == "pipeline"):
            return name
    return None

def get_prediction(dataset, model_name):
    from data_preparation_utils import create_pipeline, DfSelector, EraseNonStrings

    if (models_dir is None or (len(models_dir) == 0)):
        return "Models dir is not set", False

    target_model_dir = None
    for dir_name in os.listdir(models_dir):
        if (dir_name == model_name):
            target_model_dir = dir_name
        
    if (target_model_dir is None):
        return "Models dir not found for name '{}'".format(model_name), False

    model_file_name = get_model_name(target_model_dir)
    pipeline_file_name = get_pipeline_name(target_model_dir)

    if ((model_file_name is None) or (pipeline_file_name is None)):
        return "Model or pipeline not found", False

    print("Loading {} pipeline".format(pipeline_file_name))
    pipeline = load(path.join(models_dir, target_model_dir, pipeline_file_name))

    print("Loading {} model".format(model_file_name))
    if (model_file_name.split(".")[-1] == "joblib"):
        ml_model = load(path.join(models_dir, target_model_dir, model_file_name))
    elif (model_file_name.split(".")[-1] == "h5"):
        ml_model = keras.models.load_model(
            path.join(models_dir, target_model_dir, model_file_name))
    
    print("All loaded, transforming {} ds".format(dataset.shape))
    dataset_x = pipeline.transform(dataset.replace({pd.NA: np.nan}))
    print("dataset_x shape: ", dataset_x.shape, type(dataset_x))

    predict = ml_model.predict(dataset_x)

    return predict.tolist(), True

def get_prediction_from_file(file, model_name):
    raw_data = pd.read_csv(file)
    print("Raw data shape: ", raw_data.shape)
    return get_prediction(raw_data, model_name)


    