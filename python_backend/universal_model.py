import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, accuracy_score

class UniversalPredictor:
    def __init__(self):
        self.model = None
        self.label_encoders = {}
        self.target_column = None
        self.is_classification = False
        self.features = []

    def train(self, df: pd.DataFrame, target_column: str = None):
        if not target_column:
            target_column = df.columns[-1]
            
        self.target_column = target_column
        
        if target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' not found in the dataset.")
            
        # Drop rows where target is missing
        df = df.dropna(subset=[target_column]).copy()
        
        # Determine if classification or regression
        # If target is string/object or boolean, or has very few unique integers, it's likely classification
        if not pd.api.types.is_numeric_dtype(df[target_column]) or df[target_column].dtype == 'bool' or df[target_column].nunique() < 20:
            self.is_classification = True
            self.model = RandomForestClassifier(n_estimators=100, random_state=42)
            # Encode target if it's text/non-numeric
            if not pd.api.types.is_numeric_dtype(df[target_column]):
                le = LabelEncoder()
                df[target_column] = le.fit_transform(df[target_column].astype(str))
                self.label_encoders['__target__'] = le
        else:
            self.is_classification = False
            self.model = RandomForestRegressor(n_estimators=100, random_state=42)

        # Process Features
        self.features = [col for col in df.columns if col != target_column]
        X = df[self.features]
        y = df[target_column]
        
        # Fill missing values and encode categorical features
        for col in X.columns:
            if not pd.api.types.is_numeric_dtype(X[col]):
                X[col] = X[col].fillna('Missing')
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))
                self.label_encoders[col] = le
            else:
                X[col] = X[col].fillna(X[col].median() if not X[col].isnull().all() else 0)

        # Train/Test Split to get metrics
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train Model
        self.model.fit(X_train, y_train)
        
        # Calculate metric
        predictions = self.model.predict(X_test)
        if self.is_classification:
            metric = accuracy_score(y_test, predictions)
            metric_name = "accuracy"
        else:
            metric = r2_score(y_test, predictions)
            metric_name = "r2_score"
            
        return {
            "status": "success",
            "model_type": "Classification" if self.is_classification else "Regression",
            "metric_name": metric_name,
            "metric_value": round(metric, 4),
            "features_used": self.features
        }

    def predict(self, input_data: list):
        """
        input_data: list of dicts, e.g. [{"feature1": val1, "feature2": val2}]
        """
        if not self.model:
            raise Exception("Model is not trained yet. Call train() first.")
            
        df_input = pd.DataFrame(input_data)
        
        # Ensure all columns exist
        for col in self.features:
            if col not in df_input.columns:
                df_input[col] = np.nan
        
        # Only keep the feature columns in the correct order
        X = df_input[self.features]
        
        # Preprocess identically to training
        for col in X.columns:
            if col in self.label_encoders:
                # Handle unseen labels gracefully (assign -1 or mode, here fallback to 0 for simplicity if unseen)
                le = self.label_encoders[col]
                X[col] = X[col].fillna('Missing')
                # Transform safely (ignoring unseen labels is tricky with sklearn's basic LabelEncoder, but using a map handles it)
                classes_dict = dict(zip(le.classes_, range(len(le.classes_))))
                X[col] = X[col].astype(str).map(classes_dict).fillna(0)
            else:
                X[col] = X[col].fillna(0) # In real app, fill with median from training
                
        preds = self.model.predict(X)
        
        # Inverse transform if target was text
        if self.is_classification and '__target__' in self.label_encoders:
            preds = self.label_encoders['__target__'].inverse_transform(preds.astype(int))
            
        return preds.tolist()
