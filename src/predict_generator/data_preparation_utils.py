import numpy as np
import pandas as pd
import os
from sklearn import preprocessing
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.pipeline import Pipeline
from sklearn.pipeline import FeatureUnion
from sklearn.impute import SimpleImputer
from json import dumps, dump, loads, load


def read_files_to_df(files):
    res = []
    for file in files:
        df = pd.read_csv(file)
        res.append(df)
    return pd.concat(res, ignore_index=True)


class DfSelector(BaseEstimator, TransformerMixin):
    def __init__(self, attr_names):
        self.attr_names = attr_names
        
    def fit(self, x, y=None):
        return self
    
    def transform(self, x):
        return x[self.attr_names].values
    
    def inverse_transform(self, x):
        return x[self.attr_names].values
    
class EraseNonStrings(BaseEstimator, TransformerMixin):
    def fit(self, x, y=None):
        return self
    
    def transform(self, x):
        apply = lambda value: value if isinstance(value, str) else ''
        vfunc = np.vectorize(apply)
        return vfunc(x)
    
    def inverse_transform(self, x):
        return x
    
    
def create_pipeline(num_attrs=None, cat_attrs=None):
    if ((num_attrs is None) and (cat_attrs is None)):
        return None
    
    num_pipeline = Pipeline([
        ('selector', DfSelector(num_attrs)),
        ('impute', SimpleImputer(missing_values=np.nan, fill_value=0, strategy='constant')),
        ('scaler', preprocessing.StandardScaler())
    ])
    cat_pipeline = Pipeline([
        ('selector', DfSelector(cat_attrs)),
        ('stringTransform', EraseNonStrings()),
        ('encoder', preprocessing.OneHotEncoder())
    ])
    full_pipeline = FeatureUnion(transformer_list=[
        ('num_pipe', num_pipeline),
        ('cat_pipe', cat_pipeline)
    ])
    
    return full_pipeline

        
def fit_and_dump_pipeline(pipeline, path, data):    
    pipeline.fit(data)
    dump(pipeline, path)
