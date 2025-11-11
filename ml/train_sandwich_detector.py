import os
import argparse
from datetime import datetime
import json
import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.utils.class_weight import compute_class_weight
import tensorflow as tf
from dotenv import load_dotenv

FEATURE_COLUMNS = [
    "risk_score",
    "slippage_loss",
    "gas_price_gwei",
    "time_of_day",
    "bundle_size",
    "victim_count",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--db-url", dest="db_url", default=None)
    parser.add_argument("--limit", type=int, default=50000)
    parser.add_argument("--start", dest="start", default=None)
    parser.add_argument("--end", dest="end", default=None)
    parser.add_argument("--epochs", type=int, default=25)
    parser.add_argument("--batch-size", type=int, default=256)
    parser.add_argument("--model-dir", dest="model_dir", default="ml/models")
    parser.add_argument("--val-split", dest="val_split", type=float, default=0.2)
    parser.add_argument("--test-split", dest="test_split", type=float, default=0.1)
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


def get_engine(url: str) -> Engine:
    engine = create_engine(url, pool_pre_ping=True)
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return engine


def build_query(limit: int, start: str | None, end: str | None) -> text:
    clauses = []
    params: dict[str, object] = {}
    if start:
        clauses.append("observed_at >= :start")
        params["start"] = start
    if end:
        clauses.append("observed_at <= :end")
        params["end"] = end
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    sql = f"""
        SELECT
            observed_at,
            attack_type,
            risk_score,
            slippage_loss,
            COALESCE(NULLIF(gas_price, ''), '0') AS gas_price,
            metadata
        FROM mev_events
        {where}
        ORDER BY observed_at DESC
        LIMIT :limit
    """
    params["limit"] = limit
    return text(sql).bindparams(**params)


def extract_features(row: pd.Series) -> pd.Series:
    gas_wei = float(row.gas_price) if row.gas_price not in (None, "") else 0.0
    gas_gwei = gas_wei / 1e9
    dt = pd.to_datetime(row.observed_at, utc=True)
    tod = dt.hour + dt.minute / 60.0
    metadata = row.metadata if isinstance(row.metadata, dict) else {}
    bundle_size = float(metadata.get("bundle_size", 0))
    victim_count = float(metadata.get("victim_count", metadata.get("victims", 0)))
    return pd.Series({
        "risk_score": float(row.risk_score or 0.0),
        "slippage_loss": float(row.slippage_loss or 0.0),
        "gas_price_gwei": gas_gwei,
        "time_of_day": tod / 24.0,
        "bundle_size": bundle_size,
        "victim_count": victim_count,
    })


def load_dataframe(engine: Engine, query: text) -> pd.DataFrame:
    df = pd.read_sql_query(query, engine)
    if df.empty:
        raise RuntimeError("No MEV events returned for training")
    df["metadata"] = df["metadata"].apply(lambda x: json.loads(x) if isinstance(x, str) else x)
    features = df.apply(extract_features, axis=1)
    labels = (df["attack_type"].str.lower() == "sandwich").astype(int)
    result = features.assign(label=labels)
    result = result.dropna()
    if result["label"].nunique() < 2:
        raise RuntimeError("Dataset lacks class diversity for sandwich classification")
    return result


def split_dataset(df: pd.DataFrame, val_split: float, test_split: float, seed: int):
    train_df, test_df = train_test_split(df, test_size=test_split, stratify=df["label"], random_state=seed)
    train_df, val_df = train_test_split(train_df, test_size=val_split, stratify=train_df["label"], random_state=seed)
    return train_df, val_df, test_df


def scale_features(train_df: pd.DataFrame, val_df: pd.DataFrame, test_df: pd.DataFrame):
    scaler = StandardScaler()
    scaler.fit(train_df[FEATURE_COLUMNS])
    x_train = scaler.transform(train_df[FEATURE_COLUMNS])
    x_val = scaler.transform(val_df[FEATURE_COLUMNS])
    x_test = scaler.transform(test_df[FEATURE_COLUMNS])
    y_train = train_df["label"].to_numpy()
    y_val = val_df["label"].to_numpy()
    y_test = test_df["label"].to_numpy()
    return (x_train, y_train), (x_val, y_val), (x_test, y_test), scaler


def build_model(input_dim: int) -> tf.keras.Model:
    model = tf.keras.Sequential([
        tf.keras.layers.InputLayer(input_shape=(input_dim,)),
        tf.keras.layers.Dense(128, activation="relu"),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(64, activation="relu"),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(1, activation="sigmoid"),
    ])
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="binary_crossentropy",
        metrics=["accuracy", tf.keras.metrics.Precision(name="precision"), tf.keras.metrics.Recall(name="recall")],
    )
    return model


def compute_weights(labels: np.ndarray) -> dict[int, float]:
    classes = np.unique(labels)
    weights = compute_class_weight(class_weight="balanced", classes=classes, y=labels)
    return {int(cls): weight for cls, weight in zip(classes, weights)}


def ensure_dir(path: str) -> str:
    os.makedirs(path, exist_ok=True)
    return path


def save_artifacts(model: tf.keras.Model, scaler: StandardScaler, output_dir: str, metadata: dict[str, object]):
    ensure_dir(output_dir)
    model.save(os.path.join(output_dir, "model"))
    np.save(os.path.join(output_dir, "scaler_mean.npy"), scaler.mean_)
    np.save(os.path.join(output_dir, "scaler_scale.npy"), scaler.scale_)
    with open(os.path.join(output_dir, "metadata.json"), "w", encoding="utf-8") as fh:
        json.dump(metadata, fh, indent=2, default=str)


def main():
    load_dotenv()
    args = parse_args()
    db_url = args.db_url or os.getenv("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL is required")
    engine = get_engine(db_url)
    query = build_query(args.limit, args.start, args.end)
    df = load_dataframe(engine, query)
    train_df, val_df, test_df = split_dataset(df, args.val_split, args.test_split, args.seed)
    (x_train, y_train), (x_val, y_val), (x_test, y_test), scaler = scale_features(train_df, val_df, test_df)
    model = build_model(len(FEATURE_COLUMNS))
    class_weights = compute_weights(y_train)
    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor="val_loss", patience=5, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3, min_lr=1e-5),
    ]
    history = model.fit(
        x_train,
        y_train,
        validation_data=(x_val, y_val),
        epochs=args.epochs,
        batch_size=args.batch_size,
        class_weight=class_weights,
        callbacks=callbacks,
        verbose=1,
    )
    evaluation = model.evaluate(x_test, y_test, verbose=0)
    metrics = dict(zip(model.metrics_names, evaluation))
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    output_dir = ensure_dir(os.path.join(args.model_dir, timestamp))
    save_artifacts(
        model,
        scaler,
        output_dir,
        {
            "metrics": metrics,
            "history": {k: [float(v) for v in history.history[k]] for k in history.history},
            "feature_columns": FEATURE_COLUMNS,
        },
    )
    print(json.dumps({"output_dir": output_dir, "metrics": metrics}, indent=2))


if __name__ == "__main__":
    main()
