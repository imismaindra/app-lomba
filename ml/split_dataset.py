import argparse
import random
import shutil
from pathlib import Path


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def parse_args():
    parser = argparse.ArgumentParser(description="Split waste image dataset into train/val/test folders.")
    parser.add_argument("--source", default="../dataset/dataset-sampah", help="Source folder with one subfolder per class.")
    parser.add_argument("--output", default="data_split", help="Output folder for split dataset.")
    parser.add_argument("--train", type=float, default=0.7, help="Train ratio.")
    parser.add_argument("--val", type=float, default=0.15, help="Validation ratio.")
    parser.add_argument("--test", type=float, default=0.15, help="Test ratio.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed.")
    parser.add_argument("--copy", action="store_true", help="Copy files instead of hard-linking when possible.")
    return parser.parse_args()


def list_images(class_dir: Path):
    return sorted(
        path for path in class_dir.iterdir()
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    )


def place_file(source: Path, target: Path, copy: bool):
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        return

    if copy:
        shutil.copy2(source, target)
        return

    try:
        target.hardlink_to(source)
    except OSError:
        shutil.copy2(source, target)


def main():
    args = parse_args()
    total_ratio = args.train + args.val + args.test
    if abs(total_ratio - 1.0) > 0.0001:
        raise ValueError("Train, validation, and test ratios must add up to 1.0")

    source_dir = Path(args.source).resolve()
    output_dir = Path(args.output).resolve()

    if not source_dir.exists():
        raise FileNotFoundError(f"Dataset source not found: {source_dir}")

    random.seed(args.seed)
    class_dirs = sorted(path for path in source_dir.iterdir() if path.is_dir())
    if not class_dirs:
        raise ValueError(f"No class folders found in {source_dir}")

    for class_dir in class_dirs:
        images = list_images(class_dir)
        random.shuffle(images)

        train_end = int(len(images) * args.train)
        val_end = train_end + int(len(images) * args.val)

        splits = {
            "train": images[:train_end],
            "val": images[train_end:val_end],
            "test": images[val_end:],
        }

        for split_name, split_images in splits.items():
            for image_path in split_images:
                target = output_dir / split_name / class_dir.name / image_path.name
                place_file(image_path, target, args.copy)

        print(
            f"{class_dir.name}: "
            f"train={len(splits['train'])}, val={len(splits['val'])}, test={len(splits['test'])}"
        )

    print(f"Dataset split created at: {output_dir}")


if __name__ == "__main__":
    main()
