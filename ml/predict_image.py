import argparse
import json
from pathlib import Path

import numpy as np
import tensorflow as tf


CATEGORY_MAP = {
    "organic": "Organik",
    "botol plastik": "Anorganik",
    "plastic": "Anorganik",
    "kaca": "Anorganik",
    "kardus": "Anorganik",
    "kertas": "Anorganik",
    "metal": "Anorganik",
}


POINTS_MAP = {
    "Organik": 5,
    "Anorganik": 10,
    "B3": 25,
}


def parse_args():
    parser = argparse.ArgumentParser(description="Predict a single waste image.")
    parser.add_argument("--image", required=True, help="Image path to predict.")
    parser.add_argument("--model", default="artifacts/best_model.keras", help="Path to trained .keras model.")
    parser.add_argument("--labels", default="artifacts/labels.json", help="Path to labels JSON.")
    parser.add_argument("--image-size", type=int, default=224, help="Input image size.")
    return parser.parse_args()


def load_image(image_path: Path, image_size: int):
    image = tf.keras.utils.load_img(image_path, target_size=(image_size, image_size))
    image_array = tf.keras.utils.img_to_array(image)
    return np.expand_dims(image_array, axis=0)


def main():
    args = parse_args()
    image_path = Path(args.image).resolve()
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    labels = json.loads(Path(args.labels).read_text(encoding="utf-8"))
    model = tf.keras.models.load_model(args.model)

    image_batch = load_image(image_path, args.image_size)
    probabilities = model.predict(image_batch, verbose=0)[0]
    predicted_index = int(np.argmax(probabilities))
    label = labels[str(predicted_index)]
    confidence = float(probabilities[predicted_index])
    category = CATEGORY_MAP.get(label.lower(), "Anorganik")

    result = {
        "label": label,
        "category": category,
        "confidence": round(confidence, 4),
        "points": POINTS_MAP.get(category, 10),
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
