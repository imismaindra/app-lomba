import argparse
import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix


def parse_args():
    parser = argparse.ArgumentParser(description="Evaluate trained waste classification model.")
    parser.add_argument("--data-dir", default="data_split", help="Folder containing train/val/test split.")
    parser.add_argument("--model", default="artifacts/best_model.keras", help="Path to trained .keras model.")
    parser.add_argument("--labels", default="artifacts/labels.json", help="Path to labels JSON.")
    parser.add_argument("--output-dir", default="artifacts", help="Folder to save testing reports.")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size.")
    parser.add_argument("--image-size", type=int, default=224, help="Input image size.")
    return parser.parse_args()


def plot_confusion_matrix(matrix, class_names, output_path: Path):
    plt.figure(figsize=(10, 8))
    plt.imshow(matrix, interpolation="nearest", cmap="Blues")
    plt.title("Confusion Matrix")
    plt.colorbar()
    tick_marks = np.arange(len(class_names))
    plt.xticks(tick_marks, class_names, rotation=45, ha="right")
    plt.yticks(tick_marks, class_names)
    plt.ylabel("True label")
    plt.xlabel("Predicted label")
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()


def main():
    args = parse_args()
    test_dir = Path(args.data_dir).resolve() / "test"
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    if not test_dir.exists():
        raise FileNotFoundError("Run split_dataset.py first so data_split/test exists.")

    test_ds = tf.keras.utils.image_dataset_from_directory(
        test_dir,
        image_size=(args.image_size, args.image_size),
        batch_size=args.batch_size,
        label_mode="categorical",
        shuffle=False,
    )
    labels_path = Path(args.labels)
    if labels_path.exists():
        labels = json.loads(labels_path.read_text(encoding="utf-8"))
        class_names = [labels[str(index)] for index in range(len(labels))]
    else:
        class_names = test_ds.class_names
        labels = {index: label for index, label in enumerate(class_names)}
        labels_path.parent.mkdir(parents=True, exist_ok=True)
        labels_path.write_text(json.dumps(labels, indent=2), encoding="utf-8")
        print(f"labels.json not found. Generated labels from test folders: {labels_path}")

    model = tf.keras.models.load_model(args.model)
    loss, accuracy = model.evaluate(test_ds)

    y_true = []
    y_pred = []
    for images, labels_batch in test_ds:
        predictions = model.predict(images, verbose=0)
        y_true.extend(np.argmax(labels_batch.numpy(), axis=1))
        y_pred.extend(np.argmax(predictions, axis=1))

    report = classification_report(y_true, y_pred, target_names=class_names, digits=4)
    matrix = confusion_matrix(y_true, y_pred)

    report_text = f"Test loss: {loss:.4f}\nTest accuracy: {accuracy:.4f}\n\n{report}"
    (output_dir / "test_report.txt").write_text(report_text, encoding="utf-8")
    np.savetxt(output_dir / "confusion_matrix.csv", matrix, delimiter=",", fmt="%d")
    plot_confusion_matrix(matrix, class_names, output_dir / "confusion_matrix.png")

    print(report_text)
    print(f"Testing artifacts saved to: {output_dir}")


if __name__ == "__main__":
    main()
